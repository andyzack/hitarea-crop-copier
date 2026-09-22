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

// Runs inside the page (via chrome.scripting.executeScript) — must be self-contained,
// no closures over anything outside its own arguments.
function extractCropFromPage(hitareaValue) {
  const el = document.querySelector(`[data-hitarea="${hitareaValue}"]`)
  if (!el) return null

  const src = el.currentSrc || el.src || getComputedStyle(el).backgroundImage || ``
  const match = src.match(/c_crop,[^/)"']+/)
  if (!match) return null

  // Strip a trailing ,fl_relative — that's appended at render time, not part of the stored crop.
  return match[0].replace(/,fl_relative$/, ``)
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

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: extractCropFromPage,
      args: [hitareaValue],
    })

    const found = results.map((r) => r.result).find((r) => r)

    if (!found) {
      setStatus(`No element with data-hitarea="${hitareaValue}" (and a c_crop URL) found on this page.`, true)
      return
    }

    await navigator.clipboard.writeText(found)
    resultTextEl.textContent = found
    resultEl.hidden = false
    setStatus(`Copied to clipboard.`)
  } catch (error) {
    setStatus(`Error: ${error.message}`, true)
  }
})
