/* =========================================================
   TRIVIA NIGHT PRO — admin.js
   No-code trivia pack editor.
   ========================================================= */
(function () {
  "use strict";

  const BUILTIN_PACKS = [
    { file: "questions/hiphop.json", label: "Hip-Hop" },
    { file: "questions/dancehall.json", label: "Dancehall" },
    { file: "questions/movies.json", label: "Movies" },
    { file: "questions/sports.json", label: "Sports" },
    { file: "questions/history.json", label: "History" },
    { file: "questions/bible.json", label: "Bible Trivia" },
    { file: "questions/nas.json", label: "Nas" },
    { file: "questions/jayz.json", label: "Jay-Z" },
    { file: "questions/biggie.json", label: "Biggie Smalls" },
    { file: "questions/flatbush.json", label: "Flatbush, Brooklyn" },
    { file: "questions/90shiphop.json", label: "90's Hip-Hop" },
    { file: "questions/90srnb.json", label: "90's R&B" },
    { file: "questions/fabolous.json", label: "Fabolous" },
    { file: "questions/instagram.json", label: "Instagram" },
    { file: "questions/beyonce.json", label: "Beyoncé" },
    { file: "questions/90sdancehall.json", label: "90's Dancehall" },
    { file: "questions/michaeljackson.json", label: "Michael Jackson" },
    { file: "questions/marvel.json", label: "Marvel (MCU)" },
    { file: "questions/dc.json", label: "DC (DCU)" },
    { file: "questions/loveandhiphop.json", label: "Love & Hip Hop" },
    { file: "questions/hiphopdjs.json", label: "Hip-Hop DJ's" },
    { file: "questions/rihanna.json", label: "Rihanna" },
    { file: "questions/custom.json", label: "Custom Template" }
  ];
  const CUSTOM_PACKS_KEY = "tnp_custom_packs_v1";

  const $ = (id) => document.getElementById(id);
  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  let currentPack = null;   // {id?, pack:{packName,theme,categories,finalJeopardy}, isCustom}

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindToolbar();
    bindModalClose();
    newBlankPack();
  }

  function bindModalClose() {
    qsa("[data-close-modal]").forEach((b) => b.addEventListener("click", () => b.closest(".modal-overlay").classList.add("hidden")));
    qsa(".modal-overlay").forEach((o) => o.addEventListener("click", (e) => { if (e.target === o) o.classList.add("hidden"); }));
  }

  function bindToolbar() {
    $("btnNewPack").addEventListener("click", () => { if (confirm("Start a new blank pack? Unsaved changes will be lost.")) newBlankPack(); });
    $("btnLoadPack").addEventListener("click", openLoadModal);
    $("btnDuplicatePack").addEventListener("click", duplicateCurrentPack);
    $("btnImportJson").addEventListener("click", importJson);
    $("btnExportJson").addEventListener("click", exportJson);
    $("btnDeletePack").addEventListener("click", deleteCurrentPack);
    $("btnSavePack").addEventListener("click", savePack);
  }

  function blankPackData() {
    const categories = [];
    for (let c = 0; c < 6; c++) {
      const questions = [100, 200, 300, 400, 500].map((v) => ({ value: v, question: "", answer: "" }));
      categories.push({ name: "Category " + (c + 1), questions });
    }
    return {
      packName: "New Trivia Pack",
      theme: "glass",
      categories,
      finalJeopardy: { category: "", question: "", answer: "" }
    };
  }

  function newBlankPack() {
    currentPack = { id: null, pack: blankPackData(), isCustom: true };
    renderPackIntoForm();
    showToast("Blank pack ready — fill in your categories and questions.");
  }

  function renderPackIntoForm() {
    const p = currentPack.pack;
    $("packNameInput").value = p.packName || "";
    $("packThemeInput").value = p.theme || "glass";
    $("fjCategory").value = (p.finalJeopardy && p.finalJeopardy.category) || "";
    $("fjQuestion").value = (p.finalJeopardy && p.finalJeopardy.question) || "";
    $("fjAnswer").value = (p.finalJeopardy && p.finalJeopardy.answer) || "";
    renderCategoryEditor();
  }

  function renderCategoryEditor() {
    const wrap = $("categoryEditor");
    wrap.innerHTML = "";
    currentPack.pack.categories.forEach((cat, ci) => {
      const catEl = document.createElement("div");
      catEl.className = "admin-cat glass";
      catEl.innerHTML = `
        <div class="admin-cat-header">
          <input type="text" value="${escapeAttr(cat.name)}" data-cat-name="${ci}" placeholder="Category name" />
          <button class="btn btn-sm" data-add-question="${ci}">＋ Question</button>
          ${currentPack.pack.categories.length > 1 ? `<button class="btn btn-sm btn-danger" data-remove-cat="${ci}">Remove Category</button>` : ""}
        </div>
        <div class="admin-q-grid" data-q-grid="${ci}"></div>
      `;
      wrap.appendChild(catEl);
      renderQuestionGrid(ci, catEl);
    });

    const addCatBtn = document.createElement("button");
    addCatBtn.className = "btn btn-sm";
    addCatBtn.textContent = "＋ Add Category";
    addCatBtn.addEventListener("click", () => {
      currentPack.pack.categories.push({ name: "New Category", questions: [100, 200, 300, 400, 500].map((v) => ({ value: v, question: "", answer: "" })) });
      renderCategoryEditor();
    });
    wrap.appendChild(addCatBtn);

    qsa("[data-cat-name]", wrap).forEach((inp) => inp.addEventListener("input", () => {
      currentPack.pack.categories[+inp.dataset.catName].name = inp.value;
    }));
    qsa("[data-add-question]", wrap).forEach((btn) => btn.addEventListener("click", () => {
      const ci = +btn.dataset.addQuestion;
      const qs_ = currentPack.pack.categories[ci].questions;
      const nextVal = qs_.length ? qs_[qs_.length - 1].value + 100 : 100;
      qs_.push({ value: nextVal, question: "", answer: "" });
      renderCategoryEditor();
    }));
    qsa("[data-remove-cat]", wrap).forEach((btn) => btn.addEventListener("click", () => {
      const ci = +btn.dataset.removeCat;
      if (confirm("Remove this category?")) { currentPack.pack.categories.splice(ci, 1); renderCategoryEditor(); }
    }));
  }

  function renderQuestionGrid(ci, catEl) {
    const grid = qs(`[data-q-grid="${ci}"]`, catEl);
    const cat = currentPack.pack.categories[ci];
    grid.innerHTML = "";
    cat.questions.forEach((q, qi) => {
      const qEl = document.createElement("div");
      qEl.className = "admin-q";
      qEl.innerHTML = `
        <div class="field-row" style="align-items:center;">
          <label style="flex:1;">Value $</label>
          <input type="number" value="${q.value}" data-q-value="${ci}:${qi}" style="width:90px;padding:0.3rem 0.5rem;border-radius:6px;border:1px solid var(--card-border);background:rgba(0,0,0,0.25);color:var(--text);" />
          <button class="btn btn-sm btn-danger" data-remove-q="${ci}:${qi}" title="Remove question">✕</button>
        </div>
        <label>Question</label>
        <textarea data-q-question="${ci}:${qi}" placeholder="Enter the question text">${escapeHtml(q.question)}</textarea>
        <label>Answer</label>
        <textarea data-q-answer="${ci}:${qi}" placeholder="Enter the correct answer">${escapeHtml(q.answer)}</textarea>
      `;
      grid.appendChild(qEl);
    });
    qsa("[data-q-value]", grid).forEach((inp) => inp.addEventListener("input", () => {
      const [ci2, qi2] = inp.dataset.qValue.split(":").map(Number);
      currentPack.pack.categories[ci2].questions[qi2].value = +inp.value || 0;
    }));
    qsa("[data-q-question]", grid).forEach((ta) => ta.addEventListener("input", () => {
      const [ci2, qi2] = ta.dataset.qQuestion.split(":").map(Number);
      currentPack.pack.categories[ci2].questions[qi2].question = ta.value;
    }));
    qsa("[data-q-answer]", grid).forEach((ta) => ta.addEventListener("input", () => {
      const [ci2, qi2] = ta.dataset.qAnswer.split(":").map(Number);
      currentPack.pack.categories[ci2].questions[qi2].answer = ta.value;
    }));
    qsa("[data-remove-q]", grid).forEach((btn) => btn.addEventListener("click", () => {
      const [ci2, qi2] = btn.dataset.removeQ.split(":").map(Number);
      currentPack.pack.categories[ci2].questions.splice(qi2, 1);
      renderCategoryEditor();
    }));
  }

  function syncFormIntoPack() {
    currentPack.pack.packName = $("packNameInput").value.trim() || "Untitled Pack";
    currentPack.pack.theme = $("packThemeInput").value;
    currentPack.pack.finalJeopardy = {
      category: $("fjCategory").value.trim(),
      question: $("fjQuestion").value.trim(),
      answer: $("fjAnswer").value.trim()
    };
  }

  /* ---------------- LOAD / SAVE / DELETE / DUPLICATE ---------------- */
  function openLoadModal() {
    const grid = $("adminPackGrid");
    grid.innerHTML = "";
    BUILTIN_PACKS.forEach((p) => {
      const card = document.createElement("button");
      card.className = "pack-card";
      card.innerHTML = `<h3>${p.label}</h3><p>Built-in pack (loads as editable copy)</p>`;
      card.addEventListener("click", () => {
        fetch(p.file).then((r) => r.json()).then((pack) => {
          currentPack = { id: null, pack, isCustom: true };
          renderPackIntoForm();
          $("modalLoadPack").classList.add("hidden");
          showToast("Loaded " + p.label + " — save to create your custom copy.");
        }).catch(() => showToast("Could not load pack. See README about running a local server.", "danger"));
      });
      grid.appendChild(card);
    });
    getCustomPacks().forEach((cp) => {
      const card = document.createElement("button");
      card.className = "pack-card";
      card.innerHTML = `<h3>${escapeHtml(cp.pack.packName)}</h3><p>Custom pack</p>`;
      card.addEventListener("click", () => {
        currentPack = { id: cp.id, pack: cp.pack, isCustom: true };
        renderPackIntoForm();
        $("modalLoadPack").classList.add("hidden");
        showToast("Loaded " + cp.pack.packName);
      });
      grid.appendChild(card);
    });
    $("modalLoadPack").classList.remove("hidden");
  }

  function getCustomPacks() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_PACKS_KEY) || "[]"); } catch (e) { return []; }
  }
  function setCustomPacks(list) { localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(list)); }

  function savePack() {
    syncFormIntoPack();
    const list = getCustomPacks();
    if (!currentPack.id) currentPack.id = "custom-" + Date.now();
    const idx = list.findIndex((cp) => cp.id === currentPack.id);
    const entry = { id: currentPack.id, pack: currentPack.pack };
    if (idx >= 0) list[idx] = entry; else list.push(entry);
    setCustomPacks(list);
    showToast("Pack saved! It now appears in Select Trivia Pack.", "success");
  }

  function duplicateCurrentPack() {
    syncFormIntoPack();
    currentPack = { id: null, pack: JSON.parse(JSON.stringify(currentPack.pack)), isCustom: true };
    currentPack.pack.packName += " (Copy)";
    renderPackIntoForm();
    showToast("Duplicated — edit and save to keep this copy.");
  }

  function deleteCurrentPack() {
    if (!currentPack.id) { showToast("This pack hasn't been saved yet, nothing to delete.", "danger"); return; }
    if (!confirm("Delete this custom pack? This cannot be undone.")) return;
    const list = getCustomPacks().filter((cp) => cp.id !== currentPack.id);
    setCustomPacks(list);
    showToast("Pack deleted.", "success");
    newBlankPack();
  }

  function exportJson() {
    syncFormIntoPack();
    const blob = new Blob([JSON.stringify(currentPack.pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = (currentPack.pack.packName || "trivia-pack").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".json";
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast("Exported " + filename, "success");
  }

  function importJson() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "application/json";
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const pack = JSON.parse(reader.result);
          if (!pack.categories) throw new Error("Missing categories");
          currentPack = { id: null, pack, isCustom: true };
          renderPackIntoForm();
          showToast("Imported pack — save to add it to your library.", "success");
        } catch (e) { showToast("Invalid trivia pack JSON.", "danger"); }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  /* ---------------- UTIL ---------------- */
  function showToast(msg, kind) {
    const stack = $("toastStack");
    const t = document.createElement("div");
    t.className = "toast glass";
    if (kind === "success") t.style.color = "var(--success)";
    if (kind === "danger") t.style.color = "var(--danger)";
    t.textContent = msg;
    stack.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
  function escapeHtml(str) {
    return String(str || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }
  function escapeAttr(str) { return escapeHtml(str).replace(/"/g, "&quot;"); }

})();
