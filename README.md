# Lando wave mask demo: how to view it

You do **not** need any build tools or coding knowledge—this is a static HTML page. Pick one of the quick options below.

## Zero-effort: copy-paste one command
1) Open a terminal/command prompt **in this folder** (where the files are).
2) Run:
   ```bash
   python run_demo.py
   ```
3) Your default browser will open to the demo automatically at `http://localhost:8000/lando_wave_mask_demo.html`.

If Python isn’t installed, use Option A or B.

## Option A: open the file directly
1) Download or clone this folder.
2) Double-click `lando_wave_mask_demo.html` to open it in your browser (Chrome, Edge, Firefox, or Safari).
3) Wait a second for the remote portrait image to load; you should see the wavy helmet reveal animation immediately.

## Option B: use a tiny local server (if double-click is blocked)
1) Open a terminal/command prompt in this folder.
2) Run a local server:
   - Python 3: `python -m http.server 8000`
3) Visit `http://localhost:8000/lando_wave_mask_demo.html` in your browser.

No additional setup or npm install is required.
