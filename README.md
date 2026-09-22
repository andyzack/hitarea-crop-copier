# Hitarea Crop Copier

Copies the Cloudinary crop parameters off a `data-hitarea` image on the current page, so you can
paste them straight into a Google Sheet (or anywhere else) instead of retyping them.

Given a hero image URL like:

```
https://res.cloudinary.com/mabx-eu-prod/image/upload/f_auto/c_crop,h_0.8627,w_0.5742,x_0.1054,y_0.0156,fl_relative/q_60,w_300/v1/studio/001-Thoroughbreds_Hulk_Image-optimised_jtt7np
```

it extracts:

```
c_crop,h_0.8627,w_0.5742,x_0.1054,y_0.0156
```

## Install (unpacked, for local use)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.

## Why there's a "Preview host" field

Sesimi Studio renders the template preview inside a cross-origin iframe — `stargate-nebula.netlify.app`
for the account this was built against, but the actual host varies per client/brand (e.g.
`toyota-au.sesimi.app`, `volkswagen-us.sesimi.app`, `daimlertruck-au.sesimi.app`). `activeTab` alone
only grants script access to the tab's top-level origin, not to that iframe, so the extension needs
explicit permission for whichever host is actually rendering the preview.

Rather than hardcoding one client's domain, the popup has a **Preview host** field. The first time
you use it against a new host, Chrome shows a one-time permission prompt for that specific domain;
accept it and it's remembered for next time (no reinstalling or manifest edits needed). If the
current tab's preview lives somewhere unexpected, just type that domain in before clicking extract.

## Use

1. In Studio, pick the hero image and crop it for the placement you're working on.
2. Click the extension icon.
3. Set **Preview host** to the domain rendering the template preview on this page (defaults to
   `stargate-nebula.netlify.app`, remembered between uses — change it per client if needed).
4. Set the **data-hitarea value** to match the element you want to read from (defaults to
   `tabHero`, and is also remembered).
5. Click **Copy crop params** — grant the permission prompt if it's a new host, then it searches
   the current tab (including iframes) for `[data-hitarea="<value>"]`, reads its image URL, and
   copies the crop string to your clipboard.
6. Paste into the sheet column for that placement, switch placements in Studio, and repeat.
