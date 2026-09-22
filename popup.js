const STORAGE_KEY = `hitarea`

const hitareaInput = document.getElementById(`hitarea`)
const extractButton = document.getElementById(`extract`)
const statusEl = document.getElementById(`status`)
const resultEl = document.getElementById(`result`)
const resultTextEl = document.getElementById(`result-text`)

const setStatus = (message, isError = false) => {
  statusEl.textContent = message
  statusEl.classList.toggle(`error`, isError)
}

chrome.storage.local.get(STORAGE_KEY, (data) => {
  hitareaInput.value = data[STORAGE_KEY] ?? `tabHero`
})

hitareaInput.addEventListener(`input`, () => {
  chrome.storage.local.set({ [STORAGE_KEY]: hitareaInput.value })
})

// Runs inside the page (via chrome.scripting.executeScript) — must be self-contained, no
// closures over anything outside its own arguments. Walks light DOM + open shadow roots so a
// shadow-DOM-based editor doesn't silently look like "nothing on the page".
function inspectPage(hitareaValue) {
  const withHitarea = []
  const walk = (root) => {
    if (!root || !root.querySelectorAll) return
    for (const node of root.querySelectorAll(`*`)) {
      if (node.hasAttribute(`data-hitarea`)) withHitarea.push(node)
      if (node.shadowRoot) walk(node.shadowRoot)
    }
  }
  walk(document)

  const match = withHitarea.find((el) => el.getAttribute(`data-hitarea`) === hitareaValue)

  if (!match) {
    return {
      frameUrl: location.href,
      found: false,
      seenValues: [...new Set(withHitarea.map((el) => el.getAttribute(`data-hitarea`)))],
    }
  }

  const src = match.currentSrc || match.src || getComputedStyle(match).backgroundImage || ``
  const cropMatch = src.match(/c_crop,[^/)"']+/)

  return {
    frameUrl: location.href,
    found: true,
    tagName: match.tagName,
    src,
    crop: cropMatch ? cropMatch[0].replace(/,fl_relative$/, ``) : null,
  }
}

extractButton.addEventListener(`click`, async () => {
  const hitareaValue = hitareaInput.value.trim()
  resultEl.hidden = true

  if (!hitareaValue) {
    setStatus(`Enter a data-hitarea value first.`, true)
    return
  }

  setStatus(`Searching the page…`)

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      setStatus(`No active tab found.`, true)
      return
    }

    const injections = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: inspectPage,
      args: [hitareaValue],
    })

    const perFrame = injections.map((r) => r.result).filter(Boolean)
    const matchWithCrop = perFrame.find((r) => r.found && r.crop)
    const matchNoCrop = perFrame.find((r) => r.found && !r.crop)
    const allSeenValues = [...new Set(perFrame.flatMap((r) => r.seenValues ?? []))]

    if (matchWithCrop) {
      await navigator.clipboard.writeText(matchWithCrop.crop)
      resultTextEl.textContent = matchWithCrop.crop
      resultEl.hidden = false
      setStatus(`Copied to clipboard.`)
      return
    }

    if (matchNoCrop) {
      setStatus(
        `Found the <${matchNoCrop.tagName.toLowerCase()}> element, but its image URL has no crop transform yet — has it been cropped? (src: ${matchNoCrop.src.slice(0, 80)}…)`,
        true
      )
      return
    }

    if (allSeenValues.length > 0) {
      setStatus(
        `No element with data-hitarea="${hitareaValue}" — found these values instead: ${allSeenValues.join(`, `)}`,
        true
      )
      return
    }

    setStatus(
      `No data-hitarea attributes found anywhere this extension could reach (${injections.length} frame(s) checked). It may be inside a frame this tab doesn't expose, or rendered after this check ran — try again once the crop preview has fully loaded.`,
      true
    )
  } catch (error) {
    setStatus(`Error: ${error.message}`, true)
  }
})
