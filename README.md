# Jodetx — The Living Office (v7)

A reference-inspired interactive office experience, rebuilt from the supplied v6 project and informed by the supplied video. This is a fictional office, not an architectural reconstruction of Jodetx's actual premises or a pixel-exact copy of the video.

## Open the app

- **Quickest:** open `jodetx-office.html` in a modern browser. The app, avatar, branding, product screenshots, and product images are embedded; no CDN is required for the experience.
- **Deploy:** publish the contents of `dist/` to any static HTTPS host. For local testing: `python3 -m http.server 8000 --directory dist`, then open `http://localhost:8000`.
- Official-site links and real company onboarding require an internet connection.

## Controls — no +/− buttons

### Desktop
- Scroll/trackpad: zoom toward the cursor.
- Left-drag: orbit.
- Right-drag or Shift-drag: pan.
- Free camera: W/A/S/D or arrow keys move; Q/E change height.
- Full view, Top view, and Neighbourhood are framing presets.
- `0`: full view; `F`: free camera. Keyboard `+`/`-` remains an optional shortcut; there are **no plus/minus buttons**.
- `?`: instructions and graphics-quality settings.

### Phone / tablet
- One finger: orbit.
- Two fingers: pan and pinch to zoom, anchored to their midpoint.
- The destination strip scrolls horizontally; every room remains accessible.

## What changed

- Seven destinations: reception, payments, business systems, meeting room, operations, lounge, and director's cabin.
- Expanded furnished office, exterior landscaping, parked cars, streets, and a surrounding neighbourhood.
- Sixteen textured, skinned people: the guided visitor, four circulating staff, and seated/standing staff with idle animation. These are variations of the supplied avatar, not sixteen independently modelled people.
- Material-specific suit colour variations; faces and hair retain their source textures.
- Guided navigation waits for the visitor and camera to settle before opening room information.
- Functional free-camera orbit, pan, cursor-anchored scroll, finger-anchored pinch, bounded zoom, and responsive presets.
- Reduced-motion mode and device-adaptive graphics resolution; graphics quality can also be selected manually.
- Shared monitor materials, batched static geometry, capped pixel ratio, compressed textures, cached shadows, and paused updates in background tabs.
- Graceful 3D-unavailable behaviour retains the product catalogue, official artwork, capabilities, legal information, and contact draft form.
- Product and office hash routes support direct linking and browser history.

## Official content

Reviewed the public product menu and its **21 entries / 20 unique product routes**, **132 product walkthrough states**, company overview tabs, business onboarding page, and five linked legal documents. The two CheckOut menu entries deliberately retain their shared official route.

Included **55 downloaded official assets**, official product-page screenshots, the official Jodetx logo, product walkthrough text, company contact details, and reference copies of Terms of Use, Privacy, Cookies, Cancellation & Refund, and Verification Consent.

`asset-sources.json` records the downloaded image origins; `official-content-audit.json` records coverage. Captured on 12 October 2026. The live official website takes precedence where content changes. Claims and demonstration metrics shown in official screenshots/text are source material, not independently verified promises.

The product panels combine official imagery/text with a clearly labelled **illustrative 3D walkthrough**. The original official site's animated CSS demonstrations are not reproduced as identical interactive implementations.

## Contact / backend scope

The enquiry form validates inputs and downloads a local text draft. It does **not** email, transmit, store, or submit the enquiry to Jodetx. It links to the official onboarding page for real registration, OTP verification, compliance checks, and company follow-up. There is no invented OTP or payments backend.

## Rebuild

```sh
npm ci
npm run build
```

Build inputs are `index.template.html`, `src/`, and `assets/`. `build.cjs` generates the standalone HTML and deployable `dist/` folder. The recovered avatar, animation, and logo assets required for a reproducible build are now included. Generated JS intermediates are not needed in the source package.

## Testing

See `QA/` for scripts, reports, and a test summary. Tests cover both 1440px desktop and 390px phone layouts, room arrival and retargeting, all product panels, actual image loading, catalogue search/empty states, camera controls, touch gestures, form draft export/reset, browser history, reduced motion, and graphics-unavailable behaviour.

Tests use headless Chromium on Linux, including software WebGL and synthetic touch input. They do not establish performance on every physical device, every browser, or all possible interactions. No zero-bug or fixed-FPS guarantee is made. Source code is supplied for further iteration and production-specific testing.

## Rights and attribution

- Jodetx names, branding, images, and public content remain the property of their respective owners. Their inclusion does not imply endorsement or grant new rights; obtain permission for public use where required.
- The human avatar was included in the supplied project. The original project attributes “Indian man with suit” by Polymount under Sketchfab Free Standard terms: https://sketchfab.com/3d-models/indian-man-with-suit-720635f58afc408795d5b3e73c5bb8c5 . Verify the original licence and your publishing/distribution rights. Do not extract or redistribute the character as a standalone asset.
- Three.js licence: `THREE-LICENSE.txt`.
