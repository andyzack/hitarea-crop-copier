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

## Use

1. In Studio, pick the hero image and crop it for the placement you're working on.
2. Click the extension icon.
3. Set the **data-hitarea value** to match the element you want to read from (defaults to
   `tabHero`, and is remembered between uses).
4. Click **Copy crop params** — it searches the current tab (including iframes) for
   `[data-hitarea="<value>"]`, reads its image URL, and copies the crop string to your clipboard.
5. Paste into the sheet column for that placement, switch placements in Studio, and repeat.
