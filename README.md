# Trivia Night Pro

A reusable, browser-based game-show trivia platform. Create unlimited trivia
packs on any topic, run a classic Jeopardy-style board, track team scores,
handle Daily Doubles and Final Jeopardy, and switch themes instantly — no
server, database, or account required.

Designed by **DJ Dreamer 524**.

---

## 1. Project Structure

```
trivia-night-pro/
├── index.html          Main app (home screen + game board)
├── admin.html           No-code trivia pack editor
├── style.css             All styling & themes
├── script.js             Main app logic
├── admin.js              Admin panel logic
├── questions/            JSON trivia packs
│   ├── hiphop.json
│   ├── dancehall.json
│   ├── movies.json
│   ├── sports.json
│   ├── history.json
│   ├── bible.json
│   └── custom.json       Blank template pack
├── images/                Put custom background images here
├── audio/                  Put sound effect / music files here
└── README.md
```

## 2. Running It Locally

Because the app loads trivia packs with `fetch()`, most browsers **block
that when you open `index.html` directly from disk** (the `file://`
protocol). Run a tiny local server instead — pick whichever you have:

```bash
# Python 3
python -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000` in your browser.

## 3. Deploying to GitHub Pages

1. Create a new GitHub repository and push this entire folder to it.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Choose the `main` branch and `/ (root)` folder, then **Save**.
5. GitHub will publish your site at `https://<your-username>.github.io/<repo-name>/`.
6. No build step is required — it's plain HTML/CSS/JS.

## 4. Creating Trivia Packs

You have two ways to build a pack, no coding required:

**Option A — Admin Panel (recommended)**
1. From the home screen, click **Create Trivia Pack**.
2. Fill in the pack name, 6 categories, and 5 questions per category (or
   add/remove categories and questions freely).
3. Fill in the Final Jeopardy category, question, and answer.
4. Click **Save Pack** — it now appears in **Select Trivia Pack** on the
   home screen.
5. Use **Export JSON** to download the pack file, or **Import JSON** to
   load one someone else made.

**Option B — Hand-edit JSON**
Add a new file to `/questions/`, following this shape:

```json
{
  "packName": "Christmas Trivia",
  "theme": "gold",
  "categories": [
    {
      "name": "Category Name",
      "questions": [
        { "value": 100, "question": "Question text", "answer": "Answer text" },
        { "value": 200, "question": "...", "answer": "..." },
        { "value": 300, "question": "...", "answer": "..." },
        { "value": 400, "question": "...", "answer": "..." },
        { "value": 500, "question": "...", "answer": "..." }
      ]
    }
    // 6 categories total for a full board
  ],
  "finalJeopardy": {
    "category": "Final Category",
    "question": "Final question text",
    "answer": "Final answer text"
  }
}
```

Then add it to the `BUILTIN_PACKS` list near the top of `script.js` (and
`admin.js` if you want it editable there) so it shows up on the home
screen.

## 5. Adding Backgrounds, Music & Sound Effects

- Drop image files into `/images/` and reference them in your own CSS
  overrides, or extend `style.css` to add a custom background per pack.
- Drop audio files into `/audio/` using these exact filenames so the app
  picks them up automatically:
  - `audio/correct.mp3`
  - `audio/wrong.mp3`
  - `audio/scratch.mp3`
  - `audio/applause.mp3`
  - `audio/background.mp3` (looping background music)
- No files ship in this repo by default — the app fails silently if a
  sound file is missing, so add your own royalty-free tracks/effects.
- Volume sliders and mute live in **Settings**.

## 6. Themes

Six built-in themes, switchable instantly from **Settings → Theme**:

- Modern Glass
- Classic Jeopardy Blue
- Hip-Hop Graffiti
- Neon
- Dark Mode
- Gold

Themes are defined as CSS custom properties at the top of `style.css`
under `[data-theme="..."]` selectors — duplicate one of those blocks and
tweak the colors to add your own.

## 7. Editing Questions

Open **Create Trivia Pack** → **Load Pack** to pull up any built-in or
custom pack, edit any field inline, then **Save Pack**. Built-in packs
always load as an editable copy, so the originals are never overwritten.

## 8. How to Play

1. **Select Trivia Pack** (or build one).
2. **Set up teams** — 2 to 8 teams, each with a name and color.
3. Teams pick a category and dollar amount from the board.
4. Click a team to make it "active," reveal the question, then mark
   **Correct** or **Incorrect** — scores update automatically.
5. **Daily Double** cells hide their value until a team wagers.
6. Once the board is cleared, click **Final Jeopardy** — every team
   wagers, answers the same question, and the highest score wins.

### Keyboard Shortcuts
| Key | Action |
|---|---|
| Arrow keys | Move between board cells |
| Enter | Select the focused cell |
| Space | Reveal the answer |
| Esc | Close the current overlay/modal |
| F | Toggle fullscreen |
| R | Reset the board |

## 9. Save System

The game auto-saves your current board, scores, remaining questions,
theme, and settings to `localStorage`. Refreshing the page — or clicking
**Continue Last Game** from the home screen — restores exactly where you
left off. Use **Settings → Export Backup** to download everything (custom
packs, settings, and the current game) as a single JSON file you can
re-import on another device with **Import Backup**.

## 10. Customization Notes

- All game logic lives in `script.js`; all pack-editing logic lives in
  `admin.js`. Both are vanilla ES6 with no build tooling.
- Styling is centralized in `style.css` using CSS custom properties, so
  most visual tweaks only require editing variables at the top of the
  file.
- Board size is currently fixed at 6 categories × 5 questions to match
  classic Jeopardy, but the code does not hard-require that shape —
  packs with more or fewer categories/questions will still render.

## 11. Browser Support

Modern Chrome, Firefox, Safari, and Edge on Windows, macOS, Linux,
iPhone, Android, and iPad. Works on smart TVs and projectors via any
Chromium- or WebKit-based browser. Fullscreen mode and large-format
layout are tuned for classroom projectors and TV displays.

---

Enjoy the game — and good luck out there. 🎤🏆
