# Validation notes

Tests were run in headless Chromium on Linux with software WebGL, at 1440 × 900 and 390 × 844. Synthetic touch tests cover two-finger pinch anchoring. These are not physical-device or all-browser certifications.

The reports cover: all seven room arrivals, cancellation/retargeting; sixteen characters including four circulating staff; catalogue filters/search/empty state; all twenty-one product entries and loaded official preview images; free camera, orbit, pan, keyboard movement, zoom bounds, cursor/finger anchoring; local enquiry draft download/reset; browser history; reduced motion; and graphics-unavailable fallback. No uncaught JavaScript errors were recorded in the passing tested flows.

Visual review included all twenty-one product panels, the seven office views, desktop/mobile home layouts, presets, contact/policy panels, and the graphics fallback. Blank initial product artwork, a mobile sizing defect, a pinch-initialization error, a rapid-navigation form reset race, overlapping zoomed-out labels, and a seating alignment issue were corrected during QA.

## Rerun

Install Playwright (`npm install --no-save playwright`) and a Chromium executable. Adjust `executablePath` in the scripts if Chromium is not at `/usr/local/bin/chromium`. Run `node QA/regression.cjs`, `node QA/gestures.cjs`, `node QA/interactions.cjs`, and `node QA/fallback.cjs`. Results and screenshots are written to `QA/output/`.

Room-navigation tests use a deterministic simulation clock; their simulated travel times are not performance/FPS measurements. Graphics resolution adapts to frame timing, and real performance will vary by device.
