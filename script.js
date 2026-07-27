/* =========================================================
   TRIVIA NIGHT PRO — script.js
   Vanilla JS, no build step, no server required (once hosted
   over http/https — see README for local-testing notes).
   ========================================================= */

(function () {
  "use strict";

  /* ---------------- CONSTANTS ---------------- */
  const BUILTIN_PACKS = [
    { file: "questions/hiphop.json", id: "builtin-hiphop", tags: "Music • Culture" },
    { file: "questions/dancehall.json", id: "builtin-dancehall", tags: "Music • Culture" },
    { file: "questions/movies.json", id: "builtin-movies", tags: "Film" },
    { file: "questions/sports.json", id: "builtin-sports", tags: "Sports" },
    { file: "questions/history.json", id: "builtin-history", tags: "History" },
    { file: "questions/bible.json", id: "builtin-bible", tags: "Faith" },
    { file: "questions/nas.json", id: "builtin-nas", tags: "Music • Hip-Hop" },
    { file: "questions/jayz.json", id: "builtin-jayz", tags: "Music • Hip-Hop" },
    { file: "questions/biggie.json", id: "builtin-biggie", tags: "Music • Hip-Hop" },
    { file: "questions/flatbush.json", id: "builtin-flatbush", tags: "NYC • Brooklyn" },
    { file: "questions/90shiphop.json", id: "builtin-90shiphop", tags: "Music • 90s" },
    { file: "questions/90srnb.json", id: "builtin-90srnb", tags: "Music • 90s" },
    { file: "questions/fabolous.json", id: "builtin-fabolous", tags: "Music • Hip-Hop" },
    { file: "questions/instagram.json", id: "builtin-instagram", tags: "Tech • Social Media" },
    { file: "questions/beyonce.json", id: "builtin-beyonce", tags: "Music" },
    { file: "questions/90sdancehall.json", id: "builtin-90sdancehall", tags: "Music • 90s" },
    { file: "questions/michaeljackson.json", id: "builtin-mj", tags: "Music" },
    { file: "questions/marvel.json", id: "builtin-marvel", tags: "Movies • Comics" },
    { file: "questions/dc.json", id: "builtin-dc", tags: "Movies • Comics" },
    { file: "questions/loveandhiphop.json", id: "builtin-lhh", tags: "Reality TV" },
    { file: "questions/hiphopdjs.json", id: "builtin-hiphopdjs", tags: "Music • Hip-Hop" },
    { file: "questions/rihanna.json", id: "builtin-rihanna", tags: "Music" },
    { file: "questions/kendricklamar.json", id: "builtin-kendrick", tags: "Music • Hip-Hop" },
    { file: "questions/grammys.json", id: "builtin-grammys", tags: "Music • Awards" },
    { file: "questions/bestsellingalbums.json", id: "builtin-bestsellingalbums", tags: "Music" },
    { file: "questions/movietrivia.json", id: "builtin-movietrivia", tags: "Film" },
    { file: "questions/tubimovies.json", id: "builtin-tubimovies", tags: "Film • Streaming" },
    { file: "questions/truecrime.json", id: "builtin-truecrime", tags: "Documentary" },
    { file: "questions/romance.json", id: "builtin-romance", tags: "Movies • Books" },
    { file: "questions/queens.json", id: "builtin-queens", tags: "NYC" },
    { file: "questions/nyclandmarks.json", id: "builtin-nyclandmarks", tags: "NYC" },
    { file: "questions/fiveboroughs.json", id: "builtin-fiveboroughs", tags: "NYC" },
    { file: "questions/fashion.json", id: "builtin-fashion", tags: "Style" },
    { file: "questions/hypebeast.json", id: "builtin-hypebeast", tags: "Style • Streetwear" },
    { file: "questions/sneakers.json", id: "builtin-sneakers", tags: "Style • Sneakers" },
    { file: "questions/gossip.json", id: "builtin-gossip", tags: "Pop Culture" },
    { file: "questions/custom.json", id: "builtin-custom", tags: "Template" }
  ];
  const TEAM_COLORS = ["#ff6ec7", "#6ee7ff", "#ffd166", "#55e0a8", "#ff5d7a", "#c792ff", "#7cf29c", "#ffa552"];
  const THEMES = [
    { id: "glass", name: "Modern Glass" },
    { id: "classic", name: "Classic Jeopardy" },
    { id: "graffiti", name: "Hip-Hop Graffiti" },
    { id: "neon", name: "Neon" },
    { id: "dark", name: "Dark Mode" },
    { id: "gold", name: "Gold" }
  ];
  const SAVE_KEY = "tnp_save_v1";
  const SETTINGS_KEY = "tnp_settings_v1";
  const CUSTOM_PACKS_KEY = "tnp_custom_packs_v1";

  /* ---------------- STATE ---------------- */
  let state = {
    pack: null,          // loaded pack object {packName, categories:[...], finalJeopardy}
    board: null,         // runtime board: categories[].questions[].used / dailyDouble
    teams: [],           // [{name,color,score}]
    activeTeam: 0,
    history: [],         // undo stack of {teamIndex, delta, kind}
    currentCell: null,   // {catIdx, qIdx}
    finalTeamAnswers: [] // for final jeopardy scoring
  };

  let settings = {
    theme: "glass",
    masterVolume: 70,
    sfxVolume: 80,
    musicVolume: 40,
    muted: false,
    largeText: false,
    highContrast: false,
    timerEnabled: false
  };

  let timerInterval = null;
  let timerSeconds = 30;

  /* ---------------- DOM SHORTCUTS ---------------- */
  const $ = (id) => document.getElementById(id);
  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------------- INIT ---------------- */
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    loadSettings();
    applySettings();
    bindHomeButtons();
    bindModalCloseButtons();
    bindGameButtons();
    bindQuestionOverlay();
    bindFinalJeopardy();
    bindSettingsModal();
    bindKeyboardShortcuts();
    renderThemeGrid();
    tryRestoreSession();
  }

  /* ============================================================
     PERSISTENCE
     ============================================================ */
  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) settings = Object.assign(settings, JSON.parse(raw));
    } catch (e) { /* ignore corrupt settings */ }
  }
  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        pack: state.pack, board: state.board, teams: state.teams,
        activeTeam: state.activeTeam, screen: currentScreen()
      }));
    } catch (e) { /* storage full or unavailable */ }
  }
  function clearGame() {
    localStorage.removeItem(SAVE_KEY);
  }
  function currentScreen() {
    return $("gameScreen").classList.contains("hidden") ? "home" : "game";
  }
  function tryRestoreSession() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && data.pack && data.board && data.teams) {
        state.pack = data.pack; state.board = data.board; state.teams = data.teams;
        state.activeTeam = data.activeTeam || 0;
        if (data.screen === "game") {
          enterGameScreen();
        }
      }
    } catch (e) { /* ignore */ }
  }

  function getCustomPacks() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_PACKS_KEY) || "[]"); }
    catch (e) { return []; }
  }

  /* ============================================================
     SETTINGS / THEME / ACCESSIBILITY
     ============================================================ */
  function applySettings() {
    document.documentElement.setAttribute("data-theme", settings.theme);
    document.body.classList.toggle("large-text", settings.largeText);
    document.body.classList.toggle("high-contrast", settings.highContrast);
    const mv = $("masterVolume"), sv = $("sfxVolume"), bv = $("musicVolume"), mute = $("muteAll");
    if (mv) mv.value = settings.masterVolume;
    if (sv) sv.value = settings.sfxVolume;
    if (bv) bv.value = settings.musicVolume;
    if (mute) mute.checked = settings.muted;
    const lt = $("toggleLargeText"), hc = $("toggleHighContrast"), tm = $("toggleTimer");
    if (lt) lt.checked = settings.largeText;
    if (hc) hc.checked = settings.highContrast;
    if (tm) tm.checked = settings.timerEnabled;
    applyMusicVolume();
  }

  function renderThemeGrid() {
    const grid = $("themeGrid");
    grid.innerHTML = "";
    THEMES.forEach((t) => {
      const el = document.createElement("div");
      el.className = "theme-swatch glass" + (settings.theme === t.id ? " active" : "");
      el.textContent = t.name;
      el.tabIndex = 0;
      el.addEventListener("click", () => {
        settings.theme = t.id;
        document.documentElement.setAttribute("data-theme", t.id);
        qsa(".theme-swatch", grid).forEach((s) => s.classList.remove("active"));
        el.classList.add("active");
        saveSettings();
        showToast("Theme set to " + t.name, "success");
      });
      grid.appendChild(el);
    });
  }

  function bindSettingsModal() {
    $("masterVolume").addEventListener("input", (e) => { settings.masterVolume = +e.target.value; saveSettings(); applyMusicVolume(); });
    $("sfxVolume").addEventListener("input", (e) => { settings.sfxVolume = +e.target.value; saveSettings(); });
    $("musicVolume").addEventListener("input", (e) => { settings.musicVolume = +e.target.value; saveSettings(); applyMusicVolume(); });
    $("muteAll").addEventListener("change", (e) => { settings.muted = e.target.checked; saveSettings(); applyMusicVolume(); });
    $("toggleLargeText").addEventListener("change", (e) => { settings.largeText = e.target.checked; document.body.classList.toggle("large-text", settings.largeText); saveSettings(); });
    $("toggleHighContrast").addEventListener("change", (e) => { settings.highContrast = e.target.checked; document.body.classList.toggle("high-contrast", settings.highContrast); saveSettings(); });
    $("toggleTimer").addEventListener("change", (e) => { settings.timerEnabled = e.target.checked; saveSettings(); });

    $("btnAutoBackup").addEventListener("click", exportBackup);
    $("btnImportBackup").addEventListener("click", () => importBackupPrompt());
  }

  function exportBackup() {
    const backup = {
      settings, customPacks: getCustomPacks(),
      savedGame: JSON.parse(localStorage.getItem(SAVE_KEY) || "null")
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "trivia-night-pro-backup.json";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast("Backup exported", "success");
  }

  function importBackupPrompt() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "application/json";
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (data.settings) { settings = Object.assign(settings, data.settings); saveSettings(); applySettings(); renderThemeGrid(); }
          if (data.customPacks) localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(data.customPacks));
          if (data.savedGame) localStorage.setItem(SAVE_KEY, JSON.stringify(data.savedGame));
          showToast("Backup imported — reloading…", "success");
          setTimeout(() => location.reload(), 900);
        } catch (e) { showToast("Invalid backup file", "danger"); }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function applyMusicVolume() {
    const music = $("audioMusic");
    if (!music) return;
    music.volume = settings.muted ? 0 : (settings.masterVolume / 100) * (settings.musicVolume / 100);
  }

  function playSfx(id) {
    if (settings.muted) return;
    const el = $(id);
    if (!el) return;
    el.volume = (settings.masterVolume / 100) * (settings.sfxVolume / 100);
    el.currentTime = 0;
    el.play().catch(() => { /* audio file may be missing — fail silently */ });
  }

  /* ============================================================
     TOASTS
     ============================================================ */
  function showToast(msg, kind) {
    const stack = $("toastStack");
    const t = document.createElement("div");
    t.className = "toast glass";
    if (kind === "success") t.style.color = "var(--success)";
    if (kind === "danger") t.style.color = "var(--danger)";
    t.textContent = msg;
    stack.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  /* ============================================================
     MODALS
     ============================================================ */
  function openModal(id) { $(id).classList.remove("hidden"); }
  function closeModal(id) { $(id).classList.add("hidden"); }
  function closeAllModals() { qsa(".modal-overlay").forEach((m) => m.classList.add("hidden")); }
  function bindModalCloseButtons() {
    qsa("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => btn.closest(".modal-overlay").classList.add("hidden"));
    });
    qsa(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.add("hidden"); });
    });
  }

  /* ============================================================
     HOME SCREEN BUTTONS
     ============================================================ */
  function bindHomeButtons() {
    $("btnPlay").addEventListener("click", () => openPackSelector());
    $("btnSelectPack").addEventListener("click", () => openPackSelector());
    $("btnCreatePack").addEventListener("click", () => { window.location.href = "admin.html"; });
    $("btnContinue").addEventListener("click", continueLastGame);
    $("btnSettings").addEventListener("click", () => openModal("modalSettings"));
    $("btnHowTo").addEventListener("click", () => openModal("modalHowTo"));
    $("btnAbout").addEventListener("click", () => openModal("modalAbout"));
    $("btnFullscreen").addEventListener("click", toggleFullscreen);
    $("btnFullscreen2").addEventListener("click", toggleFullscreen);
    $("btnHome").addEventListener("click", () => { saveGame(); goHome(); });
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }

  function goHome() {
    $("gameScreen").classList.add("hidden");
    $("homeScreen").classList.remove("hidden");
  }

  function continueLastGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { showToast("No saved game found", "danger"); return; }
    try {
      const data = JSON.parse(raw);
      state.pack = data.pack; state.board = data.board; state.teams = data.teams;
      state.activeTeam = data.activeTeam || 0;
      enterGameScreen();
    } catch (e) { showToast("Saved game could not be loaded", "danger"); }
  }

  /* ============================================================
     PACK SELECTOR
     ============================================================ */
  function openPackSelector() {
    renderPackGrid();
    openModal("modalSelectPack");
  }

  function renderPackGrid() {
    const grid = $("packGrid");
    grid.innerHTML = "";
    BUILTIN_PACKS.forEach((p) => {
      const card = document.createElement("button");
      card.className = "pack-card";
      card.innerHTML = `<h3>${p.file.split("/").pop().replace(".json", "")}</h3><p>Built-in trivia pack</p><div class="pack-tags">${p.tags}</div>`;
      card.addEventListener("click", () => loadPackFromUrl(p.file));
      grid.appendChild(card);
    });
    getCustomPacks().forEach((cp) => {
      const card = document.createElement("button");
      card.className = "pack-card";
      const catCount = (cp.pack.categories || []).length;
      card.innerHTML = `<h3>${escapeHtml(cp.pack.packName || "Custom Pack")}</h3><p>${catCount} categories</p><div class="pack-tags">Custom</div>`;
      card.addEventListener("click", () => loadPackObject(cp.pack));
      grid.appendChild(card);
    });
  }

  function loadPackFromUrl(url) {
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error("Pack not found"); return r.json(); })
      .then((pack) => loadPackObject(pack))
      .catch((err) => {
        showToast("Could not load pack. If you're opening this file directly (file://), run a local server — see README.", "danger");
        console.error(err);
      });
  }

  function loadPackObject(pack) {
    state.pack = pack;
    closeModal("modalSelectPack");
    openTeamSetup();
  }

  /* ============================================================
     TEAM SETUP
     ============================================================ */
  function openTeamSetup() {
    renderTeamNameInputs(+$("teamCount").value || 2);
    openModal("modalTeamSetup");
    $("teamCount").oninput = () => renderTeamNameInputs(+$("teamCount").value || 2);
  }

  function renderTeamNameInputs(count) {
    count = Math.max(2, Math.min(8, count));
    const wrap = $("teamNameList");
    wrap.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const row = document.createElement("div");
      row.className = "team-setup-row";
      row.innerHTML = `
        <input type="color" value="${TEAM_COLORS[i % TEAM_COLORS.length]}" data-team-color="${i}" />
        <input type="text" placeholder="Team ${i + 1}" value="Team ${i + 1}" data-team-name="${i}" />
      `;
      wrap.appendChild(row);
    }
  }

  function bindGameButtons() {
    $("btnStartGame").addEventListener("click", () => {
      const nameInputs = qsa("[data-team-name]");
      const colorInputs = qsa("[data-team-color]");
      state.teams = nameInputs.map((inp, i) => ({
        name: inp.value.trim() || `Team ${i + 1}`,
        color: colorInputs[i].value,
        score: 0
      }));
      state.activeTeam = 0;
      state.history = [];
      closeModal("modalTeamSetup");
      buildBoard();
      enterGameScreen();
      showToast("Game started — good luck!", "success");
    });

    $("btnResetBoard").addEventListener("click", () => {
      if (confirm("Reset the board? All questions will become available again and scores stay the same.")) {
        buildBoard(); renderBoard(); saveGame();
      }
    });
    $("btnUndo").addEventListener("click", undoLastScore);
    $("btnResetScores").addEventListener("click", () => {
      if (confirm("Reset all team scores to 0?")) {
        state.teams.forEach((t) => (t.score = 0));
        state.history = [];
        renderScoreboard(); saveGame();
      }
    });
    $("btnRenameTeams").addEventListener("click", openRenameTeams);
    $("btnSaveTeamNames").addEventListener("click", saveRenamedTeams);
    $("btnFinalJeopardy").addEventListener("click", openFinalJeopardy);
    $("btnThemeQuick").addEventListener("click", () => openModal("modalSettings"));
    $("btnSoundQuick").addEventListener("click", () => openModal("modalSettings"));
  }

  function openRenameTeams() {
    const wrap = $("renameTeamList");
    wrap.innerHTML = "";
    state.teams.forEach((t, i) => {
      const row = document.createElement("div");
      row.className = "team-setup-row";
      row.innerHTML = `
        <input type="color" value="${t.color}" data-rename-color="${i}" />
        <input type="text" value="${escapeHtml(t.name)}" data-rename-name="${i}" />
      `;
      wrap.appendChild(row);
    });
    openModal("modalRenameTeams");
  }
  function saveRenamedTeams() {
    qsa("[data-rename-name]").forEach((inp) => {
      const i = +inp.dataset.renameName;
      state.teams[i].name = inp.value.trim() || state.teams[i].name;
    });
    qsa("[data-rename-color]").forEach((inp) => {
      const i = +inp.dataset.renameColor;
      state.teams[i].color = inp.value;
    });
    renderScoreboard();
    closeModal("modalRenameTeams");
    saveGame();
  }

  /* ============================================================
     BOARD BUILD / RENDER
     ============================================================ */
  function buildBoard() {
    const categories = state.pack.categories.map((c) => ({
      name: c.name,
      questions: c.questions.map((q) => ({ value: q.value, question: q.question, answer: q.answer, used: false, dailyDouble: false }))
    }));
    // assign daily double(s): 1 for boards up to 30 cells, 2 for larger
    const totalCells = categories.reduce((sum, c) => sum + c.questions.length, 0);
    const ddCount = totalCells > 30 ? 2 : 1;
    let placed = 0, guard = 0;
    while (placed < ddCount && guard < 500) {
      guard++;
      const ci = Math.floor(Math.random() * categories.length);
      const qi = Math.floor(Math.random() * categories[ci].questions.length);
      if (qi === 0) continue; // keep $100 row safe, matches classic Jeopardy convention
      if (!categories[ci].questions[qi].dailyDouble) {
        categories[ci].questions[qi].dailyDouble = true;
        placed++;
      }
    }
    state.board = { categories };
    state.finalTeamAnswers = [];
  }

  function enterGameScreen() {
    $("homeScreen").classList.add("hidden");
    $("gameScreen").classList.remove("hidden");
    $("packTitleLabel").textContent = state.pack.packName || "Hood Trivia";
    if (!state.board) buildBoard();
    renderScoreboard();
    renderBoard();
    saveGame();
  }

  function renderScoreboard() {
    const bar = $("scoreboard");
    bar.innerHTML = "";
    state.teams.forEach((team, i) => {
      const chip = document.createElement("div");
      chip.className = "team-chip glass" + (i === state.activeTeam ? "" : "");
      chip.style.borderColor = i === state.activeTeam ? team.color : "";
      chip.innerHTML = `
        <span class="swatch" style="background:${team.color}"></span>
        <span class="name">${escapeHtml(team.name)}</span>
        <span class="score ${team.score < 0 ? "neg" : ""}">$${team.score}</span>
        <div class="score-btns">
          ${[100, 200, 300, 400, 500].map((v) => `<button class="plus" data-adjust="${i}:${v}">+${v}</button>`).join("")}
        </div>
        <div class="score-btns">
          ${[100, 200, 300, 400, 500].map((v) => `<button class="minus" data-adjust="${i}:-${v}">−${v}</button>`).join("")}
        </div>
      `;
      chip.addEventListener("click", (e) => {
        if (e.target.closest("[data-adjust]")) return;
        state.activeTeam = i;
        renderScoreboard();
      });
      bar.appendChild(chip);
    });
    qsa("[data-adjust]", bar).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const [i, delta] = btn.dataset.adjust.split(":").map(Number);
        adjustScore(i, delta);
      });
    });
  }

  function adjustScore(teamIndex, delta) {
    state.teams[teamIndex].score += delta;
    state.history.push({ teamIndex, delta });
    renderScoreboard();
    saveGame();
  }

  function undoLastScore() {
    const last = state.history.pop();
    if (!last) { showToast("Nothing to undo", "danger"); return; }
    state.teams[last.teamIndex].score -= last.delta;
    renderScoreboard();
    saveGame();
    showToast("Undid last score change", "success");
  }

  function renderBoard() {
    const board = $("board");
    board.innerHTML = "";
    state.board.categories.forEach((cat, ci) => {
      const col = document.createElement("div");
      col.className = "board-col";
      const catEl = document.createElement("div");
      catEl.className = "board-cat glass";
      catEl.textContent = cat.name;
      col.appendChild(catEl);
      cat.questions.forEach((q, qi) => {
        const cell = document.createElement("button");
        cell.className = "cell" + (q.used ? " used" : "");
        cell.textContent = q.used ? "" : "$" + q.value;
        cell.disabled = q.used;
        cell.setAttribute("data-cat", ci);
        cell.setAttribute("data-q", qi);
        cell.addEventListener("click", () => openQuestion(ci, qi));
        col.appendChild(cell);
      });
      board.appendChild(col);
    });
    checkBoardComplete();
  }

  function checkBoardComplete() {
    const allUsed = state.board.categories.every((c) => c.questions.every((q) => q.used));
    $("btnFinalJeopardy").classList.toggle("btn-primary", true);
    if (allUsed) showToast("Board complete! Ready for Final Jeopardy.", "success");
  }

  /* ============================================================
     QUESTION OVERLAY
     ============================================================ */
  function bindQuestionOverlay() {
    $("btnReveal").addEventListener("click", revealAnswer);
    $("btnCloseQuestion").addEventListener("click", closeQuestion);
    $("btnWagerConfirm").addEventListener("click", confirmWager);
  }

  function openQuestion(ci, qi) {
    const q = state.board.categories[ci].questions[qi];
    if (q.used) return;
    state.currentCell = { ci, qi };
    playSfx("audioScratch");
    $("questionMeta").textContent = state.board.categories[ci].name.toUpperCase() + " — $" + q.value;
    $("answerText").classList.remove("show");
    $("answerText").textContent = "";
    $("questionText").textContent = q.question;
    $("assignStep").classList.add("hidden");
    $("assignStep").innerHTML = "";
    $("btnReveal").classList.remove("hidden");
    $("dailyDoubleBanner").classList.toggle("hidden", !q.dailyDouble);
    $("timerDisplay").textContent = "";

    if (q.dailyDouble) {
      $("wagerStep").classList.remove("hidden");
      $("questionStep").classList.add("hidden");
      renderDailyDoubleTeamPicker();
    } else {
      $("wagerStep").classList.add("hidden");
      $("questionStep").classList.remove("hidden");
      maybeStartTimer();
    }
    openModalRaw("questionOverlay");
  }

  function renderDailyDoubleTeamPicker() {
    const wagerStepEl = $("wagerStep");
    let picker = qs("#ddTeamPicker");
    if (picker) picker.remove();
    picker = document.createElement("div");
    picker.id = "ddTeamPicker";
    picker.innerHTML = `<p style="color:var(--text-dim);margin-bottom:0.6rem;">Which team found the Daily Double?</p>
      <div class="assign-row">${state.teams.map((t, i) => `<button class="btn btn-sm" data-dd-team="${i}" style="border-color:${t.color}">${escapeHtml(t.name)}</button>`).join("")}</div>`;
    wagerStepEl.prepend(picker);
    qsa("[data-dd-team]", picker).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeTeam = +btn.dataset.ddTeam;
        picker.remove();
        qs("#wagerInput").focus();
      });
    });
  }

  function confirmWager() {
    const val = Math.max(0, +$("wagerInput").value || 0);
    const q = state.board.categories[state.currentCell.ci].questions[state.currentCell.qi];
    q._wager = val;
    $("wagerStep").classList.add("hidden");
    $("questionStep").classList.remove("hidden");
    maybeStartTimer();
  }

  function maybeStartTimer() {
    clearInterval(timerInterval);
    if (!settings.timerEnabled) { $("timerDisplay").textContent = ""; return; }
    timerSeconds = 30;
    $("timerDisplay").textContent = timerSeconds + "s";
    $("timerDisplay").classList.remove("low");
    timerInterval = setInterval(() => {
      timerSeconds--;
      $("timerDisplay").textContent = timerSeconds + "s";
      if (timerSeconds <= 10) $("timerDisplay").classList.add("low");
      if (timerSeconds <= 0) { clearInterval(timerInterval); revealAnswer(); }
    }, 1000);
  }

  function revealAnswer() {
    clearInterval(timerInterval);
    const { ci, qi } = state.currentCell;
    const q = state.board.categories[ci].questions[qi];
    $("answerText").textContent = q.answer;
    $("answerText").classList.add("show");
    $("btnReveal").classList.add("hidden");
    renderAssignStep(q);
  }

  function renderAssignStep(q) {
    const step = $("assignStep");
    step.classList.remove("hidden");
    if (q.dailyDouble) {
      const team = state.teams[state.activeTeam];
      step.innerHTML = `
        <button class="btn btn-success" id="ddCorrect">${escapeHtml(team.name)} Correct (+$${q._wager})</button>
        <button class="btn btn-danger" id="ddWrong">${escapeHtml(team.name)} Incorrect (−$${q._wager})</button>
      `;
      qs("#ddCorrect", step).addEventListener("click", () => { adjustScore(state.activeTeam, q._wager); playSfx("audioCorrect"); finishQuestion(q); });
      qs("#ddWrong", step).addEventListener("click", () => { adjustScore(state.activeTeam, -q._wager); playSfx("audioWrong"); finishQuestion(q); });
    } else {
      step.innerHTML = `<p style="width:100%;color:var(--text-dim);font-size:0.8rem;margin-bottom:0.4rem;">Mark the result for the active team (${escapeHtml(state.teams[state.activeTeam].name)}):</p>` +
        `<button class="btn btn-success" id="qCorrect">Correct (+$${q.value})</button>
         <button class="btn btn-danger" id="qWrong">Incorrect (−$${q.value})</button>
         <button class="btn" id="qSkip">No Score / Next</button>`;
      qs("#qCorrect", step).addEventListener("click", () => { adjustScore(state.activeTeam, q.value); playSfx("audioCorrect"); finishQuestion(q); });
      qs("#qWrong", step).addEventListener("click", () => { adjustScore(state.activeTeam, -q.value); playSfx("audioWrong"); finishQuestion(q); });
      qs("#qSkip", step).addEventListener("click", () => finishQuestion(q));
    }
  }

  function finishQuestion(q) {
    q.used = true;
    closeQuestion();
    renderBoard();
    saveGame();
  }

  function closeQuestion() {
    clearInterval(timerInterval);
    closeModalRaw("questionOverlay");
    state.currentCell = null;
  }

  function openModalRaw(id) { $(id).classList.remove("hidden"); }
  function closeModalRaw(id) { $(id).classList.add("hidden"); }

  /* ============================================================
     FINAL JEOPARDY
     ============================================================ */
  function bindFinalJeopardy() {
    $("btnFinalWagersDone").addEventListener("click", startFinalQuestion);
    $("btnFinalReveal").addEventListener("click", revealFinalAnswer);
    $("btnFinalDone").addEventListener("click", calculateFinalWinner);
    $("btnWinnerClose").addEventListener("click", () => {
      closeModalRaw("winnerOverlay");
      clearGame();
      goHome();
    });
  }

  function openFinalJeopardy() {
    if (!state.pack.finalJeopardy) { showToast("This pack has no Final Jeopardy round.", "danger"); return; }
    const fj = state.pack.finalJeopardy;
    $("finalCategory").textContent = fj.category;
    $("finalQuestionText").textContent = fj.question;
    $("finalAnswerText").textContent = fj.answer;
    $("finalAnswerText").classList.remove("show");
    $("finalWagerStep").classList.remove("hidden");
    $("finalQuestionStep").classList.add("hidden");
    $("finalScoringList").classList.add("hidden");
    $("btnFinalDone").classList.add("hidden");

    const list = $("finalWagerList");
    list.innerHTML = "";
    state.teams.forEach((t, i) => {
      const row = document.createElement("div");
      row.className = "team-setup-row";
      row.innerHTML = `<span style="min-width:100px;text-align:left;color:${t.color};font-weight:700;">${escapeHtml(t.name)}</span>
        <input type="number" min="0" max="${Math.max(0, t.score)}" value="0" data-final-wager="${i}" placeholder="Wager" />`;
      list.appendChild(row);
    });
    openModalRaw("finalOverlay");
  }

  function startFinalQuestion() {
    state.finalTeamAnswers = qsa("[data-final-wager]").map((inp) => Math.max(0, Math.min(+inp.value || 0, 999999)));
    $("finalWagerStep").classList.add("hidden");
    $("finalQuestionStep").classList.remove("hidden");
    playSfx("audioScratch");
  }
  function revealFinalAnswer() {
    $("finalAnswerText").classList.add("show");
    $("btnFinalReveal").classList.add("hidden");
    const scoringList = $("finalScoringList");
    scoringList.classList.remove("hidden");
    scoringList.innerHTML = state.teams.map((t, i) => `
      <div class="team-setup-row">
        <span style="min-width:100px;text-align:left;color:${t.color};font-weight:700;">${escapeHtml(t.name)}</span>
        <label style="display:flex;align-items:center;gap:0.3rem;font-size:0.8rem;"><input type="radio" name="finalResult${i}" value="correct" checked /> Correct</label>
        <label style="display:flex;align-items:center;gap:0.3rem;font-size:0.8rem;"><input type="radio" name="finalResult${i}" value="wrong" /> Incorrect</label>
      </div>
    `).join("");
    $("btnFinalDone").classList.remove("hidden");
  }
  function calculateFinalWinner() {
    state.teams.forEach((t, i) => {
      const wager = state.finalTeamAnswers[i] || 0;
      const result = qs(`input[name="finalResult${i}"]:checked`).value;
      t.score += result === "correct" ? wager : -wager;
    });
    renderScoreboard();
    closeModalRaw("finalOverlay");
    saveGame();
    showWinner();
  }

  function showWinner() {
    const top = Math.max(...state.teams.map((t) => t.score));
    const winners = state.teams.filter((t) => t.score === top);
    $("winnerName").textContent = winners.map((w) => w.name).join(" & ");
    $("winnerScore").textContent = "Final Score: $" + top;
    openModalRaw("winnerOverlay");
    playSfx("audioApplause");
    launchConfetti();
  }

  function launchConfetti() {
    const colors = ["#ffd166", "#6ee7ff", "#ff6ec7", "#55e0a8", "#ff5d7a"];
    for (let i = 0; i < 90; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = 2.4 + Math.random() * 1.8 + "s";
      piece.style.opacity = String(0.7 + Math.random() * 0.3);
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4500);
    }
  }

  /* ============================================================
     KEYBOARD SHORTCUTS
     ============================================================ */
  function bindKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select";

      if (e.key === "Escape") {
        if (!$("questionOverlay").classList.contains("hidden")) closeQuestion();
        else if (!$("winnerOverlay").classList.contains("hidden")) { /* require explicit button */ }
        else closeAllModals();
        return;
      }
      if (typing) return;

      if (e.key === " ") {
        if (!$("questionOverlay").classList.contains("hidden") && !$("btnReveal").classList.contains("hidden")) {
          e.preventDefault(); revealAnswer();
        }
        return;
      }
      if (e.key.toLowerCase() === "f") { toggleFullscreen(); return; }
      if (e.key.toLowerCase() === "r") {
        if (currentScreen() === "game" && confirm("Reset the board?")) { buildBoard(); renderBoard(); saveGame(); }
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        navigateBoardFocus(e.key);
      }
      if (e.key === "Enter") {
        const focused = document.activeElement;
        if (focused && focused.classList.contains("cell") && !focused.disabled) focused.click();
      }
    });
  }

  function navigateBoardFocus(key) {
    const cells = qsa(".cell:not(:disabled)");
    if (!cells.length) return;
    let idx = cells.indexOf(document.activeElement);
    if (idx === -1) { cells[0].focus(); return; }
    const cols = state.board.categories.length;
    if (key === "ArrowRight") idx = Math.min(cells.length - 1, idx + 1);
    if (key === "ArrowLeft") idx = Math.max(0, idx - 1);
    if (key === "ArrowDown") idx = Math.min(cells.length - 1, idx + 1);
    if (key === "ArrowUp") idx = Math.max(0, idx - 1);
    cells[idx].focus();
  }

  /* ============================================================
     UTIL
     ============================================================ */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

})();
