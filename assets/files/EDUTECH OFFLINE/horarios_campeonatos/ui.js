import { formatDateDisplay } from "./utils.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapTable(headers, rowsHtml) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>${rowsHtml || "<tr><td colspan='99'>Sin datos.</td></tr>"}</tbody>
      </table>
    </div>
  `;
}

function options(items, valueKey, labelKey, selectedValue = "") {
  return items
    .map((it) => `<option value="${escapeHtml(it[valueKey])}" ${String(it[valueKey]) === String(selectedValue) ? "selected" : ""}>${escapeHtml(it[labelKey])}</option>`)
    .join("");
}

export function bindTabNavigation() {
  const tabs = [...document.querySelectorAll(".tab")];
  const panels = [...document.querySelectorAll(".tab-panel")];
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add("active");
    });
  });
}

export function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const node = document.createElement("div");
  node.className = `toast ${type}`;
  node.textContent = message;
  container.appendChild(node);
  setTimeout(() => node.remove(), 3500);
}

export function renderWarnings(messages = []) {
  const panel = document.getElementById("warningPanel");
  panel.innerHTML = messages.map((m) => `<div class="warning-item ${m.type}">${escapeHtml(m.text)}</div>`).join("");
}

export function collectWarningsForUI(...sets) {
  return sets.flat().filter(Boolean).map((text) => {
    let type = "warning";
    if (/error|falta|inválido|inexistente/i.test(text)) type = "error";
    if (/sin conflictos|correctamente|generada/i.test(text)) type = "success";
    return { type, text };
  });
}

export function renderSummaryCards(appState) {
  const grid = document.getElementById("summaryGrid");
  const cfg = appState.data?.config || {};
  const cards = [
    ["Torneo", cfg.torneo || "-"],
    ["Lugar", cfg.lugar || "-"],
    ["Fecha jornada", formatDateDisplay(cfg.fecha || "")],
    ["Categorías", appState.data?.categorias.length || 0],
    ["Técnicos", appState.data?.tecnicos.length || 0],
    ["Equipos", appState.data?.equipos.length || 0],
    ["Slots disponibles", (appState.data?.horarios || []).filter((h) => h.disponible).length],
    ["Enfrentamientos cargados", appState.requestedMatches?.length || 0],
    ["Programados", appState.scheduler?.scheduled?.length || 0],
    ["No programados", appState.scheduler?.unscheduled?.length || 0]
  ];

  grid.innerHTML = cards
    .map(([label, value]) => `<article class="summary-card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></article>`)
    .join("");
}

function renderConfigPanel(appState, handlers) {
  const node = document.getElementById("tab-configuracion");
  const cfg = appState.data?.config || {};
  node.innerHTML = `
    <h3>Configuración de jornada (una fecha)</h3>
    <div class="planner-grid">
      <label>Torneo<input id="cfgTorneo" class="inline-select" value="${escapeHtml(cfg.torneo || "")}" /></label>
      <label>Lugar<input id="cfgLugar" class="inline-select" value="${escapeHtml(cfg.lugar || "")}" /></label>
      <label>Fecha<input id="cfgFecha" type="date" class="inline-select" value="${escapeHtml(cfg.fecha || "")}" /></label>
      <label>Notas<input id="cfgNotas" class="inline-select" value="${escapeHtml(cfg.notas || "")}" /></label>
    </div>
    <div class="planner-actions"><button id="saveConfigBtn" class="btn btn-primary">Guardar configuración</button></div>
  `;
  document.getElementById("saveConfigBtn")?.addEventListener("click", () => {
    handlers.onSaveConfig({
      torneo: document.getElementById("cfgTorneo")?.value || "",
      lugar: document.getElementById("cfgLugar")?.value || "",
      fecha: document.getElementById("cfgFecha")?.value || "",
      notas: document.getElementById("cfgNotas")?.value || ""
    });
  });
}

function renderDatosPanel(appState, handlers) {
  const node = document.getElementById("tab-datos");
  const categorias = appState.data?.categorias || [];
  const tecnicos = appState.data?.tecnicos || [];
  const equipos = appState.data?.equipos || [];
  const horarios = appState.data?.horarios || [];

  const categoryRows = categorias.map((c, i) => `<tr><td>${escapeHtml(c.categoria_id)}</td><td>${escapeHtml(c.categoria_nombre)}</td><td>${escapeHtml(c.modalidad)}</td><td><button class="btn btn-ghost" data-del-cat="${i}">Quitar</button></td></tr>`).join("");
  const coachRows = tecnicos.map((t, i) => `<tr><td>${escapeHtml(t.tecnico_id)}</td><td>${escapeHtml(t.tecnico_nombre)}</td><td>${escapeHtml(t.telefono)}</td><td><button class="btn btn-ghost" data-del-coach="${i}">Quitar</button></td></tr>`).join("");
  const teamRows = equipos.map((e, i) => `<tr><td>${escapeHtml(e.equipo_id)}</td><td>${escapeHtml(e.equipo_nombre)}</td><td>${escapeHtml(e.categoria_id)}</td><td>${escapeHtml(e.tecnico_id)}</td><td><button class="btn btn-ghost" data-del-team="${i}">Quitar</button></td></tr>`).join("");
  const slotRows = horarios.map((h, i) => `<tr><td>${escapeHtml(h.slot_id)}</td><td>${escapeHtml(h.hora)}</td><td>${escapeHtml(h.cancha)}</td><td>${h.disponible ? "SI" : "NO"}</td><td><button class="btn btn-ghost" data-del-slot="${i}">Quitar</button></td></tr>`).join("");

  node.innerHTML = `
    <h3>Captura manual de datos base</h3>
    <div class="planner-grid">
      <label>ID categoría<input id="catId" class="inline-select" placeholder="CAT001" /></label>
      <label>Nombre categoría<input id="catNombre" class="inline-select" placeholder="Babies 2019 F5" /></label>
      <label>Modalidad<input id="catModalidad" class="inline-select" placeholder="Fútbol 5" /></label>
      <label>&nbsp;<button id="addCatBtn" class="btn">Agregar categoría</button></label>
    </div>
    <div class="planner-grid">
      <label>ID técnico<input id="coachId" class="inline-select" placeholder="TEC001" /></label>
      <label>Nombre técnico<input id="coachNombre" class="inline-select" placeholder="Juan Pérez" /></label>
      <label>Teléfono<input id="coachTel" class="inline-select" placeholder="3001111111" /></label>
      <label>&nbsp;<button id="addCoachBtn" class="btn">Agregar técnico</button></label>
    </div>
    <div class="planner-grid">
      <label>ID equipo<input id="teamId" class="inline-select" placeholder="EQ001" /></label>
      <label>Nombre equipo<input id="teamNombre" class="inline-select" placeholder="Leones" /></label>
      <label>Categoría<select id="teamCategoria" class="inline-select">${options(categorias, "categoria_id", "categoria_nombre")}</select></label>
      <label>Técnico<select id="teamTecnico" class="inline-select">${options(tecnicos, "tecnico_id", "tecnico_nombre")}</select></label>
      <label>&nbsp;<button id="addTeamBtn" class="btn">Agregar equipo</button></label>
    </div>
    <div class="planner-grid">
      <label>ID slot<input id="slotId" class="inline-select" placeholder="H001" /></label>
      <label>Hora<input id="slotHora" class="inline-select" placeholder="08:00" /></label>
      <label>Cancha<input id="slotCancha" class="inline-select" placeholder="Cancha 1" /></label>
      <label>Disponible
        <select id="slotDisp" class="inline-select"><option value="1">SI</option><option value="0">NO</option></select>
      </label>
      <label>&nbsp;<button id="addSlotBtn" class="btn">Agregar horario</button></label>
    </div>

    <h4>Categorías</h4>${wrapTable(["ID", "Nombre", "Modalidad", "Acción"], categoryRows)}
    <h4 style="margin-top:0.8rem;">Técnicos</h4>${wrapTable(["ID", "Nombre", "Teléfono", "Acción"], coachRows)}
    <h4 style="margin-top:0.8rem;">Equipos</h4>${wrapTable(["ID", "Nombre", "Categoría", "Técnico", "Acción"], teamRows)}
    <h4 style="margin-top:0.8rem;">Horarios</h4>${wrapTable(["ID", "Hora", "Cancha", "Disponible", "Acción"], slotRows)}
  `;

  document.getElementById("addCatBtn")?.addEventListener("click", () => handlers.onAddCategory({
    categoria_id: document.getElementById("catId")?.value || "",
    categoria_nombre: document.getElementById("catNombre")?.value || "",
    modalidad: document.getElementById("catModalidad")?.value || "",
    observaciones: ""
  }));
  document.getElementById("addCoachBtn")?.addEventListener("click", () => handlers.onAddCoach({
    tecnico_id: document.getElementById("coachId")?.value || "",
    tecnico_nombre: document.getElementById("coachNombre")?.value || "",
    telefono: document.getElementById("coachTel")?.value || "",
    observaciones: ""
  }));
  document.getElementById("addTeamBtn")?.addEventListener("click", () => handlers.onAddTeam({
    equipo_id: document.getElementById("teamId")?.value || "",
    equipo_nombre: document.getElementById("teamNombre")?.value || "",
    categoria_id: document.getElementById("teamCategoria")?.value || "",
    tecnico_id: document.getElementById("teamTecnico")?.value || "",
    grupo: "A",
    observaciones: ""
  }));
  document.getElementById("addSlotBtn")?.addEventListener("click", () => handlers.onAddSlot({
    slot_id: document.getElementById("slotId")?.value || "",
    hora: document.getElementById("slotHora")?.value || "",
    cancha: document.getElementById("slotCancha")?.value || "",
    disponible: document.getElementById("slotDisp")?.value === "1",
    observaciones: ""
  }));

  node.querySelectorAll("[data-del-cat]").forEach((b) => b.addEventListener("click", (e) => handlers.onDeleteCategory(Number(e.target.dataset.delCat))));
  node.querySelectorAll("[data-del-coach]").forEach((b) => b.addEventListener("click", (e) => handlers.onDeleteCoach(Number(e.target.dataset.delCoach))));
  node.querySelectorAll("[data-del-team]").forEach((b) => b.addEventListener("click", (e) => handlers.onDeleteTeam(Number(e.target.dataset.delTeam))));
  node.querySelectorAll("[data-del-slot]").forEach((b) => b.addEventListener("click", (e) => handlers.onDeleteSlot(Number(e.target.dataset.delSlot))));
}

function renderEnfrentamientosPanel(appState, handlers) {
  const node = document.getElementById("tab-enfrentamientos");
  const categorias = appState.data?.categorias || [];
  const equipos = appState.data?.equipos || [];
  const selectedCat = appState.selectedCategoryId || categorias[0]?.categoria_id || "";
  const teamsByCat = equipos.filter((e) => e.categoria_id === selectedCat);

  const rows = (appState.requestedMatches || [])
    .map((m, i) => {
      const local = equipos.find((e) => e.equipo_id === m.equipo_local_id);
      const away = equipos.find((e) => e.equipo_id === m.equipo_visitante_id);
      const cat = categorias.find((c) => c.categoria_id === m.categoria_id);
      return `<tr><td>${i + 1}</td><td>${escapeHtml(cat?.categoria_nombre || m.categoria_id)}</td><td>${escapeHtml(local?.equipo_nombre || m.equipo_local_id)}</td><td>${escapeHtml(away?.equipo_nombre || m.equipo_visitante_id)}</td><td><button class="btn btn-ghost" data-del-match="${i}">Quitar</button></td></tr>`;
    })
    .join("");

  node.innerHTML = `
    <h3>Definir enfrentamientos de la fecha</h3>
    <div class="planner-grid">
      <label>Categoría<select id="matchCat" class="inline-select">${options(categorias, "categoria_id", "categoria_nombre", selectedCat)}</select></label>
      <label>Local<select id="matchLocal" class="inline-select">${options(teamsByCat, "equipo_id", "equipo_nombre")}</select></label>
      <label>Visitante<select id="matchAway" class="inline-select">${options(teamsByCat, "equipo_id", "equipo_nombre")}</select></label>
      <label>&nbsp;<button id="addMatchBtn" class="btn">Agregar enfrentamiento</button></label>
    </div>
    <div class="planner-actions">
      <button id="clearMatchesBtn" class="btn btn-ghost">Vaciar enfrentamientos</button>
    </div>
    ${wrapTable(["#", "Categoría", "Local", "Visitante", "Acción"], rows)}
  `;

  document.getElementById("matchCat")?.addEventListener("change", (ev) => handlers.onSelectCategory(ev.target.value));
  document.getElementById("addMatchBtn")?.addEventListener("click", () => handlers.onAddMatch({
    categoria_id: document.getElementById("matchCat")?.value || "",
    equipo_local_id: document.getElementById("matchLocal")?.value || "",
    equipo_visitante_id: document.getElementById("matchAway")?.value || ""
  }));
  document.getElementById("clearMatchesBtn")?.addEventListener("click", () => handlers.onClearMatches());
  node.querySelectorAll("[data-del-match]").forEach((b) => b.addEventListener("click", (e) => handlers.onDeleteMatch(Number(e.target.dataset.delMatch))));
}

function buildSlotOptions(slots, selectedId) {
  return slots
    .map((slot) => `<option value="${escapeHtml(slot.slot_id)}" ${slot.slot_id === selectedId ? "selected" : ""}>${escapeHtml(slot.hora)} | ${escapeHtml(slot.cancha)}</option>`)
    .join("");
}

function renderProgramacionPanel(appState, handlers) {
  const node = document.getElementById("tab-programacion");
  const slots = (appState.data?.horarios || []).filter((h) => h.disponible);
  const rows = (appState.scheduler?.scheduled || [])
    .map((m, i) => {
      const cat = appState.data.categorias.find((c) => c.categoria_id === m.categoria_id);
      const local = appState.data.equipos.find((e) => e.equipo_id === m.equipo_local_id);
      const away = appState.data.equipos.find((e) => e.equipo_id === m.equipo_visitante_id);
      const t1 = appState.data.tecnicos.find((t) => t.tecnico_id === local?.tecnico_id);
      const t2 = appState.data.tecnicos.find((t) => t.tecnico_id === away?.tecnico_id);
      return `<tr>
        <td>${i + 1}</td><td>${escapeHtml(cat?.categoria_nombre || m.categoria_id)}</td><td>${escapeHtml(m.hora)}</td><td>${escapeHtml(m.cancha)}</td>
        <td>${escapeHtml(local?.equipo_nombre || m.equipo_local_id)}</td><td>${escapeHtml(away?.equipo_nombre || m.equipo_visitante_id)}</td>
        <td>${escapeHtml(t1?.tecnico_nombre || "-")}</td><td>${escapeHtml(t2?.tecnico_nombre || "-")}</td>
        <td><select class="inline-select" data-slot-change="${i}">${buildSlotOptions(slots, m.slot_id)}</select></td></tr>`;
    })
    .join("");
  node.innerHTML = `
    <h3>Programación final de la fecha ${escapeHtml(formatDateDisplay(appState.data?.config?.fecha || ""))}</h3>
    ${wrapTable(["#", "Categoría", "Hora", "Cancha", "Local", "Visitante", "Técnico local", "Técnico visitante", "Ajuste"], rows)}
  `;
  node.querySelectorAll("[data-slot-change]").forEach((el) => el.addEventListener("change", (e) => handlers.onManualChange(Number(e.target.dataset.slotChange), e.target.value)));
}

function renderAlertasPanel(appState) {
  const node = document.getElementById("tab-alertas");
  const cRows = (appState.scheduler?.conflicts || []).map((c) => `<tr class="row-danger"><td>${escapeHtml(c.tipo)}</td><td>${escapeHtml(c.hora)}</td><td>${escapeHtml(c.entidad)}</td></tr>`).join("");
  const uRows = (appState.scheduler?.unscheduled || []).map((m) => {
    const local = appState.data.equipos.find((e) => e.equipo_id === m.equipo_local_id);
    const away = appState.data.equipos.find((e) => e.equipo_id === m.equipo_visitante_id);
    return `<tr><td>${escapeHtml(local?.equipo_nombre || m.equipo_local_id)}</td><td>${escapeHtml(away?.equipo_nombre || m.equipo_visitante_id)}</td><td>${escapeHtml(m.motivo || "sin horario disponible")}</td></tr>`;
  }).join("");
  node.innerHTML = `
    <h3>Alertas y conflictos</h3>
    ${wrapTable(["Tipo", "Hora", "Entidad"], cRows)}
    <h3 style="margin-top:0.8rem;">No programados</h3>
    ${wrapTable(["Local", "Visitante", "Motivo"], uRows)}
  `;
}

export function renderAll(appState, handlers) {
  renderSummaryCards(appState);

  if (!appState.data) {
    ["configuracion", "datos", "enfrentamientos", "programacion", "alertas"].forEach((id) => {
      document.getElementById(`tab-${id}`).innerHTML = '<div class="placeholder">Carga plantilla o empieza a capturar datos.</div>';
    });
    return;
  }

  renderConfigPanel(appState, handlers);
  renderDatosPanel(appState, handlers);
  renderEnfrentamientosPanel(appState, handlers);
  renderProgramacionPanel(appState, handlers);
  renderAlertasPanel(appState);
}
