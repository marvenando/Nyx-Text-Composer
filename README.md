# Nyx Text Composer — After Effects CEP Panel

A Mister Horse-inspired **Text Presets Plugin Panel** for **Adobe After Effects 2024 – 2026** (also compatible with AE 2021–2023).

## Features
- **48 Curated Text Presets** across 12 categories:
  - **Mask Reveal** (Mask Slide Up/Down/Left, Mask Rise Letters — with dynamic auto-sizing mask)
  - **Overshoot & Slide** (Overshoot Up/Drop, Whip From Right, Skew Slide Rush)
  - **Pop & Bounce** (Pop In Letters, Elastic Bounce, Spin & Pop, Punch Zoom Down)
  - **Fade & Tracking** (Cinematic Tracking, Tighten & Fade, Smooth Fade Wave, Random Dissolve)
  - **3D Flip & Rotate** (3D Flip X Up, 3D Swivel Y, 3D Fly From Camera, 3D Tumble Cascade)
  - **Typewriter** (Classic Typewriter, Word-By-Word Snap, Cipher Decode, Type & Stamp)
  - **Blur & Stretch** (Blur Dissolve, Motion Blur Whip, Vertical Stretch, Wide Squash Snap)
  - **Glitch & Flicker** (Neon Flicker, Digital Jitter, Cyber Scramble, Signal Lock)
  - **Loops & FX** *(Continuous, stacks with IN/OUT)* — Stop-Motion Wiggle, Floating Wave, Cinematic Tracking Drift, Rhythmic Pulse, Neon Hue Cycle
  - **Social & Captions** — Karaoke Word Highlight, Outline-to-Fill Snap, Highlighter Box Swipe, Rapid Hook Punch
  - **Mechanical & Data** — Slot-Machine Roll, Split-Flap Board, Number Counter (`$10,000` / `98%` auto-detected)
  - **Editorial & Boxes** — Center-Out Split, Auto-Boxed Title, Underline Draw, Chromatic RGB Hit
- **Live Animated Previews:** Hover any card (or toggle **Auto-Play**) to preview the animation in real time.
- **Non-Destructive IN / OUT / BOTH:** Animations are anchored to the layer's `In Point` and `Out Point` via Expression Selectors—trimming or sliding your text layer automatically shifts the animations with zero keyframes to move.
- **Live Effect Controls:** Every applied animation adds native sliders in **Effect Controls** (`Duration`, `Stagger %`, `Overshoot`, `Reverse Order`).
- **One-Click Clear:** Remove all Text Composer animations and masks from selected layers without touching your font, styling, or other effects.

## Installation

### Windows
1. Double-click **`Install.bat`**.
   - Enables Adobe's `PlayerDebugMode` (`CSXS.10`–`CSXS.13`), links the panel into `%APPDATA%\Adobe\CEP\extensions\com.textcomposer.panel`, and shows a confirmation popup.
2. Restart **Adobe After Effects**.
3. Open **`Window > Extensions > Nyx Text Composer`** and dock it anywhere in your workspace.

> **Reinstall or Uninstall:** Double-click **`Install.bat`** again and pick **Yes** (Reinstall) or **No** (Uninstall).

### macOS
1. Unzip the folder, then **Right-click > Open** on **`Install-Mac.command`** (if macOS says it's not executable, run `chmod +x Install-Mac.command` once in Terminal, then double-click it).
   - Enables Adobe's `PlayerDebugMode` (`CSXS.10`–`CSXS.13`), copies the panel into `~/Library/Application Support/Adobe/CEP/extensions/com.textcomposer.panel`, and shows a confirmation popup.
2. Restart **Adobe After Effects**.
3. Open **`Window > Extensions > Nyx Text Composer`**.

> **Reinstall or Uninstall:** Double-click **`Install-Mac.command`** again and choose **Reinstall** or **Uninstall**.

## Usage
1. Select one or more **Text Layers** in your active composition.
2. Browse or search presets in the **Text Composer** panel.
3. Click **IN**, **OUT**, or **BOTH** on any preset card (or click the preview box to apply **IN**).
4. Adjust timing anytime in the layer's **Effect Controls** panel (`[TC IN]` / `[TC OUT]`), or drag the layer's In/Out points on the timeline.

## 1-Click In-Panel Updates (Private GitHub Repo)
Connected to **`marvenando/nyx-text-composer`** in **`client/config.js`**.

### One-Time Setup for Private Repo Updates
1. On GitHub, go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Under **Repository access**, choose **Only select repositories** → **`marvenando/nyx-text-composer`**.
3. Under **Repository permissions**, set **Contents** to **Read-only**, then generate the token.
4. In **Nyx Text Composer** (both you and your friend): open **Apply Settings** at the bottom of the panel and paste the token into **Update Token** *(stored locally on each machine, never committed to Git)*.

### Pushing Updates
1. Bump `"version"` in both **`client/config.js`** and **`package.json`**.
2. Commit and push to `main`.
3. Anyone using **Nyx Text Composer** (Windows or macOS) will see a green dot on the **Update** button in the top bar—clicking it downloads the latest files and hot-reloads the panel automatically!

## Customizing / Adding Your Own Presets
Open `client/presets.js` to add new presets or tweak defaults, then reopen the panel in After Effects (or push to GitHub so your friends can click Update).
