const EPQA = {
  storageKey: "epqa_horarios_avance_v1",
  data: null,
  slots: [],
  schedules: [],
  activeScheduleId: null,
  plan: { plan_code: "free", max_schedules: 1 },
  limit: null,
  audit: { counts: { P0: 0, P1: 0, P2: 0 }, score: 100, results: [] },
  chart: null,
  ui: {
    audio: null,
    soundEnabled: true,
    lastDropTarget: null,
    dragMoveKey: "",
    dragMoveResult: null,
    relaxedProposal: null,
    splitPendingLoads: {},
    bulkLoadDraft: []
  },
  palette: {
    "Castellano": "#fde2e4",
    "Matematicas": "#dbeafe",
    "Tecnologia e Informatica": "#dcfce7",
    "DPC": "#ccfbf1",
    "Emprendimiento": "#fef3c7",
    "Educacion Fisica": "#fed7aa",
    "Fisica": "#e0e7ff",
    "Quimica": "#fbcfe8",
    "Biologia": "#bbf7d0",
    "Ingles": "#cffafe",
    "Sociales": "#ddd6fe",
    "Artistica": "#fae8ff",
    "Religion": "#f5f5f4",
    "Etica": "#e7e5e4"
  }
};

const AUDIT_RULE_LABELS = {
  "base": "Sin conflictos importantes",
  "keep-original-load": "No cambiar docente, materia ni grupo original",
  "teacher-site": "Respetar sede asignada del docente",
  "no-teacher-overlap": "Docente con dos clases al mismo tiempo",
  "no-group-overlap": "Grupo con dos clases al mismo tiempo",
  "no-room-overlap": "Espacio ocupado por varias clases",
  "room-ti": "Tecnologia debe ir en sala TI",
  "pe-room": "Educacion fisica debe ir en cancha",
  "pe-block": "Educacion fisica debe quedar en bloque",
  "andres-load": "Carga completa de Andres",
  "secondary-min-load": "Carga minima docente en secundaria",
  "same-subject-day-hours": "Horas misma materia por dia",
  "pedagogic-block": "Bloque pedagogico recomendado"
};

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".app-shell")) return;
  bindNavigation();
  setupDataSectionTabs();
  bindActions();
  loadSeed();
});

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      document.querySelector(`#panel-${button.dataset.panel}`).classList.add("active");
    });
  });
}

function setupDataSectionTabs() {
  const panel = byId("panel-data");
  const grid = panel?.querySelector(".catalog-grid");
  if (!panel || !grid || panel.querySelector(".config-tabs")) return;
  const cards = [...grid.querySelectorAll(".catalog-card")];
  const tabs = document.createElement("div");
  tabs.className = "config-tabs";
  const labels = ["Institución", "Sedes", "Docentes", "Resumen docente", "Resumen grados", "Grados", "Materias", "Reglas", "Asignaciones", "Disponibilidad", "JSON"];
  cards.forEach((card, index) => {
    card.dataset.configTab = String(index);
    if (index !== 0) card.hidden = true;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `config-tab ${index === 0 ? "active" : ""}`;
    button.textContent = labels[index] || card.querySelector("h2")?.textContent?.trim() || `Seccion ${index + 1}`;
    button.addEventListener("click", () => {
      cards.forEach((item) => { item.hidden = item !== card; });
      tabs.querySelectorAll(".config-tab").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
    tabs.appendChild(button);
  });
  panel.insertBefore(tabs, grid);
  enhanceSelectsInDataPanel();
}

function enhanceSelectsInDataPanel() {
  document.querySelectorAll("#panel-data select").forEach((select) => syncSearchableSelect(select, true));
}

function bindActions() {
  byId("btnCollapseSidebar")?.addEventListener("click", () => {
    document.querySelector(".app-shell")?.classList.toggle("sidebar-collapsed");
  });
  byId("viewMode")?.addEventListener("change", () => {
    fillFilters();
    renderAvailableTray();
    renderBoard();
  });
  byId("viewFilter").addEventListener("change", () => {
    renderAvailableTray();
    renderBoard();
  });
  byId("auditMode").addEventListener("change", renderBoard);
  byId("breakMode").addEventListener("change", renderBoard);
  onAny("click", () => generateOptimizedSchedule(false), "btnDashGenerarCero", "btnGenerate");
  onAny("click", () => generateOptimizedSchedule(true), "btnDashGenerarActual", "btnGenerateMissing");
  onAny("click", repairConflicts, "btnDashRevisarProblemas", "btnRepair");
  onAny("click", () => saveVersion(false), "btnDashGuardarVersion", "btnSave");
  onAny("click", () => saveVersion(true), "btnFinalPdf");
  const scheduleSelect = byAnyId("dashHorarioSelect", "scheduleSelect");
  scheduleSelect?.addEventListener("change", () => loadScheduleById(scheduleSelect.value));
  onAny("click", createScheduleFromCurrent, "btnDashCrearNuevo", "btnNewSchedule");
  onAny("click", duplicateActiveSchedule, "btnDashDuplicar", "btnDuplicateSchedule");
  onAny("click", exportActiveScheduleJson, "btnDashExportarJson", "btnExportJson");
  onAny("click", deleteActiveSchedule, "btnDeleteSchedule");
  byId("btnImportJson")?.addEventListener("click", importJson);
  byId("btnImportFile")?.addEventListener("click", importDataFile);
  byId("dataFileInput")?.addEventListener("change", importDataFile);
  byId("btnExcel").addEventListener("click", exportExcel);
  byId("btnPdfTeachers").addEventListener("click", () => exportPdf("teacher"));
  byId("btnPdfGroups").addEventListener("click", () => exportPdf("group"));
  byId("btnPdfRooms").addEventListener("click", () => exportPdf("room"));
  onAny("click", saveProgress, "btnDashGuardarAvance", "btnSaveProgress");
  onAny("click", loadProgress, "btnDashCargarAvance", "btnLoadProgress");
  onAny("click", downloadProgressBackup, "btnDashDescargarBackup", "btnBackupProgress");
  onAny("click", () => byId("backupInput")?.click(), "btnDashSubirBackup");
  byId("backupInput")?.addEventListener("change", importProgressBackup);
  onAny("click", () => {
    const menu = byAnyId("dashMasAccionesMenu");
    if (menu) menu.hidden = !menu.hidden;
  }, "btnDashMasAcciones");
  onAny("click", () => openPanel("editor"), "btnDashIrPropuesta");
  onAny("click", () => openPanel("audit"), "btnDashIrAuditoría", "btnDashVerAuditoría");
  document.querySelectorAll(".epqa-dashboard-v2 a[data-target-tab]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openConfigSection(link.dataset.targetTab);
    });
  });
  byId("btnSaveSchool")?.addEventListener("click", saveSchoolData);
  byId("btnSaveGeneralRules")?.addEventListener("click", saveGeneralRules);
  byId("btnAddDailyRule")?.addEventListener("click", addDailyRuleException);
  byId("btnAddSite")?.addEventListener("click", addSite);
  byId("btnAddRoom")?.addEventListener("click", addRoom);
  byId("btnAddTeacher")?.addEventListener("click", addTeacher);
  byAnyId("teacherSummarySelect", "teacherDetailSelect")?.addEventListener("change", renderTeacherDetailPanel);
  byAnyId("gradeSummarySelect", "groupDetailSelect")?.addEventListener("change", renderGroupDetailPanel);
  byId("loadTeacher")?.addEventListener("change", () => refreshLoadGroupOptions());
  byId("loadRoom")?.addEventListener("change", () => refreshLoadGroupOptions());
  byId("btnAddGroup")?.addEventListener("click", addGroup);
  byId("btnAddSubject")?.addEventListener("click", addSubject);
  byId("btnAddLoad")?.addEventListener("click", addLoad);
  byId("btnOpenBulkLoad")?.addEventListener("click", openBulkLoadModal);
  byId("bulkLoadModalClose")?.addEventListener("click", requestCloseBulkLoadModal);
  byId("bulkLoadModalCancel")?.addEventListener("click", requestCloseBulkLoadModal);
  byId("bulkLoadTeacher")?.addEventListener("change", () => {
    renderBulkLoadGroups();
    renderBulkLoadDrafts();
  });
  byId("bulkLoadRoom")?.addEventListener("change", renderBulkLoadGroups);
  byId("bulkLoadToggleGroups")?.addEventListener("click", toggleBulkLoadGroups);
  byId("bulkLoadAddDraft")?.addEventListener("click", addBulkLoadDraft);
  byId("bulkLoadAssign")?.addEventListener("click", assignBulkLoadDrafts);
  byId("bulkLoadModal")?.addEventListener("click", (event) => {
    if (event.target === byId("bulkLoadModal")) requestCloseBulkLoadModal();
  });
  byId("editLoadModalClose")?.addEventListener("click", closeEditLoadModal);
  byId("editLoadModalCancel")?.addEventListener("click", closeEditLoadModal);
  byId("editLoadSave")?.addEventListener("click", saveEditLoadModal);
  byId("editLoadModal")?.addEventListener("click", (event) => {
    if (event.target === byId("editLoadModal")) closeEditLoadModal();
  });
  ["loadsFilterText", "loadsFilterTeacher", "loadsFilterGroup", "loadsFilterSubject", "loadsFilterPriority"].forEach((id) => {
    byId(id)?.addEventListener(id === "loadsFilterText" ? "input" : "change", renderLoads);
  });
  byId("btnClearLoadFilters")?.addEventListener("click", clearLoadFilters);
  document.addEventListener("click", (event) => {
    closeScheduleContextMenu();
    if (event.target.closest("[data-modal-close]")) closeAvailabilityModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeScheduleContextMenu();
  });
  byId("availabilityModalSave")?.addEventListener("click", saveAvailabilityModal);
  byId("availabilityModalReset")?.addEventListener("click", resetAvailabilityModal);
  byId("availabilityModalBaseSite")?.addEventListener("change", syncAvailabilityModalBaseSite);
  byId("availabilityModalGrid")?.addEventListener("click", onAvailabilityModalGridClick);
  byId("availabilityModalGrid")?.addEventListener("change", onAvailabilityModalGridChange);
  byId("availabilityModal")?.addEventListener("click", (event) => {
    if (event.target === byId("availabilityModal")) closeAvailabilityModal();
  });
  byId("uxModalClose")?.addEventListener("click", closeUxModal);
  byId("uxModalCancel")?.addEventListener("click", closeUxModal);
  byId("uxModalUpgrade")?.addEventListener("click", () => {
    window.location.href = "/?pg=plans";
  });
  byId("uxModal")?.addEventListener("click", (event) => {
    if (event.target === byId("uxModal")) closeUxModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (byId("uxModal")?.hidden === false) closeUxModal();
    else if (byId("availabilityModal")?.hidden === false) closeAvailabilityModal();
  });
}

async function loadSeed() {
  const serverLoaded = await loadScheduleWorkspace();
  if (serverLoaded) return;
  const saved = readProgress();
  if (saved?.data) {
    applyProgress(saved);
    return;
  }
  initializeEmptyWorkspace();
}

function initializeEmptyWorkspace() {
  EPQA.data = normalizeImportedData({
    project: { name: "", institution: "" },
    sites: [],
    days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    teachers: [],
    groups: [],
    rooms: [],
    subjects: [],
    loads: [],
    slots: [],
    rules: { general: { maxTeacherHoursPerDay: 6, dailyExceptions: [] }, critical: [], teacherSite: [], room: [], block: [] }
  });
  EPQA.slots = [];
  EPQA.audit = { counts: { P0: 0, P1: 0, P2: 0 }, score: 100, results: [] };
  byId("jsonInput").value = "";
  fillFilters();
  renderMetrics();
  renderLoads();
  renderCatalogEditor();
  renderAvailableTray();
  renderBoard();
  renderAudit();
}

async function loadScheduleWorkspace(scheduleId = null) {
  try {
    const url = scheduleId ? `/horarios/api/schedules.php?id=${encodeURIComponent(scheduleId)}` : "/horarios/api/schedules.php";
    const response = await fetch(url);
    if (response.status === 401) {
      window.location.href = "/?pg=login";
      return true;
    }
    const payload = await response.json();
    if (!payload.ok) return false;
    EPQA.schedules = payload.schedules || [];
    EPQA.plan = payload.plan || EPQA.plan;
    EPQA.limit = payload.limit || null;
    renderScheduleSwitcher(payload.active || null);
    const fallbackScheduleId = chooseLoadedScheduleId(payload.schedules || [], scheduleId);
    if (!payload.active?.data && fallbackScheduleId && String(fallbackScheduleId) !== String(scheduleId || "")) {
      return loadScheduleWorkspace(fallbackScheduleId);
    }
    if (payload.active) {
      EPQA.activeScheduleId = payload.active.id;
      const snapshotData = canonicalScheduleInput(payload.active.data || {});
      const currentData = canonicalScheduleInput(EPQA.data && typeof EPQA.data === "object" ? EPQA.data : {});
      const resolvedData = resolveScheduleData(snapshotData, currentData);
      EPQA.data = normalizeImportedData(resolvedData);
      EPQA.slots = Array.isArray(payload.active.slots) && payload.active.slots.length
        ? payload.active.slots
        : (EPQA.data.slots && EPQA.data.slots.length ? EPQA.data.slots : (Array.isArray(currentData.slots) ? currentData.slots : EPQA.slots));
      EPQA.audit = payload.active.audit || EPQA.audit;
      if (byId("jsonInput")) byId("jsonInput").value = JSON.stringify(EPQA.data, null, 2);
      updateDataLoadAlert({ data: EPQA.data, slots: EPQA.slots, audit: EPQA.audit });
      traceWorkspaceState("before-render", payload.active);
      try {
        renderDataViews();
        traceWorkspaceState("after-render", payload.active);
      } catch (renderError) {
        console.error("EPQA render error after loading schedule", renderError);
        showDataLoadAlert("El horario activo cargó con advertencias visuales. Revisa si faltan datos en Institución, Docentes, Grados, Materias o Cargas.");
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("EPQA load schedule error", error);
    return false;
  }
}

function resolveScheduleData(snapshotData, fallbackData) {
  const snapshot = snapshotData && typeof snapshotData === "object" ? snapshotData : {};
  const fallback = fallbackData && typeof fallbackData === "object" ? fallbackData : {};
  if (hasCanonicalScheduleData(snapshot)) return snapshot;
  if (hasCanonicalScheduleData(fallback)) return fallback;
  const merged = { ...fallback, ...snapshot };
  merged.project = { ...(fallback.project || {}), ...(snapshot.project || {}) };
  merged.days = Array.isArray(snapshot.days) && snapshot.days.length ? snapshot.days : (Array.isArray(fallback.days) ? fallback.days : merged.days);
  merged.sites = Array.isArray(snapshot.sites) && snapshot.sites.length ? snapshot.sites : (Array.isArray(fallback.sites) ? fallback.sites : merged.sites);
  merged.rooms = Array.isArray(snapshot.rooms) && snapshot.rooms.length ? snapshot.rooms : (Array.isArray(fallback.rooms) ? fallback.rooms : merged.rooms);
  merged.teachers = Array.isArray(snapshot.teachers) && snapshot.teachers.length ? snapshot.teachers : (Array.isArray(fallback.teachers) ? fallback.teachers : merged.teachers);
  merged.groups = Array.isArray(snapshot.groups) && snapshot.groups.length ? snapshot.groups : (Array.isArray(fallback.groups) ? fallback.groups : merged.groups);
  merged.subjects = Array.isArray(snapshot.subjects) && snapshot.subjects.length ? snapshot.subjects : (Array.isArray(fallback.subjects) ? fallback.subjects : merged.subjects);
  merged.loads = Array.isArray(snapshot.loads) && snapshot.loads.length ? snapshot.loads : (Array.isArray(fallback.loads) ? fallback.loads : merged.loads);
  merged.slots = Array.isArray(snapshot.slots) && snapshot.slots.length ? snapshot.slots : (Array.isArray(fallback.slots) ? fallback.slots : merged.slots);
  merged.rules = snapshot.rules && Object.keys(snapshot.rules).length ? snapshot.rules : fallback.rules || merged.rules;
  return merged;
}

function traceWorkspaceState(stage, active) {
  try {
    const data = EPQA.data || {};
    const teachers = Array.isArray(data.teachers) ? data.teachers.length : 0;
    const groups = Array.isArray(data.groups)
      ? data.groups.length
      : (Array.isArray(data.groups?.primary) ? data.groups.primary.length : 0) + (Array.isArray(data.groups?.secondary) ? data.groups.secondary.length : 0);
    const subjects = Array.isArray(data.subjects) ? data.subjects.length : 0;
    const loads = Array.isArray(data.loads) ? data.loads.length : 0;
    const slots = Array.isArray(EPQA.slots) ? EPQA.slots.length : 0;
    const auditCounts = EPQA.audit?.counts || { P0: 0, P1: 0, P2: 0 };
    const dataSummary = {
      scheduleId: EPQA.activeScheduleId || active?.id || null,
      scheduleName: active?.schedule?.name || data.project?.institution || data.project?.name || "",
      teachers,
      groups,
      subjects,
      loads,
      slots,
      p0: Number(auditCounts.P0 || 0),
      p1: Number(auditCounts.P1 || 0),
      p2: Number(auditCounts.P2 || 0)
    };
    const domSummary = {
      dashHorarioActivo: textById("dashHorarioActivo"),
      dashEstadoHorario: textById("dashEstadoHorario"),
      dashUltimaActualizacion: textById("dashUltimaActualizacion"),
      metricDocentes: textById("metricDocentes"),
      metricGrados: textById("metricGrados"),
      metricMaterias: textById("metricMaterias"),
      metricCargas: textById("metricCargas"),
      metricHorasAsignadas: textById("metricHorasAsignadas"),
      metricHorasPendientes: textById("metricHorasPendientes"),
      metricP0: textById("metricP0"),
      metricP1: textById("metricP1"),
      metricP2: textById("metricP2"),
      metricCumplimiento: textById("metricCumplimiento"),
      metricPendientesTexto: textById("metricPendientesTexto"),
      metricAlertasTexto: textById("metricAlertasTexto")
    };
    console.groupCollapsed(`EPQA trace ${stage}`);
    console.log("active payload", active || null);
    console.log("data summary", dataSummary);
    console.log("dom summary", domSummary);
    console.log("comparison", {
      docentes: String(dataSummary.teachers) === normalizeDomNumber(domSummary.metricDocentes),
      grados: String(dataSummary.groups) === normalizeDomNumber(domSummary.metricGrados),
      materias: String(dataSummary.subjects) === normalizeDomNumber(domSummary.metricMaterias),
      cargas: String(dataSummary.loads) === normalizeDomNumber(domSummary.metricCargas),
      p0: String(dataSummary.p0) === normalizeDomNumber(domSummary.metricP0),
      p1: String(dataSummary.p1) === normalizeDomNumber(domSummary.metricP1),
      p2: String(dataSummary.p2) === normalizeDomNumber(domSummary.metricP2)
    });
    console.groupEnd();
  } catch (error) {
    console.error("EPQA trace error", error);
  }
}

function textById(id) {
  return (byId(id)?.textContent || "").trim();
}

function normalizeDomNumber(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function chooseLoadedScheduleId(schedules, currentId = null) {
  const current = currentId ? String(currentId) : "";
  const preferred = (schedules || []).find((schedule) => schedule && schedule.active_version_id && String(schedule.id) !== current);
  if (preferred) return preferred.id;
  const first = (schedules || []).find((schedule) => schedule && String(schedule.id) !== current);
  return first?.id || null;
}

function showDataLoadAlert(message, tone = "warning") {
  const alert = byId("dataLoadAlert");
  if (!alert) return;
  alert.hidden = false;
  alert.className = `panel-inline-alert ${tone}`;
  alert.textContent = message;
}

function hideDataLoadAlert() {
  const alert = byId("dataLoadAlert");
  if (!alert) return;
  alert.hidden = true;
  alert.textContent = "";
  alert.className = "panel-inline-alert";
}

function updateDataLoadAlert(active) {
  const data = active?.data || {};
  const missing = [];
  if (!Object.keys(data).length) missing.push("el snapshot activo no trae datos base");
  if (!Array.isArray(data.teachers) || !data.teachers.length) missing.push("no hay docentes cargados");
  if (!Array.isArray(data.groups) || (!data.groups.length && !data.groups?.primary?.length && !data.groups?.secondary?.length)) missing.push("no hay grados cargados");
  if (!Array.isArray(data.subjects) || !data.subjects.length) missing.push("no hay materias cargadas");
  if (!Array.isArray(EPQA.slots) || !EPQA.slots.length) missing.push("no hay propuesta de horario cargada");
  if (!EPQA.audit || !Array.isArray(EPQA.audit.results)) missing.push("no hay Auditoría");
  if (missing.length) {
    showDataLoadAlert(`El horario llegó con faltantes: ${missing.join(", ")}.`);
  } else {
    hideDataLoadAlert();
  }
}

function renderScheduleSwitcher(active) {
  EPQA.activeScheduleId = active?.id || null;
  const activeSchedule = active?.schedule || (EPQA.schedules || []).find((item) => String(item.id) === String(active?.id));
  const select = byAnyId("dashHorarioSelect", "scheduleSelect");
  if (select) {
    select.innerHTML = (EPQA.schedules || []).map((schedule) =>
      `<option value="${escapeHtml(schedule.id)}">${escapeHtml(schedule.name)} (${statusLabel(schedule.status)})</option>`
    ).join("");
    if (active?.id) select.value = String(active.id);
  }
  setTextAny(activeSchedule?.name || "Sin horario activo", "dashHorarioActivo", "activeScheduleName");
  setTextAny(activeSchedule ? statusLabel(activeSchedule.status) : "Crea o importa un horario", "dashEstadoHorario", "activeScheduleStatus");
  const canCreate = EPQA.limit?.allowed !== false;
  const createButton = byAnyId("btnDashCrearNuevo", "btnNewSchedule");
  if (createButton) {
    createButton.disabled = !canCreate;
    createButton.title = canCreate ? "" : "Disponible en plan Pro";
  }
}

function statusLabel(status) {
  return {
    draft: "Borrador",
    auditing: "Con pendientes criticos",
    publishable: "Publicable con observaciones",
    finalized: "Finalizado",
    archived: "Archivado"
  }[status] || status || "Borrador";
}

function formatShortDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

async function loadScheduleById(scheduleId) {
  if (!scheduleId) return;
  await loadScheduleWorkspace(scheduleId);
}

async function createScheduleFromCurrent() {
  const name = prompt("Nombre del nuevo horario", EPQA.data?.project?.name || "Horario EPQA");
  if (!name) return;
  const response = await fetch("/horarios/api/schedules.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", name, data: EPQA.data || {}, slots: EPQA.slots || [], audit: EPQA.audit || null })
  });
  const payload = await response.json();
  if (!payload.ok) {
    if (payload.code === "FREE_LIMIT_REACHED") {
      showFreeLimitModal();
      return;
    }
    notify("No se pudo crear", payload.error || payload.message || "Intenta de nuevo.", "error", true);
    return;
  }
  EPQA.activeScheduleId = payload.id;
  await loadScheduleWorkspace(payload.id);
  notify("Horario creado", "El nuevo horario quedo asociado a tu usuario.", "success");
}

async function duplicateActiveSchedule() {
  if (!EPQA.activeScheduleId) return;
  const response = await fetch("/horarios/api/schedules.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "duplicate", schedule_id: EPQA.activeScheduleId })
  });
  const payload = await response.json();
  if (!payload.ok) {
    if (payload.code === "FREE_LIMIT_REACHED") {
      showFreeLimitModal();
      return;
    }
    notify("No se pudo duplicar", payload.error || payload.message || "Intenta de nuevo.", "error", true);
    return;
  }
  await loadScheduleWorkspace(payload.id);
  notify("Horario duplicado", "La copia quedo asociada a tu usuario.", "success");
}

async function exportActiveScheduleJson() {
  if (!EPQA.activeScheduleId) {
    downloadProgressBackup();
    return;
  }
  const response = await fetch(`/horarios/api/export.php?schedule_id=${encodeURIComponent(EPQA.activeScheduleId)}&kind=backup`);
  const payload = await response.json();
  if (!payload.ok) {
    notify("No se pudo exportar", payload.error || "Verifica permisos del horario.", "error", true);
    return;
  }
  downloadJson(payload.data, payload.file_name || "epqa_horario_backup.json");
}

async function deleteActiveSchedule() {
  if (!EPQA.activeScheduleId) return;
  confirmAction(
    "Eliminar horario",
    "Esta accion archivara el horario activo.\nSolo se eliminara para tu usuario.\n\nDeseas continuar?",
    async () => {
      const response = await fetch("/horarios/api/schedules.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", schedule_id: EPQA.activeScheduleId })
      });
      const payload = await response.json();
      if (!payload.ok) {
        notify("No se pudo eliminar", payload.error || "Verifica permisos del horario.", "error", true);
        return;
      }
      EPQA.activeScheduleId = null;
      await loadScheduleWorkspace();
      notify("Horario eliminado", "El horario fue archivado.", "success");
    },
    "Eliminar"
  );
}

function showFreeLimitModal(onReplace = null) {
  openUxModal(
    "Limite del plan gratuito",
    "Tu cuenta gratuita permite crear un horario.\nPuedes seguir editando tu horario actual o actualizar tu plan para crear horarios adicionales.",
    "warning",
    {
      confirmLabel: onReplace ? "Reemplazar horario existente" : "Abrir mi horario",
      cancelLabel: "Cancelar",
      showUpgrade: true,
      onConfirm: async () => {
        if (onReplace) {
          onReplace();
          return;
        }
        const current = EPQA.schedules?.[0]?.id;
        if (current) await loadScheduleWorkspace(current);
      }
    }
  );
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function epqaIcon(name, className = "epqa-svg-icon") {
  const icons = {
    school: `<path d="M3 21h18"/><path d="M6 21V10"/><path d="M18 21V10"/><path d="M12 3 4 8h16l-8-5Z"/><path d="M9 21v-6h6v6"/>`,
    x: `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
    pin: `<path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>`,
    users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    file: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>`,
    monitor: `<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/>`,
    "book-open": `<path d="M12 7v14"/><path d="M3 5a4 4 0 0 1 4-2h5v18H7a4 4 0 0 0-4 2V5Z"/><path d="M21 5a4 4 0 0 0-4-2h-5v18h5a4 4 0 0 1 4 2V5Z"/>`,
    calculator: `<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>`,
    leaf: `<path d="M11 20A7 7 0 0 1 4 13c0-6 8-10 16-10 0 8-4 16-10 16Z"/><path d="M4 20c4-7 8-10 16-17"/>`,
    brain: `<path d="M9.5 2A3.5 3.5 0 0 0 6 5.5v.7A4 4 0 0 0 4 13a4 4 0 0 0 4 7h1.5V2Z"/><path d="M14.5 2A3.5 3.5 0 0 1 18 5.5v.7A4 4 0 0 1 20 13a4 4 0 0 1-4 7h-1.5V2Z"/><path d="M9.5 8H7"/><path d="M14.5 8H17"/><path d="M9.5 14H7"/><path d="M14.5 14H17"/>`,
    message: `<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 9h8"/><path d="M8 13h5"/>`,
    running: `<path d="M13 4a2 2 0 1 0 0 .01"/><path d="M10 16 6 21"/><path d="m14 12 2 3 4 1"/><path d="m8 11 3-3 4 2"/><path d="m11 8-1 5 4 3"/>`,
    atom: `<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2-2-1.2-8.4-7.2-14.4S.6-3.4-1.4-1.4 1 7 7 13s11.2 9.2 13.2 7.2Z" transform="translate(2.6 2.6)"/><path d="M3.8 20.2c-2-2 1.2-8.4 7.2-14.4S23.4-3.4 25.4-1.4 23 7 17 13 5.8 22.2 3.8 20.2Z" transform="translate(-2.6 2.6)"/>`,
    ruler: `<path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="m14 6 2 2"/><path d="m11 9 2 2"/><path d="m8 12 2 2"/><path d="m5 15 2 2"/>`,
    sparkle: `<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>`,
    heart: `<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>`,
    chart: `<path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-3"/>`,
    book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/>`,
    scale: `<path d="M12 3v18"/><path d="M5 7h14"/><path d="m6 7-3 6h6L6 7Z"/><path d="m18 7-3 6h6l-3-6Z"/>`,
    calendar: `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>`,
    "calendar-check": `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>`,
    code: `<path d="m8 18-6-6 6-6"/><path d="m16 6 6 6-6 6"/>`,
    layers: `<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>`,
    download: `<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>`,
    upload: `<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>`,
    pencil: `<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>`,
    trash: `<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/>`,
    plus: `<path d="M12 5v14"/><path d="M5 12h14"/>`,
    copy: `<rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/>`,
    box: `<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>`,
    star: `<path d="m12 2 3 6 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.9 3 1.1-6.5-4.7-4.6L9 8l3-6Z"/>`,
    search: `<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>`,
    save: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>`,
    clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
    check: `<path d="m5 12 4 4L19 6"/>`,
    alert: `<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`,
    hash: `<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="m16 3-2 18"/>`,
    palette: `<path d="M12 22a10 10 0 1 1 10-10c0 1.7-1.3 3-3 3h-1.5a2.5 2.5 0 0 0-2 4 2 2 0 0 1-1.6 3H12Z"/><circle cx="7.5" cy="10.5" r=".5"/><circle cx="10.5" cy="7.5" r=".5"/><circle cx="14.5" cy="7.5" r=".5"/><circle cx="16.5" cy="10.5" r=".5"/>`,
    globe: `<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 0 20"/><path d="M12 2a15.3 15.3 0 0 0 0 20"/>`,
    briefcase: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>`,
    map: `<path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15"/><path d="M15 6v15"/>`,
    activity: `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`
  };
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.file}</svg>`;
}

const SUBJECT_ICON_KEYS = ["monitor", "book-open", "calculator", "palette", "leaf", "globe", "brain", "briefcase", "scale", "sparkle", "message", "running", "atom", "chart", "ruler", "code"];
const SUBJECT_COLOR_KEYS = ["blue", "green", "purple", "orange", "cyan", "pink", "yellow", "red", "neutral"];

function getDefaultSubjectVisual(subjectName = "", abbreviation = "") {
  const key = normalizeKey(`${abbreviation} ${subjectName}`);
  if (key.includes("TI") || key.includes("TECNOLOG") || key.includes("INFORMAT")) return { iconKey: "monitor", colorKey: "blue" };
  if (key.includes("DPC") || key.includes("PENSAMIENTO")) return { iconKey: "brain", colorKey: "green" };
  if (key.includes("EMP") || key.includes("EMPREND")) return { iconKey: "briefcase", colorKey: "orange" };
  if (key.includes("GEOMET")) return { iconKey: "ruler", colorKey: "purple" };
  if (key.includes("ESTAD")) return { iconKey: "chart", colorKey: "cyan" };
  if (key.includes("ARITMET") || key.includes("MATEMATIC")) return { iconKey: "calculator", colorKey: "blue" };
  if (key.includes("ARTIST")) return { iconKey: "palette", colorKey: "pink" };
  if (key.includes("BIOLOG") || key.includes("NATURAL")) return { iconKey: "leaf", colorKey: "green" };
  if (key.includes("CASTELL") || key.includes("LENGUA") || key.includes("ESPAN")) return { iconKey: "book-open", colorKey: "orange" };
  if (key.includes("INGLES") || key.includes("ENGLISH")) return { iconKey: "message", colorKey: "cyan" };
  if (key.includes("FISICA") && !key.includes("EDU")) return { iconKey: "atom", colorKey: "blue" };
  if (key.includes("FISICA") || key.includes("DEPORTE")) return { iconKey: "running", colorKey: "green" };
  if (key.includes("ETICA")) return { iconKey: "scale", colorKey: "purple" };
  if (key.includes("RELIG")) return { iconKey: "sparkle", colorKey: "pink" };
  if (key.includes("SOCIAL")) return { iconKey: "globe", colorKey: "cyan" };
  return { iconKey: "book-open", colorKey: "neutral" };
}

function normalizeSubject(subject) {
  const source = subject && typeof subject === "object" ? { ...subject } : { id: subject, name: subject };
  const name = String(source.name || source.nombre || source.subject || source.id || "").trim();
  const id = String(source.id || source.abreviatura || source.abbreviation || name).trim();
  const abbreviation = String(source.abreviatura || source.abbreviation || source.shortName || id || name).trim();
  const defaults = getDefaultSubjectVisual(name, abbreviation);
  return {
    ...source,
    id: id || name,
    name: name || id || "Sin asignar",
    nombre: source.nombre || name || id || "Sin asignar",
    abreviatura: abbreviation || subjectAbbrev(name || id),
    iconKey: SUBJECT_ICON_KEYS.includes(source.iconKey) ? source.iconKey : defaults.iconKey,
    colorKey: SUBJECT_COLOR_KEYS.includes(source.colorKey) ? source.colorKey : defaults.colorKey
  };
}

function ensureSubjectMetadata() {
  const subjects = Array.isArray(EPQA.data?.subjects) ? EPQA.data.subjects : [];
  const byId = new Map(subjects.map((subject) => {
    const normalized = normalizeSubject(subject);
    return [normalizeKey(normalized.id || normalized.name), normalized];
  }));
  (EPQA.data?.loads || []).forEach((load) => {
    const id = normalizeKey(load.subject || "");
    if (id && !byId.has(id)) byId.set(id, normalizeSubject(load.subject));
  });
  EPQA.data.subjects = [...byId.values()];
}

function subjectMeta(subject) {
  const key = normalizeKey(typeof subject === "object" ? (subject.id || subject.name || subject.nombre) : subject);
  const found = (EPQA.data?.subjects || []).map(normalizeSubject).find((item) =>
    normalizeKey(item.id) === key ||
    normalizeKey(item.name) === key ||
    normalizeKey(item.nombre) === key ||
    normalizeKey(item.abreviatura) === key
  );
  return found || normalizeSubject(subject);
}

function getSubjectIconKey(subject) {
  return subjectMeta(subject).iconKey;
}

function getSubjectColorKey(subject) {
  return subjectMeta(subject).colorKey;
}

function renderSubjectIcon(subject, className = "epqa-svg-icon") {
  return epqaIcon(getSubjectIconKey(subject), className);
}

function getSubjectVisualClass(subject) {
  return `color-${getSubjectColorKey(subject)}`;
}

function buildEmptyProposal(data) {
  const slots = [];
  (data.loads || []).forEach((load) => {
    let remaining = Number(load.hours || 0);
    let period = 1;
    while (remaining > 0) {
      const duration = Math.min(blockHours(load), remaining);
      slots.push(slotFromLoad(load, "Lunes", Math.min(period, maxPeriod(load.level)), duration));
      period += duration;
      remaining -= duration;
    }
  });
  return slots;
}

function slotFromLoad(load, day, period, duration = null) {
  const loadKey = load.loadKey || loadSignature(load);
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `slot-${Date.now()}-${Math.random()}`,
    loadId: load.id,
    loadKey,
    day,
    period: Number(period),
    group: load.group,
    level: normalizeLevel(load.level),
    subject: load.subject,
    teacher: load.teacher,
    room: load.room,
    roomId: load.roomId || roomId(load.room),
    site: load.site || load.siteId,
    siteId: load.siteId || load.site,
    duration: Number(duration || blockHours(load) || 1),
    source: "optimizer",
    locked: false
  };
}

function fillFilters() {
  const mode = byId("viewMode").value;
  const select = byId("viewFilter");
  const current = select.value;
  const generalOption = mode === "teacher"
    ? [{ value: "__ALL_TEACHERS__", label: "Profesores general" }]
    : mode === "group"
      ? [{ value: "__ALL_GROUPS__", label: "Grados general" }]
      : [];
  const sourceValues = mode === "group"
    ? [...groupOptions().map((item) => item.id), ...(EPQA.slots || []).map((slot) => slot.group)]
    : mode === "teacher"
      ? [...teacherOptions().map((item) => item.id), ...(EPQA.slots || []).map((slot) => slot.teacher)]
      : [...roomOptions().map((item) => item.name), ...(EPQA.slots || []).map((slot) => slot.room)];
  const values = unique(sourceValues).sort(naturalSort);
  select.innerHTML = [
    ...generalOption.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`),
    ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
  ].join("");
  if (values.includes(current)) {
    select.value = current;
  } else if (generalOption.some((item) => item.value === current)) {
    select.value = current;
  }
}

function renderMetrics() {
  const groups = Array.isArray(EPQA.data?.groups)
    ? EPQA.data.groups.map((group) => group.id || group.name)
    : [...(EPQA.data?.groups?.primary || []), ...(EPQA.data?.groups?.secondary || [])];
  setTextAny(groups.length, "metricGroups", "metricGrados");
  setTextAny((EPQA.data?.teachers || []).length, "metricTeachers", "metricDocentes");
  setTextAny((EPQA.data?.loads || []).length, "metricLoads", "metricCargas");
  setTextAny((EPQA.slots || []).reduce((sum, slot) => sum + slotDuration(slot), 0), "metricSlots", "metricHorasAsignadas");
  renderDashboardOverview();
}

function renderDashboardOverview(active = null) {
  const project = EPQA.data?.project || {};
  const teachers = EPQA.data?.teachers || [];
  const groups = Array.isArray(EPQA.data?.groups)
    ? EPQA.data.groups
    : [...(EPQA.data?.groups?.primary || []), ...(EPQA.data?.groups?.secondary || [])];
  const subjects = EPQA.data?.subjects || [];
  const loads = EPQA.data?.loads || [];
  const slots = EPQA.slots || [];
  const sites = EPQA.data?.sites || [];
  const rooms = EPQA.data?.rooms || [];
  const rules = EPQA.data?.rules || {};
  const audit = EPQA.audit || { counts: { P0: 0, P1: 0, P2: 0 }, score: 100 };
  const loadHours = loads.reduce((sum, load) => sum + Number(load.hours || 0), 0);
  const placedHours = slots.reduce((sum, slot) => sum + slotDuration(slot), 0);
  const pendingHours = Math.max(0, loadHours - placedHours);
  const critical = Number(audit.counts?.P0 || 0);
  const strong = Number(audit.counts?.P1 || 0);
  const preference = Number(audit.counts?.P2 || 0);
  const hasBasics = Boolean((project.institution || project.name) && teachers.length && groups.length && subjects.length);
  const hasLoads = loads.length > 0;
  const hasAvailability = teachers.some((teacher) => teacherAvailabilityTotals(teacher).total > 0);
  const hasRules = Boolean(
    (rules.general && Object.keys(rules.general).length) ||
    (rules.critical && rules.critical.length) ||
    (rules.teacherSite && rules.teacherSite.length) ||
    (rules.room && rules.room.length) ||
    (rules.block && rules.block.length)
  );
  const hasProposal = slots.length > 0;
  const activeSchedule = active?.schedule || active || null;
  const scheduleName = activeSchedule?.name || project.institution || project.name || "Horario activo";
  const scheduleStatus = statusLabel(activeSchedule?.status || "draft");
  const updatedAt = activeSchedule?.updated_at || activeSchedule?.updatedAt || activeSchedule?.modified_at || activeSchedule?.modifiedAt || null;
  const statusState = critical > 0
    ? "Requiere corrección obligatoria"
    : strong > 0
      ? "Publicable con observaciones"
      : hasProposal
        ? "Listo para exportar"
        : "En construcción";
  const nextTitle = chooseDashboardNextAction({ hasBasics, hasLoads, hasProposal, critical, strong, pendingHours });
  const nextHelp = chooseDashboardNextHelp({ hasBasics, hasLoads, hasProposal, critical, strong, pendingHours });
  const executiveSummary = hasBasics
    ? `Tu horario tiene ${teachers.length} docentes, ${groups.length} grados y ${loads.length} cargas académicas. Hay ${critical} problemas obligatorios y ${strong} reglas importantes por revisar.`
    : "Empieza por registrar la información base para construir un horario claro y publicable.";

  setTextAny(scheduleName, "dashHorarioActivo", "activeScheduleName", "workspaceHeroTitle");
  setTextAny(scheduleStatus, "activeScheduleStatus");
  setTextAny(updatedAt ? formatShortDate(updatedAt) : "Sin fecha aún", "dashUltimaActualizacion");
  setTextAny(statusState, "dashEstadoHorario", "workspaceAvailabilityBadge");
  setTextAny(nextTitle, "dashNextActionTitle", "workspaceNextAction");
  setTextAny(nextHelp, "dashNextActionHelp", "workspaceNextActionHelp");
  setTextAny(executiveSummary, "workspaceDiagnostic");
  setTextAny(critical > 0 ? "corrección obligatoria" : strong > 0 ? "Revisar reglas importantes" : hasProposal ? "Listo para exportar" : "Listo para revisar", "workspaceNextActionBadge");

  const dashboardSelect = byAnyId("dashHorarioSelect", "scheduleSelect");
  if (dashboardSelect) {
    dashboardSelect.innerHTML = (EPQA.schedules || []).map((schedule) =>
      `<option value="${escapeHtml(schedule.id)}">${escapeHtml(schedule.name)} (${statusLabel(schedule.status)})</option>`
    ).join("");
    if (activeSchedule?.id) dashboardSelect.value = String(activeSchedule.id);
  }

  const stepper = byAnyId("workflowStepper");
  if (stepper) {
    const steps = [
      dashboardStep("Institución", Boolean(project.institution || project.name), !project.institution && !project.name),
      dashboardStep("Sedes y espacios", sites.length > 0 && rooms.length > 0, sites.length === 0 || rooms.length === 0),
      dashboardStep("Docentes", teachers.length > 0, teachers.length === 0),
      dashboardStep("Grados", groups.length > 0, groups.length === 0),
      dashboardStep("Materias", subjects.length > 0, subjects.length === 0),
      dashboardStep("Cargas", hasLoads, !hasLoads),
      dashboardStep("Disponibilidad", hasAvailability, !hasAvailability),
      dashboardStep("Reglas", hasRules, !hasRules),
      dashboardStep("Generación", hasProposal, !hasProposal),
      dashboardStep("Auditoría", critical === 0, critical > 0),
      dashboardStep("Consolidado", critical === 0 && hasProposal, critical > 0 || !hasProposal)
    ];
    stepper.innerHTML = steps.map((step, index) => `
      <div class="epqa-flow-step-v2 ${step.state === "is-complete" ? "✓" : step.label === "Generación" && step.state !== "is-complete" ? "epqa-flow-step-v2--active" : (step.label === "Auditoría" || step.label === "Consolidado") && critical > 0 ? "epqa-flow-step-v2--warning" : step.state === "is-pending" ? "epqa-flow-step-v2--pending" : "epqa-flow-step-v2--warning"}">
        <span>${step.state === "is-complete" ? "✓" : step.label === "Generación" && step.state !== "is-complete" ? index + 1 : (step.label === "Auditoría" || step.label === "Consolidado") && critical > 0 ? "!" : step.state === "is-pending" ? index + 1 : "!"}</span>
        <small>${escapeHtml(step.label)}</small>
      </div>
    `).join("");
  }

  setTextAny(groups.length, "metricGrados");
  setTextAny(teachers.length, "metricDocentes");
  setTextAny(subjects.length, "metricMaterias");
  setTextAny(loads.length, "metricCargas");
  setTextAny(`${loadHours}h`, "metricHorasAsignadas");
  setTextAny(`${pendingHours}h`, "metricHorasPendientes");
  setTextAny(critical, "metricP0");
  setTextAny(strong, "metricP1");
  setTextAny(preference, "metricP2");
  setTextAny(`${Math.max(0, Math.min(100, Math.round(audit.score || 0)))}%`, "metricCumplimiento");
  setTextAny(`${pendingHours} horas pendientes`, "metricPendientesTexto");
  setTextAny(critical > 0 ? `${critical} problemas obligatorios impiden publicar el horario` : strong > 0 ? `${strong} reglas fuertes necesitan revisión` : "No hay problemas obligatorios", "metricAlertasTexto");

  const alerts = byAnyId("dashboardAlerts");
  if (alerts) {
    const rows = [];
    if (critical > 0) rows.push(dashboardAlert("critical", `Hay ${critical} problemas obligatorios`, "Corrige estas situaciones antes de publicar."));
    if (strong > 0) rows.push(dashboardAlert("warning", `${strong} reglas importantes por revisar`, "Pueden aceptarse o ajustarse según el criterio Institucional."));
    if (!rows.length) rows.push(dashboardAlert("ok", "No hay problemas obligatorios", "El horario puede avanzar a revisión o exportación."));
    alerts.innerHTML = rows.join("");
  }
}

function dashboardStep(label, complete, warning) {
  if (complete && !warning) return { label, copy: "Completo", state: "is-complete" };
  if (warning && !complete) return { label, copy: "Pendiente", state: "is-pending" };
  return { label, copy: "En curso", state: "is-warning" };
}

function dashboardMetric(label, value, tone = "info") {
  return `<article class="metric-card metric-${tone}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></article>`;
}

function dashboardAlert(tone, title, copy) {
  return `<div class="dashboard-alert ${tone}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(copy)}</span></div>`;
}

function chooseDashboardNextAction({ hasBasics, hasLoads, hasProposal, critical, strong, pendingHours }) {
  if (!hasBasics) return "Continúar construcción";
  if (!hasLoads) return "Asignar materias";
  if (!hasProposal) return "Generar horario";
  if (critical > 0) return "Revisar problemas";
  if (strong > 0) return "Revisar reglas importantes";
  if (pendingHours > 0) return "Completar pendientes";
  return "Ver horario generado";
}

function chooseDashboardNextHelp({ hasBasics, hasLoads, hasProposal, critical, strong, pendingHours }) {
  if (!hasBasics) return "Registra Institución, docentes, grupos y materias para empezar.";
  if (!hasLoads) return "Define la carga academica para que el sistema pueda proponer un horario.";
  if (!hasProposal) return "Con la carga lista, el sistema puede generar una propuesta completa.";
  if (critical > 0) return "Hay problemas obligatorios que conviene revisar antes de publicar.";
  if (strong > 0) return "Hay reglas importantes que pueden requerir ajuste o excepcion.";
  if (pendingHours > 0) return "Aun quedan horas por ubicar. Puedes acomodarlas manualmente.";
  return "La propuesta esta lista para revisar o exportar.";
}

function renderLoads() {
  renderLoadFilters();
  const rows = filteredLoads();
  const isV6 = Boolean(document.querySelector(".epqa-assignments-card-v6"));
  byId("loadsTable").innerHTML = rows.map((load) => {
    const priority = loadRulePriority(load);
    return `
    <tr data-load-id="${escapeHtml(load.id)}">
      <td>${escapeHtml(load.teacher || "Sin asignar")}</td>
      <td>${escapeHtml(load.group || "Sin asignar")}</td>
      <td>${escapeHtml(load.subject || "Sin asignar")}</td>
      <td>${Number(load.hours || 0)}h</td>
      <td>${blockHours(load) > 1 ? `${blockHours(load)}h` : "No"}</td>
      <td><span class="${isV6 ? `epqa-assignment-priority-badge-v6 epqa-assignment-priority-badge-v6--${priority.toLowerCase()}` : `badge ${priority}`}">${priority}</span></td>
      <td>${escapeHtml(preferredDaysLabel(load))}</td>
      <td>${escapeHtml(load.room || load.roomId || "Aula disponible")}</td>
      <td class="${isV6 ? "epqa-assignment-row-actions-v6" : "load-row-actions"}">
        <button class="${isV6 ? "epqa-assignment-icon-btn-v6" : "ghost"} edit-load" type="button" data-load-id="${escapeHtml(load.id)}" title="Editar asignacion" aria-label="Editar asignacion">${isV6 ? epqaIcon("pencil") : "Editar"}</button>
        <button class="${isV6 ? "epqa-assignment-icon-btn-v6 epqa-assignment-icon-btn-v6--danger" : "ghost danger"} delete-load" type="button" data-load-id="${escapeHtml(load.id)}" title="Eliminar asignacion" aria-label="Eliminar asignacion">${isV6 ? epqaIcon("trash") : "Quitar"}</button>
      </td>
    </tr>
  `;
  }).join("") || `<tr><td colspan="9" class="teacher-empty">No hay cargas con esos filtros.</td></tr>`;
  const totalHours = rows.reduce((sum, load) => sum + Number(load.hours || 0), 0);
  byId("loadsTableSummary").textContent = `${rows.length} carga(s) filtrada(s) | ${totalHours} hora(s)`;
  document.querySelectorAll(".edit-load").forEach((button) => {
    button.addEventListener("click", () => openEditLoadModal(button.dataset.loadId));
  });
  document.querySelectorAll(".delete-load").forEach((button) => {
    button.addEventListener("click", () => {
      EPQA.data.loads = EPQA.data.loads.filter((load) => load.id !== button.dataset.loadId);
      EPQA.slots = EPQA.slots.filter((slot) => slot.loadId !== button.dataset.loadId);
      syncWorkspaceSnapshot();
      void persistWorkspaceDraft("Carga eliminada");
      renderDataViews();
    });
  });
}

function renderLoadFilters() {
  fillFilterSelect("loadsFilterTeacher", unique((EPQA.data.loads || []).map((load) => load.teacher)).sort(naturalSort), "Todos");
  fillFilterSelect("loadsFilterGroup", unique((EPQA.data.loads || []).map((load) => load.group)).sort(naturalSort), "Todos");
  fillFilterSelect("loadsFilterSubject", unique((EPQA.data.loads || []).map((load) => load.subject)).sort(naturalSort), "Todas");
  fillFilterSelect("loadsFilterPriority", ["P0", "P1", "P2"], "Todas");
}

function fillFilterSelect(id, values, allLabel) {
  const select = byId(id);
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>` + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  if ([...select.options].some((option) => option.value === current)) select.value = current;
}

function filteredLoads() {
  const text = normalizeKey(byId("loadsFilterText")?.value || "");
  const teacher = byId("loadsFilterTeacher")?.value || "";
  const group = byId("loadsFilterGroup")?.value || "";
  const subject = byId("loadsFilterSubject")?.value || "";
  const priority = byId("loadsFilterPriority")?.value || "";
  return (EPQA.data.loads || []).filter((load) => {
    const searchable = normalizeKey(`${load.teacher} ${load.group} ${load.subject} ${load.room || load.roomId || ""} ${loadRulePriority(load)}`);
    return (!text || searchable.includes(text)) &&
      (!teacher || load.teacher === teacher) &&
      (!group || load.group === group) &&
      (!subject || load.subject === subject) &&
      (!priority || loadRulePriority(load) === priority);
  });
}

function clearLoadFilters() {
  ["loadsFilterText", "loadsFilterTeacher", "loadsFilterGroup", "loadsFilterSubject", "loadsFilterPriority"].forEach((id) => {
    const el = byId(id);
    if (el) el.value = "";
  });
  renderLoads();
}

function preferredDaysLabel(load) {
  const days = (load.preferredDays || load.preferred_days || []).map(normalizeDay).filter(Boolean);
  if (!days.length) return "Sin preferencia";
  return `${normalizeRulePriority(load.preferredDaysPriority || load.preferred_days_priority || "P2")}: ${days.map(dayInitial).join(" ")}`;
}

function renderDayPreferenceChecks(containerId, selected = []) {
  const target = byId(containerId);
  if (!target) return;
  const selectedSet = new Set((selected || []).map(normalizeDay));
  const days = EPQA.data?.days?.length ? EPQA.data.days : ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  target.innerHTML = days.map((day) => {
    const value = normalizeDay(day);
    return `<label title="${escapeHtml(day)}"><input type="checkbox" name="${containerId}[]" value="${escapeHtml(value)}" ${selectedSet.has(value) ? "checked" : ""}>${escapeHtml(dayInitial(day))}</label>`;
  }).join("");
}

function selectedDaysFrom(containerId) {
  return [...document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)].map((input) => normalizeDay(input.value));
}

function dayInitial(day) {
  const key = normalizeKey(day);
  if (key.startsWith("MIER")) return "X";
  return (key[0] || "").toUpperCase();
}

function openEditLoadModal(loadId) {
  const load = findLoad(loadId);
  const modal = byId("editLoadModal");
  if (!load || !modal) return;
  modal.dataset.loadId = load.id;
  byId("editLoadModalTitle").textContent = `${load.subject} - ${load.group}`;
  byId("editLoadSummary").innerHTML = `
    <strong>${escapeHtml(load.teacher)}</strong>
    <span>${escapeHtml(load.subject)} · ${escapeHtml(load.group)}</span>
  `;
  byId("editLoadHours").value = Number(load.hours || 1);
  byId("editLoadBlockHours").value = String(blockHours(load));
  byId("editLoadRulePriority").value = loadRulePriority(load);
  fillSelect("editLoadRoom", roomOptionsWithFlexible(), "id", "name");
  byId("editLoadRoom").value = load.roomId || "";
  byId("editLoadPreferredDaysPriority").value = normalizeRulePriority(load.preferredDaysPriority || load.preferred_days_priority || "P2");
  renderDayPreferenceChecks("editLoadPreferredDays", load.preferredDays || load.preferred_days || []);
  syncSearchableSelect(byId("editLoadRoom"), true);
  modal.hidden = false;
  modal.removeAttribute("hidden");
  document.body.classList.add("modal-open");
}

function closeEditLoadModal() {
  const modal = byId("editLoadModal");
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("hidden", "");
  delete modal.dataset.loadId;
  if (byId("availabilityModal")?.hidden !== false && byId("bulkLoadModal")?.hidden !== false && byId("uxModal")?.hidden !== false) {
    document.body.classList.remove("modal-open");
  }
}

function saveEditLoadModal() {
  const modal = byId("editLoadModal");
  const load = findLoad(modal?.dataset.loadId);
  if (!load) return;
  const room = roomOptions().find((item) => item.id === byId("editLoadRoom").value) || {};
  load.hours = Math.max(1, Number(byId("editLoadHours").value || 1));
  load.blockHours = Math.max(1, Number(byId("editLoadBlockHours").value || 1));
  load.rulePriority = normalizeRulePriority(byId("editLoadRulePriority").value || "P0");
  load.room = room.name || "";
  load.roomId = room.id || "";
  load.preferredDays = selectedDaysFrom("editLoadPreferredDays");
  load.preferredDaysPriority = normalizeRulePriority(byId("editLoadPreferredDaysPriority").value || "P2");
  load.loadKey = loadSignature(load);
  reconcileSlotsForLoad(load);
  closeEditLoadModal();
  syncWorkspaceSnapshot();
  void persistWorkspaceDraft("Carga editada");
  renderDataViews();
}

function renderDataViews() {
  const steps = [
    ["fillFilters", () => fillFilters()],
    ["renderMetrics", () => renderMetrics()],
    ["renderLoads", () => renderLoads()],
    ["renderCatalogEditor", () => renderCatalogEditor()],
    ["renderTeacherDetailPanel", () => renderTeacherDetailPanel()],
    ["renderAvailableTray", () => renderAvailableTray()],
    ["renderBoard", () => renderBoard()]
  ];
  for (const [name, step] of steps) {
    try {
      step();
    } catch (error) {
      console.error(`EPQA ${name} error`, error);
      showDataLoadAlert(`La vista de edición tuvo un problema al dibujar ${name}. Revisa la consola para el detalle.`);
      return;
    }
  }
  auditNow();
}

function renderCatalogEditor() {
  if (!EPQA.data) {
    showDataLoadAlert("Aún no se cargó un horario activo. Puedes crear uno nuevo o cargar uno existente.");
    return;
  }
  hideDataLoadAlert();
  if (byId("schoolName")) byId("schoolName").value = EPQA.data.project?.institution || EPQA.data.project?.name || "";
  if (byId("schoolOwner")) byId("schoolOwner").value = EPQA.data.project?.owner || "";
  ensureGradeEditorV6Chrome();
  ensureSubjectEditorV7Chrome();
  ensureRulesEditorV6Chrome();
  ensureAssignmentEditorV6Chrome();
  if (byId("maxTeacherHoursPerDay")) byId("maxTeacherHoursPerDay").value = maxTeacherHoursPerDay();
  fillSelect("dailyRuleTeacher", teacherOptions(), "id", "name");
  fillSelect("dailyRuleSite", siteOptions(), "id", "name");
  fillSelect("dailyRuleDay", dayOptions(), "id", "name");
  fillSelect("groupSite", siteOptions(), "id", "name");
  fillSelect("roomSite", siteOptions(), "id", "name");
  fillSelect("teacherDefaultSite", siteOptionsWithEmpty(), "id", "name");
  ensureTeacherSummaryV5Chrome();
  ensureGradeSummaryV6Chrome();
  fillSelect("loadTeacher", teacherOptions(), "id", "name");
  fillSelect("teacherSummarySelect", teacherOptions(), "id", "name");
  fillSelect("gradeSummarySelect", groupOptions(), "id", "name");
  fillSelect("loadSubject", subjectOptions(), "id", "name");
  fillSelect("loadRoom", roomOptionsWithFlexible(), "id", "name");
  refreshLoadGroupOptions();
  renderDayPreferenceChecks("loadPreferredDays");
  renderCatalogManagers();
  enhanceSelectsInDataPanel();
  renderAvailabilityGrid();
  renderTeacherDetailPanel();
  renderGroupDetailPanel();
}

function fillSelect(id, rows, valueKey, labelKey) {
  const select = byId(id);
  if (!select) return;
  const current = select.value;
  const normalizedRows = [{ [valueKey]: "", [labelKey]: placeholderForSelect(id) }, ...(rows || [])];
  select.innerHTML = normalizedRows.map((row) => `<option value="${escapeHtml(row[valueKey])}">${escapeHtml(row[labelKey])}</option>`).join("");
  if (rows.some((row) => String(row[valueKey]) === current)) select.value = current;
  syncSearchableSelect(select);
}

function placeholderForSelect(id) {
  return ["loadRoom", "bulkLoadRoom"].includes(id) ? "Seleccionar / Aula disponible" : "Seleccionar...";
}

function syncSearchableSelect(select, force = false) {
  if (!select || select.dataset.searchReady === "1") {
    updateSearchableSelect(select);
    return;
  }
  if (select.closest(".epqa-grades-card-v6, .epqa-rules-card-v6, .epqa-assignments-card-v6")) return;
  if (!force && !select.closest(".load-builder, .compact-form, .modal-card, .teacher-summary-toolbar, .loads-filter-bar, .catalog-manager")) return;
  select.dataset.searchReady = "1";
  select.classList.add("native-search-select");
  const wrapper = document.createElement("div");
  wrapper.className = "searchable-select";
  const input = document.createElement("input");
  input.type = "search";
  input.className = "select-search-input";
  input.placeholder = placeholderForSelect(select.id);
  input.setAttribute("autocomplete", "off");
  input.setAttribute("aria-label", `Buscar ${select.id}`);
  const list = document.createElement("div");
  list.className = "select-search-list";
  list.hidden = true;
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(input);
  wrapper.appendChild(list);
  wrapper.appendChild(select);
  input.addEventListener("input", () => renderSearchableOptions(select));
  input.addEventListener("focus", () => renderSearchableOptions(select));
  input.addEventListener("change", () => selectSearchText(select));
  input.addEventListener("blur", () => setTimeout(() => selectSearchText(select), 120));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") list.hidden = true;
  });
  select.addEventListener("change", () => updateSearchableSelect(select));
  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) list.hidden = true;
  });
  updateSearchableSelect(select);
}

function selectSearchText(select) {
  const wrapper = select.closest(".searchable-select");
  const input = wrapper?.querySelector(".select-search-input");
  if (!input) return;
  const text = normalizeKey(input.value);
  if (!text) {
    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  const exact = [...select.options].find((option) => normalizeKey(option.textContent) === text);
  if (exact) {
    select.value = exact.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function updateSearchableSelect(select) {
  const wrapper = select?.closest?.(".searchable-select");
  if (!wrapper) return;
  const input = wrapper.querySelector(".select-search-input");
  const option = select.selectedOptions?.[0];
  input.value = option && option.value ? option.textContent : "";
}

function renderSearchableOptions(select) {
  const wrapper = select.closest(".searchable-select");
  const input = wrapper.querySelector(".select-search-input");
  const list = wrapper.querySelector(".select-search-list");
  const query = normalizeKey(input.value);
  const options = [...select.options]
    .filter((option) => !query || normalizeKey(option.textContent).includes(query))
    .slice(0, 40);
  list.innerHTML = options.map((option) => `<button type="button" data-value="${escapeHtml(option.value)}">${escapeHtml(option.textContent)}</button>`).join("");
  list.hidden = false;
  list.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      select.value = button.dataset.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      list.hidden = true;
    });
  });
}

function siteOptions() {
  return (EPQA.data.sites || []).map((site) => ({ id: site.id || site.code || site.name, name: site.name || site.id || site.code }));
}

function siteOptionsWithEmpty() {
  return [{ id: "", name: "Sin sede fija" }, ...siteOptions()];
}

function teacherOptions() {
  return (EPQA.data.teachers || []).map((teacher) => ({ id: teacher.id || teacher.name || teacher, name: teacher.name || teacher.id || teacher }));
}

function groupOptions() {
  const groups = new Map();
  const addGroupOption = (group, fallbackLevel = null) => {
    if (!group) return;
    const id = typeof group === "string" ? group : (group.id || group.name || group.group);
    if (!id || groups.has(String(id))) return;
    const name = typeof group === "string" ? group : (group.name || group.id || group.group);
    const level = normalizeLevel((typeof group === "string" ? fallbackLevel : (group.level || fallbackLevel)) || inferGroupLevel(id));
    groups.set(String(id), {
      id,
      name,
      level,
      siteId: typeof group === "string" ? "" : (group.siteId || group.site || "")
    });
  };
  if (Array.isArray(EPQA.data.groups)) {
    EPQA.data.groups.forEach((group) => addGroupOption(group));
  } else {
    (EPQA.data.groups?.primary || []).forEach((group) => addGroupOption(group, "primary"));
    (EPQA.data.groups?.secondary || []).forEach((group) => addGroupOption(group, "secondary"));
  }
  (EPQA.data.loads || []).forEach((load) => addGroupOption({ id: load.group, name: load.group, level: load.level, siteId: load.siteId || load.site }));
  (EPQA.slots || []).forEach((slot) => addGroupOption({ id: slot.group, name: slot.group, level: slot.level, siteId: slot.siteId || slot.site }));
  return [...groups.values()].sort((a, b) => naturalSort(a.name, b.name));
}

function inferGroupLevel(group) {
  const number = Number(String(group || "").match(/\d+/)?.[0] || 0);
  return number >= 1 && number <= 5 ? "primary" : "secondary";
}

function teacherSchoolLevel(teacher) {
  return normalizeLevel(teacher?.type || teacher?.level || "secondary");
}

function groupsForTeacher(teacherId) {
  const teacher = findTeacher(teacherId);
  if (!teacher) return groupOptions();
  const level = teacherSchoolLevel(teacher);
  const groups = groupOptions();
  const compatible = groups.filter((group) => normalizeLevel(group.level) === level);
  return compatible.length ? compatible : groups.map((group) => ({ ...group, needsLevelReview: true }));
}

function roomSiteById(roomId) {
  if (!roomId) return "";
  const room = roomOptions().find((item) => String(item.id) === String(roomId) || String(item.name) === String(roomId));
  return room?.siteId || room?.site || siteFromRoom(roomId);
}

function filterGroupsByRoomSite(groups, roomId) {
  const roomSite = roomSiteById(roomId);
  if (!roomSite) return groups;
  const withSameSite = groups.filter((group) => group.siteId && sameSite(group.siteId, roomSite));
  return withSameSite.map((group) => ({ ...group, roomSite }));
}

function refreshLoadGroupOptions() {
  const teacherId = byId("loadTeacher")?.value || "";
  const groups = filterGroupsByRoomSite(groupsForTeacher(teacherId), byId("loadRoom")?.value || "");
  fillSelect("loadGroup", groups, "id", "name");
  const groupSelect = byId("loadGroup");
  if (groupSelect && !groups.length) {
    groupSelect.innerHTML = `<option value="">Sin grados creados</option>`;
  }
}

function subjectOptions() {
  ensureSubjectMetadata();
  return (EPQA.data.subjects || []).map(normalizeSubject);
}

function roomOptions() {
  return (EPQA.data.rooms || []).map((room) => ({
    id: room.id || room.name,
    name: room.name || room.id,
    siteId: room.siteId || room.site || siteFromRoom(room.name || room.id),
    site: room.siteId || room.site || siteFromRoom(room.name || room.id)
  }));
}

function roomOptionsWithFlexible() {
  return roomOptions();
}

function saveSchoolData() {
  EPQA.data.project = EPQA.data.project || {};
  EPQA.data.project.institution = byId("schoolName").value.trim();
  EPQA.data.project.owner = byId("schoolOwner").value.trim();
  byId("jsonInput").value = JSON.stringify(EPQA.data, null, 2);
}

function saveGeneralRules() {
  EPQA.data.rules = EPQA.data.rules || {};
  EPQA.data.rules.general = EPQA.data.rules.general || {};
  EPQA.data.rules.general.maxTeacherHoursPerDay = Math.max(1, Number(byId("maxTeacherHoursPerDay")?.value || 6));
  normalizeDailyRuleExceptions();
  byId("jsonInput").value = JSON.stringify(EPQA.data, null, 2);
  renderCatalogManagers();
  auditNow();
  notify("Reglas guardadas", "Se actualizo el maximo de horas por docente al dia.", "success");
}

function maxTeacherHoursPerDay() {
  return Math.max(1, Number(EPQA.data?.rules?.general?.maxTeacherHoursPerDay || EPQA.data?.rules?.maxTeacherHoursPerDay || 6));
}

function dailyRuleExceptions() {
  EPQA.data.rules = EPQA.data.rules || {};
  EPQA.data.rules.general = EPQA.data.rules.general || {};
  EPQA.data.rules.general.dailyExceptions = EPQA.data.rules.general.dailyExceptions || [];
  return EPQA.data.rules.general.dailyExceptions;
}

function addDailyRuleException() {
  const selectedDay = byId("dailyRuleDay")?.value || "";
  const days = selectedDay === "__ALL_DAYS__"
    ? (EPQA.data?.days?.length ? EPQA.data.days : ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]).map(normalizeDay)
    : [normalizeDay(selectedDay)];
  const baseRule = {
    teacher: byId("dailyRuleTeacher")?.value || "",
    site: byId("dailyRuleSite")?.value || "",
    type: byId("dailyRuleType")?.value || "allow",
    hours: Math.max(1, Number(byId("dailyRuleHours")?.value || 6)),
    priority: normalizeRulePriority(byId("dailyRulePriority")?.value || "P0")
  };
  if (!baseRule.teacher || !days[0]) {
    notify("Faltan datos", "Selecciona docente y dia para crear la excepcion.", "warning", true);
    return;
  }
  const addButton = byId("btnAddDailyRule");
  const editingRuleId = addButton?.dataset.editingDailyRule || "";
  if (editingRuleId) {
    EPQA.data.rules.general.dailyExceptions = dailyRuleExceptions().filter((rule) => rule.id !== editingRuleId);
    delete addButton.dataset.editingDailyRule;
  }
  days.forEach((day) => upsertDailyRuleException({
    ...baseRule,
    id: `daily-rule-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    day
  }));
  saveGeneralRules();
  notify(editingRuleId ? "Excepcion actualizada" : "Excepcion agregada", selectedDay === "__ALL_DAYS__" ? "La regla quedo aplicada a todos los dias." : "La regla por docente, sede y dia quedo registrada.", "success");
}

function dailyRuleKey(rule) {
  return [
    normalizeKey(rule.teacher),
    normalizeKey(rule.site || ""),
    normalizeDay(rule.day),
    rule.type || "allow"
  ].join("|");
}

function upsertDailyRuleException(rule) {
  const key = dailyRuleKey(rule);
  EPQA.data.rules.general.dailyExceptions = dailyRuleExceptions().filter((item) => dailyRuleKey(item) !== key);
  EPQA.data.rules.general.dailyExceptions.push(rule);
}

function normalizeDailyRuleExceptions() {
  const latest = new Map();
  dailyRuleExceptions().forEach((rule) => {
    const normalized = { ...rule, day: normalizeDay(rule.day), type: rule.type || "allow" };
    latest.set(dailyRuleKey(normalized), normalized);
  });
  EPQA.data.rules.general.dailyExceptions = [...latest.values()];
}

function matchingDailyRule(teacher, day, site = "") {
  const rules = dailyRuleExceptions().filter((rule) =>
    sameTeacherLoose(rule.teacher, teacher) &&
    (rule.day === "__ALL_DAYS__" || normalizeDay(rule.day) === normalizeDay(day)) &&
    (!rule.site || !site || sameSite(rule.site, site))
  );
  return rules.sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority))[0] || null;
}

function maxTeacherHoursForDay(teacher, day, site = "") {
  const rule = matchingDailyRule(teacher, day, site);
  if (rule?.type === "allow") return Math.max(maxTeacherHoursPerDay(), Number(rule.hours || 0));
  return maxTeacherHoursPerDay();
}

function teacherName(value) {
  const teacher = findTeacher(value);
  return teacher?.name || teacher?.id || value || "";
}

function renderCatalogManagers() {
  renderSiteRoomManager();
  renderTeacherManager();
  renderGroupManager();
  renderSubjectManager();
  renderDailyRulesManager();
}

function dayOptions() {
  const days = EPQA.data?.days?.length ? EPQA.data.days : ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  return [{ id: "__ALL_DAYS__", name: "Todos los dias" }, ...days.map((day) => ({ id: normalizeDay(day), name: day }))];
}

function renderSiteRoomManager() {
  const siteTarget = byId("siteRoomSitesManager");
  const roomTarget = byId("siteRoomRoomsManager");
  const fallbackTarget = byId("siteRoomManager");
  const siteRows = (EPQA.data.sites || []).map((site, index) => `
    <tr data-site-index="${index}">
      <td><input data-catalog-field="site-id" value="${escapeHtml(site.id || site.code || site.name || "")}"></td>
      <td><input data-catalog-field="site-name" value="${escapeHtml(site.name || site.id || site.code || "")}"></td>
      <td class="catalog-actions">
        <button class="epqa-icon-btn" data-save-site="${index}" type="button" title="Guardar sede"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i></button>
        <button class="epqa-icon-btn danger" data-delete-site="${index}" type="button" title="Borrar sede"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
      </td>
    </tr>`).join("") || `<tr><td colspan="3">Sin sedes.</td></tr>`;
  const roomRows = (EPQA.data.rooms || []).map((room, index) => `
    <tr data-room-index="${index}">
      <td><input data-catalog-field="room-id" value="${escapeHtml(room.id || room.name || "")}"></td>
      <td><input data-catalog-field="room-name" value="${escapeHtml(room.name || room.id || "")}"></td>
      <td><select data-catalog-field="room-site">${siteOptionsWithEmpty().map((site) => `<option value="${escapeHtml(site.id)}" ${sameSite(site.id, room.siteId || room.site || "") ? "selected" : ""}>${escapeHtml(site.name)}</option>`).join("")}</select></td>
      <td><span class="epqa-type-pill-v3 ${normalizeKey(room.room_type || room.roomType || "AULA") === "SALA_TI" ? "ti" : normalizeKey(room.room_type || room.roomType || "AULA") === "CANCHA" ? "cancha" : ""}">${escapeHtml(room.room_type || room.roomType || "AULA")}</span></td>
      <td class="catalog-actions">
        <button class="epqa-icon-btn" data-save-room="${index}" type="button" title="Guardar espacio"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i></button>
        <button class="epqa-icon-btn danger" data-delete-room="${index}" type="button" title="Borrar espacio"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
      </td>
    </tr>`).join("") || `<tr><td colspan="5">Sin espacios.</td></tr>`;
  const siteMarkup = `<div class="epqa-table-wrap-v3"><table class="epqa-table-v3"><thead><tr><th style="width: 42%;">ID</th><th>Nombre</th><th style="width: 120px;">Acciones</th></tr></thead><tbody>${siteRows}</tbody></table></div>`;
  const roomMarkup = `<div class="epqa-table-wrap-v3"><table class="epqa-table-v3"><thead><tr><th style="width: 23%;">ID</th><th style="width: 23%;">Nombre</th><th style="width: 22%;">Sede</th><th style="width: 16%;">Tipo</th><th style="width: 120px;">Acciones</th></tr></thead><tbody>${roomRows}</tbody></table></div>`;
  if (siteTarget) siteTarget.innerHTML = siteMarkup;
  if (roomTarget) roomTarget.innerHTML = roomMarkup;
  if (fallbackTarget && !siteTarget && !roomTarget) {
    fallbackTarget.innerHTML = `
      <section class="epqa-panel-v3 epqa-panel-sedes-v3"><div class="epqa-table-wrap-v3"><table class="epqa-table-v3"><thead><tr><th>ID</th><th>Nombre</th><th></th></tr></thead><tbody>${siteRows}</tbody></table></div></section>
      <section class="epqa-panel-v3 epqa-panel-espacios-v3"><div class="epqa-table-wrap-v3"><table class="epqa-table-v3"><thead><tr><th>ID</th><th>Nombre</th><th>Sede</th><th>Tipo</th><th></th></tr></thead><tbody>${roomRows}</tbody></table></div></section>`;
  }
  setTextAny((EPQA.data.sites || []).length, "siteCountLabel");
  setTextAny((EPQA.data.rooms || []).length, "roomCountLabel");
  if (siteTarget) bindCatalogManagerActions(siteTarget);
  if (roomTarget) bindCatalogManagerActions(roomTarget);
  if (fallbackTarget && !siteTarget && !roomTarget) bindCatalogManagerActions(fallbackTarget);
}

function renderTeacherManager() {
  const target = byId("teacherManager");
  if (!target) return;
  target.classList.add("epqa-table-wrap-v4");
  const teachers = EPQA.data.teachers || [];
  const rows = teachers.map((teacher, index) => {
    const teacherType = teacher.type || teacher.level || "Otro";
    const badgeClass = teacherTypeBadgeClass(teacherType);
    const teacherId = teacher.id || teacher.name || "";
    const teacherSiteId = teacher.siteId || teacher.site || "";
    const rowLabel = `${teacherId} ${teacher.name || ""} ${teacherType} ${siteNameForId(teacherSiteId) || ""}`.trim();
    return `
    <tr data-teacher-index="${index}" data-teacher-label="${escapeHtml(rowLabel)}" data-teacher-type="${escapeHtml(teacherType)}" data-teacher-site="${escapeHtml(teacherSiteId)}">
      <td><input data-catalog-field="teacher-id" value="${escapeHtml(teacherId)}"></td>
      <td><input data-catalog-field="teacher-name" value="${escapeHtml(teacher.name || teacherId || "")}"></td>
      <td>
        <span class="epqa-type-badge-v4 ${badgeClass}">${escapeHtml(teacherTypeLabel(teacherType))}</span>
      </td>
      <td><select data-catalog-field="teacher-site">${siteOptionsWithEmpty().map((site) => `<option value="${escapeHtml(site.id)}" ${sameSite(site.id, teacherSiteId) ? "selected" : ""}>${escapeHtml(site.name)}</option>`).join("")}</select></td>
      <td><input data-catalog-field="teacher-min" type="number" min="0" value="${Number(teacher.minWeeklyHours || teacher.min_secondary_hours || 0)}"></td>
      <td class="catalog-actions">
        <button class="epqa-icon-action-v4" data-save-teacher="${index}" type="button" title="Guardar docente" aria-label="Guardar docente">💾</button>
        <button class="epqa-icon-action-v4 epqa-icon-action-v4--danger" data-delete-teacher="${index}" type="button" title="Borrar docente" aria-label="Borrar docente">🗑️</button>
      </td>
    </tr>`;
  }).join("");
  const emptyRow = teachers.length
    ? `<tr class="epqa-teacher-empty-row epqa-teacher-no-results-row" hidden><td colspan="6">Sin coincidencias para los filtros activos.</td></tr>`
    : `<tr class="epqa-teacher-empty-row"><td colspan="6">Sin docentes.</td></tr>`;
  target.innerHTML = `<table class="epqa-table-v3 epqa-table-v4"><thead><tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Sede</th><th>Min</th><th>Acciones</th></tr></thead><tbody>${rows || ""}${emptyRow}</tbody></table>`;
  setTextAny((EPQA.data.teachers || []).length, "teacherCountLabel");
  ensureTeacherV4Chrome();
  populateTeacherFilterSites();
  bindTeacherV4Actions();
  applyTeacherFilters();
  bindCatalogManagerActions(target);
}

function teacherTypeLabel(value) {
  const normalized = normalizeLevel(value || "");
  if (normalized === "primary") return "Primaria";
  if (normalized === "secondary") return "Secundaria";
  return value || "Otro";
}

function teacherTypeBadgeClass(value) {
  const normalized = normalizeLevel(value || "");
  if (normalized === "primary") return "epqa-type-badge-v4--primaria";
  if (normalized === "secondary") return "epqa-type-badge-v4--secundaria";
  return "epqa-type-badge-v4--otro";
}

function applyTeacherFilters() {
  const search = normalizeKey(byId("teacherSearchInput")?.value || "");
  const typeFilter = byId("teacherTypeFilter")?.value || "__ALL__";
  const siteFilter = byId("teacherSiteFilter")?.value || "__ALL__";
  const rows = document.querySelectorAll("#teacherManager tbody tr[data-teacher-index]");
  let visibleCount = 0;

  rows.forEach((row) => {
    const label = normalizeKey(row.dataset.teacherLabel || row.textContent || "");
    const teacherType = normalizeLevel(row.dataset.teacherType || "");
    const teacherSite = row.dataset.teacherSite || "";
    const matchesSearch = !search || label.includes(search);
    const matchesType = typeFilter === "__ALL__" || teacherTypeLabel(teacherType) === typeFilter || teacherType === normalizeLevel(typeFilter);
    const matchesSite = siteFilter === "__ALL__" || sameSite(teacherSite, siteFilter);
    const visible = matchesSearch && matchesType && matchesSite;
    row.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  const emptyRow = document.querySelector("#teacherManager .epqa-teacher-no-results-row");
  if (emptyRow) emptyRow.hidden = visibleCount > 0;
}

function populateTeacherFilterSites() {
  const select = byId("teacherSiteFilter");
  if (!select) return;
  const currentValue = select.value || "__ALL__";
  const options = [{ id: "__ALL__", name: "Todas las sedes" }, ...siteOptionsWithEmpty().filter((site) => site.id)];
  select.innerHTML = options.map((site) => `<option value="${escapeHtml(site.id)}">${escapeHtml(site.name)}</option>`).join("");
  select.value = options.some((site) => site.id === currentValue) ? currentValue : "__ALL__";
}

function ensureTeacherV4Chrome() {
  const mainCard = document.querySelector(".epqa-docentes-main-card-v3");
  if (!mainCard) return;

  const headerTitle = mainCard.querySelector(".epqa-docentes-header-v3 h1");
  if (headerTitle) headerTitle.textContent = "Gestión de docentes";
  const headerCopy = mainCard.querySelector(".epqa-docentes-header-v3 p");
  if (headerCopy) headerCopy.textContent = "Gestiona los docentes y su disponibilidad mínima.";
  const formTitle = mainCard.querySelector(".epqa-docentes-form-panel-v3 h2");
  if (formTitle) formTitle.textContent = "Nuevo docente";
  const formCopy = mainCard.querySelector(".epqa-docentes-form-panel-v3 p");
  if (formCopy) formCopy.textContent = "Completa la información base para agregar un docente al sistema.";
  const tableTitle = mainCard.querySelector(".epqa-docentes-table-panel-v3 h2");
  if (tableTitle) tableTitle.textContent = "Docentes creados";
  const tableCopy = mainCard.querySelector(".epqa-docentes-table-panel-v3 .epqa-table-header-v3 p");
  if (tableCopy) tableCopy.textContent = "Listado editable de docentes registrados en el horario.";
  const addTeacherButton = byId("btnAddTeacher");
  if (addTeacherButton) addTeacherButton.innerHTML = "<span>＋</span><span>Agregar docente</span>";
  const footerIcon = mainCard.querySelector(".epqa-footer-icon-v3");
  if (footerIcon) footerIcon.textContent = "◌";

  const layout = mainCard.querySelector(".epqa-docentes-layout-v3");
  if (layout) layout.classList.add("epqa-docentes-layout-v3--compact");
  ensureTeacherSummaryV4Chrome();

  if (!document.getElementById("teacherFormModal")) {
    const formPanel = mainCard.querySelector(".epqa-docentes-form-panel-v3");
    if (!formPanel) return;
    const teacherForm = formPanel.querySelector(".epqa-docente-form-v3");
    const modal = document.createElement("div");
    modal.id = "teacherFormModal";
    modal.className = "modal-backdrop epqa-teacher-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="modal-card epqa-teacher-modal-card" role="dialog" aria-modal="true" aria-labelledby="teacherModalTitle">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Docentes</p>
            <h2 id="teacherModalTitle">Nuevo docente</h2>
            <p class="modal-subcopy">Completa la información base para agregar un docente al sistema.</p>
          </div>
          <button type="button" class="modal-close" data-teacher-modal-close aria-label="Cerrar">×</button>
        </div>
        <div class="epqa-teacher-modal-body"></div>
      </div>`;
    if (teacherForm) {
      teacherForm.classList.add("epqa-docente-form-v3--modal");
      modal.querySelector(".epqa-teacher-modal-body")?.appendChild(teacherForm);
    }
    formPanel.remove();
    document.body.appendChild(modal);
  }

  if (!mainCard.querySelector(".epqa-docentes-actions-v4")) {
    const actions = document.createElement("section");
    actions.className = "epqa-docentes-actions-v4";
    actions.setAttribute("aria-label", "Acciones de docentes");
    actions.innerHTML = `
      <button class="epqa-docente-action-card-v4 epqa-docente-action-card-v4--blue" id="btnTeacherQuickCreate" type="button">
        <span class="epqa-docente-action-icon-v4">＋</span>
        <span class="epqa-docente-action-copy-v4">
          <strong>Nuevo docente</strong>
          <small>Agrega un docente rápidamente</small>
        </span>
        <span class="epqa-docente-action-arrow-v4">›</span>
      </button>

      <article class="epqa-docente-action-card-v4 epqa-docente-action-card-v4--green">
        <span class="epqa-docente-action-icon-v4">＋</span>
        <span class="epqa-docente-action-copy-v4">
          <strong>Importar docentes</strong>
          <small>Importa desde un archivo Excel</small>
          <span class="epqa-import-actions-v4">
            <button type="button" class="epqa-mini-action-v4" id="btnTeacherTemplate">Descargar plantilla</button>
            <button type="button" class="epqa-mini-action-v4 epqa-mini-action-v4--primary" id="btnTeacherImportExcel">⬆️ Importar Excel</button>
          </span>
        </span>
        <span class="epqa-docente-action-arrow-v4">›</span>
      </article>`;
    mainCard.insertBefore(actions, layout);
  }

  const tablePanel = mainCard.querySelector(".epqa-docentes-table-panel-v3");
  if (!tablePanel) return;
  let toolbar = tablePanel.querySelector(".epqa-docentes-toolbar-v4");
  if (!toolbar) {
    const header = tablePanel.querySelector(".epqa-table-header-v3");
    toolbar = document.createElement("section");
    toolbar.className = "epqa-docentes-toolbar-v4";
    toolbar.innerHTML = `
      <div class="epqa-search-shell-v4">
        <span><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></span>
        <input id="teacherSearchInput" type="text" placeholder="Buscar por nombre o ID...">
      </div>

      <select id="teacherTypeFilter">
        <option value="__ALL__">Todos los tipos</option>
        <option value="Primaria">Primaria</option>
        <option value="Secundaria">Secundaria</option>
      </select>

      <select id="teacherSiteFilter"></select>

      <button type="button" class="epqa-filter-btn-v4" id="btnTeacherFilters">Filtros</button>`;
    if (header) {
      header.insertAdjacentElement("afterend", toolbar);
    } else {
      tablePanel.insertBefore(toolbar, tablePanel.firstChild);
    }
  }
}

function ensureTeacherSummaryV5Chrome() {
  const card = document.querySelector(".teacher-summary-card");
  if (!card) return;
  if (card.querySelector(".epqa-teacher-summary-v5")) return;
  card.innerHTML = `
    <section class="epqa-teacher-summary-v5">
      <header class="epqa-teacher-summary-header-v5">
        <div class="epqa-teacher-title-v5">
          <span class="epqa-teacher-title-icon-v5">${epqaIcon("file")}</span>
          <div>
            <h1>Resumen docente</h1>
            <p>Visualiza la carga, disponibilidad y distribución horaria de cada docente.</p>
          </div>
        </div>

        <div class="epqa-teacher-selector-v5">
          <label for="teacherSummarySelect">Elegir docente</label>
          <select id="teacherSummarySelect"></select>
        </div>
      </header>

      <div id="teacherDetailPanel" class="teacher-detail-panel epqa-teacher-detail-panel-v5"></div>
    </section>`;
  const select = byId("teacherSummarySelect");
  if (select) select.onchange = renderTeacherDetailPanel;
}

function ensureTeacherSummaryV4Chrome() {
  ensureTeacherSummaryV5Chrome();
}

function ensureGradeSummaryV6Chrome() {
  const card = document.querySelector(".group-summary-card");
  if (!card) return;
  if (card.querySelector(".epqa-grade-summary-v6")) return;
  card.innerHTML = `
    <section class="epqa-grade-summary-v6">
      <header class="epqa-grade-summary-header-v6">
        <div class="epqa-grade-title-v6">
          <span class="epqa-grade-title-icon-v6">${epqaIcon("school")}</span>
          <div>
            <h1>Resumen grados</h1>
            <p>Visualiza el cumplimiento semanal y la distribución académica por grado.</p>
          </div>
        </div>

        <div class="epqa-grade-selector-v6">
          <label for="gradeSummarySelect">Elegir grado</label>
          <select id="gradeSummarySelect"></select>
        </div>
      </header>

      <div id="groupDetailPanel" class="teacher-detail-panel epqa-grade-detail-panel-v6"></div>
    </section>`;
  const select = byId("gradeSummarySelect");
  if (select) select.onchange = renderGroupDetailPanel;
}

function rulesMinimumTeacherHoursLabel() {
  const values = (EPQA.data?.teachers || [])
    .map((teacher) => Number(teacher?.minWeeklyHours || teacher?.min_secondary_hours || teacher?.minPrimaryHours || teacher?.minimumHours || 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const value = values.length ? Math.max(...values) : 27;
  return `${value}h`;
}

function bindRulesEditorV6Events() {
  const saveButton = byId("btnSaveGeneralRules");
  if (saveButton) saveButton.onclick = saveGeneralRules;
  const addButton = byId("btnAddDailyRule");
  if (addButton) addButton.onclick = addDailyRuleException;
}

function ensureRulesEditorV6Chrome() {
  const anchor = byId("dailyRulesManager") || byId("maxTeacherHoursPerDay") || byId("dailyRuleTeacher");
  const card = anchor?.closest(".catalog-card");
  if (!card) return;
  if (card.classList.contains("epqa-rules-card-v6")) {
    bindRulesEditorV6Events();
    return;
  }
  card.className = "catalog-card epqa-rules-card-v6";
  card.innerHTML = `
    <header class="epqa-rules-header-v6">
      <div class="epqa-rules-title-icon-v6">${epqaIcon("scale")}</div>
      <div>
        <h1>Reglas</h1>
        <p>Define las reglas de asignacion y excepciones del horario.</p>
      </div>
    </header>

    <div class="epqa-rules-body-v6">
      <section class="epqa-rules-kpis-v6">
        <article class="epqa-rule-kpi-v6">
          <span class="epqa-rule-kpi-icon-v6">${epqaIcon("clock")}</span>
          <div>
            <small>Horas minimas</small>
            <strong>${escapeHtml(rulesMinimumTeacherHoursLabel())}</strong>
            <span>Minimo por docente</span>
          </div>
        </article>

        <article class="epqa-rule-kpi-v6">
          <span class="epqa-rule-kpi-icon-v6">${epqaIcon("calendar-check")}</span>
          <div>
            <small>Bloques obligatorios</small>
            <strong>Obligatoria</strong>
            <span>Prioridad P0</span>
          </div>
        </article>

        <article class="epqa-rule-kpi-v6">
          <span class="epqa-rule-kpi-icon-v6">${epqaIcon("star")}</span>
          <div>
            <small>Preferencia de dias</small>
            <strong>Prioridad media</strong>
            <span>P2 deseable</span>
          </div>
        </article>

        <article class="epqa-rule-kpi-v6 epqa-rule-kpi-v6--editable">
          <span class="epqa-rule-kpi-icon-v6">${epqaIcon("calendar")}</span>
          <div>
            <small>Limite diario</small>
            <label class="epqa-rule-kpi-input-v6" for="maxTeacherHoursPerDay">
              <input id="maxTeacherHoursPerDay" name="maxTeacherHoursPerDay" type="number" min="1" max="12" value="${maxTeacherHoursPerDay()}">
              <span>h</span>
            </label>
            <span>Max. por dia</span>
          </div>
          <button id="btnSaveGeneralRules" class="epqa-rule-save-btn-v6" type="button" title="Guardar reglas" aria-label="Guardar reglas">${epqaIcon("save")}</button>
        </article>
      </section>

      <section class="epqa-priority-summary-grid-v6" aria-label="Prioridades de reglas">
        <article class="epqa-priority-summary-card-v6 epqa-priority-summary-card-v6--p0">
          <div class="epqa-priority-summary-icon-v6">${epqaIcon("alert")}</div>
          <div>
            <small>Regla critica</small>
            <strong>P0</strong>
            <span>No debe romperse</span>
          </div>
        </article>
        <article class="epqa-priority-summary-card-v6 epqa-priority-summary-card-v6--p1">
          <div class="epqa-priority-summary-icon-v6">${epqaIcon("star")}</div>
          <div>
            <small>Regla fuerte</small>
            <strong>P1</strong>
            <span>Solo se flexibiliza con revision</span>
          </div>
        </article>
        <article class="epqa-priority-summary-card-v6 epqa-priority-summary-card-v6--p2">
          <div class="epqa-priority-summary-icon-v6">${epqaIcon("sparkle")}</div>
          <div>
            <small>Regla deseable</small>
            <strong>P2</strong>
            <span>Preferencia ajustable</span>
          </div>
        </article>
      </section>

      <section class="epqa-exception-form-card-v6">
        <h2>Agregar excepcion</h2>
        <div class="epqa-exception-grid-v6">
          <label class="epqa-rule-field-v6">Docente
            <span class="epqa-rule-control-v6"><select id="dailyRuleTeacher" name="dailyRuleTeacher"></select></span>
          </label>
          <label class="epqa-rule-field-v6">Sede
            <span class="epqa-rule-control-v6"><select id="dailyRuleSite" name="dailyRuleSite"></select></span>
          </label>
          <label class="epqa-rule-field-v6">Dia
            <span class="epqa-rule-control-v6"><select id="dailyRuleDay" name="dailyRuleDay"></select></span>
          </label>
          <label class="epqa-rule-field-v6">Tipo
            <span class="epqa-rule-control-v6">
              <select id="dailyRuleType" name="dailyRuleType">
                <option value="allow">Permitir hasta</option>
                <option value="require">Exigir exactamente</option>
              </select>
            </span>
          </label>
          <label class="epqa-rule-field-v6">Horas
            <span class="epqa-rule-control-v6"><input id="dailyRuleHours" name="dailyRuleHours" type="number" min="1" max="99" value="6" inputmode="numeric"></span>
          </label>
          <label class="epqa-rule-field-v6">Prioridad
            <span class="epqa-rule-control-v6">
              <select id="dailyRulePriority" name="dailyRulePriority">
                <option value="P0">P0 critica</option>
                <option value="P1">P1 fuerte</option>
                <option value="P2">P2 deseable</option>
              </select>
            </span>
          </label>
          <button id="btnAddDailyRule" class="epqa-add-exception-btn-v6" type="button">
            ${epqaIcon("plus")}
            <span>Agregar</span>
          </button>
        </div>
      </section>

      <section class="epqa-exceptions-table-card-v6">
        <h2>Excepciones registradas</h2>
        <div id="dailyRulesManager" class="catalog-manager epqa-daily-rules-manager-v6"></div>
      </section>
    </div>`;
  bindRulesEditorV6Events();
}

function bindAssignmentEditorV6Events() {
  const addButton = byId("btnAddLoad");
  if (addButton) addButton.onclick = addLoad;
  const bulkButton = byId("btnOpenBulkLoad");
  if (bulkButton) bulkButton.onclick = openBulkLoadModal;
  const bulkInlineButton = byId("btnOpenBulkLoadInline");
  if (bulkInlineButton) bulkInlineButton.onclick = openBulkLoadModal;
  const templateButton = byId("btnDownloadLoadsTemplate");
  if (templateButton) templateButton.onclick = downloadLoadsTemplate;
  const clearButton = byId("btnClearLoadFilters");
  if (clearButton) clearButton.onclick = clearLoadFilters;
  if (byId("loadTeacher")) byId("loadTeacher").onchange = refreshLoadGroupOptions;
  if (byId("loadRoom")) byId("loadRoom").onchange = refreshLoadGroupOptions;
  ["loadsFilterText", "loadsFilterTeacher", "loadsFilterGroup", "loadsFilterSubject", "loadsFilterPriority"].forEach((id) => {
    const element = byId(id);
    if (!element) return;
    element.oninput = id === "loadsFilterText" ? renderLoads : element.oninput;
    element.onchange = id === "loadsFilterText" ? element.onchange : renderLoads;
  });
}

function ensureAssignmentEditorV6Chrome() {
  const anchor = byId("loadsTable") || byId("loadTeacher") || byId("btnAddLoad");
  const card = anchor?.closest(".catalog-card");
  if (!card) return;
  if (card.classList.contains("epqa-assignments-card-v6")) {
    bindAssignmentEditorV6Events();
    return;
  }
  card.className = "catalog-card wide epqa-assignments-card-v6";
  card.innerHTML = `
    <header class="epqa-assignments-header-v6">
      <div class="epqa-assignments-title-v6">
        <span class="epqa-assignments-title-icon-v6">${epqaIcon("calendar")}</span>
        <div>
          <h1>Asignaciones</h1>
          <p>Gestiona las materias asignadas por docente, grado, bloque e importancia.</p>
        </div>
      </div>

      <div class="epqa-assignments-actions-v6">
        <button id="btnDownloadLoadsTemplate" class="epqa-assignments-btn-v6" type="button">
          ${epqaIcon("download")}
          <span>Descargar plantilla</span>
        </button>
        <button id="btnOpenBulkLoad" class="epqa-assignments-btn-v6 epqa-assignments-btn-v6--primary" type="button">
          ${epqaIcon("layers")}
          <span>Asignacion masiva</span>
        </button>
      </div>
    </header>

    <div class="epqa-assignments-body-v6">
      <section class="epqa-assignment-form-card-v6">
        <h2>Nueva asignacion</h2>

        <div class="load-builder epqa-assignment-form-grid-v6">
          <label class="epqa-assignment-field-v6">Docente
            <span class="epqa-assignment-control-v6">${epqaIcon("users")}<select id="loadTeacher" name="loadTeacher"></select></span>
          </label>
          <label class="epqa-assignment-field-v6">Grado
            <span class="epqa-assignment-control-v6">${epqaIcon("school")}<select id="loadGroup" name="loadGroup"></select></span>
          </label>
          <label class="epqa-assignment-field-v6">Materia
            <span class="epqa-assignment-control-v6">${epqaIcon("book")}<select id="loadSubject" name="loadSubject"></select></span>
          </label>
          <label class="epqa-assignment-field-v6">Espacio
            <span class="epqa-assignment-control-v6">${epqaIcon("map")}<select id="loadRoom" name="loadRoom"></select></span>
          </label>
          <label class="epqa-assignment-field-v6">Horas
            <span class="epqa-assignment-control-v6">${epqaIcon("clock")}<input id="loadHours" name="loadHours" type="number" min="1" max="99" value="1" inputmode="numeric"></span>
          </label>
        </div>

        <div class="epqa-assignment-form-grid-v6 epqa-assignment-form-grid-v6--second">
          <label class="epqa-assignment-field-v6">Bloque
            <span class="epqa-assignment-control-v6">
              ${epqaIcon("layers")}
              <select id="loadBlockHours" name="loadBlockHours">
                <option value="1">No, horas sueltas</option>
                <option value="2">Bloque indivisible 2h</option>
                <option value="3">Bloque indivisible 3h</option>
              </select>
            </span>
          </label>
          <label class="epqa-assignment-field-v6">Importancia
            <span class="epqa-assignment-control-v6">
              ${epqaIcon("alert")}
              <select id="loadRulePriority" name="loadRulePriority">
                <option value="P0">P0 obligatoria</option>
                <option value="P1">P1 fuerte</option>
                <option value="P2">P2 deseable</option>
              </select>
            </span>
          </label>
          <label class="epqa-assignment-field-v6">Preferencia de dias
            <span class="epqa-assignment-control-v6">
              ${epqaIcon("star")}
              <select id="loadPreferredDaysPriority" name="loadPreferredDaysPriority">
                <option value="P2">P2 deseable</option>
                <option value="P1">P1 fuerte</option>
                <option value="P0">P0 obligatoria</option>
              </select>
            </span>
          </label>
          <div class="epqa-assignment-field-v6 epqa-assignment-days-v6">
            <span>Dias sugeridos</span>
            <div class="day-checks" id="loadPreferredDays"></div>
          </div>
          <button id="btnAddLoad" class="epqa-assignments-btn-v6 epqa-assignments-btn-v6--primary epqa-assignment-submit-v6" type="button">
            ${epqaIcon("plus")}
            <span>Agregar asignacion</span>
          </button>
          <button id="btnOpenBulkLoadInline" class="epqa-assignments-btn-v6 epqa-assignments-btn-v6--soft-green" type="button">
            ${epqaIcon("layers")}
            <span>Asignar varias asignaturas</span>
          </button>
        </div>

        <p class="plain block-help epqa-assignment-hint-v6">${epqaIcon("clock")}<span>Ejemplo: 3h con bloque 2h crea un bloque de 2h consecutivas y 1h suelta; 4h con bloque 2h crea dos bloques de 2h.</span></p>
      </section>

      <section class="epqa-assignment-filters-card-v6">
        <h2>Filtros y busqueda</h2>
        <div class="loads-filter-bar epqa-assignment-filters-grid-v6">
          <label class="epqa-assignment-search-v6">
            ${epqaIcon("search")}
            <input id="loadsFilterText" type="search" placeholder="Buscar por docente, grupo o materia...">
          </label>
          <label class="epqa-assignment-control-v6">${epqaIcon("users")}<select id="loadsFilterTeacher"></select></label>
          <label class="epqa-assignment-control-v6">${epqaIcon("school")}<select id="loadsFilterGroup"></select></label>
          <label class="epqa-assignment-control-v6">${epqaIcon("book")}<select id="loadsFilterSubject"></select></label>
          <label class="epqa-assignment-control-v6">${epqaIcon("alert")}<select id="loadsFilterPriority"></select></label>
          <button id="btnClearLoadFilters" class="epqa-assignments-btn-v6" type="button">${epqaIcon("search")}<span>Limpiar filtros</span></button>
        </div>
      </section>

      <section class="epqa-assignments-table-card-v6">
        <h2>Asignaciones registradas</h2>
        <div class="epqa-assignments-table-wrap-v6">
          <table class="epqa-assignments-table-v6">
            <thead><tr><th>Docente</th><th>Grupo</th><th>Materia</th><th>Horas</th><th>Bloque</th><th>Importancia</th><th>Dias pref.</th><th>Espacio</th><th>Acciones</th></tr></thead>
            <tbody id="loadsTable"></tbody>
            <tfoot><tr><td colspan="9" id="loadsTableSummary">0 cargas | 0 horas</td></tr></tfoot>
          </table>
        </div>
      </section>
    </div>`;
  bindAssignmentEditorV6Events();
}

function downloadLoadsTemplate() {
  const rows = [
    ["Docente", "Grado", "Materia", "Espacio", "Horas", "Bloque", "Importancia", "PreferenciaDias"],
    ["DOCENTE EJEMPLO", "6F", "TI", "Sala TI", "2", "2", "P0", "Lunes, Miercoles"]
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla_asignaciones_epqa.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function bindTeacherV4Actions() {
  const quickCreate = byId("btnTeacherQuickCreate");
  if (quickCreate && !quickCreate.dataset.bound) {
    quickCreate.dataset.bound = "1";
    quickCreate.addEventListener("click", openTeacherModal);
  }

  const templateButton = byId("btnTeacherTemplate");
  if (templateButton && !templateButton.dataset.bound) {
    templateButton.dataset.bound = "1";
    templateButton.addEventListener("click", downloadTeacherTemplate);
  }

  const importButton = byId("btnTeacherImportExcel");
  if (importButton && !importButton.dataset.bound) {
    importButton.dataset.bound = "1";
    importButton.addEventListener("click", () => byId("dataFileInput")?.click());
  }

  const searchInput = byId("teacherSearchInput");
  if (searchInput) searchInput.oninput = applyTeacherFilters;

  const typeFilter = byId("teacherTypeFilter");
  if (typeFilter) typeFilter.onchange = applyTeacherFilters;

  const siteFilter = byId("teacherSiteFilter");
  if (siteFilter) siteFilter.onchange = applyTeacherFilters;

  const filterButton = byId("btnTeacherFilters");
  if (filterButton && !filterButton.dataset.bound) {
    filterButton.dataset.bound = "1";
    filterButton.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (typeFilter) typeFilter.value = "__ALL__";
      if (siteFilter) siteFilter.value = "__ALL__";
      applyTeacherFilters();
      searchInput?.focus();
      });
  }

  const modal = byId("teacherFormModal");
  if (modal && !modal.dataset.bound) {
    modal.dataset.bound = "1";
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-teacher-modal-close]")) closeTeacherModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeTeacherModal();
    });
  }
}

function openTeacherModal() {
  const modal = byId("teacherFormModal");
  if (!modal) return;
  modal.hidden = false;
  refreshTeacherModalSearchables();
  const input = byId("teacherName");
  setTimeout(() => input?.focus(), 0);
}

function closeTeacherModal() {
  const modal = byId("teacherFormModal");
  if (!modal) return;
  modal.hidden = true;
}

function refreshTeacherModalSearchables() {
  const modal = byId("teacherFormModal");
  if (!modal) return;
  modal.querySelectorAll(".searchable-select select").forEach((select) => updateSearchableSelect(select));
}

function downloadTeacherTemplate() {
  if (!window.XLSX) {
    downloadJson({
      teachers: [
        { id: "", name: "", type: "Primaria", siteId: "", minWeeklyHours: 0 }
      ]
    }, "plantilla_docentes_epqa.json");
    return;
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["ID", "Nombre", "Tipo", "Sede", "Min horas"],
    ["", "", "Primaria", "", 0]
  ]);
  ws["!cols"] = [{ wch: 24 }, { wch: 30 }, { wch: 16 }, { wch: 24 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, "Docentes");
  XLSX.writeFile(wb, "plantilla_docentes_epqa.xlsx");
}

function ensureGradeEditorV6Chrome() {
  const legacyInput = byId("groupName");
  const card = legacyInput?.closest(".catalog-card") || byId("groupManager")?.closest(".catalog-card");
  if (!card || card.classList.contains("epqa-grades-card-v6")) return;
  card.className = "catalog-card wide epqa-grades-card-v6";
  card.innerHTML = `
    <header class="epqa-grades-header-v6">
      <div class="epqa-grades-title-v6">
        <span class="epqa-grades-title-icon-v6">${epqaIcon("school")}</span>
        <div>
          <h1>Grados</h1>
          <p>Administra los grados por sede y nivel académico.</p>
        </div>
      </div>
      <div class="epqa-grades-actions-v6">
        <button class="epqa-grades-btn-v6" id="btnGradeTemplate" type="button">
          ${epqaIcon("download")}
          <span>Descargar plantilla</span>
        </button>
        <button class="epqa-grades-btn-v6 epqa-grades-btn-v6--primary" id="btnGradeImport" type="button">
          ${epqaIcon("upload")}
          <span>Importar grados</span>
        </button>
      </div>
    </header>
    <div class="epqa-grades-body-v6">
      <aside class="epqa-grade-form-card-v6">
        <h2>Nuevo grado</h2>
        <p>Registra un nuevo grado para una sede y nivel.</p>
        <div class="epqa-grade-form-v6">
          <label class="epqa-grade-field-v6">
            <span>Grado</span>
            <span class="epqa-grade-input-shell-v6">
              ${epqaIcon("school")}
              <input id="groupName" type="text" placeholder="Ej: 1F, 10A...">
            </span>
          </label>
          <label class="epqa-grade-field-v6">
            <span>Sede</span>
            <span class="epqa-grade-input-shell-v6">
              ${epqaIcon("pin")}
              <select id="groupSite"></select>
            </span>
          </label>
          <label class="epqa-grade-field-v6">
            <span>Nivel</span>
            <span class="epqa-grade-input-shell-v6">
              ${epqaIcon("layers")}
              <select id="groupLevel">
                <option value="primary">Primaria</option>
                <option value="secondary">Secundaria</option>
              </select>
            </span>
          </label>
          <button id="btnAddGroup" class="epqa-grade-add-btn-v6" type="button">
            <span>${epqaIcon("plus")}</span>
            <strong>Agregar grado</strong>
          </button>
        </div>
      </aside>
      <section class="epqa-grades-table-card-v6">
        <header class="epqa-grades-table-head-v6">
          <h2>Grados creados</h2>
        </header>
        <div class="epqa-grades-filters-v6">
          <label class="epqa-grade-filter-v6">
            ${epqaIcon("search")}
            <input id="gradeSearchInput" type="search" placeholder="Buscar grado o sede...">
          </label>
          <label class="epqa-grade-filter-v6">
            <select id="gradeLevelFilter">
              <option value="__ALL__">Todos los niveles</option>
              <option value="primary">Primaria</option>
              <option value="secondary">Secundaria</option>
            </select>
          </label>
          <label class="epqa-grade-filter-v6">
            <select id="gradeSiteFilter"></select>
          </label>
        </div>
        <div id="groupManager" class="catalog-manager epqa-grades-manager-v6"></div>
      </section>
    </div>`;
  byId("btnAddGroup")?.addEventListener("click", addGroup);
  byId("btnGradeTemplate")?.addEventListener("click", downloadGradeTemplate);
  byId("btnGradeImport")?.addEventListener("click", importGradesFromToolbar);
  byId("gradeSearchInput")?.addEventListener("input", applyGradeFilters);
  byId("gradeLevelFilter")?.addEventListener("change", applyGradeFilters);
  byId("gradeSiteFilter")?.addEventListener("change", applyGradeFilters);
}

function downloadGradeTemplate() {
  if (!window.XLSX) {
    downloadJson({ groups: [{ id: "", name: "", siteId: "", level: "primary" }] }, "plantilla_grados_epqa.json");
    return;
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["ID", "Nombre", "Sede", "Nivel"],
    ["1F", "1F", "", "Primaria"]
  ]);
  ws["!cols"] = [{ wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws, "Grados");
  XLSX.writeFile(wb, "plantilla_grados_epqa.xlsx");
}

function importGradesFromToolbar() {
  const input = byId("dataFileInput");
  if (input) {
    input.click();
    return;
  }
  notify("Importación no disponible", "No se encontró el selector de archivo del módulo.", "warning", true);
}

function populateGradeSiteFilter() {
  const select = byId("gradeSiteFilter");
  if (!select) return;
  const current = select.value || "__ALL__";
  const options = [{ id: "__ALL__", name: "Todas las sedes" }, ...siteOptionsWithEmpty().filter((site) => site.id)];
  select.innerHTML = options.map((site) => `<option value="${escapeHtml(site.id)}">${escapeHtml(site.name)}</option>`).join("");
  select.value = options.some((site) => site.id === current) ? current : "__ALL__";
}

function applyGradeFilters() {
  const search = normalizeKey(byId("gradeSearchInput")?.value || "");
  const level = byId("gradeLevelFilter")?.value || "__ALL__";
  const site = byId("gradeSiteFilter")?.value || "__ALL__";
  let visible = 0;
  document.querySelectorAll("#groupManager tbody tr[data-group-id]").forEach((row) => {
    const text = normalizeKey(row.dataset.groupSearch || row.textContent || "");
    const rowLevel = row.dataset.groupLevel || "";
    const rowSite = row.dataset.groupSite || "";
    const matches = (!search || text.includes(search)) &&
      (level === "__ALL__" || rowLevel === level) &&
      (site === "__ALL__" || sameSite(rowSite, site));
    row.hidden = !matches;
    if (matches) visible++;
  });
  const empty = byId("gradeNoResultsRow");
  if (empty) empty.hidden = visible > 0;
  const summary = byId("gradeTableSummary");
  const total = document.querySelectorAll("#groupManager tbody tr[data-group-id]").length;
  if (summary) summary.textContent = `Mostrando ${visible ? 1 : 0} a ${visible} de ${total} grados`;
}

function ensureSubjectEditorV7Chrome() {
  const legacyInput = byId("subjectName");
  const card = legacyInput?.closest(".catalog-card") || byId("subjectManager")?.closest(".catalog-card");
  if (!card || card.classList.contains("epqa-subjects-card-v7")) return;
  card.className = "catalog-card wide epqa-subjects-card-v7";
  card.innerHTML = `
    <header class="epqa-subjects-header-v7">
      <div class="epqa-subjects-title-v7">
        <span class="epqa-subjects-title-icon-v7">${epqaIcon("book-open")}</span>
        <div>
          <h1>Materias</h1>
          <p>Define materias con abreviatura, icono SVG y color visual para los resúmenes.</p>
        </div>
      </div>
    </header>
    <div class="epqa-subjects-body-v7">
      <aside class="epqa-subject-form-card-v7">
        <h2>Nueva materia</h2>
        <p>Registra una materia y elige un icono seguro de la biblioteca local.</p>
        <div class="epqa-subject-form-v7">
          <label class="epqa-grade-field-v6">
            <span>Nombre de materia</span>
            <span class="epqa-grade-input-shell-v6">${epqaIcon("book-open")}<input id="subjectName" type="text" placeholder="Ej: Tecnología e Informática"></span>
          </label>
          <label class="epqa-grade-field-v6">
            <span>Abreviatura</span>
            <span class="epqa-grade-input-shell-v6">${epqaIcon("hash")}<input id="subjectAbbreviation" type="text" placeholder="Ej: TI"></span>
          </label>
          <input type="hidden" id="subjectIconKey" value="book-open">
          <input type="hidden" id="subjectColorKey" value="blue">
          <div>
            <span class="epqa-subject-picker-label-v7">Icono SVG</span>
            <div class="epqa-subject-icon-picker-v7">${renderSubjectIconPicker("subjectIconKey", "book-open")}</div>
          </div>
          <div>
            <span class="epqa-subject-picker-label-v7">Color visual</span>
            <div class="epqa-subject-color-picker-v7">${renderSubjectColorPicker("subjectColorKey", "blue")}</div>
          </div>
          <div class="epqa-subject-preview-v7" id="subjectPreview">${renderSubjectIcon({ iconKey: "book-open", colorKey: "blue", name: "Materia" })}<span>Vista previa</span></div>
          <button id="btnAddSubject" class="epqa-grade-add-btn-v6" type="button"><span>${epqaIcon("plus")}</span><strong>Agregar materia</strong></button>
        </div>
      </aside>
      <section class="epqa-subjects-table-card-v7">
        <header class="epqa-grades-table-head-v6"><h2>Materias creadas</h2></header>
        <div id="subjectManager" class="catalog-manager epqa-subjects-manager-v7"></div>
      </section>
    </div>`;
  byId("btnAddSubject")?.addEventListener("click", addSubject);
  byId("subjectName")?.addEventListener("input", updateSubjectPreview);
  bindSubjectPickers(card);
}

function renderSubjectIconPicker(inputId, current) {
  return SUBJECT_ICON_KEYS.map((key) => `
    <button class="epqa-subject-icon-option-v7 ${key === current ? "active" : ""}" data-subject-icon-target="${escapeHtml(inputId)}" data-icon-key="${escapeHtml(key)}" type="button" title="${escapeHtml(key)}" aria-label="Icono ${escapeHtml(key)}">
      ${epqaIcon(key)}
    </button>
  `).join("");
}

function renderSubjectColorPicker(inputId, current) {
  return SUBJECT_COLOR_KEYS.map((key) => `
    <button class="epqa-subject-color-option-v7 ${key === current ? "active" : ""} color-${escapeHtml(key)}" data-subject-color-target="${escapeHtml(inputId)}" data-color-key="${escapeHtml(key)}" type="button" title="${escapeHtml(key)}" aria-label="Color ${escapeHtml(key)}"></button>
  `).join("");
}

function bindSubjectPickers(root = document) {
  root.querySelectorAll("[data-subject-icon-target]").forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = "1";
    button.addEventListener("click", () => {
      const input = byId(button.dataset.subjectIconTarget);
      if (input) input.value = button.dataset.iconKey || "book-open";
      button.parentElement?.querySelectorAll("[data-subject-icon-target]").forEach((item) => item.classList.toggle("active", item === button));
      updateSubjectPreview();
    });
  });
  root.querySelectorAll("[data-subject-color-target]").forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = "1";
    button.addEventListener("click", () => {
      const input = byId(button.dataset.subjectColorTarget);
      if (input) input.value = button.dataset.colorKey || "neutral";
      button.parentElement?.querySelectorAll("[data-subject-color-target]").forEach((item) => item.classList.toggle("active", item === button));
      updateSubjectPreview();
    });
  });
}

function updateSubjectPreview() {
  const preview = byId("subjectPreview");
  if (!preview) return;
  const subject = {
    name: byId("subjectName")?.value || "Materia",
    iconKey: byId("subjectIconKey")?.value || "book-open",
    colorKey: byId("subjectColorKey")?.value || "blue"
  };
  preview.className = `epqa-subject-preview-v7 ${getSubjectVisualClass(subject)}`;
  preview.innerHTML = `${renderSubjectIcon(subject)}<span>${escapeHtml(subject.name || "Vista previa")}</span>`;
}

function renderGroupManager() {
  const target = byId("groupManager");
  if (!target) return;
  populateGradeSiteFilter();
  const groups = groupOptions().map((group) => groupObjectById(group.id));
  const siteOptionsHtml = (selected) => siteOptionsWithEmpty().map((site) =>
    `<option value="${escapeHtml(site.id)}" ${sameSite(site.id, selected || "") ? "selected" : ""}>${escapeHtml(site.name || "Sin sede")}</option>`
  ).join("");
  const groupRows = groups.map((group) => {
    const id = group.id || group.name || "";
    const name = group.name || group.id || "";
    const siteId = group.siteId || group.site || "";
    const siteLabel = siteNameForId(siteId) || "Sin sede";
    const level = normalizeLevel(group.level || inferGroupLevel(id));
    const levelLabel = level === "primary" ? "Primaria" : "Secundaria";
    const badgeClass = level === "primary" ? "epqa-grade-level-badge-v6--primary" : "epqa-grade-level-badge-v6--secondary";
    const searchText = `${id} ${name} ${siteLabel} ${levelLabel}`;
    return `
    <tr data-group-id="${escapeHtml(id)}" data-group-site="${escapeHtml(siteId)}" data-group-level="${escapeHtml(level)}" data-group-search="${escapeHtml(searchText)}">
      <td><input data-catalog-field="group-id" value="${escapeHtml(id)}" aria-label="ID del grado"></td>
      <td><input data-catalog-field="group-name" value="${escapeHtml(name)}" aria-label="Nombre del grado"></td>
      <td><select data-catalog-field="group-site" aria-label="Sede del grado">${siteOptionsHtml(siteId)}</select></td>
      <td>
        <select data-catalog-field="group-level" aria-label="Nivel del grado">
          <option value="primary" ${level === "primary" ? "selected" : ""}>Primaria</option>
          <option value="secondary" ${level === "secondary" ? "selected" : ""}>Secundaria</option>
        </select>
        <span class="epqa-grade-level-badge-v6 ${badgeClass}">${escapeHtml(levelLabel)}</span>
      </td>
      <td class="catalog-actions epqa-grade-row-actions-v6">
        <button class="epqa-grade-icon-btn-v6" data-save-group="${escapeHtml(id)}" type="button" title="Guardar grado" aria-label="Guardar grado">${epqaIcon("save")}</button>
        <button class="epqa-grade-icon-btn-v6 epqa-grade-icon-btn-v6--danger" data-delete-group="${escapeHtml(id)}" type="button" title="Eliminar grado" aria-label="Eliminar grado">${epqaIcon("trash")}</button>
      </td>
    </tr>`;
  }).join("");
  target.innerHTML = `
    <div class="epqa-grades-table-wrap-v6">
      <table class="epqa-grades-table-v6">
        <thead><tr><th>ID</th><th>Nombre</th><th>Sede</th><th>Nivel</th><th>Acciones</th></tr></thead>
        <tbody>
          ${groupRows || `<tr><td colspan="5">Sin grados.</td></tr>`}
          <tr id="gradeNoResultsRow" hidden><td colspan="5">Sin coincidencias para los filtros activos.</td></tr>
        </tbody>
      </table>
    </div>
    <footer class="epqa-grades-footer-v6">
      <span id="gradeTableSummary">Mostrando ${groups.length ? 1 : 0} a ${groups.length} de ${groups.length} grados</span>
      <div class="epqa-grades-pagination-v6" aria-label="Paginación de grados">
        <button type="button" disabled>‹</button>
        <button type="button" class="active">1</button>
        <button type="button" disabled>›</button>
      </div>
    </footer>`;
  bindCatalogManagerActions(target);
  applyGradeFilters();
}

function renderSubjectManager() {
  const target = byId("subjectManager");
  if (!target) return;
  const subjectRows = subjectOptions().map((subject) => {
    const item = normalizeSubject(subject);
    const used = usesSubject(item.id) || usesSubject(item.name) || usesSubject(item.abreviatura);
    return `
    <tr data-subject-id="${escapeHtml(item.id)}" data-subject-name="${escapeHtml(item.name)}" data-subject-abbreviation="${escapeHtml(item.abreviatura)}">
      <td><span class="epqa-subject-table-icon-v7 ${getSubjectVisualClass(item)}">${renderSubjectIcon(item)}</span></td>
      <td><input data-catalog-field="subject-name" value="${escapeHtml(item.name)}" aria-label="Nombre de la materia"></td>
      <td><input data-catalog-field="subject-abbreviation" value="${escapeHtml(item.abreviatura)}" aria-label="Abreviatura de la materia"></td>
      <td><span class="epqa-subject-use-badge-v7 ${used ? "is-used" : ""}">${used ? "En uso" : "Sin uso"}</span></td>
      <td>
        <input type="hidden" data-catalog-field="subject-icon" id="subjectIcon-${escapeHtml(item.id)}" value="${escapeHtml(item.iconKey)}">
        <div class="epqa-subject-icon-picker-v7 epqa-subject-icon-picker-v7--row">${renderSubjectIconPicker(`subjectIcon-${item.id}`, item.iconKey)}</div>
      </td>
      <td>
        <input type="hidden" data-catalog-field="subject-color" id="subjectColor-${escapeHtml(item.id)}" value="${escapeHtml(item.colorKey)}">
        <div class="epqa-subject-color-picker-v7">${renderSubjectColorPicker(`subjectColor-${item.id}`, item.colorKey)}</div>
      </td>
      <td class="catalog-actions epqa-grade-row-actions-v6">
        <button class="epqa-grade-icon-btn-v6" data-save-subject="${escapeHtml(item.id)}" type="button" title="Guardar materia" aria-label="Guardar materia">${epqaIcon("save")}</button>
        <button class="epqa-grade-icon-btn-v6 epqa-grade-icon-btn-v6--danger" data-delete-subject="${escapeHtml(item.id)}" type="button" title="Eliminar materia" aria-label="Eliminar materia">${epqaIcon("trash")}</button>
      </td>
    </tr>`;
  }).join("") || `<tr><td colspan="7">Sin materias.</td></tr>`;
  target.innerHTML = `
    <div class="epqa-grades-table-wrap-v6">
      <table class="epqa-grades-table-v6 epqa-subjects-table-v7">
        <thead><tr><th>Icono</th><th>Materia</th><th>Abreviatura</th><th>Uso</th><th>Icono SVG</th><th>Color</th><th>Acciones</th></tr></thead>
        <tbody>${subjectRows}</tbody>
      </table>
    </div>`;
  bindSubjectPickers(target);
  bindCatalogManagerActions(target);
}

function renderDailyRulesManager() {
  const target = byId("dailyRulesManager");
  if (!target) return;
  const rules = dailyRuleExceptions();
  const rows = rules.map((rule) => {
    const priority = normalizeRulePriority(rule.priority || "P0");
    return `
    <tr>
      <td>${escapeHtml(teacherName(rule.teacher) || "Sin asignar")}</td>
      <td>${escapeHtml(siteNameForId(rule.site) || "Cualquier sede")}</td>
      <td>${escapeHtml(rule.day || "Sin asignar")}</td>
      <td>${rule.type === "require" ? "Exigir exactamente" : "Permitir hasta"}</td>
      <td>${Number(rule.hours || 0) > 0 ? `${Number(rule.hours || 0)}h` : "—"}</td>
      <td><span class="epqa-priority-badge-v6 epqa-priority-badge-v6--${escapeHtml(priority.toLowerCase())}">${escapeHtml(priority || "Sin prioridad")}</span></td>
      <td>
        <div class="epqa-rule-row-actions-v6">
          <button class="epqa-rule-icon-btn-v6" type="button" data-edit-daily-rule="${escapeHtml(rule.id)}" title="Editar excepcion" aria-label="Editar excepcion">${epqaIcon("pencil")}</button>
          <button class="epqa-rule-icon-btn-v6 epqa-rule-icon-btn-v6--danger" type="button" data-delete-daily-rule="${escapeHtml(rule.id)}" title="Eliminar excepcion" aria-label="Eliminar excepcion">${epqaIcon("trash")}</button>
        </div>
      </td>
    </tr>
  `;
  }).join("") || `<tr><td colspan="7">Sin excepciones.</td></tr>`;
  target.innerHTML = `
    <div class="epqa-exceptions-table-wrap-v6">
      <table class="epqa-exceptions-table-v6">
        <thead><tr><th>Docente</th><th>Sede</th><th>Dia</th><th>Tipo</th><th>Horas</th><th>Prioridad</th><th>Acciones</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <footer class="epqa-rules-footer-v6">
      <span>Mostrando ${rules.length ? 1 : 0} a ${rules.length} de ${rules.length} excepciones</span>
      <div class="epqa-rules-pagination-v6">
        <button type="button" disabled>‹</button>
        <button type="button" class="active">1</button>
        <button type="button" disabled>›</button>
      </div>
    </footer>`;
  target.querySelectorAll("[data-edit-daily-rule]").forEach((button) => {
    button.addEventListener("click", () => loadDailyRuleExceptionForEdit(button.dataset.editDailyRule));
  });
  target.querySelectorAll("[data-delete-daily-rule]").forEach((button) => {
    button.addEventListener("click", () => {
      EPQA.data.rules.general.dailyExceptions = dailyRuleExceptions().filter((rule) => rule.id !== button.dataset.deleteDailyRule);
      saveGeneralRules();
    });
  });
}

function loadDailyRuleExceptionForEdit(ruleId) {
  const rule = dailyRuleExceptions().find((item) => item.id === ruleId);
  if (!rule) return;
  if (byId("dailyRuleTeacher")) byId("dailyRuleTeacher").value = rule.teacher || "";
  if (byId("dailyRuleSite")) byId("dailyRuleSite").value = rule.site || "";
  if (byId("dailyRuleDay")) byId("dailyRuleDay").value = normalizeDay(rule.day);
  if (byId("dailyRuleType")) byId("dailyRuleType").value = rule.type || "allow";
  if (byId("dailyRuleHours")) byId("dailyRuleHours").value = Math.max(1, Number(rule.hours || 1));
  if (byId("dailyRulePriority")) byId("dailyRulePriority").value = normalizeRulePriority(rule.priority || "P0");
  if (byId("btnAddDailyRule")) byId("btnAddDailyRule").dataset.editingDailyRule = rule.id;
  notify("Excepcion cargada", "Ajusta los campos y pulsa Agregar para actualizarla.", "info");
}

function snapshotProgress() {
  return {
    schemaVersion: "1.0.0",
    savedAt: new Date().toISOString(),
    module: "EPQA_Horarios_Inteligentes",
    scheduleId: EPQA.activeScheduleId,
    data: EPQA.data,
    slots: EPQA.slots,
    audit: EPQA.audit
  };
}

async function saveProgress() {
  try {
    syncWorkspaceSnapshot();
    localStorage.setItem(EPQA.storageKey, JSON.stringify(snapshotProgress()));
  } catch (error) {
    // El guardado local no debe impedir el remoto.
  }
  const persisted = await persistWorkspaceDraft("Guardado de avance", true);
  if (!persisted) {
    notify("No se pudo guardar en la base de datos", "El avance quedo en este navegador, pero falta confirmar el guardado remoto.", "error", true);
    return;
  }
  notify("Avance guardado", "El horario quedo guardado en la base de datos y en este navegador.", "success");
}

function readProgress() {
  try {
    const raw = localStorage.getItem(EPQA.storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data ? parsed : null;
  } catch (error) {
    return null;
  }
}

function loadProgress() {
  const saved = readProgress();
  if (!saved) {
    notify("Sin avance local", "No hay avance guardado en este navegador.", "warning", true);
    return;
  }
  applyProgress(saved);
  notify("Avance cargado", `${saved.savedAt ? new Date(saved.savedAt).toLocaleString() : "Sin fecha guardada"}.`, "success");
}

function applyProgress(progress) {
  EPQA.data = normalizeImportedData(progress.data || progress);
  EPQA.slots = Array.isArray(progress.slots) ? progress.slots : (EPQA.data.slots || []);
  EPQA.audit = progress.audit || EPQA.audit;
  byId("jsonInput").value = JSON.stringify(EPQA.data, null, 2);
  renderDataViews();
}

function syncWorkspaceSnapshot() {
  if (!EPQA.data) return;
  EPQA.data.slots = EPQA.slots || [];
  const json = JSON.stringify(EPQA.data, null, 2);
  if (byId("jsonInput")) byId("jsonInput").value = json;
  try {
    localStorage.setItem(EPQA.storageKey, JSON.stringify(snapshotProgress()));
  } catch (error) {
    // El guardado remoto sigue siendo la fuente principal cuando existe horario activo.
  }
}

async function persistWorkspaceDraft(actionName = "Guardado automatico", requireDatabase = false) {
  if (!EPQA.activeScheduleId) {
    const created = await ensureActiveScheduleForPersistence(actionName);
    if (!created && requireDatabase) return false;
  }
  if (!EPQA.activeScheduleId) return false;
  try {
    const response = await fetch("/horarios/api/versions.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schedule_id: EPQA.activeScheduleId,
        final: false,
        counts: EPQA.audit?.counts || { P0: 0, P1: 0, P2: 0 },
        snapshot: { data: EPQA.data, slots: EPQA.slots, audit: EPQA.audit, actionName }
      })
    });
    const payload = await response.json();
    return Boolean(payload.ok);
  } catch (error) {
    return false;
  }
}

async function ensureActiveScheduleForPersistence(actionName = "Guardado automatico") {
  try {
    const response = await fetch("/horarios/api/schedules.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        name: EPQA.data?.project?.name || EPQA.data?.project?.institution || "Horario EPQA",
        data: EPQA.data || {},
        slots: EPQA.slots || [],
        audit: EPQA.audit || null,
        createdFrom: actionName
      })
    });
    const payload = await response.json();
    if (!payload.ok || !payload.id) return false;
    EPQA.activeScheduleId = payload.id;
    await loadScheduleWorkspace(payload.id);
    return true;
  } catch (error) {
    return false;
  }
}

function downloadProgressBackup() {
  const blob = new Blob([JSON.stringify(snapshotProgress(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `epqa_horarios_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importProgressBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = parseLooseJson(await file.text());
    const progress = parsed.data ? parsed : { data: parsed, slots: parsed.slots || [] };
    applyProgress(progress);
    localStorage.setItem(EPQA.storageKey, JSON.stringify(snapshotProgress()));
    notify("Backup cargado", "El archivo quedo guardado como avance actual.", "success");
  } catch (error) {
    notify("Backup invalido", "Revise que el archivo sea un JSON valido de EPQA.", "error", true);
  } finally {
    event.target.value = "";
  }
}

function addSite() {
  const siteId = normalizeKey(byId("siteName").value || "SEDE").replace(/\s+/g, "_");
  EPQA.data.sites = EPQA.data.sites || [];
  if (!EPQA.data.sites.some((site) => (site.id || site.name) === siteId)) {
    EPQA.data.sites.push({ id: siteId, name: byId("siteName").value.trim() || siteId });
  }
  byId("siteName").value = "";
  renderDataViews();
}

function addRoom() {
  const siteId = byId("roomSite").value;
  const roomNameValue = byId("roomName").value.trim();
  if (!siteId || !roomNameValue) return;
  EPQA.data.rooms = EPQA.data.rooms || [];
  EPQA.data.rooms.push({
    id: roomId(roomNameValue),
    name: roomNameValue,
    siteId,
    room_type: byId("roomType").value,
    capacity: byId("roomType").value === "AULA" ? 99 : 1
  });
  byId("roomName").value = "";
  renderDataViews();
}

function addTeacher() {
  const name = normalizeKey(byId("teacherName").value);
  if (!name) return;
  const siteId = byId("teacherDefaultSite")?.value || "";
  EPQA.data.teachers = EPQA.data.teachers || [];
  if (!EPQA.data.teachers.some((teacher) => (teacher.id || teacher.name) === name)) {
    EPQA.data.teachers.push({
      id: name,
      name,
      type: byId("teacherType").value,
      minWeeklyHours: Number(byId("teacherMinHours").value || 0),
      siteId,
      site: siteId,
      availability: {}
    });
    ensureTeacherDefaultAvailabilitySite(EPQA.data.teachers[EPQA.data.teachers.length - 1], siteId);
  }
  renderDataViews();
  closeTeacherModal();
}

function addGroup() {
  const group = byId("groupName").value.trim();
  if (!group) {
    notify("Falta el grado", "Escribe el nombre del grado antes de agregarlo.", "warning", true);
    return;
  }
  EPQA.data.groups = Array.isArray(EPQA.data.groups) ? EPQA.data.groups : groupOptions().map((item) => ({ id: item.id, name: item.name }));
  if (!EPQA.data.groups.some((item) => (item.id || item.name) === group)) {
    EPQA.data.groups.push({ id: group, name: group, siteId: byId("groupSite").value, level: byId("groupLevel").value });
  }
  byId("groupName").value = "";
  renderDataViews();
}

function addSubject() {
  const name = String(byId("subjectName")?.value || "").trim();
  const abbreviation = String(byId("subjectAbbreviation")?.value || "").trim() || normalizeKey(name);
  if (!name && !abbreviation) {
    notify("Falta la materia", "Escribe el nombre de la materia antes de agregarla.", "warning", true);
    return;
  }
  EPQA.data.subjects = EPQA.data.subjects || [];
  const subject = normalizeSubject({
    id: abbreviation || name,
    name: name || abbreviation,
    nombre: name || abbreviation,
    abreviatura: abbreviation || subjectAbbrev(name),
    iconKey: byId("subjectIconKey")?.value || "",
    colorKey: byId("subjectColorKey")?.value || ""
  });
  if (!subjectOptions().some((item) => normalizeKey(item.id) === normalizeKey(subject.id) || normalizeKey(item.name) === normalizeKey(subject.name))) {
    EPQA.data.subjects.push(subject);
  }
  if (byId("subjectName")) byId("subjectName").value = "";
  if (byId("subjectAbbreviation")) byId("subjectAbbreviation").value = "";
  renderDataViews();
}

function bindCatalogManagerActions(root) {
  root.querySelectorAll("[data-save-site]").forEach((button) => button.addEventListener("click", () => saveSiteFromRow(button)));
  root.querySelectorAll("[data-delete-site]").forEach((button) => button.addEventListener("click", () => deleteSite(Number(button.dataset.deleteSite))));
  root.querySelectorAll("[data-save-room]").forEach((button) => button.addEventListener("click", () => saveRoomFromRow(button)));
  root.querySelectorAll("[data-delete-room]").forEach((button) => button.addEventListener("click", () => deleteRoom(Number(button.dataset.deleteRoom))));
  root.querySelectorAll("[data-save-teacher]").forEach((button) => button.addEventListener("click", () => saveTeacherFromRow(button)));
  root.querySelectorAll("[data-delete-teacher]").forEach((button) => button.addEventListener("click", () => deleteTeacher(Number(button.dataset.deleteTeacher))));
  root.querySelectorAll("[data-save-group]").forEach((button) => button.addEventListener("click", () => saveGroupFromRow(button)));
  root.querySelectorAll("[data-delete-group]").forEach((button) => button.addEventListener("click", () => deleteGroup(button.dataset.deleteGroup)));
  root.querySelectorAll("[data-save-subject]").forEach((button) => button.addEventListener("click", () => saveSubjectFromRow(button)));
  root.querySelectorAll("[data-delete-subject]").forEach((button) => button.addEventListener("click", () => deleteSubject(button.dataset.deleteSubject)));
}

function field(row, name) {
  return row.querySelector(`[data-catalog-field="${name}"]`)?.value?.trim() || "";
}

function saveSiteFromRow(button) {
  const index = Number(button.dataset.saveSite);
  const row = button.closest("tr");
  const site = EPQA.data.sites[index];
  if (!site || !row) return;
  const oldId = site.id || site.code || site.name;
  const id = field(row, "site-id") || oldId;
  const name = field(row, "site-name") || id;
  site.id = id;
  site.name = name;
  replaceSiteReferences(oldId, id);
  renderDataViews();
}

function deleteSite(index) {
  const site = EPQA.data.sites?.[index];
  if (!site) return;
  const id = site.id || site.code || site.name;
  if (usesSite(id)) {
    notify("No se puede borrar", "Esta sede esta usada por docentes, grados, espacios, cargas u horarios.", "warning", true);
    return;
  }
  EPQA.data.sites.splice(index, 1);
  renderDataViews();
}

function saveRoomFromRow(button) {
  const index = Number(button.dataset.saveRoom);
  const row = button.closest("tr");
  const room = EPQA.data.rooms[index];
  if (!room || !row) return;
  const oldId = room.id || room.name;
  const oldName = room.name || room.id;
  room.id = field(row, "room-id") || oldId;
  room.name = field(row, "room-name") || room.id;
  room.siteId = field(row, "room-site");
  room.site = room.siteId;
  room.room_type = field(row, "room-type") || "AULA";
  replaceRoomReferences(oldId, oldName, room);
  renderDataViews();
}

function deleteRoom(index) {
  const room = EPQA.data.rooms?.[index];
  if (!room) return;
  if (usesRoom(room.id || room.name, room.name || room.id)) {
    notify("No se puede borrar", "Este espacio esta usado por cargas u horarios.", "warning", true);
    return;
  }
  EPQA.data.rooms.splice(index, 1);
  renderDataViews();
}

function saveTeacherFromRow(button) {
  const index = Number(button.dataset.saveTeacher);
  const row = button.closest("tr");
  const teacher = EPQA.data.teachers[index];
  if (!teacher || !row) return;
  const oldId = teacher.id || teacher.name;
  const oldName = teacher.name || teacher.id;
  teacher.id = field(row, "teacher-id") || oldId;
  teacher.name = field(row, "teacher-name") || teacher.id;
  teacher.type = field(row, "teacher-type") || "Secundaria";
  teacher.siteId = field(row, "teacher-site");
  teacher.site = teacher.siteId;
  teacher.minWeeklyHours = Number(field(row, "teacher-min") || 0);
  ensureTeacherDefaultAvailabilitySite(teacher, teacher.siteId);
  replaceTeacherReferences(oldId, oldName, teacher.id);
  renderDataViews();
}

function ensureTeacherDefaultAvailabilitySite(teacher, siteId = "") {
  if (!teacher || !siteId) return;
  teacher.availability = teacher.availability || {};
  const days = EPQA.data?.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const hasSavedAvailability = Object.values(teacher.availability).some((record) =>
    record && typeof record === "object" && ("site" in record || "slots" in record || "hours" in record)
  );
  if (hasSavedAvailability) return;
  days.forEach((day) => {
    const current = normalizeAvailabilityRecord(teacher.availability[day]);
    teacher.availability[day] = {
      ...current,
      site: current.site || siteId,
      hours: current.hours || availabilityPeriods().length
    };
  });
}

function deleteTeacher(index) {
  const teacher = EPQA.data.teachers?.[index];
  if (!teacher) return;
  if (usesTeacher(teacher.id || teacher.name, teacher.name || teacher.id)) {
    notify("No se puede borrar", "Este docente tiene cargas u horas en el horario.", "warning", true);
    return;
  }
  EPQA.data.teachers.splice(index, 1);
  renderDataViews();
}

function saveGroupFromRow(button) {
  const oldId = button.dataset.saveGroup;
  const row = button.closest("tr");
  const group = groupObjectById(oldId);
  if (!group || !row) return;
  const newId = field(row, "group-id") || oldId;
  group.id = newId;
  group.name = field(row, "group-name") || newId;
  group.siteId = field(row, "group-site");
  group.level = field(row, "group-level") || "secondary";
  ensureGroupsArray();
  replaceGroupReferences(oldId, newId);
  renderDataViews();
}

function deleteGroup(id) {
  if (usesGroup(id)) {
    notify("No se puede borrar", "Este grado tiene cargas u horas en el horario.", "warning", true);
    return;
  }
  ensureGroupsArray();
  EPQA.data.groups = (EPQA.data.groups || []).filter((group) => (group.id || group.name) !== id);
  renderDataViews();
}

function saveSubjectFromRow(button) {
  const oldId = button.dataset.saveSubject;
  const row = button.closest("tr");
  if (!row) return;
  const oldName = row.dataset.subjectName || oldId;
  const oldAbbreviation = row.dataset.subjectAbbreviation || oldId;
  const newName = field(row, "subject-name") || oldId;
  const abbreviation = field(row, "subject-abbreviation") || subjectAbbrev(newName);
  const newId = abbreviation || newName;
  const iconKey = field(row, "subject-icon") || getSubjectIconKey(oldId);
  const colorKey = field(row, "subject-color") || getSubjectColorKey(oldId);
  const subjectsBeforeSave = subjectOptions();
  unique([oldId, oldName, oldAbbreviation]).forEach((alias) => replaceSubjectReferences(alias, newId));
  EPQA.data.subjects = subjectsBeforeSave.map((subject) => {
    const item = normalizeSubject(subject);
    const matchesOldSubject = [oldId, oldName, oldAbbreviation].some((alias) =>
      normalizeKey(item.id) === normalizeKey(alias) ||
      normalizeKey(item.name) === normalizeKey(alias) ||
      normalizeKey(item.nombre) === normalizeKey(alias) ||
      normalizeKey(item.abreviatura) === normalizeKey(alias)
    );
    return matchesOldSubject
      ? normalizeSubject({ ...item, id: newId, name: newName, nombre: newName, abreviatura: abbreviation, iconKey, colorKey })
      : item;
  }).filter((subject, index, list) => list.findIndex((item) => normalizeKey(item.id) === normalizeKey(subject.id)) === index);
  syncWorkspaceSnapshot();
  void persistWorkspaceDraft("Materia editada");
  renderDataViews();
  notify("Materia actualizada", "Se guardaron el nombre, abreviatura, icono y color.", "success");
}

function deleteSubject(id) {
  if (usesSubject(id)) {
    notify("No se puede borrar", "Esta materia tiene cargas u horas en el horario.", "warning", true);
    return;
  }
  EPQA.data.subjects = (EPQA.data.subjects || []).filter((subject) => {
    const item = normalizeSubject(subject);
    return normalizeKey(item.id) !== normalizeKey(id) && normalizeKey(item.name) !== normalizeKey(id) && normalizeKey(item.abreviatura) !== normalizeKey(id);
  });
  renderDataViews();
}

function addLoad() {
  const group = byId("loadGroup").value;
  if (!group) {
    notify("Sin grado compatible", "El docente seleccionado no tiene grados de su ciclo escolar para asignar.", "warning", true);
    return;
  }
  const load = buildLoad({
    teacher: byId("loadTeacher").value,
    group,
    subject: byId("loadSubject").value,
    roomId: byId("loadRoom").value,
    hours: Number(byId("loadHours").value || 1),
    blockHours: Number(byId("loadBlockHours").value || 1),
    rulePriority: byId("loadRulePriority")?.value || "P0",
    preferredDays: selectedDaysFrom("loadPreferredDays"),
    preferredDaysPriority: byId("loadPreferredDaysPriority")?.value || "P2"
  });
  EPQA.data.loads = EPQA.data.loads || [];
  EPQA.data.loads.push(load);
  syncWorkspaceSnapshot();
  void persistWorkspaceDraft("Carga creada");
  renderDataViews();
}

function buildLoad({ teacher, group, subject, roomId, hours, blockHours, rulePriority, preferredDays = [], preferredDaysPriority = "P2" }) {
  const groupMeta = groupOptions().find((item) => item.id === group) || {};
  const room = roomOptions().find((item) => item.id === roomId) || {};
  const load = {
    id: `load-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    teacher,
    group,
    subject,
    room: room.name || "",
    roomId: room.id || "",
    site: groupMeta.siteId || siteFromRoom(room.id || room.name) || byId("groupSite")?.value || "",
    siteId: groupMeta.siteId || siteFromRoom(room.id || room.name) || "",
    level: normalizeLevel(groupMeta.level || byId("groupLevel")?.value || "secondary"),
    hours: Math.max(1, Number(hours || 1)),
    blockHours: Math.max(1, Number(blockHours || 1)),
    rulePriority: normalizeRulePriority(rulePriority || "P0"),
    preferredDays: (preferredDays || []).map(normalizeDay).filter(Boolean),
    preferredDaysPriority: normalizeRulePriority(preferredDaysPriority || "P2"),
    lockedTeacher: true
  };
  load.loadKey = loadSignature(load);
  return load;
}

function openBulkLoadModal() {
  const modal = byId("bulkLoadModal");
  if (!modal) return;
  ensureBulkLoadModalV8Chrome();
  EPQA.ui.bulkLoadDraft = [];
  fillSelect("bulkLoadTeacher", teacherOptions(), "id", "name");
  fillSelect("bulkLoadSubject", subjectOptions(), "id", "name");
  fillSelect("bulkLoadRoom", roomOptionsWithFlexible(), "id", "name");
  if (byId("loadTeacher")?.value) byId("bulkLoadTeacher").value = byId("loadTeacher").value;
  if (byId("loadSubject")?.value) byId("bulkLoadSubject").value = byId("loadSubject").value;
  if (byId("loadRoom")?.value) byId("bulkLoadRoom").value = byId("loadRoom").value;
  byId("bulkLoadHours").value = byId("loadHours")?.value || 1;
  byId("bulkLoadBlockHours").value = byId("loadBlockHours")?.value || 1;
  byId("bulkLoadRulePriority").value = byId("loadRulePriority")?.value || "P0";
  byId("bulkLoadPreferredDaysPriority").value = byId("loadPreferredDaysPriority")?.value || "P2";
  renderDayPreferenceChecks("bulkLoadPreferredDays", selectedDaysFrom("loadPreferredDays"));
  populateBulkLoadFiltersV8();
  bindBulkLoadModalV8Events();
  renderBulkLoadGroups();
  renderBulkLoadDrafts();
  modal.hidden = false;
  modal.removeAttribute("hidden");
  document.body.classList.add("modal-open");
  setTimeout(() => byId("bulkLoadTeacher")?.focus(), 0);
}

function ensureBulkLoadModalV8Chrome() {
  const modal = byId("bulkLoadModal");
  if (!modal || modal.dataset.v9Ready === "1") return;
  modal.classList.remove("epqa-mass-modal-overlay-v8");
  modal.classList.add("epqa-mass-modal-overlay-v9");
  modal.innerHTML = `
    <section class="epqa-mass-modal-v9" role="dialog" aria-modal="true" aria-labelledby="bulkLoadModalTitle">
      <header class="epqa-mass-header-v9">
        <div class="epqa-mass-header-copy-v9">
          <div class="epqa-mass-kicker-v9">ASIGNACION MASIVA</div>
          <h1 id="bulkLoadModalTitle" class="epqa-mass-title-v9">Materias por docente</h1>
          <p class="epqa-mass-subtitle-v9">Prepara varias asignaciones y revísalas antes de guardarlas.</p>
        </div>
        <button type="button" class="epqa-mass-close-v9" id="bulkLoadModalClose" aria-label="Cerrar modal" title="Cerrar modal">${epqaIcon("x")}</button>
      </header>

      <div class="epqa-mass-body-v9">
        <main class="epqa-mass-left-v9">
          <section class="epqa-mass-card-v9 epqa-mass-base-card-v9">
            <div class="epqa-mass-card-head-v9">
              <div>
                <h2>1. Define la asignación base</h2>
                <p>Configura una vez y aplica a varios grados.</p>
              </div>
              <span class="epqa-mass-chip-v9 epqa-mass-chip-primary-v9">${epqaIcon("copy")}<span>Modo rápido</span></span>
            </div>

            <div class="epqa-mass-form-grid-v9 epqa-mass-form-grid-top-v9">
              <label class="epqa-mass-field-v9">Docente
                <span class="epqa-control-v9">${epqaIcon("users")}<select id="bulkLoadTeacher" name="bulkLoadTeacher"></select></span>
              </label>
              <label class="epqa-mass-field-v9">Materia
                <span class="epqa-control-v9">${epqaIcon("book-open")}<select id="bulkLoadSubject" name="bulkLoadSubject"></select></span>
              </label>
              <label class="epqa-mass-field-v9">Espacio
                <span class="epqa-control-v9">${epqaIcon("map")}<select id="bulkLoadRoom" name="bulkLoadRoom"></select></span>
              </label>
            </div>

            <div class="epqa-mass-form-grid-v9 epqa-mass-form-grid-bottom-v9">
              <label class="epqa-mass-field-v9">Horas por grado
                <span class="epqa-control-v9">${epqaIcon("clock")}<input id="bulkLoadHours" name="bulkLoadHours" type="number" min="1" max="99" value="1" inputmode="numeric"></span>
              </label>
              <label class="epqa-mass-field-v9">Bloque
                <span class="epqa-control-v9">${epqaIcon("calendar")}
                  <select id="bulkLoadBlockHours" name="bulkLoadBlockHours">
                    <option value="1">No, horas sueltas</option>
                    <option value="2">Bloque indivisible 2h</option>
                    <option value="3">Bloque indivisible 3h</option>
                  </select>
                </span>
              </label>
              <label class="epqa-mass-field-v9">Importancia
                <span class="epqa-control-v9">${epqaIcon("alert")}
                  <select id="bulkLoadRulePriority" name="bulkLoadRulePriority">
                    <option value="P0">P0 obligatoria</option>
                    <option value="P1">P1 fuerte</option>
                    <option value="P2">P2 deseable</option>
                  </select>
                </span>
              </label>
              <label class="epqa-mass-field-v9">Preferencia de días
                <span class="epqa-control-v9">${epqaIcon("star")}
                  <select id="bulkLoadPreferredDaysPriority" name="bulkLoadPreferredDaysPriority">
                    <option value="P2">P2 deseable</option>
                    <option value="P1">P1 fuerte</option>
                    <option value="P0">P0 obligatoria</option>
                  </select>
                </span>
              </label>
            </div>

            <div class="epqa-mass-quick-row-v9">
              <div class="epqa-mass-days-box-v9">
                <label>Días sugeridos</label>
                <div class="day-checks epqa-mass-day-buttons-v9" id="bulkLoadPreferredDays"></div>
              </div>
              <div class="epqa-mass-chips-row-v9">
                <button class="epqa-mass-chip-v9" type="button" data-bulk-level="primary">Primaria</button>
                <button class="epqa-mass-chip-v9" type="button" data-bulk-level="secondary">Secundaria</button>
                <button class="epqa-mass-chip-v9" type="button" data-bulk-site-current>Solo sede actual</button>
                <button class="epqa-mass-chip-v9 active" type="button" data-bulk-exclude-existing>Excluir ya asignados</button>
                <button class="epqa-mass-chip-v9 active" type="button" data-bulk-compatible>Mostrar compatibles</button>
              </div>
            </div>
          </section>

          <section class="epqa-mass-card-v9 epqa-mass-grades-card-v9">
            <div class="epqa-mass-card-head-v9">
              <div>
                <h2>2. Selecciona los grados compatibles</h2>
                <p>Marca varios grados para crear asignaciones en bloque.</p>
              </div>
            </div>
            <div class="epqa-mass-toolbar-v9">
              <label class="epqa-control-v9">${epqaIcon("search")}<input id="bulkGroupSearch" type="search" placeholder="Buscar grado..."></label>
              <span class="epqa-control-v9">
                <select id="bulkGroupSiteFilter"></select>
              </span>
              <span class="epqa-control-v9">
                <select id="bulkGroupLevelFilter">
                <option value="">Todos los niveles</option>
                <option value="primary">Primaria</option>
                <option value="secondary">Secundaria</option>
                </select>
              </span>
              <button class="epqa-outline-btn-v9" type="button" id="bulkLoadToggleGroups">${epqaIcon("check")}<span>Marcar todos</span></button>
            </div>
            <div class="epqa-mass-grade-grid-v9" id="bulkLoadGroups"></div>
            <div class="epqa-mass-grade-action-v9">
              <button class="epqa-primary-btn-v9 epqa-primary-btn-full-v9" type="button" id="bulkLoadAddDraft">${epqaIcon("plus")}<span>Agregar a la lista</span></button>
            </div>
          </section>
        </main>

        <aside class="epqa-mass-right-v9">
          <section class="epqa-mass-card-v9 epqa-mass-summary-card-v9">
            <div class="epqa-summary-top-v9">
              <div class="epqa-summary-icon-v9">${epqaIcon("copy")}</div>
              <div class="epqa-summary-copy-v9"><span>Total preparado</span><strong id="bulkLoadPreparedCount">0 asignaciones preparadas</strong></div>
              <div class="epqa-summary-hours-v9" id="bulkLoadTotalHours">0h</div>
            </div>
            <div class="epqa-summary-load-v9" id="bulkLoadTeacherHours"></div>
          </section>

          <section class="epqa-mass-card-v9 epqa-mass-prepared-card-v9">
            <h2>3. Revisa antes de guardar</h2>
            <div id="bulkLoadDraftList"></div>
          </section>

          <section class="epqa-warning-box-v9" id="bulkLoadValidationBox">${epqaIcon("alert")}<span>Selecciona docente, materia y grados para preparar asignaciones.</span></section>
        </aside>
      </div>

      <footer class="epqa-mass-footer-v9">
        <div class="epqa-footer-status-v9">${epqaIcon("check")}<span id="bulkLoadFooterStatus">0 grados seleccionados · 0 asignaciones preparadas · 0h listas</span></div>
        <div class="epqa-footer-actions-v9">
          <button type="button" class="epqa-secondary-btn-v9" id="bulkLoadModalCancel">${epqaIcon("x")}<span>Cancelar</span></button>
          <button type="button" class="epqa-primary-btn-v9" id="bulkLoadAssign" disabled>${epqaIcon("check")}<span>Asignar todas</span></button>
        </div>
      </footer>
    </section>`;
  modal.dataset.v9Ready = "1";
}

function bindBulkLoadModalV8Events() {
  if (byId("bulkLoadModalClose")) byId("bulkLoadModalClose").onclick = requestCloseBulkLoadModal;
  if (byId("bulkLoadModalCancel")) byId("bulkLoadModalCancel").onclick = requestCloseBulkLoadModal;
  if (byId("bulkLoadTeacher")) byId("bulkLoadTeacher").onchange = () => {
    renderBulkLoadGroups();
    renderBulkLoadDrafts();
  };
  if (byId("bulkLoadRoom")) byId("bulkLoadRoom").onchange = renderBulkLoadGroups;
  if (byId("bulkLoadSubject")) byId("bulkLoadSubject").onchange = renderBulkLoadGroups;
  if (byId("bulkGroupSearch")) byId("bulkGroupSearch").oninput = renderBulkLoadGroups;
  if (byId("bulkGroupSiteFilter")) byId("bulkGroupSiteFilter").onchange = renderBulkLoadGroups;
  if (byId("bulkGroupLevelFilter")) byId("bulkGroupLevelFilter").onchange = renderBulkLoadGroups;
  if (byId("bulkLoadToggleGroups")) byId("bulkLoadToggleGroups").onclick = toggleBulkLoadGroups;
  if (byId("bulkLoadAddDraft")) byId("bulkLoadAddDraft").onclick = addBulkLoadDraft;
  if (byId("bulkLoadAssign")) byId("bulkLoadAssign").onclick = assignBulkLoadDrafts;
  if (byId("bulkClearSelection")) byId("bulkClearSelection").onclick = clearBulkLoadGroupSelection;
  if (byId("bulkLoadModal")) byId("bulkLoadModal").onclick = (event) => {
    if (event.target === byId("bulkLoadModal")) requestCloseBulkLoadModal();
  };
  document.querySelectorAll(".epqa-mass-chip-v9").forEach((button) => {
    button.onclick = () => toggleBulkSmartChip(button);
  });
}

function populateBulkLoadFiltersV8() {
  const siteFilter = byId("bulkGroupSiteFilter");
  if (!siteFilter) return;
  const current = siteFilter.value;
  siteFilter.innerHTML = `<option value="">Todas las sedes</option>` + siteOptions().map((site) => `<option value="${escapeHtml(site.id)}">${escapeHtml(site.name)}</option>`).join("");
  if ([...siteFilter.options].some((option) => option.value === current)) siteFilter.value = current;
}

function toggleBulkSmartChip(button) {
  if (!button) return;
  if (button.dataset.bulkLevel) {
    const selected = button.classList.contains("active");
    document.querySelectorAll("[data-bulk-level]").forEach((chip) => chip.classList.remove("active"));
    byId("bulkGroupLevelFilter").value = selected ? "" : button.dataset.bulkLevel;
    if (!selected) button.classList.add("active");
  } else {
    button.classList.toggle("active");
  }
  renderBulkLoadGroups();
}

function clearBulkLoadGroupSelection() {
  document.querySelectorAll("#bulkLoadGroups input[type='checkbox']").forEach((input) => {
    input.checked = false;
    input.closest(".epqa-mass-grade-item-v9")?.classList.remove("selected");
  });
  updateBulkLoadFooterStatus();
}

function closeBulkLoadModal() {
  const modal = byId("bulkLoadModal");
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("hidden", "");
  EPQA.ui.bulkLoadDraft = [];
  if (byId("availabilityModal")?.hidden !== false && byId("uxModal")?.hidden !== false) {
    document.body.classList.remove("modal-open");
  }
}

function requestCloseBulkLoadModal() {
  if ((EPQA.ui.bulkLoadDraft || []).length) {
    confirmAction(
      "Salir sin asignar",
      "Tienes asignaciones preparadas que aun no se han guardado.\n\nSi sales ahora se perdera esta lista.\n\nDeseas continuar?",
      closeBulkLoadModal,
      "Salir"
    );
    return;
  }
  closeBulkLoadModal();
}

function renderBulkLoadGroups() {
  const target = byId("bulkLoadGroups");
  if (!target) return;
  const teacherId = byId("bulkLoadTeacher")?.value || "";
  const roomId = byId("bulkLoadRoom")?.value || "";
  const subject = byId("bulkLoadSubject")?.value || "";
  const roomSite = roomSiteById(roomId);
  const search = normalizeKey(byId("bulkGroupSearch")?.value || "");
  const siteFilter = byId("bulkGroupSiteFilter")?.value || "";
  const levelFilter = normalizeLevel(byId("bulkGroupLevelFilter")?.value || "");
  const excludeExisting = document.querySelector("[data-bulk-exclude-existing]")?.classList.contains("active");
  let groups = filterGroupsByRoomSite(groupsForTeacher(teacherId), roomId);
  groups = groups.filter((group) => {
    const level = normalizeLevel(group.level);
    const hasExisting = bulkLoadHasExisting(teacherId, group.id, subject);
    return (!search || normalizeKey(`${group.id} ${group.name}`).includes(search)) &&
      (!siteFilter || sameSite(group.siteId || group.site || "", siteFilter)) &&
      (!levelFilter || level === levelFilter) &&
      (!excludeExisting || !hasExisting);
  });
  target.innerHTML = groups.map((group) => {
    const level = normalizeLevel(group.level);
    const hasExisting = bulkLoadHasExisting(teacherId, group.id, subject);
    const stateLabel = hasExisting ? "Ya tiene materia" : group.needsLevelReview ? "Revisar" : "Libre";
    const stateClass = hasExisting ? "exists" : group.needsLevelReview ? "review" : "free";
    return `
    <label class="bulk-group-option epqa-mass-grade-item-v9">
      <input type="checkbox" name="bulkLoadGroups" value="${escapeHtml(group.id)}">
      <strong>${escapeHtml(group.name || group.id)}</strong>
      <span>${level === "primary" ? "Primaria" : "Secundaria"}${roomSite ? ` · ${escapeHtml(siteNameForId(roomSite))}` : ""}</span>
      <small class="${stateClass}">${escapeHtml(stateLabel)}</small>
    </label>
  `;
  }).join("") || `<div class="epqa-mass-empty-card-v9"><div>${epqaIcon("box")}<strong>No hay grados disponibles</strong><span>Revisa docente, sede, nivel o la opción de excluir asignados.</span></div></div>`;
  target.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.onchange = () => {
      input.closest(".epqa-mass-grade-item-v9")?.classList.toggle("selected", input.checked);
      updateBulkLoadFooterStatus();
    };
  });
  updateBulkLoadFooterStatus();
}

function toggleBulkLoadGroups() {
  const checks = [...document.querySelectorAll("#bulkLoadGroups input[type='checkbox']")];
  if (!checks.length) return;
  const shouldCheck = checks.some((input) => !input.checked);
  checks.forEach((input) => {
    input.checked = shouldCheck;
    input.closest(".epqa-mass-grade-item-v9")?.classList.toggle("selected", shouldCheck);
  });
  const label = byId("bulkLoadToggleGroups")?.querySelector("span") || byId("bulkLoadToggleGroups");
  if (label) label.textContent = shouldCheck ? "Desmarcar todos" : "Marcar todos";
  updateBulkLoadFooterStatus();
}

function addBulkLoadDraft() {
  const teacher = byId("bulkLoadTeacher")?.value || "";
  const subject = byId("bulkLoadSubject")?.value || "";
  const roomId = byId("bulkLoadRoom")?.value || "";
  const groups = [...document.querySelectorAll("#bulkLoadGroups input[type='checkbox']:checked")].map((input) => input.value);
  if (!teacher || !subject || !groups.length) {
    notify("Faltan datos", "Selecciona docente, materia y al menos un grado.", "warning", true);
    return;
  }
  const hours = Math.max(1, Number(byId("bulkLoadHours")?.value || 1));
  const blockHours = Math.max(1, Number(byId("bulkLoadBlockHours")?.value || 1));
  const rulePriority = normalizeRulePriority(byId("bulkLoadRulePriority")?.value || "P0");
  const preferredDays = selectedDaysFrom("bulkLoadPreferredDays");
  const preferredDaysPriority = normalizeRulePriority(byId("bulkLoadPreferredDaysPriority")?.value || "P2");
  let added = 0;
  let skipped = 0;
  groups.forEach((group) => {
    if (bulkLoadHasExisting(teacher, group, subject) || bulkLoadHasDraft(teacher, group, subject)) {
      skipped += 1;
      return;
    }
    EPQA.ui.bulkLoadDraft.push({ teacher, group, subject, roomId, hours, blockHours, rulePriority, preferredDays, preferredDaysPriority });
    added += 1;
  });
  clearBulkLoadGroupSelection();
  const label = byId("bulkLoadToggleGroups")?.querySelector("span") || byId("bulkLoadToggleGroups");
  if (label) label.textContent = "Marcar todos";
  renderBulkLoadDrafts();
  if (added) notify("Asignaciones preparadas", `${added} carga(s) agregada(s) a la lista temporal.`, "success");
  if (skipped) notify("Duplicados omitidos", `${skipped} asignacion(es) ya existian o estaban preparadas.`, "warning");
}

function renderBulkLoadDrafts() {
  const list = byId("bulkLoadDraftList");
  const total = byId("bulkLoadTotalHours");
  const teacherHours = byId("bulkLoadTeacherHours");
  const drafts = EPQA.ui.bulkLoadDraft || [];
  const preparedHours = drafts.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  if (total) total.textContent = `${preparedHours}h`;
  if (byId("bulkLoadPreparedCount")) byId("bulkLoadPreparedCount").textContent = `${drafts.length} asignacion${drafts.length === 1 ? "" : "es"} preparad${drafts.length === 1 ? "a" : "as"}`;
  if (teacherHours) {
    const teacherId = byId("bulkLoadTeacher")?.value || "";
    const current = (EPQA.data.loads || []).filter((load) => sameTeacher(load.teacher, teacherId)).reduce((sum, load) => sum + Number(load.hours || 0), 0);
    const prepared = drafts.filter((load) => sameTeacher(load.teacher, teacherId)).reduce((sum, load) => sum + Number(load.hours || 0), 0);
    teacherHours.innerHTML = teacherId
      ? `<span>Docente seleccionado</span><strong>${current}h actuales + ${prepared}h preparadas = ${current + prepared}h</strong>`
      : `<span>Docente seleccionado</span><strong>Selecciona un docente para calcular la carga.</strong>`;
  }
  if (!list) return;
  if (!drafts.length) {
    list.innerHTML = `<div class="epqa-mass-empty-card-v9"><div><div class="epqa-mass-empty-icon-v9">${epqaIcon("box")}</div><strong>Aquí se acumulan tus asignaciones</strong><span>Agrega materias y grados para revisar el resumen antes de confirmar.</span></div></div>`;
    updateBulkLoadFooterStatus();
    updateBulkLoadValidationBox();
    return;
  }
  const visibleDrafts = drafts.slice(0, 5);
  const hiddenDrafts = Math.max(0, drafts.length - visibleDrafts.length);
  list.innerHTML = `<div class="epqa-mass-prepared-table-wrap-v9"><table class="epqa-mass-prepared-table-v9"><thead><tr><th>Grado</th><th>Materia</th><th>Espacio</th><th>Horas</th><th>Importancia</th><th></th></tr></thead><tbody>${visibleDrafts.map((item, index) => {
    const group = groupOptions().find((option) => option.id === item.group);
    const room = roomOptions().find((option) => option.id === item.roomId);
    return `
      <tr>
        <td><span class="epqa-mass-grade-pill-v9">${escapeHtml(group?.name || item.group)}</span></td>
        <td>${escapeHtml(item.subject || "Sin asignar")}</td>
        <td>${escapeHtml(room?.name || item.roomId || "Aula disponible")}</td>
        <td>${Number(item.hours || 0)}h</td>
        <td><span class="epqa-mass-priority-badge-v9 epqa-mass-priority-badge-v9--${escapeHtml(normalizeRulePriority(item.rulePriority).toLowerCase())}">${escapeHtml(normalizeRulePriority(item.rulePriority))}</span></td>
        <td><button type="button" class="epqa-mass-remove-btn-v9" data-remove-bulk-draft="${index}" title="Quitar asignación" aria-label="Quitar asignación">${epqaIcon("trash")}</button></td>
      </tr>
    `;
  }).join("")}</tbody></table>${hiddenDrafts ? `<div class="epqa-mass-prepared-more-v9">+ ${hiddenDrafts} asignaciones más preparadas</div>` : ""}</div>`;
  list.querySelectorAll("[data-remove-bulk-draft]").forEach((button) => {
    button.addEventListener("click", () => {
      EPQA.ui.bulkLoadDraft.splice(Number(button.dataset.removeBulkDraft), 1);
      renderBulkLoadDrafts();
    });
  });
  updateBulkLoadFooterStatus();
  updateBulkLoadValidationBox();
  return;
  list.innerHTML = drafts.map((item, index) => {
    const group = groupOptions().find((option) => option.id === item.group);
    return `
      <article class="bulk-load-draft">
        <div>
          <strong>${escapeHtml(item.subject)}</strong>
          <span>${escapeHtml(group?.name || item.group)} · ${escapeHtml(item.rulePriority)}</span>
        </div>
        <button type="button" class="ghost danger" data-remove-bulk-draft="${index}">Quitar</button>
      </article>
    `;
  }).join("") || `<div class="teacher-empty">Agrega una o varias materias para revisar el total antes de asignar.</div>`;
  list.querySelectorAll("[data-remove-bulk-draft]").forEach((button) => {
    button.addEventListener("click", () => {
      EPQA.ui.bulkLoadDraft.splice(Number(button.dataset.removeBulkDraft), 1);
      renderBulkLoadDrafts();
    });
  });
}

function bulkLoadHasExisting(teacher, group, subject) {
  if (!teacher || !group || !subject) return false;
  return (EPQA.data.loads || []).some((load) =>
    sameTeacher(load.teacher, teacher) &&
    normalizeKey(load.group) === normalizeKey(group) &&
    normalizeKey(load.subject) === normalizeKey(subject)
  );
}

function bulkLoadHasDraft(teacher, group, subject) {
  if (!teacher || !group || !subject) return false;
  return (EPQA.ui.bulkLoadDraft || []).some((load) =>
    sameTeacher(load.teacher, teacher) &&
    normalizeKey(load.group) === normalizeKey(group) &&
    normalizeKey(load.subject) === normalizeKey(subject)
  );
}

function updateBulkLoadFooterStatus() {
  const selectedCount = document.querySelectorAll("#bulkLoadGroups input[type='checkbox']:checked").length;
  const drafts = EPQA.ui.bulkLoadDraft || [];
  const preparedHours = drafts.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  if (byId("bulkLoadFooterStatus")) byId("bulkLoadFooterStatus").textContent = `${selectedCount} grados seleccionados · ${drafts.length} asignaciones preparadas · ${preparedHours}h listas`;
  if (byId("bulkLoadAssign")) byId("bulkLoadAssign").disabled = !drafts.length;
}

function updateBulkLoadValidationBox() {
  const box = byId("bulkLoadValidationBox");
  if (!box) return;
  const drafts = EPQA.ui.bulkLoadDraft || [];
  const teacher = byId("bulkLoadTeacher")?.value || "";
  const subject = byId("bulkLoadSubject")?.value || "";
  const selectedCount = document.querySelectorAll("#bulkLoadGroups input[type='checkbox']:checked").length;
  const preparedHours = drafts.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  let message = "Todo listo para preparar asignaciones.";
  if (!teacher) message = "Selecciona un docente para calcular la carga.";
  else if (!subject) message = "Selecciona una materia antes de preparar asignaciones.";
  else if (!selectedCount && !drafts.length) message = "Selecciona uno o varios grados.";
  box.innerHTML = `${epqaIcon("alert")}<span>${escapeHtml(message)}</span>`;
}

function assignBulkLoadDrafts() {
  const drafts = EPQA.ui.bulkLoadDraft || [];
  if (!drafts.length) {
    notify("Sin asignaciones", "Primero agrega materias a la lista.", "warning", true);
    return;
  }
  EPQA.data.loads = EPQA.data.loads || [];
  const uniqueDrafts = drafts.filter((item, index, list) =>
    list.findIndex((other) =>
      sameTeacher(other.teacher, item.teacher) &&
      normalizeKey(other.group) === normalizeKey(item.group) &&
      normalizeKey(other.subject) === normalizeKey(item.subject)
    ) === index && !bulkLoadHasExisting(item.teacher, item.group, item.subject)
  );
  if (!uniqueDrafts.length) {
    notify("Sin asignaciones nuevas", "Todas las asignaciones preparadas ya existian.", "warning", true);
    EPQA.ui.bulkLoadDraft = [];
    renderBulkLoadDrafts();
    renderBulkLoadGroups();
    return;
  }
  uniqueDrafts.forEach((item) => {
    EPQA.data.loads.push(buildLoad(item));
  });
  const count = uniqueDrafts.length;
  const hours = uniqueDrafts.reduce((sum, item) => sum + Number(item.hours || 0), 0);
  closeBulkLoadModal();
  syncWorkspaceSnapshot();
  void persistWorkspaceDraft("Asignaciones masivas");
  renderDataViews();
  notify("Asignaciones creadas", `${count} carga(s), ${hours} hora(s) en total.`, "success");
}

function ensureGroupsArray() {
  if (Array.isArray(EPQA.data.groups)) return;
  EPQA.data.groups = groupOptions().map((item) => ({ id: item.id, name: item.name, level: "secondary", siteId: "" }));
}

function groupObjectById(id) {
  ensureGroupsArray();
  let group = (EPQA.data.groups || []).find((item) => (item.id || item.name) === id);
  if (!group && id) {
    group = { id, name: id, level: "secondary", siteId: "" };
    EPQA.data.groups.push(group);
  }
  return group || null;
}

function replaceSiteReferences(oldId, newId) {
  if (!oldId || oldId === newId) return;
  (EPQA.data.rooms || []).forEach((room) => {
    if (sameSite(room.siteId || room.site, oldId)) room.siteId = room.site = newId;
  });
  (EPQA.data.teachers || []).forEach((teacher) => {
    if (sameSite(teacher.siteId || teacher.site, oldId)) teacher.siteId = teacher.site = newId;
  });
  groupOptions().forEach((group) => {
    const object = groupObjectById(group.id);
    if (object && sameSite(object.siteId || object.site, oldId)) object.siteId = newId;
  });
  [...(EPQA.data.loads || []), ...(EPQA.slots || [])].forEach((item) => {
    if (sameSite(item.siteId || item.site, oldId)) item.siteId = item.site = newId;
  });
}

function replaceRoomReferences(oldId, oldName, room) {
  [...(EPQA.data.loads || []), ...(EPQA.slots || [])].forEach((item) => {
    if (normalizeKey(item.roomId) === normalizeKey(oldId) || normalizeKey(item.room) === normalizeKey(oldName)) {
      item.roomId = room.id;
      item.room = room.name;
      item.siteId = room.siteId || room.site || item.siteId;
      item.site = room.siteId || room.site || item.site;
    }
  });
}

function replaceTeacherReferences(oldId, oldName, newId) {
  [...(EPQA.data.loads || []), ...(EPQA.slots || [])].forEach((item) => {
    if (sameTeacher(item.teacher, oldId) || sameTeacher(item.teacher, oldName)) item.teacher = newId;
  });
}

function replaceGroupReferences(oldId, newId) {
  [...(EPQA.data.loads || []), ...(EPQA.slots || [])].forEach((item) => {
    if (String(item.group) === String(oldId)) item.group = newId;
  });
}

function replaceSubjectReferences(oldId, newName) {
  [...(EPQA.data.loads || []), ...(EPQA.slots || [])].forEach((item) => {
    if (normalizeKey(item.subject) === normalizeKey(oldId)) item.subject = newName;
  });
}

function usesSite(id) {
  return [...(EPQA.data.rooms || []), ...(EPQA.data.teachers || []), ...(EPQA.data.loads || []), ...(EPQA.slots || [])]
    .some((item) => sameSite(item.siteId || item.site, id));
}

function usesRoom(id, name) {
  return [...(EPQA.data.loads || []), ...(EPQA.slots || [])]
    .some((item) => normalizeKey(item.roomId) === normalizeKey(id) || normalizeKey(item.room) === normalizeKey(name));
}

function usesTeacher(id, name) {
  return [...(EPQA.data.loads || []), ...(EPQA.slots || [])]
    .some((item) => sameTeacher(item.teacher, id) || sameTeacher(item.teacher, name));
}

function usesGroup(id) {
  return [...(EPQA.data.loads || []), ...(EPQA.slots || [])].some((item) => String(item.group) === String(id));
}

function usesSubject(id) {
  return [...(EPQA.data.loads || []), ...(EPQA.slots || [])].some((item) => normalizeKey(item.subject) === normalizeKey(id));
}

function renderAvailabilityGrid() {
  const grid = byId("availabilityGrid");
  if (!grid) return;
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  grid.innerHTML = teacherOptions().map((teacher) => {
    const teacherData = (EPQA.data.teachers || []).find((item) => (item.id || item.name) === teacher.id) || {};
    const availability = teacherData.availability || {};
    const summaryDays = days.map((day) => {
      const record = normalizeAvailabilityRecord(availability[day], siteOptions());
      const counts = availabilityStateCounts(record);
      const siteName = siteOptions().find((site) => site.id === record.site)?.name || "Sin sede";
      return `
        <div class="availability-mini ${availabilityMiniClass(record)}">
          <strong>${escapeHtml(day)}</strong>
          <span>${escapeHtml(siteName)}</span>
          <small>A:${counts.available} F:${counts.flexible} N:${counts.unavailable}</small>
        </div>`;
    }).join("");
    const totals = teacherAvailabilityTotals(teacherData);
    return `<article class="availability-card summary-card" data-teacher="${escapeHtml(teacher.id)}">
      <div class="availability-card-head">
        <strong>${escapeHtml(teacher.name)}</strong>
        <button type="button" class="ghost edit-availability" data-teacher="${escapeHtml(teacher.id)}">Editar</button>
      </div>
      <div class="availability-score">
        <span>${totals.used}h usadas</span>
        <strong>${totals.total}h disponibles</strong>
      </div>
      <div class="availability-summary-days">${summaryDays}</div>
    </article>`;
  }).join("");
  document.querySelectorAll(".edit-availability").forEach((button) => {
    button.addEventListener("click", () => openAvailabilityModal(button.dataset.teacher));
  });
}

function availabilityPeriods() {
  return ["H1", "H2", "H3", "H4", "H5", "H6"];
}

function normalizeAvailabilityRecord(record, sites = siteOptions()) {
  const periods = availabilityPeriods();
  const normalized = { site: record?.site || "", slots: {} };
  if (record?.slots && typeof record.slots === "object") {
    periods.forEach((period) => {
      const value = record.slots[period] || record.slots[Number(period.slice(1))] || "available";
      normalized.slots[period] = normalizeAvailabilityState(value);
    });
    return normalized;
  }
  const hours = Math.max(0, Math.min(periods.length, Number(record?.hours || periods.length)));
  const defaultState = normalizeAvailabilityState(record?.state || "available");
  periods.forEach((period, index) => {
    normalized.slots[period] = index < hours ? defaultState : "unavailable";
  });
  return normalized;
}

function normalizeAvailabilityState(state) {
  const key = normalizeKey(state || "");
  if (key.includes("NO") || key.includes("UNAVAILABLE") || key.includes("OCUP")) return "unavailable";
  if (key.includes("FLEX")) return "flexible";
  return "available";
}

function availabilityStateCounts(record) {
  const counts = { available: 0, flexible: 0, unavailable: 0 };
  Object.values(record?.slots || {}).forEach((state) => {
    counts[normalizeAvailabilityState(state)]++;
  });
  return counts;
}

function availabilityMiniClass(record) {
  const counts = availabilityStateCounts(record);
  if (counts.unavailable >= 6) return "unavailable";
  if (counts.flexible > 0) return "flexible";
  return "available";
}

function openAvailabilityModal(teacherId) {
  const modal = byId("availabilityModal");
  if (!modal) return;
  const teacher = findTeacher(teacherId);
  if (!teacher) {
    notify("Docente no encontrado", "No pude abrir la disponibilidad porque el docente no esta en el catalogo.", "error", true);
    return;
  }
  modal.dataset.teacher = teacherKey(teacher);
  modal.hidden = false;
  modal.removeAttribute("hidden");
  document.body.classList.add("modal-open");
  fillSelect("availabilityModalBaseSite", siteOptions(), "id", "name");
  renderAvailabilityModal(modal.dataset.teacher);
}

function closeAvailabilityModal() {
  const modal = byId("availabilityModal");
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("hidden", "");
  if (byId("uxModal")?.hidden !== false) {
    document.body.classList.remove("modal-open");
  }
  delete modal.dataset.teacher;
}

function renderAvailabilityModal(teacherId = null) {
  const modal = byId("availabilityModal");
  const grid = byId("availabilityModalGrid");
  const teacherLabel = byId("availabilityModalTeacher");
  const stats = byId("availabilityModalStats");
  const baseSite = byId("availabilityModalBaseSite");
  if (!modal || !grid || !teacherLabel || !stats || !baseSite) return;
  const currentTeacherId = teacherId || modal.dataset.teacher || byAnyId("teacherSummarySelect", "teacherDetailSelect")?.value || teacherOptions()[0]?.id || "";
  const teacher = findTeacher(currentTeacherId);
  if (!teacher) {
    grid.innerHTML = `<div class="teacher-empty">No hay docente seleccionado.</div>`;
    return;
  }
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const currentTeacherKey = teacherKey(teacher);
  modal.dataset.teacher = currentTeacherKey;
  teacherLabel.textContent = teacher.name || teacher.id || "Docente";
  const totals = teacherAvailabilityTotals(teacher);
  stats.textContent = `${totals.available} disponibles, ${totals.flexible} flexibles, ${totals.unavailable} no disponibles`;
  const teacherAvailability = teacher.availability || {};
  const defaultSite = teacherFixedSite(currentTeacherKey);
  if (!baseSite.value) {
    baseSite.value = defaultSite || "";
  }
  const rows = days.map((day) => {
    const record = normalizeAvailabilityRecord(teacherAvailability[day]);
    const rowSiteValue = record.site || defaultSite || "";
    const siteOptionsHtml = [`<option value="">Sin sede</option>`].concat(siteOptions().map((site) =>
      `<option value="${escapeHtml(site.id)}" ${site.id === rowSiteValue ? "selected" : ""}>${escapeHtml(site.name)}</option>`
    )).join("");
    const cells = availabilityPeriods().map((period) => {
      const state = record.slots[period] || "available";
      const label = state === "flexible" ? "F" : state === "unavailable" ? "X" : "✓";
      return `<button type="button" class="availability-cell ${state}" data-teacher="${escapeHtml(currentTeacherKey)}" data-day="${escapeHtml(day)}" data-period="${period}" data-state="${state}">
        <span>${period}</span>
        <strong>${label}</strong>
      </button>`;
    }).join("");
    return `
      <section class="availability-day-row" data-day="${escapeHtml(day)}">
        <div class="availability-day-head">
          <strong>${escapeHtml(day)}</strong>
          <select id="availability-site-${escapeHtml(normalizeKey(day).toLowerCase())}" name="availability-site-${escapeHtml(normalizeKey(day).toLowerCase())}" class="availability-day-site" data-day="${escapeHtml(day)}">${siteOptionsHtml}</select>
        </div>
        <div class="availability-cell-grid">${cells}</div>
      </section>`;
  }).join("");
  grid.innerHTML = rows;
  baseSite.value = days.map((day) => teacherAvailability[day]?.site).find(Boolean) || defaultSite || "";
}

async function saveAvailabilityModal() {
  const modal = byId("availabilityModal");
  if (!modal?.dataset.teacher) return;
  const teacher = findTeacher(modal.dataset.teacher);
  if (!teacher) return;
  teacher.availability = teacher.availability || {};
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  days.forEach((day) => {
    const row = byId("availabilityModalGrid")?.querySelector(`.availability-day-row[data-day="${cssEscape(day)}"]`);
    if (!row) return;
    const site = row.querySelector(".availability-day-site")?.value || "";
    const slots = {};
    row.querySelectorAll(".availability-cell").forEach((cell) => {
      slots[cell.dataset.period] = normalizeAvailabilityState(cell.dataset.state);
    });
    const available = Object.values(slots).filter((state) => state !== "unavailable").length;
    teacher.availability[day] = { site, hours: available, slots };
  });
  syncWorkspaceSnapshot();
  const persisted = await persistWorkspaceDraft("Disponibilidad guardada", true);
  renderDataViews();
  closeAvailabilityModal();
  if (persisted) {
    notify("Disponibilidad guardada", "Las horas y sedes quedaron guardadas en la base de datos.", "success");
  } else {
    notify("Disponibilidad local", "Se actualizo en pantalla, pero no fue posible guardarla en la base de datos. Revisa sesion/conexion y vuelve a guardar.", "warning", true);
  }
}

async function resetAvailabilityModal() {
  const modal = byId("availabilityModal");
  if (!modal?.dataset.teacher) return;
  const teacher = findTeacher(modal.dataset.teacher);
  if (!teacher) return;
  teacher.availability = teacher.availability || {};
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  days.forEach((day) => {
    teacher.availability[day] = {
      site: teacherFixedSite(modal.dataset.teacher) || "",
      hours: availabilityPeriods().length,
      slots: Object.fromEntries(availabilityPeriods().map((period) => [period, "available"]))
    };
  });
  renderAvailabilityModal(modal.dataset.teacher);
  renderAvailabilityGrid();
  renderTeacherDetailPanel();
  syncWorkspaceSnapshot();
  const persisted = await persistWorkspaceDraft("Disponibilidad restablecida", true);
  notify(
    persisted ? "Disponibilidad restablecida" : "Disponibilidad local",
    persisted
      ? "Todas las horas quedaron como disponibles y guardadas en la base de datos."
      : "Se restablecio en pantalla, pero no fue posible guardar en la base de datos.",
    persisted ? "info" : "warning",
    !persisted
  );
}

function syncAvailabilityModalBaseSite() {
  const modal = byId("availabilityModal");
  const baseSite = byId("availabilityModalBaseSite");
  if (!modal?.dataset.teacher || !baseSite) return;
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  days.forEach((day) => {
    const row = byId("availabilityModalGrid")?.querySelector(`.availability-day-row[data-day="${cssEscape(day)}"]`);
    if (!row) return;
    const select = row.querySelector(".availability-day-site");
    if (select) select.value = baseSite.value || "";
  });
}

function onAvailabilityModalGridClick(event) {
  const cell = event.target.closest(".availability-cell");
  if (!cell) return;
  const states = ["available", "flexible", "unavailable"];
  const current = normalizeAvailabilityState(cell.dataset.state);
  const next = states[(states.indexOf(current) + 1) % states.length];
  cell.dataset.state = next;
  cell.classList.remove("available", "flexible", "unavailable");
  cell.classList.add(next);
  const label = cell.querySelector("strong");
  if (label) label.textContent = next === "flexible" ? "F" : next === "unavailable" ? "X" : "✓";
}

function onAvailabilityModalGridChange(event) {
  if (!event.target.classList.contains("availability-day-site")) return;
  const modal = byId("availabilityModal");
  if (!modal?.dataset.teacher) return;
  const teacher = findTeacher(modal.dataset.teacher);
  if (!teacher) return;
  teacher.availability = teacher.availability || {};
  const day = event.target.dataset.day;
  teacher.availability[day] = teacher.availability[day] || { hours: 6, slots: {} };
  teacher.availability[day].site = event.target.value || "";
}

function renderTeacherDetailPanelV4Legacy() {
  const panel = byId("teacherDetailPanel");
  const select = byId("teacherDetailSelect");
  if (!panel || !select) return;
  const teacherId = select.value || teacherOptions()[0]?.id || "";
  const teacher = findTeacher(teacherId);
  if (!teacher) {
    panel.innerHTML = `<div class="teacher-empty teacher-empty-v4">No hay docente disponible para mostrar.</div>`;
    return;
  }

  const teacherIdForData = teacherKey(teacher);
  const loads = (EPQA.data.loads || []).filter((load) => sameTeacher(load.teacher, teacherIdForData));
  const slots = (EPQA.slots || []).filter((slot) => sameTeacher(slot.teacher, teacherIdForData));
  const loadHours = loads.reduce((sum, load) => sum + Number(load.hours || 0), 0);
  const assignedHours = slots.reduce((sum, slot) => sum + slotDuration(slot), 0);
  const pendingHours = Math.max(0, loadHours - assignedHours);
  const availabilityStats = teacherAvailabilityTotals(teacher);
  const availableHours = availabilityStats.available;
  const usagePct = Math.min(100, availabilityStats.total ? Math.round((assignedHours / availabilityStats.total) * 100) : 0);
  const orderedLoads = unique(loads.map((load) => `${load.subject}|${load.group}`))
    .map((key) => {
      const [subject, group] = key.split("|");
      const itemLoads = loads.filter((load) => load.subject === subject && load.group === group);
      const itemSlots = slots.filter((slot) => slot.subject === subject && slot.group === group);
      const total = itemLoads.reduce((sum, load) => sum + Number(load.hours || 0), 0);
      const assigned = itemSlots.reduce((sum, slot) => sum + slotDuration(slot), 0);
      const color = generatedPastel(`${subject}|${group}`);
      return { subject, group, total, assigned, pending: Math.max(0, total - assigned), color };
    });
  const topColors = orderedLoads.slice(0, 3).map((item) => item.color);
  const background = topColors.length
    ? `linear-gradient(135deg, ${topColors[0]} 0%, ${topColors[1] || topColors[0]} 52%, ${topColors[2] || topColors[1] || topColors[0]} 100%)`
    : "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)";
  const barSegments = orderedLoads.length
    ? orderedLoads.map((item) => {
        const width = loadHours ? Math.max(8, Math.round((item.total / loadHours) * 100)) : 0;
        return `<span class="teacher-bar-segment teacher-bar-segment-v4" style="width:${width}%;background:${item.color}" title="${escapeHtml(item.subject)} ${escapeHtml(item.group)} · ${item.total}h"></span>`;
      }).join("")
    : `<span class="teacher-bar-empty"></span>`;

  panel.innerHTML = `
    <section class="teacher-summary-hero teacher-summary-hero-v4" style="background:${background}">
      <div class="teacher-summary-copy-v4">
        <p class="teacher-summary-eyebrow-v4">DOCENTE SELECCIONADO</p>
        <h3>${escapeHtml(teacher.name || teacher.id)}</h3>
        <p>${escapeHtml(teacher.type || "")} · mínimo ${Number(teacher.minWeeklyHours || 0)}h</p>
        <button type="button" class="ghost open-availability-btn teacher-summary-cta-v4" data-open-availability="${escapeHtml(teacherIdForData)}">Definir horas disponibles</button>
      </div>
      <div class="teacher-score teacher-score-v4">
        <strong>${assignedHours}h</strong>
        <span>asignadas</span>
      </div>
    </section>

    <div class="teacher-kpi-grid-v4">
      <article class="teacher-kpi-card-v4 teacher-kpi-card-v4--blue"><strong>${loadHours}h</strong><span>cargas definidas</span></article>
      <article class="teacher-kpi-card-v4 teacher-kpi-card-v4--green"><strong>${assignedHours}h</strong><span>en propuesta</span></article>
      <article class="teacher-kpi-card-v4 teacher-kpi-card-v4--amber"><strong>${pendingHours}h</strong><span>pendientes</span></article>
      <article class="teacher-kpi-card-v4 teacher-kpi-card-v4--slate"><strong>${availableHours}h</strong><span>disponibles</span></article>
    </div>

    <div class="teacher-progress teacher-progress-v4" aria-label="Resumen de horas asignadas">
      <div class="teacher-progress-bar teacher-progress-bar-v4">${barSegments}</div>
      <small>${usagePct}% de la matriz usada · ${availabilityStats.flexible} flexibles · ${availabilityStats.unavailable} no disponibles</small>
    </div>

    <div class="teacher-load-list teacher-load-list-v4">
      ${orderedLoads.length ? orderedLoads.map((item) => `
        <div class="teacher-load-chip teacher-load-chip-v4" style="--chip:${item.color}">
          <strong>${escapeHtml(item.subject)}</strong>
          <span>${escapeHtml(item.group)}</span>
          <em>${item.assigned}/${item.total}h</em>
        </div>
      `).join("") : `<div class="teacher-empty teacher-empty-v4">Este docente todavía no tiene cargas asignadas.</div>`}
    </div>
  `;
  panel.querySelectorAll("[data-open-availability]").forEach((button) => {
    button.addEventListener("click", () => openAvailabilityModal(button.dataset.openAvailability));
  });
}

function teacherSummarySubjectIcon(subject) {
  return getSubjectIconKey(subject);
}

function teacherSummaryColorClass(subject, index = 0) {
  return getSubjectVisualClass(subject);
}

function teacherSummarySegmentColor(index = 0) {
  return ["#BFE8FF", "#D8D2FF", "#E7F8EA", "#BFF3CE", "#E5CFFF", "#DFF7EB", "#E8E8E8", "#C8F6F1", "#FFC9CE", "#BFF0CE", "#FFD7A3", "#BFF4F7", "#D9C4FF"][index % 13];
}

function safeHourValue(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function renderTeacherDetailPanel() {
  ensureTeacherSummaryV5Chrome();
  const panel = byId("teacherDetailPanel");
  const select = byAnyId("teacherSummarySelect", "teacherDetailSelect");
  if (!panel || !select) return;
  const teacherId = select.value || teacherOptions()[0]?.id || "";
  if (!select.value && teacherId) select.value = teacherId;
  const teacher = findTeacher(teacherId);
  if (!teacher) {
    panel.innerHTML = `<div class="teacher-empty teacher-empty-v4">No hay docente disponible para mostrar.</div>`;
    return;
  }

  const teacherIdForData = teacherKey(teacher);
  const loads = (EPQA.data.loads || []).filter((load) => sameTeacher(load.teacher, teacherIdForData));
  const slots = (EPQA.slots || []).filter((slot) => sameTeacher(slot.teacher, teacherIdForData));
  const loadHours = loads.reduce((sum, load) => sum + safeHourValue(load.hours), 0);
  const assignedHours = slots.reduce((sum, slot) => sum + safeHourValue(slotDuration(slot)), 0);
  const pendingHours = Math.max(0, loadHours - assignedHours);
  const availabilityStats = teacherAvailabilityTotals(teacher);
  const availableHours = safeHourValue(availabilityStats.available);
  const usagePct = Math.min(100, availabilityStats.total ? Math.round((assignedHours / availabilityStats.total) * 100) : 0);
  const minHours = safeHourValue(teacher.minWeeklyHours || teacher.min_secondary_hours || teacher.minPrimaryHours || teacher.minimumHours);
  const teacherType = teacherTypeLabel(teacher.type || teacher.level || "") || "Sin asignar";
  const orderedLoads = unique(loads.map((load) => `${load.subject}|${load.group}`))
    .map((key, index) => {
      const [subject, group] = key.split("|");
      const itemLoads = loads.filter((load) => load.subject === subject && load.group === group);
      const itemSlots = slots.filter((slot) => slot.subject === subject && slot.group === group);
      const total = itemLoads.reduce((sum, load) => sum + safeHourValue(load.hours), 0);
      const assigned = itemSlots.reduce((sum, slot) => sum + safeHourValue(slotDuration(slot)), 0);
      const meta = subjectMeta(subject);
      return {
        subject: meta.abreviatura || subject || "Sin asignar",
        group: group || "Sin asignar",
        total,
        assigned,
        pending: Math.max(0, total - assigned),
        icon: teacherSummarySubjectIcon(subject),
        colorClass: teacherSummaryColorClass(subject, index)
      };
    });
  const barSegments = orderedLoads.length
    ? orderedLoads.map((item, index) => {
        const width = loadHours ? Math.max(6, Math.round((item.total / loadHours) * 100)) : 0;
        return `<span style="--w:${width}%; --c:${teacherSummarySegmentColor(index)};" title="${escapeHtml(item.subject)} ${escapeHtml(item.group)} · ${item.total}h"></span>`;
      }).join("")
    : `<span style="--w:100%; --c:#E8E8E8;"></span>`;

  panel.innerHTML = `
    <section class="epqa-teacher-hero-v5">
      <div class="epqa-teacher-hero-info-v5">
        <span class="epqa-teacher-label-v5">DOCENTE SELECCIONADO</span>
        <h2 id="teacherSummaryName">${escapeHtml(teacher.name || teacher.id || "Sin asignar")}</h2>
        <p id="teacherSummaryMeta">${escapeHtml(teacherType)} · mínimo ${minHours}h</p>
        <button type="button" class="epqa-teacher-availability-btn-v5" data-open-availability="${escapeHtml(teacherIdForData)}">
          ${epqaIcon("clock")}
          <span>Definir horas disponibles</span>
        </button>
      </div>
      <div class="epqa-teacher-hours-box-v5">
        <strong id="teacherAssignedHours">${assignedHours}h</strong>
        <span>asignadas</span>
      </div>
    </section>

    <section class="epqa-teacher-kpis-v5">
      <article class="epqa-teacher-kpi-v5 epqa-teacher-kpi-v5--blue">
        <span class="epqa-kpi-icon-v5">${epqaIcon("book")}</span>
        <div><strong id="teacherDefinedLoads">${loadHours}h</strong><span>cargas definidas</span></div>
      </article>
      <article class="epqa-teacher-kpi-v5 epqa-teacher-kpi-v5--purple">
        <span class="epqa-kpi-icon-v5">${epqaIcon("pin")}</span>
        <div><strong id="teacherProposalHours">${assignedHours}h</strong><span>en propuesta</span></div>
      </article>
      <article class="epqa-teacher-kpi-v5 epqa-teacher-kpi-v5--clock">
        <span class="epqa-kpi-icon-v5">${epqaIcon("clock")}</span>
        <div><strong id="teacherPendingHours">${pendingHours}h</strong><span>pendientes</span></div>
      </article>
      <article class="epqa-teacher-kpi-v5 epqa-teacher-kpi-v5--green">
        <span class="epqa-kpi-icon-v5">${epqaIcon("check")}</span>
        <div><strong id="teacherAvailableHours">${availableHours}h</strong><span>disponibles</span></div>
      </article>
    </section>

    <section class="epqa-teacher-matrix-v5">
      <div class="epqa-teacher-matrix-bar-v5">${barSegments}</div>
      <p id="teacherMatrixUsageText">${usagePct}% de la matriz usada · ${safeHourValue(availabilityStats.flexible)} flexibles · ${safeHourValue(availabilityStats.unavailable)} no disponibles</p>
    </section>

    <section class="epqa-teacher-load-grid-v5" id="teacherLoadGrid">
      ${orderedLoads.length ? orderedLoads.map((item) => `
        <article class="epqa-teacher-load-card-v5 ${item.colorClass}">
          <span class="epqa-load-icon-v5">${epqaIcon(item.icon)}</span>
          <div>
            <strong>${escapeHtml(item.subject)}</strong>
            <span>${escapeHtml(item.group)}</span>
            <small>${item.total} h/sem</small>
          </div>
        </article>
      `).join("") : `<div class="teacher-empty teacher-empty-v4">Este docente todavÃ­a no tiene cargas asignadas.</div>`}
    </section>
  `;
  panel.querySelectorAll("[data-open-availability]").forEach((button) => {
    button.addEventListener("click", () => openAvailabilityModal(button.dataset.openAvailability));
  });
}

function renderGroupDetailPanelV4Legacy() {
  const panel = byId("groupDetailPanel");
  const select = byId("groupDetailSelect");
  if (!panel || !select) return;
  const groupId = select.value || groupOptions()[0]?.id || "";
  const group = groupOptions().find((item) => String(item.id) === String(groupId)) || null;
  if (!group) {
    panel.innerHTML = `<div class="teacher-empty teacher-empty-v4">No hay grado disponible para mostrar.</div>`;
    return;
  }
  const level = normalizeLevel(group.level || inferGroupLevel(group.id));
  const requiredHours = level === "primary" ? 25 : 30;
  const loads = (EPQA.data.loads || []).filter((load) => String(load.group) === String(group.id));
  const slots = (EPQA.slots || []).filter((slot) => String(slot.group) === String(group.id));
  const loadHours = loads.reduce((sum, load) => sum + Number(load.hours || 0), 0);
  const assignedHours = slots.reduce((sum, slot) => sum + slotDuration(slot), 0);
  const pendingHours = Math.max(0, loadHours - assignedHours);
  const weeklyStatus = assignedHours === requiredHours ? "Cumple" : assignedHours < requiredHours ? "Faltan" : "Excede";
  const statusClass = assignedHours === requiredHours ? "ok" : "warn";
  const rows = unique(loads.map((load) => `${load.subject}|${load.teacher}`)).map((key) => {
    const [subject, teacher] = key.split("|");
    const itemLoads = loads.filter((load) => load.subject === subject && sameTeacherLoose(load.teacher, teacher));
    const itemSlots = slots.filter((slot) => slot.subject === subject && sameTeacherLoose(slot.teacher, teacher));
    const total = itemLoads.reduce((sum, load) => sum + Number(load.hours || 0), 0);
    const assigned = itemSlots.reduce((sum, slot) => sum + slotDuration(slot), 0);
    return { subject, teacher, total, assigned, pending: Math.max(0, total - assigned), color: generatedPastel(`${group.id}|${subject}|${teacher}`) };
  }).sort((a, b) => normalizeKey(a.subject).localeCompare(normalizeKey(b.subject)));
  const pct = Math.min(100, requiredHours ? Math.round((assignedHours / requiredHours) * 100) : 0);
  panel.innerHTML = `
    <section class="teacher-summary-hero group-summary-hero">
      <div>
        <p class="eyebrow">Grado seleccionado</p>
        <h3>${escapeHtml(group.name || group.id)}</h3>
        <p>${level === "primary" ? "Primaria" : "Secundaria"} · meta ${requiredHours}h semanales</p>
      </div>
      <div class="teacher-score ${statusClass}">
        <strong>${assignedHours}/${requiredHours}h</strong>
        <span>${weeklyStatus}</span>
      </div>
    </section>
    <div class="teacher-stats">
      <article><strong>${loadHours}h</strong><span>cargas definidas</span></article>
      <article><strong>${assignedHours}h</strong><span>en propuesta</span></article>
      <article><strong>${pendingHours}h</strong><span>pendientes</span></article>
      <article><strong>${Math.abs(requiredHours - assignedHours)}h</strong><span>${assignedHours >= requiredHours ? "sobre/meta" : "para cumplir"}</span></article>
    </div>
    <div class="teacher-progress" aria-label="Cumplimiento semanal del grado">
      <div class="teacher-progress-bar"><span class="teacher-bar-segment ${statusClass}" style="width:${pct}%"></span></div>
      <small>${pct}% de la meta semanal · ${weeklyStatus}</small>
    </div>
    <div class="teacher-load-list">
      ${rows.length ? rows.map((item) => `
        <div class="teacher-load-chip" style="--chip:${item.color}">
          <strong>${escapeHtml(item.subject)}</strong>
          <span>${escapeHtml(item.teacher)}</span>
          <em>${item.assigned}/${item.total}h</em>
        </div>
      `).join("") : `<div class="teacher-empty teacher-empty-v4">Este grado todavía no tiene cargas asignadas.</div>`}
    </div>
  `;
}

function gradeSummarySubjectVisual(subject) {
  return { icon: getSubjectIconKey(subject), colorClass: getSubjectVisualClass(subject) };
}

function gradeWeeklyTarget(group) {
  const ownTarget = safeHourValue(group?.weeklyTarget || group?.targetHours || group?.requiredHours || group?.weeklyHours || group?.hoursPerWeek);
  if (ownTarget) return ownTarget;
  const level = normalizeLevel(group?.level || inferGroupLevel(group?.id || group?.name));
  const dataTarget = level === "primary"
    ? safeHourValue(EPQA.data?.rules?.primaryWeeklyHours || EPQA.data?.primaryWeeklyHours)
    : safeHourValue(EPQA.data?.rules?.secondaryWeeklyHours || EPQA.data?.secondaryWeeklyHours);
  return dataTarget || (level === "primary" ? 25 : 30);
}

function gradeStatusMeta(assignedHours, requiredHours, pendingHours) {
  const overTarget = Math.max(0, assignedHours - requiredHours);
  if (overTarget > 0) return { key: "over", label: "Sobre meta", icon: "alert", className: "is-over" };
  if (pendingHours > 0 || assignedHours < requiredHours) return { key: "pending", label: "Pendiente", icon: "alert", className: "is-pending" };
  return { key: "ok", label: "Cumple", icon: "check", className: "is-ok" };
}

function renderGroupDetailPanel() {
  ensureGradeSummaryV6Chrome();
  const panel = byId("groupDetailPanel");
  const select = byAnyId("gradeSummarySelect", "groupDetailSelect");
  if (!panel || !select) return;
  const groupId = select.value || groupOptions()[0]?.id || "";
  if (!select.value && groupId) select.value = groupId;
  const groupOption = groupOptions().find((item) => String(item.id) === String(groupId)) || null;
  const group = groupObjectById(groupId) || groupOption;
  if (!group) {
    panel.innerHTML = `<div class="teacher-empty teacher-empty-v4">No hay grado disponible para mostrar.</div>`;
    return;
  }
  const groupKey = group.id || group.name || groupId;
  const level = normalizeLevel(group.level || groupOption?.level || inferGroupLevel(groupKey));
  const requiredHours = gradeWeeklyTarget({ ...group, level, id: groupKey });
  const loads = (EPQA.data.loads || []).filter((load) => String(load.group) === String(groupKey));
  const slots = (EPQA.slots || []).filter((slot) => String(slot.group) === String(groupKey));
  const loadHours = loads.reduce((sum, load) => sum + safeHourValue(load.hours), 0);
  const assignedHours = slots.reduce((sum, slot) => sum + safeHourValue(slotDuration(slot)), 0);
  const pendingHours = Math.max(0, loadHours - assignedHours);
  const overTarget = Math.max(0, assignedHours - requiredHours);
  const status = gradeStatusMeta(assignedHours, requiredHours, pendingHours);
  const rows = unique(loads.map((load) => `${load.subject}|${load.teacher || ""}`)).map((key) => {
    const [subject, teacher] = key.split("|");
    const itemLoads = loads.filter((load) => load.subject === subject && sameTeacherLoose(load.teacher || "", teacher || ""));
    const itemSlots = slots.filter((slot) => slot.subject === subject && sameTeacherLoose(slot.teacher || "", teacher || ""));
    const total = itemLoads.reduce((sum, load) => sum + safeHourValue(load.hours), 0);
    const assigned = itemSlots.reduce((sum, slot) => sum + safeHourValue(slotDuration(slot)), 0);
    const teachers = unique(itemLoads.map((load) => teacherName(load.teacher || "")).filter(Boolean));
    const visual = gradeSummarySubjectVisual(subject);
    const meta = subjectMeta(subject);
    return {
      subject: meta.name || subject || "Sin asignar",
      teacher: teachers.length > 1 ? "Varios docentes" : (teachers[0] || teacherName(teacher) || "Sin asignar"),
      total,
      assigned,
      pending: Math.max(0, total - assigned),
      ...visual
    };
  }).sort((a, b) => normalizeKey(a.subject).localeCompare(normalizeKey(b.subject)));
  const pct = Math.min(100, requiredHours ? Math.round((assignedHours / requiredHours) * 100) : 0);
  const levelLabel = level === "primary" ? "Primaria" : "Secundaria";
  panel.innerHTML = `
    <section class="epqa-grade-hero-v6 ${status.className}">
      <div class="epqa-grade-hero-info-v6">
        <span class="epqa-grade-label-v6">GRADO SELECCIONADO</span>
        <h2 id="gradeSummaryName">${escapeHtml(group.name || group.id || "Sin asignar")}</h2>
        <p id="gradeSummaryMeta">${escapeHtml(levelLabel)} · meta ${requiredHours}h semanales</p>
      </div>
      <div class="epqa-grade-status-box-v6 ${status.className}">
        <div>
          <strong id="gradeAssignedTargetHours">${assignedHours}/${requiredHours}h</strong>
          <span id="gradeComplianceStatus">${status.label}</span>
        </div>
        <span class="epqa-grade-status-icon-v6">${epqaIcon(status.icon)}</span>
      </div>
    </section>

    <section class="epqa-grade-kpis-v6">
      <article class="epqa-grade-kpi-v6 epqa-grade-kpi-v6--blue">
        <span class="epqa-grade-kpi-icon-v6">${epqaIcon("book")}</span>
        <div><strong id="gradeDefinedLoads">${loadHours}h</strong><span>cargas definidas</span></div>
      </article>
      <article class="epqa-grade-kpi-v6 epqa-grade-kpi-v6--purple">
        <span class="epqa-grade-kpi-icon-v6">${epqaIcon("pin")}</span>
        <div><strong id="gradeProposalHours">${assignedHours}h</strong><span>en propuesta</span></div>
      </article>
      <article class="epqa-grade-kpi-v6 epqa-grade-kpi-v6--yellow">
        <span class="epqa-grade-kpi-icon-v6">${epqaIcon("clock")}</span>
        <div><strong id="gradePendingHours">${pendingHours}h</strong><span>pendientes</span></div>
      </article>
      <article class="epqa-grade-kpi-v6 epqa-grade-kpi-v6--red">
        <span class="epqa-grade-kpi-icon-v6">${epqaIcon("alert")}</span>
        <div><strong id="gradeOverTargetHours">${overTarget}h</strong><span>sobre/meta</span></div>
      </article>
    </section>

    <section class="epqa-grade-progress-v6 ${status.className}">
      <div class="epqa-grade-progress-track-v6">
        <div class="epqa-grade-progress-bar-v6" style="width:${pct}%;"></div>
      </div>
      <p>${pct}% de la meta semanal · <strong>${status.label}</strong></p>
    </section>

    <section class="epqa-grade-subject-grid-v6" id="gradeSubjectGrid">
      ${rows.length ? rows.map((item) => `
        <article class="epqa-grade-subject-card-v6 ${item.colorClass}">
          <span class="epqa-grade-subject-icon-v6">${epqaIcon(item.icon)}</span>
          <div>
            <strong>${escapeHtml(item.subject)}</strong>
            <span>${escapeHtml(item.teacher)}</span>
            <small>${item.total} h/sem</small>
          </div>
        </article>
      `).join("") : `<div class="teacher-empty teacher-empty-v4">Este grado todavÃ­a no tiene cargas asignadas.</div>`}
    </section>
  `;
}

function teacherAvailabilityTotals(teacher) {
  const availability = teacher?.availability || {};
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  let available = 0;
  let flexible = 0;
  let unavailable = 0;
  days.forEach((day) => {
    const record = normalizeAvailabilityRecord(availability[day], siteOptions());
    Object.values(record.slots || {}).forEach((state) => {
      if (state === "flexible") flexible++;
      else if (state === "unavailable") unavailable++;
      else available++;
    });
  });
  const total = available + flexible + unavailable || Number(teacher?.availabilitySlotsPerWeek || 30);
  return { available: available + flexible, flexible, unavailable, total };
}

function renderBoard() {
  const mode = byId("viewMode").value;
  const filter = byId("viewFilter").value;
  const board = byId("scheduleBoard");
  board.classList.remove("panorama-board", "group-panorama-board");
  board.style.gridTemplateColumns = "";
  if (mode === "teacher" && filter === "__ALL_TEACHERS__") {
    renderTeacherPanoramaBoard(board);
    return;
  }
  if (mode === "group" && filter === "__ALL_GROUPS__") {
    renderGroupPanoramaBoard(board);
    return;
  }
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const periods = Array.from({ length: boardPeriodCount(mode, filter) }, (_, index) => index + 1);

  const rows = [`<div class="board-head board-corner">${labelForMode(mode)}: ${escapeHtml(filter || "Todos")}</div>`];

  days.forEach((day, dayIndex) => {
    rows.push(`<div class="board-head" style="grid-column:${dayIndex + 2};grid-row:1">${escapeHtml(dayHeaderLabel(mode, filter, day))}</div>`);
  });

  periods.forEach((period, periodIndex) => {
    rows.push(`<div class="period-head" style="grid-column:1;grid-row:${periodIndex + 2}">H${period}</div>`);
    days.forEach((day, dayIndex) => {
      rows.push(renderBoardCell(mode, filter, day, period, dayIndex + 2, periodIndex + 2));
    });
  });

  board.innerHTML = rows.join("");

  wireDragAndDrop();
  wireRemoveButtons();
  wireScheduleContextMenu();
  activateTooltips();
  renderTeacherDetailPanel();
}

function renderTeacherPanoramaBoard(board) {
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const periods = Array.from({ length: boardPeriodCount("teacher", "__ALL_TEACHERS__") }, (_, index) => index + 1);
  const rows = [`<div class="board-head board-corner">Profesores general</div>`];
  periods.forEach((period, index) => {
    rows.push(`<div class="board-head" style="grid-column:${index + 2};grid-row:1">H${period}</div>`);
  });
  days.forEach((day, dayIndex) => {
    rows.push(`<div class="period-head" style="grid-column:1;grid-row:${dayIndex + 2}">${escapeHtml(day)}</div>`);
    periods.forEach((period, periodIndex) => {
      const slots = EPQA.slots.filter((slot) => slot.day === day && occupiedPeriods(slot).includes(`${day}-${period}`));
      rows.push(`<div class="slot-cell panorama-cell" data-mode="teacher" data-filter="__ALL_TEACHERS__" data-day="${escapeHtml(day)}" data-period="${period}" style="grid-column:${periodIndex + 2};grid-row:${dayIndex + 2}">
        ${slots.map((slot) => renderPanoramaSlot(slot, "teacher")).join("")}
      </div>`);
    });
  });
  board.classList.add("panorama-board");
  board.style.gridTemplateColumns = `66px repeat(${periods.length}, minmax(24px, 1fr))`;
  board.innerHTML = rows.join("");
  wireDragAndDrop();
  wireRemoveButtons();
  wireScheduleContextMenu();
  activateTooltips();
  renderTeacherDetailPanel();
}

function renderGroupPanoramaBoard(board) {
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const groups = groupOptions();
  const rows = [`<div class="board-head board-corner">Grados general</div>`];
  days.forEach((day, index) => {
    rows.push(`<div class="board-head" style="grid-column:${index + 2};grid-row:1">${escapeHtml(day)}</div>`);
  });
  groups.forEach((group, groupIndex) => {
    rows.push(`<div class="period-head" style="grid-column:1;grid-row:${groupIndex + 2}">${escapeHtml(group.name || group.id)}</div>`);
    days.forEach((day, dayIndex) => {
      const periods = Array.from({ length: boardPeriodCount("group", group.id, group) }, (_, index) => index + 1);
      const cells = periods.map((period) => {
        const slots = EPQA.slots
          .filter((slot) => slot.day === day && slot.group === group.id && Number(slot.period) === period)
          .sort((a, b) => String(a.teacher).localeCompare(String(b.teacher)));
        return `<div class="slot-cell panorama-mini-slot" data-mode="group" data-filter="${escapeHtml(group.id)}" data-day="${escapeHtml(day)}" data-period="${period}" data-group="${escapeHtml(group.id)}">
          <span class="mini-period">H${period}</span>
          ${slots.map((slot) => renderPanoramaSlot(slot, "group")).join("")}
        </div>`;
      }).join("");
      rows.push(`<div class="panorama-cell group-day-cell" data-day="${escapeHtml(day)}" data-group="${escapeHtml(group.id)}" style="--panorama-periods:${periods.length};grid-column:${dayIndex + 2};grid-row:${groupIndex + 2}">${cells}</div>`);
    });
  });
  board.classList.add("panorama-board", "group-panorama-board");
  board.style.gridTemplateColumns = `66px repeat(${Math.max(1, days.length)}, minmax(68px, 1fr))`;
  board.innerHTML = rows.join("");
  wireDragAndDrop();
  wireRemoveButtons();
  wireScheduleContextMenu();
  activateTooltips();
  renderTeacherDetailPanel();
}

function renderPanoramaSlot(slot, mode = "teacher") {
  const color = colorForItem(slot, "teacher");
  const symbol = mode === "group" ? subjectAbbrev(slot.subject) : teacherAbbrev(slot.teacher);
  const tooltip = `${slot.teacher} · "Aula"} · H${slot.period}`;
  return `
    <div class="class-card panorama-card ${slot.locked ? "locked" : ""}" data-slot-id="${slot.id}" data-duration="${slotDuration(slot)}" data-short-label="${escapeHtml(symbol)}" title="${escapeHtml(tooltip)}" style="background:${color};border-left-color:${borderColor(color)}">
      <button class="remove-slot" type="button" data-slot-id="${slot.id}" aria-label="Quitar hora">x</button>
      <strong>${escapeHtml(symbol)}</strong>
    </div>
  `;
}

function renderBoardCell(mode, filter, day, period, column, row) {
  const starts = EPQA.slots.filter((slot) => slot[mode] === filter && slot.day === day && Number(slot.period) === period);
  const covered = EPQA.slots.filter((slot) =>
    slot[mode] === filter &&
    slot.day === day &&
    Number(slot.period) < period &&
    occupiedPeriods(slot).includes(`${day}-${period}`)
  );
  const visibleSlots = starts.length ? starts : covered;
  const primary = visibleSlots[0] || null;
  const rowSpan = starts.length === 1 ? slotDuration(starts[0]) : 1;
  const conflictText = visibleSlots.flatMap(conflictDetailsForSlot).join(" | ");
  const conflict = visibleSlots.some(slotHasConflict) && byId("auditMode").checked;
  const cycleLevel = cellCycleLevel(mode, filter, visibleSlots[0] || null, day, period);
  const classes = [
    "slot-cell",
    starts.length ? "block-start" : "",
    !starts.length && covered.length ? "covered-cell" : "",
    rowSpan > 1 ? "spanning" : "",
    conflict ? "conflict" : ""
  ].filter(Boolean).join(" ");
  const content = starts.length
    ? starts.map(renderCard).join("")
    : covered.length
      ? `<span class="block-continuation">Continúacher)}</span>`
      : "";
  const title = conflictText || (primary ? `${primary.subject} · ${primary.group}` : "");
  const style = `grid-column:${column};grid-row:${row}${rowSpan > 1 ? ` / span ${rowSpan}` : ""}`;
  return `<div class="${classes}" data-day="${escapeHtml(day)}" data-period="${period}" data-level="${escapeHtml(cycleLevel)}" data-mode="${escapeHtml(mode)}" data-filter="${escapeHtml(filter || "")}" data-conflicts="${escapeHtml(conflictText)}" title="${escapeHtml(title)}" style="${style}">${content}</div>`;
}

function renderAvailableTray() {
  const tray = byId("availableTray");
  if (!tray) return;
  const pending = pendingLoadUnits();
  const pendingHours = pending.reduce((sum, item) => sum + Number(item.pendingDuration || 1), 0);
  byId("pendingCount").textContent = `${pendingHours} horas`;
  tray.innerHTML = pending.map(renderPendingCard).join("");
  wireAvailableTray();
  activateTooltips();
}

function pendingLoadUnits() {
  normalizeSlotLoadLinks();
  const used = usedHoursByLoad();
  const mode = byId("viewMode")?.value || "";
  const filter = byId("viewFilter")?.value || "";
  return (EPQA.data.loads || [])
    .filter((load) => {
      if (mode === "group" && filter && filter !== "__ALL_GROUPS__") return String(load.group) === String(filter);
      if (mode === "teacher" && filter && filter !== "__ALL_TEACHERS__") return sameTeacherLoose(load.teacher, filter);
      return true;
    })
    .flatMap((load) => {
      const missing = Math.max(0, Number(load.hours || 0) - (used.get(load.id) || 0));
      const units = [];
      let remaining = missing;
      let index = 1;
      while (remaining > 0) {
        const duration = pendingBlockSize(load, remaining);
        units.push({ ...load, pendingIndex: index, pendingDuration: duration });
        remaining -= duration;
        index++;
      }
      return units;
    });
}

function usedHoursByLoad() {
  const used = new Map();
  (EPQA.slots || []).forEach((slot) => {
    const load = loadForSlot(slot);
    if (!load?.id) return;
    used.set(load.id, (used.get(load.id) || 0) + slotDuration(slot));
  });
  return used;
}

function loadForSlot(slot) {
  const byId = findLoad(slot.loadId);
  if (byId) return byId;
  const key = slot.loadKey ? normalizeKey(slot.loadKey) : "";
  if (key) {
    const byKey = (EPQA.data.loads || []).find((load) => normalizeKey(load.loadKey || loadSignature(load)) === key);
    if (byKey) return byKey;
  }
  return (EPQA.data.loads || []).find((load) =>
    sameTeacherLoose(slot.teacher, load.teacher) &&
    normalizeKey(slot.subject) === normalizeKey(load.subject) &&
    String(slot.group) === String(load.group)
  ) || null;
}

function normalizeSlotLoadLinks() {
  (EPQA.slots || []).forEach((slot) => {
    const load = loadForSlot(slot);
    if (!load) return;
    slot.loadId = load.id;
    slot.loadKey = load.loadKey || loadSignature(load);
    slot.teacher = load.teacher;
    slot.subject = load.subject;
    slot.group = load.group;
  });
}

function renderPendingCard(load) {
  const color = colorForItem(load, "pending");
  const duration = Number(load.pendingDuration || 1);
  const canSplit = duration > 1;
  return `
    <div class="class-card pending-card ${duration > 1 ? "block-card" : ""}" data-load-id="${escapeHtml(load.id)}" data-duration="${duration}" style="background:${color};border-left-color:${borderColor(color)}">
      ${canSplit ? `<button class="split-pending" type="button" data-split-pending="${escapeHtml(load.id)}" aria-label="Separar bloque">1h</button>` : ""}
      <div class="card-topline">
        <span class="duration-badge">${duration}h</span>
        <span class="subject-badge">${escapeHtml(load.group)}</span>
      </div>
      <strong>${escapeHtml(load.subject)}</strong>
      <span>${escapeHtml(load.teacher)} · ${escapeHtml(load.group)}</span>
      <small>Pendiente ${load.pendingIndex} · "Aula disponible")}</small>
    </div>
  `;
}

function wireAvailableTray() {
  const tray = byId("availableTray");
  if (!tray || !window.Sortable) return;
  if (tray.dataset.sortableReady) return;
  tray.dataset.sortableReady = "1";
  tray.addEventListener("click", onAvailableTrayClick);
  tray.addEventListener("pointerover", onPendingPreviewPointer);
  tray.addEventListener("pointerout", onPendingPreviewPointerOut);
  Sortable.create(tray, {
    group: { name: "schedule", pull: "clone", put: false },
    sort: false,
    animation: 90,
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 4,
    touchStartThreshold: 4,
    ghostClass: "drag-ghost",
    chosenClass: "drag-chosen",
    dragClass: "drag-active",
    draggable: ".pending-card"
  });
}

function onAvailableTrayClick(event) {
  const button = event.target.closest("[data-split-pending]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  EPQA.ui.splitPendingLoads = EPQA.ui.splitPendingLoads || {};
  EPQA.ui.splitPendingLoads[button.dataset.splitPending] = true;
  renderAvailableTray();
  notify("Bloque separado", "La carga pendiente ahora aparece en horas sueltas para ubicar manualmente.", "info");
}

function pendingBlockSize(load, remaining) {
  if (EPQA.ui.splitPendingLoads?.[load.id]) return 1;
  return Math.min(blockHours(load), remaining);
}

function renderCard(slot) {
  const color = colorForItem(slot, byId("viewMode")?.value || "group");
  const duration = slotDuration(slot);
  return `
    <div class="class-card ${slot.locked ? "locked" : ""} ${duration > 1 ? "block-card" : ""}" data-slot-id="${slot.id}" data-duration="${duration}" style="background:${color};border-left-color:${borderColor(color)}">
      <button class="remove-slot" type="button" data-slot-id="${slot.id}" aria-label="Quitar hora">x</button>
      <div class="card-topline">
        <span class="duration-badge">${duration}h</span>
        <span class="subject-badge">${escapeHtml(slot.room || slot.site || "")}</span>
      </div>
      <strong>${escapeHtml(slot.subject)}</strong>
      <span>${escapeHtml(slot.teacher)} · ${escapeHtml(slot.group)}</span>
      <small>${escapeHtml(slot.room)} · "manual")}</small>
    </div>
  `;
}

function wireRemoveButtons() {
  document.querySelectorAll(".remove-slot").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      EPQA.slots = EPQA.slots.filter((slot) => slot.id !== button.dataset.slotId);
      renderAvailableTray();
      renderBoard();
      auditNow();
      renderTeacherDetailPanel();
    });
  });
}

function wireScheduleContextMenu() {
  document.querySelectorAll(".class-card[data-slot-id]").forEach((card) => {
    card.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openScheduleContextMenu(event, card.dataset.slotId);
    });
  });
}

function openScheduleContextMenu(event, slotId) {
  closeScheduleContextMenu();
  const slot = findSlot(slotId);
  if (!slot) return;
  const menu = document.createElement("div");
  menu.id = "scheduleContextMenu";
  menu.className = "schedule-context-menu";
  const canJoinUp = Boolean(joinCandidate(slot, -1));
  const canJoinDown = Boolean(joinCandidate(slot, 1));
  const canSplit = slotDuration(slot) > 1;
  menu.innerHTML = `
    <button type="button" data-action="join-up" ${canJoinUp ? "" : "disabled"}>Unir con la de arriba</button>
    <button type="button" data-action="join-down" ${canJoinDown ? "" : "disabled"}>Unir con la de abajo</button>
    <button type="button" data-action="split" ${canSplit ? "" : "disabled"}>Separar bloque</button>
  `;
  document.body.appendChild(menu);
  const x = Math.min(event.clientX, window.innerWidth - menu.offsetWidth - 10);
  const y = Math.min(event.clientY, window.innerHeight - menu.offsetHeight - 10);
  menu.style.left = `${Math.max(10, x)}px`;
  menu.style.top = `${Math.max(10, y)}px`;
  menu.addEventListener("click", (clickEvent) => {
    clickEvent.stopPropagation();
    const action = clickEvent.target?.dataset?.action;
    if (!action) return;
    if (action === "join-up") joinAdjacentSlot(slotId, -1);
    if (action === "join-down") joinAdjacentSlot(slotId, 1);
    if (action === "split") splitSlotBlock(slotId);
    closeScheduleContextMenu();
  });
}

function closeScheduleContextMenu() {
  byId("scheduleContextMenu")?.remove();
}

function joinCandidate(slot, direction) {
  return (EPQA.slots || []).find((candidate) =>
    candidate.id !== slot.id &&
    candidate.day === slot.day &&
    (direction < 0
      ? Number(candidate.period) + slotDuration(candidate) === Number(slot.period)
      : Number(candidate.period) === Number(slot.period) + slotDuration(slot)) &&
    sameTeacher(candidate.teacher, slot.teacher) &&
    candidate.group === slot.group &&
    normalizeKey(candidate.subject) === normalizeKey(slot.subject)
  );
}

function joinAdjacentSlot(slotId, direction) {
  const slot = findSlot(slotId);
  const other = slot ? joinCandidate(slot, direction) : null;
  if (!slot || !other) {
    notify("No se puede unir", "Solo se pueden unir clases contiguas de la misma materia, docente y grado.", "warning", true);
    return;
  }
  const start = Math.min(Number(slot.period), Number(other.period));
  const end = Math.max(Number(slot.period) + slotDuration(slot), Number(other.period) + slotDuration(other));
  slot.period = start;
  slot.duration = end - start;
  slot.source = "manual-block";
  EPQA.slots = EPQA.slots.filter((item) => item.id !== other.id);
  renderAvailableTray();
  renderBoard();
  auditNow();
  renderTeacherDetailPanel();
}

function splitSlotBlock(slotId) {
  const slot = findSlot(slotId);
  if (!slot || slotDuration(slot) <= 1) {
    notify("No se puede separar", "Esta clase no es un bloque unido.", "warning", true);
    return;
  }
  const duration = slotDuration(slot);
  slot.duration = 1;
  slot.source = "manual-split";
  for (let offset = 1; offset < duration; offset++) {
    EPQA.slots.push({
      ...slot,
      id: crypto.randomUUID ? crypto.randomUUID() : `slot-${Date.now()}-${Math.random()}`,
      period: Number(slot.period) + offset,
      duration: 1,
      source: "manual-split"
    });
  }
  renderAvailableTray();
  renderBoard();
  auditNow();
  renderTeacherDetailPanel();
}

function handlePendingDrop(event) {
  const item = event.item;
  const targetCell = event.to?.classList?.contains("slot-cell") ? event.to : event.to?.closest?.(".slot-cell");
  if (!item?.dataset?.loadId || !targetCell?.classList.contains("slot-cell")) return;
  item.remove();
  document.body.classList.remove("schedule-dragging");
  clearPendingAvailabilityPreview();
  const load = findLoad(item.dataset.loadId);
  const targetDay = targetCell.dataset.day;
  const targetPeriod = Number(targetCell.dataset.period);
  if (!load || !targetDay || !targetPeriod) {
    renderAvailableTray();
    renderBoard();
    return;
  }
  const duration = Number(item.dataset.duration || blockHours(load));
  const pendingItem = { ...load, pendingDuration: duration, duration };
  const context = validatePlacementContext(pendingItem, targetCell, true);
  if (!context.ok) {
    renderAvailableTray();
    renderBoard();
    return;
  }
  const slot = slotFromLoad(load, targetDay, targetPeriod, duration);
  slot.room = context.room || slot.room;
  slot.roomId = context.roomId || slot.roomId;
  slot.site = context.site || slot.site;
  slot.siteId = context.site || slot.siteId;
  const affected = affectedSlotsForIncoming(slot, targetDay, targetPeriod);
  if (affected.length) {
    confirmReplacementFromPending(slot, affected, targetDay, targetPeriod);
    renderAvailableTray();
    renderBoard();
    return;
  }
  const verdict = prevalidateMove(slot, slot.day, slot.period);
  if (verdict.ok || !byId("breakMode").checked) {
    slot.source = "manual";
    EPQA.slots.push(slot);
    playUiSound("drop");
  } else {
    notify("Movimiento bloqueado", restrictionMessage(verdict.reason), "error", true);
  }
  renderAvailableTray();
  renderBoard();
  auditNow();
  renderTeacherDetailPanel();
}

function affectedSlotsForIncoming(incoming, day, period) {
  return EPQA.slots.filter((slot) =>
    slot.id !== incoming.id &&
    slotsOverlap(slot, { ...incoming, day, period }) &&
    (
      sameTeacher(slot.teacher, incoming.teacher) ||
      slot.group === incoming.group ||
      (isProtectedRoom(incoming.room) && slot.room === incoming.room && sameSite(itemSite(slot), itemSite(incoming)))
    )
  );
}

function confirmReplacementFromPending(slot, affected, targetDay, targetPeriod) {
  const details = affected.map((item) =>
    `${item.subject} de ${item.group} con ${item.teacher} (${item.day} H${item.period}, ${item.room || "Aula"})`
  ).join("\n");
  confirmAction(
    "Confirmar reemplazo",
    `La celda destino tiene conflicto con:\n${details}\n\nSi aceptas, esa(s) clase(s) volveran a pendientes y se ubicara ${slot.subject} de ${slot.group} con ${slot.teacher} en ${targetDay} H${targetPeriod}.`,
    () => {
      const displaced = displaceAffectedSlots(slot, targetDay, targetPeriod);
      const verdict = prevalidateMove(slot, slot.day, slot.period);
      if (!verdict.ok && byId("breakMode").checked) {
        EPQA.slots.push(...displaced);
        notify("Movimiento bloqueado", restrictionMessage(verdict.reason), "error", true);
        renderBoard();
        renderAvailableTray();
        return;
      }
      slot.source = "manual";
      EPQA.slots.push(slot);
      playUiSound("drop");
      notify("Reemplazo aplicado", `${displaced.length} clase(s) volvieron a pendientes.`, "warning");
      renderAvailableTray();
      renderBoard();
      auditNow();
      renderTeacherDetailPanel();
    },
    "Aceptar reemplazo"
  );
}

function wireDragAndDrop() {
  document.querySelectorAll(".slot-cell:not(.covered-cell)").forEach((cell) => {
    Sortable.create(cell, {
      group: { name: "schedule", put: true },
      animation: 90,
      forceFallback: true,
      fallbackOnBody: true,
      fallbackTolerance: 4,
      touchStartThreshold: 4,
      ghostClass: "drag-ghost",
      chosenClass: "drag-chosen",
      dragClass: "drag-active",
      swapThreshold: 0.65,
      emptyInsertThreshold: 18,
      draggable: ".class-card",
      onAdd(event) {
        handlePendingDrop(event);
      },
      onStart(event) {
        closeScheduleContextMenu();
        document.body.classList.add("schedule-dragging");
        EPQA.ui.dragMoveKey = "";
        EPQA.ui.dragMoveResult = null;
        showPendingAvailabilityPreview(event.item.dataset.loadId, Number(event.item.dataset.duration || 1));
        playUiSound("lift");
        cleanupDragState(event.item);
      },
      onMove(event) {
        if (!byId("breakMode").checked) return true;
        const target = event.to?.classList?.contains("slot-cell") ? event.to : event.to?.closest?.(".slot-cell");
        if (!target?.dataset?.day) return true;
        if (EPQA.ui.lastDropTarget && EPQA.ui.lastDropTarget !== target) {
          EPQA.ui.lastDropTarget.classList.remove("drop-ok", "drop-denied");
        }
        EPQA.ui.lastDropTarget = target;
        const moveKey = [
          event.dragged.dataset.loadId || event.dragged.dataset.slotId || "",
          event.dragged.dataset.duration || "",
          target.dataset.day || "",
          target.dataset.period || "",
          target.dataset.group || ""
        ].join("|");
        if (EPQA.ui.dragMoveKey === moveKey && EPQA.ui.dragMoveResult) {
          target.classList.toggle("drop-ok", EPQA.ui.dragMoveResult.ok);
          target.classList.toggle("drop-denied", !EPQA.ui.dragMoveResult.ok);
          if (EPQA.ui.dragMoveResult.message) event.dragged.dataset.pendingDropMessage = EPQA.ui.dragMoveResult.message;
          else delete event.dragged.dataset.pendingDropMessage;
          return true;
        }
        const load = event.dragged.dataset.loadId ? findLoad(event.dragged.dataset.loadId) : null;
        const slot = load
          ? slotFromLoad(load, target.dataset.day, Number(target.dataset.period), Number(event.dragged.dataset.duration || blockHours(load)))
          : findSlot(event.dragged.dataset.slotId);
        const context = validatePlacementContext(slot || load, target, false);
        if (!context.ok) {
          target.classList.toggle("drop-ok", false);
          target.classList.toggle("drop-denied", true);
          event.dragged.dataset.pendingDropMessage = context.message || "";
          EPQA.ui.dragMoveKey = moveKey;
          EPQA.ui.dragMoveResult = { ok: false, message: context.message || "" };
          return true;
        }
        delete event.dragged.dataset.pendingDropMessage;
        const targetOccupied = EPQA.slots.some((item) =>
          item.id !== slot?.id &&
          occupiedPeriods(item).includes(`${target.dataset.day}-${Number(target.dataset.period)}`)
        );
        if (targetOccupied) {
          target.classList.toggle("drop-ok", true);
          target.classList.toggle("drop-denied", false);
          EPQA.ui.dragMoveKey = moveKey;
          EPQA.ui.dragMoveResult = { ok: true, message: "" };
          return true;
        }
        const verdict = prevalidateMove(slot, target.dataset.day, Number(target.dataset.period));
        target.classList.toggle("drop-ok", verdict.ok);
        target.classList.toggle("drop-denied", !verdict.ok);
        if (!verdict.ok) event.dragged.dataset.pendingDropMessage = restrictionMessage(verdict.reason);
        EPQA.ui.dragMoveKey = moveKey;
        EPQA.ui.dragMoveResult = { ok: verdict.ok, message: verdict.ok ? "" : restrictionMessage(verdict.reason) };
        return true;
      },
      onEnd(event) {
        document.querySelectorAll(".drop-ok,.drop-denied").forEach((el) => el.classList.remove("drop-ok", "drop-denied"));
        document.body.classList.remove("schedule-dragging");
        clearPendingAvailabilityPreview();
        EPQA.ui.lastDropTarget = null;
        EPQA.ui.dragMoveKey = "";
        EPQA.ui.dragMoveResult = null;
        const targetCell = event.to?.classList?.contains("slot-cell") ? event.to : event.to?.closest?.(".slot-cell");
        const targetDay = targetCell?.dataset?.day;
        const targetPeriod = Number(targetCell?.dataset?.period);
        if (event.item.dataset.loadId) return;
        const slot = findSlot(event.item.dataset.slotId);
        if (!slot || !targetDay) {
          renderBoard();
          cleanupDragState(event.item);
          return;
        }
        const source = {
          day: slot.day,
          period: Number(slot.period),
          room: slot.room,
          roomId: slot.roomId,
          site: slot.site,
          siteId: slot.siteId
        };
        const context = validatePlacementContext(slot, targetCell, true);
        if (!context.ok) {
          renderBoard();
          cleanupDragState(event.item);
          return;
        }
        const swapResult = tryDirectSwap(slot, source, targetCell);
        if (swapResult.done) {
                    if (swapResult.ok) {
            confirmAction(
              "Confirmar intercambio",
              `${swapResult.message || "La celda destino ya tiene una clase."}\n\n¿Deseas continuar?\nSe intercambiaran las dos clases.`,
              () => {
                applyDirectSwap(slot.id, swapResult.otherId, swapResult.movingTarget, swapResult.otherTarget);
                renderAvailableTray();
                renderBoard();
                auditNow();
                renderTeacherDetailPanel();
              },
              "Continuar"
            );
            renderBoard();
          } else if (swapResult.replaceable) {
            confirmAction(
              "Reemplazar clase",
              `${swapResult.message}\n\n¿Deseas continuar?\nLa clase que estaba en esa celda volvera a pendientes.`,
              () => {
                applyReplacementMove(slot.id, source, targetDay, targetPeriod, context);
              },
              "Continuar"
            );
          } else {
            notify("Intercambio bloqueado", swapResult.message, "error", true);
            renderBoard();
          }
          cleanupDragState(event.item);
          return;
        }
        const previous = { ...source };
        slot.room = context.room || slot.room;
        slot.roomId = context.roomId || slot.roomId;
        slot.site = context.site || slot.site;
        slot.siteId = context.site || slot.siteId;
        const displaced = displaceAffectedSlots(slot, targetDay, targetPeriod);
        const verdict = prevalidateMove(slot, targetDay, targetPeriod);
        if (!verdict.ok && byId("breakMode").checked) {
          Object.assign(slot, previous);
          EPQA.slots.push(...displaced);
          notify("Movimiento bloqueado", restrictionMessage(verdict.reason), "error", true);
          renderBoard();
          cleanupDragState(event.item);
          return;
        }
        slot.day = targetDay;
        slot.period = targetPeriod;
        slot.source = "manual";
        playUiSound("drop");
        if (displaced.length) {
          notify("Horas desplazadas", `${displaced.length} hora(s) afectada(s) volvieron a pendientes.`, "warning");
        }
        renderBoard();
        renderAvailableTray();
        auditNow();
        renderMetrics();
        renderTeacherDetailPanel();
        cleanupDragState(event.item);
      }
    });
  });
}

function onPendingPreviewPointer(event) {
  const card = event.target.closest(".pending-card");
  if (!card || card.dataset.previewActive === "1") return;
  card.dataset.previewActive = "1";
  showPendingAvailabilityPreview(card.dataset.loadId, Number(card.dataset.duration || 1));
}

function onPendingPreviewPointerOut(event) {
  const card = event.target.closest(".pending-card");
  if (!card || card.contains(event.relatedTarget)) return;
  delete card.dataset.previewActive;
  if (!document.body.classList.contains("schedule-dragging")) clearPendingAvailabilityPreview();
}

function showPendingAvailabilityPreview(loadId, duration = 1) {
  clearPendingAvailabilityPreview();
  const load = findLoad(loadId);
  if (!load) return;
  document.querySelectorAll(".slot-cell:not(.covered-cell)").forEach((cell) => {
    const day = cell.dataset.day;
    const period = Number(cell.dataset.period || 0);
    if (!day || !period) return;
    const periods = Array.from({ length: Math.max(1, duration) }, (_, index) => `${day}-${period + index}`);
    const sameGroupSlots = (EPQA.slots || []).filter((slot) => slot.group === load.group && slot.day === day);
    const occupiedByGroup = sameGroupSlots.some((slot) => periods.some((key) => occupiedPeriods(slot).includes(key)));
    const isCurrentGroupCell = byId("viewMode")?.value !== "group" || byId("viewFilter")?.value === load.group || byId("viewFilter")?.value === "__ALL_GROUPS__";
    cell.classList.add("pending-preview-cell");
    cell.classList.toggle("pending-preview-free", isCurrentGroupCell && !occupiedByGroup);
    cell.classList.toggle("pending-preview-busy", occupiedByGroup);
  });
}

function clearPendingAvailabilityPreview() {
  document.querySelectorAll(".pending-preview-cell,.pending-preview-free,.pending-preview-busy").forEach((cell) => {
    cell.classList.remove("pending-preview-cell", "pending-preview-free", "pending-preview-busy");
  });
}

function prevalidateMove(slot, day, period) {
  if (!slot) return { ok: false, reason: "Sin slot" };
  if (Number(period) + slotDuration(slot) - 1 > maxPeriod(slot.level)) {
    return { ok: false, reason: "Bloque fuera de jornada" };
  }
  const exists = EPQA.slots.some((item) => item.id === slot.id);
  const probe = exists
    ? EPQA.slots.map((item) => item.id === slot.id ? { ...item, day, period } : item)
    : [...EPQA.slots, { ...slot, day, period }];
  const conflicts = localP0Conflicts(probe, slot.id);
  return { ok: conflicts.length === 0, reason: conflicts[0] || "" };
}

function tryDirectSwap(moving, source, targetCell) {
  const targetDay = targetCell.dataset.day;
  const targetPeriod = Number(targetCell.dataset.period);
  if (source.day === targetDay && Number(source.period) === targetPeriod) {
    return { done: false };
  }

  const candidates = EPQA.slots.filter((slot) =>
    slot.id !== moving.id &&
    occupiedPeriods(slot).includes(`${targetDay}-${targetPeriod}`)
  );

  if (candidates.length !== 1) {
    return { done: false };
  }

  const other = candidates[0];
  const movingTargetContext = contextForSlotInCell(moving, targetCell);
  const otherSourceContext = contextForSlotAt(other, source);
  if (!movingTargetContext.ok || !otherSourceContext.ok) {
    return {
      done: true,
      ok: false,
      message: detailedSwapMessage([
        movingTargetContext.message,
        otherSourceContext.message
      ].filter(Boolean))
    };
  }

  const snapshot = {
    moving: { ...moving },
    other: { ...other }
  };

  Object.assign(moving, {
    day: targetDay,
    period: targetPeriod,
    room: movingTargetContext.room || moving.room,
    roomId: movingTargetContext.roomId || moving.roomId,
    site: movingTargetContext.site || moving.site,
    siteId: movingTargetContext.site || moving.siteId,
    source: "manual"
  });
  Object.assign(other, {
    day: source.day,
    period: source.period,
    room: otherSourceContext.room || other.room,
    roomId: otherSourceContext.roomId || other.roomId,
    site: otherSourceContext.site || other.site,
    siteId: otherSourceContext.site || other.siteId,
    source: "manual"
  });

  const movingDetails = conflictDetailsForSlot(moving);
  const otherDetails = conflictDetailsForSlot(other);
  const movingOk = movingDetails.length === 0;
  const otherOk = otherDetails.length === 0;
  if (movingOk && otherOk) {
    Object.assign(moving, snapshot.moving);
    Object.assign(other, snapshot.other);
    return {
      done: true,
      ok: true,
      otherId: other.id,
      movingTarget: { day: targetDay, period: targetPeriod, room: movingTargetContext.room || moving.room, roomId: movingTargetContext.roomId || moving.roomId, site: movingTargetContext.site || moving.site, siteId: movingTargetContext.site || moving.siteId },
      otherTarget: { day: source.day, period: source.period, room: otherSourceContext.room || other.room, roomId: otherSourceContext.roomId || other.roomId, site: otherSourceContext.site || other.site, siteId: otherSourceContext.site || other.siteId }
    };
  }

  Object.assign(moving, snapshot.moving);
  Object.assign(other, snapshot.other);
  const details = [...movingDetails, ...otherDetails];
  return {
    done: true,
    ok: false,
    replaceable: isReplaceableCollision(details),
    message: detailedSwapMessage(details)
  };
}

function applyDirectSwap(movingId, otherId, movingTarget, otherTarget) {
  const moving = findSlot(movingId);
  const other = findSlot(otherId);
  if (!moving || !other) return;
  Object.assign(moving, { ...movingTarget, source: "manual" });
  Object.assign(other, { ...otherTarget, source: "manual" });
}

function isReplaceableCollision(details) {
  const text = normalizeKey((details || []).join(" "));
  return (text.includes("DOCENTE") || text.includes("GRUPO") || text.includes("ESPACIO")) &&
    !text.includes("SEDE") &&
    !text.includes("SALA TI") &&
    !text.includes("CANCHA") &&
    !text.includes("DISPONIBLE");
}

function applyReplacementMove(slotId, source, targetDay, targetPeriod, context) {
  const slot = findSlot(slotId);
  if (!slot) {
    renderBoard();
    return;
  }
  const previous = { ...source };
  slot.room = context.room || slot.room;
  slot.roomId = context.roomId || slot.roomId;
  slot.site = context.site || slot.site;
  slot.siteId = context.site || slot.siteId;
  const displaced = displaceAffectedSlots(slot, targetDay, targetPeriod);
  slot.day = targetDay;
  slot.period = targetPeriod;
  slot.source = "manual";
  EPQA.slots = EPQA.slots.filter((item) => item.id !== slot.id);
  EPQA.slots.push(slot);
  renderAvailableTray();
  renderBoard();
  auditNow();
  renderMetrics();
  renderTeacherDetailPanel();
  notify(
    "Cambio aplicado",
    `${displaced.length || 1} clase(s) volvieron a pendientes.\nOrigen anterior: ${previous.day} H${previous.period}\nNuevo destino: ${targetDay} H${targetPeriod}`,
    "success"
  );
}

function displaceAffectedSlots(incoming, day, period) {
  const affected = EPQA.slots.filter((slot) =>
    slot.id !== incoming.id &&
    slotsOverlap(slot, { ...incoming, day, period }) &&
    (
      slot.teacher === incoming.teacher ||
      slot.group === incoming.group ||
      (isProtectedRoom(incoming.room) && slot.room === incoming.room && sameSite(itemSite(slot), itemSite(incoming)))
    )
  );
  if (!affected.length) return [];
  const affectedIds = new Set(affected.map((slot) => slot.id));
  EPQA.slots = EPQA.slots.filter((slot) => !affectedIds.has(slot.id));
  return affected;
}

function contextForSlotInCell(slot, cell) {
  return validatePlacementContext(slot, cell, false);
}

function contextForSlotAt(slot, target) {
  const mode = byId("viewMode").value;
  if (mode === "room") {
    const sourceRoom = target.room || slot.room;
    const room = roomContext(sourceRoom);
    if (room.site && itemSite(slot) && !sameSite(itemSite(slot), room.site)) {
      return { ok: false, message: `${slot.subject} de ${slot.group} pertenece a sede ${itemSite(slot)} y no puede ir a ${room.site}.` };
    }
    if (isTiSubject(slot.subject) && !isTiRoom(room.name)) {
      return { ok: false, message: `${slot.subject} debe quedar en Sala TI.` };
    }
    if (isPeSubject(slot.subject) && !isCourtRoom(room.name)) {
      return { ok: false, message: `${slot.subject} debe quedar en Cancha o espacio EF autorizado.` };
    }
    return { ok: true, room: room.name, roomId: room.id, site: room.site || slot.site };
  }
  const fixedSite = siteForTeacherDay(slot.teacher, target.day || slot.day);
  const targetSite = target.site || slot.site || slot.siteId || "";
  if (fixedSite && targetSite && !sameSite(fixedSite, targetSite)) {
    return { ok: false, message: `${slot.teacher} tiene sede asignada para ese dia ${fixedSite}; no puede quedar en ${targetSite}.` };
  }
  return { ok: true, room: slot.room, roomId: slot.roomId, site: slot.site };
}

function validatePlacementContext(item, targetCell, showAlert) {
  if (!item || !targetCell) return { ok: false, message: "No se pudo leer la clase o la celda destino." };
  const mode = byId("viewMode").value;
  const filter = byId("viewFilter").value;
  const result = { ok: true, room: item.room, roomId: item.roomId, site: item.site || item.siteId };
  const day = targetCell.dataset.day;
  const targetSite = targetPlacementSite(mode, filter, targetCell, item);
  const targetDaySite = siteForTeacherDay(item.teacher, day);
  const sourceDaySite = siteForTeacherDay(item.teacher, item.day);
  if (targetSite) {
    result.site = targetSite;
    result.siteId = targetSite;
  }
  if (sourceDaySite && targetDaySite && !sameSite(sourceDaySite, targetDaySite)) {
    return placementDenied(`No se puede arrastrar entre dias de sedes diferentes.\nOrigen: ${item.day} - sede ${sourceDaySite}\nDestino: ${day} - sede ${targetDaySite}`, showAlert);
  }

  if (mode === "group" && filter && filter !== "__ALL_GROUPS__" && item.group !== filter) {
    return placementDenied(`No se puede asignar esta hora en otro grupo. Esta carga pertenece a ${item.group}.`, showAlert);
  }
  if (mode === "group" && filter === "__ALL_GROUPS__" && targetCell.dataset.group && item.group !== targetCell.dataset.group) {
    return placementDenied(`No se puede asignar esta hora en otro grado. Esta carga pertenece a ${item.group}.`, showAlert);
  }

  if (mode === "teacher" && filter && filter !== "__ALL_TEACHERS__" && !sameTeacherLoose(item.teacher, filter)) {
    return placementDenied(`No se puede asignar esta hora a otro docente. Esta carga pertenece a ${item.teacher}.`, showAlert);
  }

  if (mode === "room" && filter) {
    const room = roomContext(filter);
    result.room = room.name;
    result.roomId = room.id;
    result.site = room.site;
    if (room.site && itemSite(item) && !sameSite(itemSite(item), room.site)) {
      return placementDenied("No se puede asignar en sedes diferentes. Esa hora pertenece a otra sede.", showAlert);
    }
    if (isTiSubject(item.subject) && !isTiRoom(room.name)) {
      return placementDenied("No se puede romper la restriccion de ubicacion: esta materia debe ir en Sala TI.", showAlert);
    }
    if (isPeSubject(item.subject) && !isCourtRoom(room.name)) {
      return placementDenied("No se puede romper la restriccion de ubicacion: Educacion Fisica debe ir en Cancha o espacio EF autorizado.", showAlert);
    }
  }

  const teacherDaySite = siteForTeacherDay(item.teacher, day);
  if (teacherDaySite && targetSite && !sameSite(teacherDaySite, targetSite)) {
    return placementDenied(`No se puede asignar: ${item.teacher} tiene sede asignada para ${day}: ${teacherDaySite}, y esta celda corresponde a ${targetSite}.`, showAlert);
  }

  const availability = teacherAvailability(item.teacher, day);
  if (availability?.site && targetSite && !sameSite(availability.site, targetSite)) {
    return placementDenied(`No se puede asignar en sedes diferentes. ${item.teacher} esta disponible en ${availability.site} el dia ${day}.`, showAlert);
  }
  if (availability?.slots) {
    const periods = occupiedPeriods(item, day, Number(targetCell.dataset.period || item.period || 1));
    const states = periods.map((key) => {
      const period = `H${Number(key.split("-")[1])}`;
      return availability.slots?.[period] || "available";
    });
    if (states.some((state) => normalizeAvailabilityState(state) === "unavailable")) {
      return placementDenied(`No se puede asignar: ${item.teacher} no esta disponible en ${day} para esa franja.`, showAlert);
    }
  } else if (availability?.hours) {
    const already = teacherHoursOnDay(item.teacher, day, item.id);
    if (already + Number(item.pendingDuration || item.duration || blockHours(item) || 1) > Number(availability.hours)) {
      return placementDenied(`No se puede asignar: ${item.teacher} supera las ${availability.hours} horas disponibles el dia ${day}.`, showAlert);
    }
  }
  const globalDailyMax = maxTeacherHoursForDay(item.teacher, day, targetSite || itemSite(item));
  const alreadyByRule = teacherHoursOnDay(item.teacher, day, item.id);
  const movingHours = Number(item.pendingDuration || item.duration || blockHours(item) || 1);
  if (globalDailyMax && alreadyByRule + movingHours > globalDailyMax) {
    return placementDenied(`No se puede asignar: ${item.teacher} supera el maximo permitido de ${globalDailyMax} horas el dia ${day}.`, showAlert);
  }

  return result;
}

function teacherAvailability(teacherId, day) {
  const teacher = findTeacher(teacherId);
  return teacher ? normalizeAvailabilityRecord(teacher?.availability?.[day]) : null;
}

function targetPlacementSite(mode, filter, targetCell, item) {
  if (mode === "room") {
    const room = roomContext(filter || targetCell?.dataset?.room || item?.room || item?.roomId || "");
    return room.site || "";
  }
  if (mode === "group") {
    const groupId = targetCell?.dataset?.group || (filter && filter !== "__ALL_GROUPS__" ? filter : "") || item?.group || "";
    return groupObjectById(groupId)?.siteId || groupObjectById(groupId)?.site || "";
  }
  if (mode === "teacher") {
    const day = targetCell?.dataset?.day || item?.day || "";
    return siteForTeacherDay(item?.teacher, day) || teacherFixedSite(item?.teacher) || "";
  }
  return item?.siteId || item?.site || "";
}

function siteForTeacherDay(teacherId, day) {
  if (!day) return "";
  const availability = teacherAvailability(teacherId, day);
  return availability?.site || teacherSiteRuleForDay(teacherId, day) || teacherFixedSite(teacherId) || "";
}

function teacherSiteRuleForDay(teacherId, day) {
  const rules = EPQA.data?.rules?.teacherSite || EPQA.data?.teacherSiteRules || [];
  const rule = (rules || []).find((item) => sameTeacher(item.teacher, teacherId));
  return rule?.days?.[day] || "";
}

function teacherAvailabilityForTeacher(teacherId) {
  return findTeacher(teacherId);
}

function teacherHoursOnDay(teacherId, day, excludeSlotId = null) {
  return (EPQA.slots || [])
    .filter((slot) => slot.id !== excludeSlotId && sameTeacher(slot.teacher, teacherId) && slot.day === day)
    .reduce((sum, slot) => sum + slotDuration(slot), 0);
}

function placementDenied(message, showAlert) {
  if (showAlert) notify("Movimiento bloqueado", message, "error", true);
  return { ok: false, message };
}

function showDragRestrictionOnce(element, message) {
  if (!message || element?.dataset.dragAlertShown === "1") return;
  if (message.toLowerCase().includes("sede") || message.toLowerCase().includes("restriccion")) {
    element.dataset.dragAlertShown = "1";
    notify("Movimiento no permitido", message, "warning", true);
  }
}

function cleanupDragState(element) {
  if (!element?.dataset) return;
  delete element.dataset.dragAlertShown;
  delete element.dataset.pendingDropMessage;
}

function restrictionMessage(reason) {
  return {
    "Docente ocupado": "No se puede asignar: el docente ya tiene clase en esa franja.",
    "Grupo ocupado": "No se puede asignar: el grupo ya tiene clase en esa franja.",
    "Espacio ocupado": "No se puede asignar: ese espacio ya esta ocupado en esa franja.",
    "Debe ir a Sala TI": "No se puede romper la restriccion de ubicacion: esta materia debe ir en Sala TI.",
    "Debe ir a Cancha": "No se puede romper la restriccion de ubicacion: Educacion Fisica debe ir en Cancha o espacio EF autorizado.",
    "Bloque fuera de jornada": "No se puede asignar: el bloque indivisible se sale de la jornada disponible."
  }[reason] || `No se puede asignar porque rompe una restriccion P0: ${reason || "ubicacion invalida"}.`;
}

function detailedSwapMessage(details) {
  const clean = unique((details || []).filter(Boolean));
  if (!clean.length) return "No se puede intercambiar: el cambio rompe restricciones P0.";
  return `No se puede intercambiar porque: ${clean.join(" | ")}`;
}

function roomContext(filter) {
  const rooms = EPQA.data.rooms || [];
  const found = rooms.find((room) => room.name === filter || room.id === filter);
  if (found) {
    return {
      id: found.id || roomId(found.name),
      name: found.name || roomName(found.id),
      site: found.siteId || found.site || siteFromRoom(found.id || found.name)
    };
  }
  return { id: roomId(filter), name: filter, site: siteFromRoom(filter) };
}

function itemSite(item) {
  return item.siteId || item.site || "";
}

function teacherFixedSite(teacherId) {
  const teacher = findTeacher(teacherId);
  return teacher?.siteId || teacher?.site || teacher?.baseSite || teacher?.assignedSite || "";
}

function sameSite(a, b) {
  return normalizeKey(a) === normalizeKey(b);
}

function siteFromRoom(room) {
  const key = normalizeKey(room);
  if (key.includes("RECREO")) return "RECREO";
  if (key.includes("FILO")) return "FILO";
  return "";
}

function localP0Conflicts(slots, movingId) {
  const moving = slots.find((slot) => slot.id === movingId);
  if (!moving) return ["Slot no encontrado"];
  const sameTime = slots.filter((slot) => slot.id !== moving.id && slotsOverlap(slot, moving));
  const conflicts = [];
  if (sameTime.some((slot) => sameTeacher(slot.teacher, moving.teacher))) conflicts.push("Docente ocupado");
  if (sameTime.some((slot) => slot.group === moving.group)) conflicts.push("Grupo ocupado");
  if (isProtectedRoom(moving.room) && sameTime.some((slot) => slot.room === moving.room && slot.site === moving.site)) conflicts.push("Espacio ocupado");
  if (isTiSubject(moving.subject) && !isTiRoom(moving.room)) conflicts.push("Debe ir a Sala TI");
  if (isPeSubject(moving.subject) && !isCourtRoom(moving.room)) conflicts.push("Debe ir a Cancha");
  const fixedSite = siteForTeacherDay(moving.teacher, moving.day);
  if (fixedSite && itemSite(moving) && !sameSite(fixedSite, itemSite(moving))) conflicts.push(`Sede del docente para ${moving.day}: ${fixedSite}`);
  return conflicts;
}

function conflictDetailsForSlot(slot) {
  if (!slot) return [];
  const sameTime = EPQA.slots.filter((item) => item.id !== slot.id && slotsOverlap(item, slot));
  const details = [];

  sameTime
    .filter((item) => sameTeacher(item.teacher, slot.teacher))
    .forEach((item) => details.push(`Docente ${slot.teacher}: choca con ${item.subject} de ${item.group} en H${item.period}`));

  sameTime
    .filter((item) => item.group === slot.group)
    .forEach((item) => details.push(`Grupo ${slot.group}: choca con ${item.subject} de ${item.teacher} en H${item.period}`));

  if (isProtectedRoom(slot.room)) {
    sameTime
      .filter((item) => item.room === slot.room && item.site === slot.site)
      .forEach((item) => details.push(`Espacio ${slot.room}: ocupado por ${item.subject} de ${item.group} con ${item.teacher}`));
  }

  if (isTiSubject(slot.subject) && !isTiRoom(slot.room)) {
    details.push(`${slot.subject} debe ubicarse en Sala TI`);
  }

  if (isPeSubject(slot.subject) && !isCourtRoom(slot.room)) {
    details.push(`${slot.subject} debe ubicarse en Cancha o espacio EF autorizado`);
  }

  const fixedSite = siteForTeacherDay(slot.teacher, slot.day);
  if (fixedSite && itemSite(slot) && !sameSite(fixedSite, itemSite(slot))) {
    details.push(`${slot.teacher} tiene sede asignada para ${slot.day}: ${fixedSite}, y la clase quedaria en ${itemSite(slot)}`);
  }

  return unique(details);
}

async function auditNow() {
  normalizeSlotLoadLinks();
  const response = await fetch("/horarios/api/audit.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schedule_id: EPQA.activeScheduleId, slots: EPQA.slots, loads: EPQA.data.loads, rules: EPQA.data.rules })
  });
  EPQA.audit = await response.json();
  renderAudit();
  renderBoardLight();
}

function renderBoardLight() {
  renderMetrics();
  renderAvailableTray();
  renderTeacherDetailPanel();
  if (document.querySelector("#panel-editor.active")) {
    renderBoard();
  }
}

function renderAudit() {
  const counts = EPQA.audit.counts || { P0: 0, P1: 0, P2: 0 };
  byId("p0Count").textContent = counts.P0 || 0;
  byId("p1Count").textContent = counts.P1 || 0;
  byId("p2Count").textContent = counts.P2 || 0;
  byId("scoreCount").textContent = EPQA.audit.score || 0;
  byId("btnFinalPdf").disabled = Number(counts.P0 || 0) !== 0;

  const failures = (EPQA.audit.results || []).filter((row) => row.status === "NO CUMPLE");
  byId("conflictList").innerHTML = failures.length ? failures.map((row) => `
    <div class="conflict-item ${row.priority}">
      <strong><span class="badge ${row.priority}">${row.priority}</span> ${escapeHtml(auditRuleLabel(row.code))}</strong>
      <p>${escapeHtml(row.explanation)}</p>
    </div>
  `).join("") : `<div class="conflict-item P2"><strong><span class="badge ok">OK</span> Sin P0 activos</strong><p>El horario puede avanzar a publicacion si las reglas P1/P2 estan justificadas.</p></div>`;

  byId("auditTable").innerHTML = (EPQA.audit.results || []).map((row) => `
    <tr>
      <td><span class="badge ${row.priority}">${row.priority}</span></td>
      <td><span class="badge ${row.status === "CUMPLE" ? "ok" : row.priority}">${escapeHtml(row.status)}</span></td>
      <td>${escapeHtml(auditRuleLabel(row.code))}</td>
      <td>${escapeHtml(row.explanation)}</td>
      <td>${escapeHtml(row.suggestion || "")}</td>
    </tr>
  `).join("");

  renderChart(counts);
  renderDashboardOverview();
}

function auditRuleLabel(code) {
  const raw = String(code || "");
  if (AUDIT_RULE_LABELS[raw]) return AUDIT_RULE_LABELS[raw];
  if (raw.startsWith("block-")) return "Bloque consecutivo obligatorio";
  return raw
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderChart(counts) {
  const canvas = byId("auditChart");
  if (!canvas || !window.Chart) return;
  const data = [counts.P0 || 0, counts.P1 || 0, counts.P2 || 0];
  if (EPQA.chart) {
    EPQA.chart.data.datasets[0].data = data;
    EPQA.chart.update();
    return;
  }
  EPQA.chart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["P0", "P1", "P2"],
      datasets: [{ data, backgroundColor: ["#ef9a9a", "#f6d365", "#93c5fd"] }]
    },
    options: { plugins: { legend: { position: "bottom" } }, cutout: "68%" }
  });
}

async function generateOptimizedSchedule(preserveExisting = false) {
  if (!EPQA.data?.loads?.length) {
    notify("Sin cargas", "Primero registra o importa materias asignadas.", "warning", true);
    return;
  }

  const generateButton = byId("btnGenerate");
  const generateMissingButton = byId("btnGenerateMissing");
  if (generateButton) generateButton.disabled = true;
  if (generateMissingButton) generateMissingButton.disabled = true;
  showGenerationModal(preserveExisting ? "Leyendo horario actual y calculando solo lo faltante." : "Preparando cargas, restricciones y disponibilidad docente.", 4);
  await waitFrame();

  const previousSlots = EPQA.slots || [];
  const lockedSlots = preserveExisting ? normalizeExistingSlotsForOptimization(previousSlots) : [];
  const attempts = 180;
  let best = null;
  let bestRelaxedP1 = null;
  let mode = "strict";
  let lastImprovementAttempt = 0;
  let bestMissingSeen = Infinity;
  EPQA.ui.relaxedProposal = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (best && attempt >= 60 && attempt - lastImprovementAttempt >= 24 && mode === "strict") {
      mode = "relax-p2";
    } else if (best && attempt >= 120 && attempt - lastImprovementAttempt >= 30 && mode === "relax-p2") {
      mode = "relax-p1";
    }
    const candidate = buildOptimizedProposal(attempt, lockedSlots, { relaxLevel: mode });
    if (mode === "relax-p1") {
      if (!bestRelaxedP1 || candidate.score < bestRelaxedP1.score) bestRelaxedP1 = candidate;
    } else if (!best || candidate.score < best.score) {
      best = candidate;
    }
    const tracked = mode === "relax-p1" ? bestRelaxedP1 : best;
    if (tracked && tracked.unplacedHours < bestMissingSeen) {
      bestMissingSeen = tracked.unplacedHours;
      lastImprovementAttempt = attempt;
    }
    if (attempt % 12 === 0) {
      showGenerationModal(`${optimizerModeLabel(mode)}. Intento ${attempt}/${attempts}. Mejor faltante: ${tracked.unplacedHours}h, penalizacion ${Math.round(tracked.score)}.`, Math.round((attempt / attempts) * 92));
      await waitFrame();
    }
    if (best?.unplacedHours === 0 && best.hardConflicts === 0 && attempt >= 48) break;
  }

  showGenerationModal("Auditando la mejor propuesta encontrada.", 96);
  EPQA.slots = best?.slots?.length ? best.slots : [];
  fillFilters();
  renderAvailableTray();
  renderBoard();
  await auditNow();
  hideGenerationModal();
  if (generateButton) generateButton.disabled = false;
  if (generateMissingButton) generateMissingButton.disabled = false;

  if (!best || !best.slots.length) {
    EPQA.slots = previousSlots;
    renderDataViews();
    notify("No se encontro propuesta", "El modelo no pudo ubicar ninguna carga con las restricciones actuales.", "error", true);
    return;
  }

  const missing = best.unplacedHours;
  if (missing && bestRelaxedP1 && bestRelaxedP1.unplacedHours < missing && !bestRelaxedP1.hardConflicts) {
    EPQA.ui.relaxedProposal = bestRelaxedP1;
    openRelaxedProposalModal(best, bestRelaxedP1);
    return;
  }
  const summary = missing
    ? `Se genero la mejor propuesta posible, pero faltaron ${missing} hora(s): ${best.unplaced.slice(0, 5).map((item) => `${item.teacher} ${item.subject} ${item.group} (${item.duration}h)`).join("; ")}${best.unplaced.length > 5 ? "..." : ""}`
    : `${preserveExisting ? "Se completo el horario actual" : "Propuesta nueva generada"} con ${best.slots.reduce((sum, slot) => sum + slotDuration(slot), 0)} hora(s) ubicadas.`;
  notify(missing ? "Propuesta parcial" : "Propuesta optimizada", summary, missing ? "warning" : "success", Boolean(missing));
}

function optimizerModeLabel(mode) {
  return {
    strict: "Respetando P0, P1 y P2",
    "relax-p2": "Estancado: probando romper P2",
    "relax-p1": "Simulando alternativa con P1 rotas"
  }[mode] || "Evaluando";
}

function openRelaxedProposalModal(strictBest, relaxedBest) {
  const relaxed = relaxedProposalSummary(relaxedBest);
  const remainingText = relaxedBest.unplacedHours
    ? `Aun faltarian ${relaxedBest.unplacedHours}h.`
    : "Se podria ubicar toda la carga.";
  const message = [
    `Con P0 intactas, la mejor propuesta normal deja ${strictBest.unplacedHours}h sin ubicar.`,
    `${remainingText}`,
    `Para lograrlo habria que romper ${relaxed.p1} regla(s) P1 y ${relaxed.p2} regla(s) P2.`,
    relaxed.items.length ? `Cambios propuestos:\n${relaxed.items.slice(0, 10).map((item) => `- ${item}`).join("\n")}` : "La alternativa solo relaja penalizaciones menores del modelo."
  ].join("\n\n");
  openUxModal("Se podria armar, pero...", message, "warning", {
    confirmLabel: "Aplicar y recalcular",
    cancelLabel: "Mantener propuesta parcial",
    wide: true,
    onConfirm: applyRelaxedProposalAndRecalculate
  });
}

function relaxedProposalSummary(proposal) {
  const seen = new Set();
  const rows = [];
  (proposal?.slots || []).forEach((slot) => {
    if (!slot.relaxedPriority && !slot.relaxedReason) return;
    const priority = normalizeRulePriority(slot.relaxedPriority || "P2");
    const text = `${priority}: ${slot.teacher} - ${slot.group} - ${slot.subject}. ${slot.relaxedReason || "Regla flexible omitida"}.`;
    const key = normalizeKey(text);
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ priority, text });
  });
  (proposal?.relaxed || []).forEach((item) => {
    const priority = normalizeRulePriority(item.priority || "P2");
    const text = `${priority}: ${item.teacher} - ${item.group} - ${item.subject}. ${item.reason || "Regla flexible omitida"}.`;
    const key = normalizeKey(text);
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ priority, text });
  });
  return {
    p1: rows.filter((item) => item.priority === "P1").length,
    p2: rows.filter((item) => item.priority === "P2").length,
    items: rows.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority)).map((item) => item.text)
  };
}

async function applyRelaxedProposal() {
  const proposal = EPQA.ui.relaxedProposal;
  if (!proposal?.slots?.length) return;
  EPQA.slots = proposal.slots;
  EPQA.ui.relaxedProposal = null;
  fillFilters();
  renderAvailableTray();
  renderBoard();
  await auditNow();
  notify("Propuesta aplicada", "Se aplico la alternativa con P0 intactas y reglas flexibles justificadas.", "success");
}

async function applyRelaxedProposalAndRecalculate() {
  await applyRelaxedProposal();
  await generateOptimizedSchedule(true);
}

function normalizeExistingSlotsForOptimization(slots) {
  return (slots || []).map((slot) => {
    const copy = { ...slot, source: slot.source || "manual" };
    const load = loadForSlot(copy);
    if (load) {
      copy.loadId = load.id;
      copy.loadKey = load.loadKey || loadSignature(load);
    }
    return copy;
  });
}

function buildOptimizedProposal(seed, lockedSlots = [], options = {}) {
  const days = shuffleArray(EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"], seed);
  const units = loadUnitsForOptimization(seed, lockedSlots);
  const state = { slots: [...lockedSlots], occupancy: new Set(), teacherDayHours: new Map(), unplaced: [], relaxed: [], relaxLevel: options.relaxLevel || "strict", score: 0, hardConflicts: 0 };
  lockedSlots.forEach((slot) => {
    slotKeys(slot).forEach((key) => state.occupancy.add(key));
    const dayKey = `${normalizeKey(slot.teacher)}|${slot.day}`;
    state.teacherDayHours.set(dayKey, (state.teacherDayHours.get(dayKey) || 0) + slotDuration(slot));
  });

  units.forEach((unit, index) => {
    const placement = bestPlacementForUnit(unit, days, state, seed + index * 17);
    if (!placement) {
      const relaxed = tryRelaxedPlacement(unit, days, state, seed + index * 31);
      if (!relaxed.length) {
        state.unplaced.push(unit);
        state.score += missingPenaltyForUnit(unit);
      }
      return;
    }
    commitOptimizedPlacement(placement, state);
  });

  state.unplacedHours = state.unplaced.reduce((sum, item) => sum + item.duration, 0);
  state.score += proposalSoftPenalty(state.slots);
  state.hardConflicts = countHardConflicts(state.slots);
  state.score += state.hardConflicts * 5000;
  return state;
}

function loadUnitsForOptimization(seed, lockedSlots = []) {
  const units = [];
  const used = new Map();
  lockedSlots.forEach((slot) => {
    const key = slot.loadId || slot.loadKey || "";
    if (!key) return;
    used.set(key, (used.get(key) || 0) + slotDuration(slot));
  });
  (EPQA.data.loads || []).forEach((load) => {
    const key = load.id || load.loadKey || loadSignature(load);
    const remainingHours = Math.max(0, Number(load.hours || 0) - (used.get(load.id) || used.get(load.loadKey || key) || 0));
    if (!remainingHours) return;
    blockDurationsForLoad({ ...load, hours: remainingHours }).forEach((duration, index) => {
      units.push({ ...load, duration, pendingDuration: duration, pendingIndex: index + 1, rulePriority: loadRulePriority(load) });
    });
  });
  return shuffleArray(units, seed).sort((a, b) =>
    priorityWeight(loadRulePriority(b)) - priorityWeight(loadRulePriority(a)) ||
    candidateCountEstimate(a) - candidateCountEstimate(b) ||
    b.duration - a.duration ||
    normalizeKey(a.teacher).localeCompare(normalizeKey(b.teacher))
  );
}

function bestPlacementForUnit(unit, days, state, seed) {
  const candidates = [];
  const roomCandidates = compatibleRoomsForLoad(unit);
  days.forEach((day, dayIndex) => {
    for (let period = 1; period <= maxPeriod(unit.level) - unit.duration + 1; period++) {
      roomCandidates.forEach((room, roomIndex) => {
        const slot = slotFromLoad({ ...unit, room: room.name, roomId: room.id, site: room.site, siteId: room.site }, day, period, unit.duration);
        slot.relaxLevel = state.relaxLevel;
        slot.source = "optimizer";
        const evaluation = evaluateCandidateSlot(slot, state, dayIndex, roomIndex);
        if (evaluation.ok) candidates.push({ slot, penalty: evaluation.penalty });
      });
    }
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.penalty - b.penalty || seededTie(seed, a.slot) - seededTie(seed, b.slot));
  const limit = Math.min(4, candidates.length);
  return candidates[Math.floor(seedRandom(seed) * limit)];
}

function commitOptimizedPlacement(placement, state) {
  state.slots.push(placement.slot);
  slotKeys(placement.slot).forEach((key) => state.occupancy.add(key));
  const dayKey = `${normalizeKey(placement.slot.teacher)}|${placement.slot.day}`;
  state.teacherDayHours.set(dayKey, (state.teacherDayHours.get(dayKey) || 0) + slotDuration(placement.slot));
  state.score += placement.penalty;
}

function tryRelaxedPlacement(unit, days, state, seed) {
  if (unit.duration <= 1 || loadRulePriority(unit) === "P0") return [];
  const priority = loadRulePriority(unit);
  if (state.relaxLevel === "strict") return [];
  if (state.relaxLevel === "relax-p2" && priority !== "P2") return [];
  if (state.relaxLevel === "relax-p1" && !["P1", "P2"].includes(priority)) return [];
  const placed = [];
  for (let index = 0; index < unit.duration; index++) {
    const single = { ...unit, duration: 1, pendingDuration: 1, relaxedFromBlock: unit.duration };
    const placement = bestPlacementForUnit(single, days, state, seed + index * 11);
    if (!placement) {
      state.unplaced.push(single);
      state.score += missingPenaltyForUnit(single);
      continue;
    }
    placement.penalty += priority === "P1" ? 450 : 160;
    placement.slot.source = `${placement.slot.source}-relaxed`;
    placement.slot.relaxedPriority = priority;
    placement.slot.relaxedReason = `Bloque de ${unit.duration}h separado para ubicar ${unit.subject} de ${unit.group}`;
    state.relaxed.push({ priority, teacher: unit.teacher, group: unit.group, subject: unit.subject, reason: placement.slot.relaxedReason });
    commitOptimizedPlacement(placement, state);
    placed.push(placement.slot);
  }
  return placed;
}

function evaluateCandidateSlot(slot, state, dayIndex, roomIndex) {
  if (slotKeys(slot).some((key) => state.occupancy.has(key))) return { ok: false, penalty: 0 };
  const availability = teacherAvailability(slot.teacher, slot.day);
  let penalty = dayIndex * 2 + roomIndex;

  const fixedSite = siteForTeacherDay(slot.teacher, slot.day);
  if (fixedSite && itemSite(slot) && !sameSite(fixedSite, itemSite(slot))) return { ok: false, penalty: 0 };
  if (availability?.site && itemSite(slot) && !sameSite(availability.site, itemSite(slot))) return { ok: false, penalty: 0 };
  if (availability?.slots) {
    const states = occupiedPeriods(slot).map((key) => availability.slots?.[`H${Number(key.split("-")[1])}`] || "available");
    if (states.some((stateValue) => normalizeAvailabilityState(stateValue) === "unavailable")) return { ok: false, penalty: 0 };
    penalty += states.filter((stateValue) => normalizeAvailabilityState(stateValue) === "flexible").length * 8;
  }

  const dayKey = `${normalizeKey(slot.teacher)}|${slot.day}`;
  if ((state.teacherDayHours.get(dayKey) || 0) + slotDuration(slot) > maxTeacherHoursForDay(slot.teacher, slot.day, itemSite(slot))) return { ok: false, penalty: 0 };
  penalty += (state.teacherDayHours.get(dayKey) || 0) * 5;
  const dayPreference = preferredDayPenalty(slot);
  if (!dayPreference.ok) return { ok: false, penalty: 0 };
  penalty += dayPreference.penalty;
  if (dayPreference.relaxed) {
    slot.relaxedPriority = dayPreference.relaxed;
    slot.relaxedReason = `Preferencia de dia omitida: quedaria el ${slot.day}`;
  }
  penalty += adjacentTeacherPenalty(slot, state.slots);
  penalty += protectedRoomPreferencePenalty(slot);
  return { ok: true, penalty };
}

function preferredDayPenalty(slot) {
  const days = (slot.preferredDays || slot.preferred_days || []).map(normalizeDay).filter(Boolean);
  if (!days.length || days.includes(normalizeDay(slot.day))) return { ok: true, penalty: 0 };
  const priority = normalizeRulePriority(slot.preferredDaysPriority || slot.preferred_days_priority || "P2");
  if (slot.relaxLevel === "relax-p2" && priority === "P2") return { ok: true, penalty: 520, relaxed: "P2" };
  if (slot.relaxLevel === "relax-p1" && ["P1", "P2"].includes(priority)) return { ok: true, penalty: priority === "P1" ? 1300 : 520, relaxed: priority };
  if (priority === "P0") return { ok: false, penalty: 0 };
  return { ok: true, penalty: priority === "P1" ? 900 : 220 };
}

function compatibleRoomsForLoad(load) {
  const rooms = roomOptions().map((room) => {
    const full = (EPQA.data.rooms || []).find((item) => item.id === room.id || item.name === room.name) || room;
    return {
      id: full.id || room.id || roomId(room.name),
      name: full.name || room.name || roomName(full.id),
      site: full.siteId || full.site || load.siteId || load.site || siteFromRoom(full.id || full.name)
    };
  });
  const filtered = rooms.filter((room) => {
    if (itemSite(load) && room.site && !sameSite(itemSite(load), room.site)) return false;
    if (isTiSubject(load.subject)) return isTiRoom(room.name || room.id);
    if (isPeSubject(load.subject)) return isCourtRoom(room.name || room.id);
    return normalizeKey(load.roomId || load.room || "AULA") === "AULA" ? !isProtectedRoom(room.name || room.id) || normalizeKey(room.id) === "AULA" : sameRoom(room, load);
  });
  if (filtered.length) return filtered;
  return [{ id: load.roomId || roomId(load.room || "AULA"), name: load.room || roomName(load.roomId || "AULA"), site: load.siteId || load.site || siteFromRoom(load.roomId || load.room) }];
}

function sameRoom(room, load) {
  if (!load.room && !load.roomId) return normalizeKey(room.id) === "AULA" || !isProtectedRoom(room.name || room.id);
  return normalizeKey(room.id) === normalizeKey(load.roomId) || normalizeKey(room.name) === normalizeKey(load.room);
}

function candidateCountEstimate(load) {
  const days = EPQA.data.days?.length || 5;
  const duration = Number(load.pendingDuration || load.duration || blockHours(load));
  return days * Math.max(1, maxPeriod(load.level) - duration + 1) * Math.max(1, compatibleRoomsForLoad(load).length);
}

function adjacentTeacherPenalty(slot, slots) {
  const periods = occupiedPeriods(slot).map((key) => Number(key.split("-")[1]));
  const min = Math.min(...periods);
  const max = Math.max(...periods);
  const sameDay = slots.filter((item) => sameTeacher(item.teacher, slot.teacher) && item.day === slot.day);
  const adjacent = sameDay.some((item) => {
    const itemPeriods = occupiedPeriods(item).map((key) => Number(key.split("-")[1]));
    return itemPeriods.includes(min - 1) || itemPeriods.includes(max + 1);
  });
  return adjacent ? -3 : 4;
}

function protectedRoomPreferencePenalty(slot) {
  if (isTiSubject(slot.subject) && !isTiRoom(slot.room)) return 300;
  if (isPeSubject(slot.subject) && !isCourtRoom(slot.room)) return 300;
  return 0;
}

function proposalSoftPenalty(slots) {
  const teacherDays = new Map();
  slots.forEach((slot) => {
    const key = normalizeKey(slot.teacher);
    const days = teacherDays.get(key) || new Set();
    days.add(slot.day);
    teacherDays.set(key, days);
  });
  let penalty = 0;
  teacherDays.forEach((days) => {
    if (days.size === 1) penalty += 40;
    if (days.size > 4) penalty += 8;
  });
  return penalty;
}

function countHardConflicts(slots) {
  return slots.reduce((sum, slot) => sum + localP0Conflicts(slots, slot.id).length, 0);
}

function generateSchedule() {
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const next = [];
  const occupancy = new Set();
  EPQA.data.loads.forEach((load) => {
    const blockSize = blockHours(load);
    let remaining = Number(load.hours || 0);
    while (remaining > 0) {
      const size = Math.min(blockSize, remaining);
      const placed = placeBlock(load, size, days, occupancy);
      if (!placed) break;
      next.push(...placed);
      remaining -= placed.reduce((sum, slot) => sum + slotDuration(slot), 0);
    }
  });
  EPQA.slots = next;
  fillFilters();
  renderAvailableTray();
  renderBoard();
  auditNow();
}

function placeBlock(load, size, days, occupancy) {
  for (const day of days) {
    for (let period = 1; period <= maxPeriod(load.level) - size + 1; period++) {
      const proposal = [slotFromLoad(load, day, period, size)];
      const keys = proposal.flatMap(slotKeys);
      if (keys.every((key) => !occupancy.has(key))) {
        keys.forEach((key) => occupancy.add(key));
        return proposal;
      }
    }
  }
  return null;
}

function slotKeys(slot) {
  const keys = [];
  occupiedPeriods(slot).forEach((time) => {
    keys.push(`teacher:${slot.teacher}:${time}`, `group:${slot.group}:${time}`);
    if (isProtectedRoom(slot.room)) keys.push(`room:${slot.site}:${slot.room}:${time}`);
  });
  return keys;
}

function blockSizeFor(load) {
  if (isPeSubject(load.subject)) return 2;
  if (normalizeKey(load.teacher) === "ANDRES" && ["10F", "11F", "10-11R"].includes(load.group)) return 3;
  if (normalizeKey(load.teacher) === "ANDRES") return 2;
  if (["FISICA", "QUIMICA", "MATEMATICAS", "ARITMETICA"].includes(normalizeKey(load.subject)) && Number(load.hours || 0) > 2) return 2;
  return 1;
}

function blockDurationsForLoad(load) {
  const durations = [];
  let remaining = Math.max(0, Number(load.hours || 0));
  const preferred = Math.max(1, Number(load.blockHours || blockSizeFor(load) || 1));
  while (remaining > 0) {
    const duration = Math.min(preferred, remaining);
    durations.push(duration);
    remaining -= duration;
  }
  return durations;
}

function normalizeRulePriority(value) {
  const key = normalizeKey(value);
  if (key === "P1") return "P1";
  if (key === "P2") return "P2";
  return "P0";
}

function loadRulePriority(load) {
  return normalizeRulePriority(load?.rulePriority || load?.priority || load?.blockPriority || "P0");
}

function priorityWeight(priority) {
  return { P0: 3, P1: 2, P2: 1 }[normalizeRulePriority(priority)] || 3;
}

function missingPenaltyForUnit(unit) {
  const base = { P0: 16000, P1: 9000, P2: 4200 }[loadRulePriority(unit)] || 16000;
  return base + Number(unit.duration || 1) * 650;
}

function blockHours(load) {
  return Math.max(1, Number(load?.blockHours || load?.block_hours || 1));
}

function slotDuration(slot) {
  return Math.max(1, Number(slot?.duration || 1));
}

function occupiedPeriods(slot, day = slot.day, period = Number(slot.period)) {
  return Array.from({ length: slotDuration(slot) }, (_, index) => `${day}-${Number(period) + index}`);
}

function slotsOverlap(a, b) {
  const aPeriods = new Set(occupiedPeriods(a));
  return occupiedPeriods(b).some((key) => aPeriods.has(key));
}

function reconcileSlotsForLoad(load) {
  let remaining = Number(load.hours || 0);
  EPQA.slots = EPQA.slots.filter((slot) => {
    if (slot.loadId !== load.id) return true;
    if (remaining <= 0) return false;
    const duration = Math.min(slotDuration(slot), remaining);
    slot.duration = duration;
    remaining -= duration;
    return true;
  });
}

function repairConflicts() {
  const failures = (EPQA.audit.results || []).filter((row) => row.priority === "P0" && row.status === "NO CUMPLE");
  if (!failures.length) return;
  generateOptimizedSchedule();
}

async function importJson() {
  let parsed;
  try {
    parsed = parseLooseJson(byId("jsonInput").value);
  } catch (error) {
    notify("JSON invalido", "Pegue el objeto completo, iniciando con { y terminando con }.", "error", true);
    return;
  }
  const response = await fetch("/horarios/api/import.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schedule_id: EPQA.activeScheduleId, data: parsed })
  });
  const payload = await response.json();
  if (!payload.ok) {
    if (payload.code === "FREE_IMPORT_LIMIT_REACHED") {
      showFreeLimitModal(() => importJsonWithReplace(parsed));
      return;
    }
    notify("No fue posible importar", payload.error || "Revise el contenido e intente de nuevo.", "error", true);
    return;
  }
  if (payload.schedule_id) EPQA.activeScheduleId = payload.schedule_id;
  EPQA.data = normalizeImportedData(parsed);
  EPQA.slots = EPQA.data.slots.length ? EPQA.data.slots : buildEmptyProposal(EPQA.data);
  byId("jsonInput").value = JSON.stringify(EPQA.data, null, 2);
  renderDataViews();
  await loadScheduleWorkspace(EPQA.activeScheduleId);
}

async function importJsonWithReplace(parsed) {
  const response = await fetch("/horarios/api/import.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ replace_existing: true, data: parsed })
  });
  const payload = await response.json();
  if (!payload.ok) {
    notify("No fue posible reemplazar", payload.error || payload.message || "Intenta de nuevo.", "error", true);
    return;
  }
  EPQA.activeScheduleId = payload.schedule_id || EPQA.activeScheduleId;
  await loadScheduleWorkspace(EPQA.activeScheduleId);
  notify("Horario reemplazado", "El JSON quedo asociado a tu horario existente.", "success");
}

async function importDataFile() {
  const file = byId("dataFileInput")?.files?.[0];
  if (!file) {
    notify("Archivo requerido", "Seleccione un archivo JSON o Excel.", "warning", true);
    return;
  }

  try {
    const imported = file.name.toLowerCase().endsWith(".json")
      ? parseLooseJson(await file.text())
      : await parseExcelFile(file);
    EPQA.data = normalizeImportedData(imported);
    EPQA.slots = EPQA.data.slots.length ? EPQA.data.slots : buildEmptyProposal(EPQA.data);
    byId("jsonInput").value = JSON.stringify(EPQA.data, null, 2);
    renderDataViews();
    await persistImportedData(imported);
    notify("Archivo importado", "Los datos quedaron cargados en el gestor.", "success");
  } catch (error) {
    notify("No fue posible importar", "Revise que tenga JSON valido o hojas Excel compatibles.", "error", true);
  } finally {
    const input = byId("dataFileInput");
    if (input) input.value = "";
  }
}

async function persistImportedData(imported) {
  try {
    const response = await fetch("/horarios/api/import.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedule_id: EPQA.activeScheduleId, data: imported })
    });
    const payload = await response.json();
    if (payload.ok && payload.schedule_id) {
      EPQA.activeScheduleId = payload.schedule_id;
      await loadScheduleWorkspace(payload.schedule_id);
    } else if (payload.code === "FREE_IMPORT_LIMIT_REACHED") {
      showFreeLimitModal(() => importJsonWithReplace(imported));
    }
  } catch (error) {
    // La importacion local ya quedo cargada; el guardado remoto se puede reintentar.
  }
}

async function parseExcelFile(file) {
  if (!window.XLSX) {
    throw new Error("SheetJS no esta cargado.");
  }
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetToJson = (name) => {
    const sheet = workbook.Sheets[name];
    return sheet ? XLSX.utils.sheet_to_json(sheet, { defval: "" }) : [];
  };

  const baseRows = sheetToJson("Base");
  const assignmentRows = sheetToJson("assignments").concat(sheetToJson("Asignaciones"), sheetToJson("Matriz_Grados"));
  const teacherRows = sheetToJson("Docentes");
  const groupRows = sheetToJson("Grados");
  const roomRows = sheetToJson("Espacios");

  const loads = normalizeExcelLoads(baseRows);
  const assignments = normalizeExcelAssignments(assignmentRows);
  const payload = {
    project: {
      name: "EPQA Horarios Inteligentes",
      institution: byId("schoolName")?.value || "Institución importada"
    },
    days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    teachers: normalizeExcelTeachers(teacherRows, baseRows, assignmentRows),
    groups: normalizeExcelGroups(groupRows, baseRows, assignmentRows),
    rooms: normalizeExcelRooms(roomRows, baseRows, assignmentRows),
    subjects: normalizeExcelSubjects(baseRows, assignmentRows),
    assignments
  };
  if (loads.length) payload.loads = loads;
  return payload;
}

function normalizeExcelLoads(rows) {
  return rows
    .filter((row) => row.teacher || row.Docente || row.profesor || row.Profesor)
    .map((row, index) => ({
      id: row.id || row.ID || `excel-load-${index + 1}`,
      teacher: row.teacher || row.Docente || row.profesor || row.Profesor,
      group: row.group || row.Grupo || row.grado || row.Grado,
      subject: row.subject || row.Materia || row.asignatura || row.Asignatura,
      hours: Number(row.hours || row.Horas || row.horas || 1),
      blockHours: Number(row.blockHours || row.Bloque || row.bloque || 1),
      room: row.room || row.Espacio || row.Aula || "Aula",
      roomId: row.roomId || row.EspacioId || roomId(row.room || row.Espacio || "Aula"),
      site: row.siteId || row.Sede || row.site || "",
      siteId: row.siteId || row.Sede || row.site || "",
      level: normalizeLevel(row.level || row.Nivel || "secondary"),
      rulePriority: normalizeRulePriority(row.rulePriority || row.Prioridad || row.prioridad || row.Importancia || row.importancia || "P0"),
      lockedTeacher: true
    }));
}

function normalizeExcelAssignments(rows) {
  return rows
    .filter((row) => row.day || row.Dia || row["D?a"] || row.period || row.Hora)
    .map((row, index) => ({
      id: row.id || row.ID || `excel-slot-${index + 1}`,
      siteId: row.siteId || row.Sede || "",
      site: row.site || row.Sede || "",
      level: row.level || row.Nivel || "secondary",
      group: row.group || row.Grupo || row.grado || row.Grado,
      day: row.day || row.Dia || row["D?a"],
      period: row.period || row.Hora || row.H,
      subject: row.subject || row.Materia || row.Asignatura,
      teacher: row.teacher || row.Docente || row.Profesor,
      roomId: row.roomId || row.EspacioId || roomId(row.room || row.Espacio || "Aula"),
      requiredRoomId: row.requiredRoomId || row.roomId || row.EspacioId || roomId(row.room || row.Espacio || "Aula"),
      lockedOriginalAssignment: true,
      source: "Excel"
    }));
}

function normalizeExcelTeachers(...rowSets) {
  const names = unique(rowSets.flat().map((row) => row.teacher || row.Docente || row.Profesor).filter(Boolean));
  return names.map((name) => ({ id: normalizeKey(name), name: normalizeKey(name), type: "Secundaria", availability: {} }));
}

function normalizeExcelGroups(...rowSets) {
  const names = unique(rowSets.flat().map((row) => row.group || row.Grupo || row.grado || row.Grado).filter(Boolean));
  return names.map((name) => ({ id: String(name), name: String(name), level: String(name).match(/^[1-5]/) ? "primary" : "secondary" }));
}

function normalizeExcelRooms(...rowSets) {
  const names = unique(rowSets.flat().map((row) => row.room || row.Espacio || row.Aula || row.roomId || row.EspacioId).filter(Boolean));
  return names.length ? names.map((name) => ({ id: roomId(name), name: roomName(name), siteId: siteFromRoom(name) })) : [{ id: "AULA", name: "Aula" }];
}

function normalizeExcelSubjects(...rowSets) {
  return unique(rowSets.flat().map((row) => row.subject || row.Materia || row.Asignatura).filter(Boolean));
}

function parseLooseJson(text) {
  const raw = String(text || "").trim();
  try {
    return JSON.parse(raw);
  } catch (error) {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw error;
  }
}

async function saveVersion(final) {
  if (!EPQA.activeScheduleId) {
    notify("Sin horario activo", "Crea o importa un horario antes de guardar una version.", "warning", true);
    return;
  }
  syncWorkspaceSnapshot();
  const response = await fetch("/horarios/api/versions.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schedule_id: EPQA.activeScheduleId, final, counts: EPQA.audit.counts, snapshot: { data: EPQA.data, slots: EPQA.slots, audit: EPQA.audit } })
  });
  const payload = await response.json();
  if (!payload.ok) {
    notify("No fue posible guardar", payload.error || "Intente de nuevo o descargue un backup.", "error", true);
    return;
  }
  const log = byId("versionLog");
  log.insertAdjacentHTML("afterbegin", `<div><strong>${escapeHtml(payload.status)}</strong> · ${EPQA.audit.counts.P0}</div>`);
  notify(final ? "Version final lista" : "Version guardada", final ? "Se iniciara la descarga del PDF final." : "La version quedo registrada.", "success");
  if (final) exportPdf("final");
}

function exportExcel() {
  if (!window.XLSX) return;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(EPQA.data.loads), "Base");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(EPQA.slots), "Matriz_Grados");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(EPQA.slots.map(({ teacher, day, period, group, subject, room }) => ({ teacher, day, period, group, subject, room }))), "Matriz_Profes");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(EPQA.audit.results || []), "Auditoría");
  XLSX.writeFile(wb, "epqa_horario_auditado.xlsx");
}

function exportPdf(type) {
  if (!window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  if (type === "teacher" || type === "final") {
    const teachers = exportTeacherTargets();
    if (type === "final") {
      drawFinalCoverPage(doc, teachers);
    }
    teachers.forEach((teacherId, index) => {
      if (type === "final" || index > 0) doc.addPage();
      drawTeacherPdfPage(doc, teacherId, type);
    });
    doc.save(type === "final" ? "epqa_horario_final.pdf" : "epqa_horario_profesores.pdf");
    return;
  }

  const mode = type === "room" ? "room" : "group";
  if (type === "group") {
    const groups = exportGroupTargets();
    groups.forEach((groupId, page) => {
      if (page) doc.addPage();
      drawGroupPdfPage(doc, groupId);
    });
    doc.save("epqa_horario_grados.pdf");
    return;
  }
  if (type === "room") {
    const rooms = exportRoomTargets();
    rooms.forEach((roomId, page) => {
      if (page) doc.addPage();
      drawRoomPdfPage(doc, roomId);
    });
    doc.save("epqa_horario_espacios.pdf");
    return;
  }
  const values = unique(EPQA.slots.map((slot) => slot[mode])).sort(naturalSort);
  values.forEach((value, page) => {
    if (page) doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`EPQA Horarios Inteligentes - ${labelForMode(mode)} ${value}`, 36, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Auditoríaudit.counts.P2 || 0}`, 36, 54);
    let y = 78;
    (EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]).forEach((day) => {
      doc.setFont("helvetica", "bold");
      doc.text(day, 36, y);
      y += 14;
      EPQA.slots.filter((slot) => slot[mode] === value && slot.day === day).sort((a, b) => a.period - b.period).forEach((slot) => {
        doc.setFont("helvetica", "normal");
        doc.text(`H${slot.period} · ${slot.room}`, 52, y);
        y += 13;
      });
      y += 8;
      if (y > 560) {
        doc.addPage();
        y = 42;
      }
    });
  });
  doc.save(`epqa_horario_${type}.pdf`);
}

function exportTeacherTargets() {
  return unique([
    ...(EPQA.data.teachers || []).map((teacher) => teacherKey(teacher)),
    ...(EPQA.data.loads || []).map((load) => load.teacher),
    ...(EPQA.slots || []).map((slot) => slot.teacher)
  ]).filter((teacherId) => {
    return (EPQA.data.loads || []).some((load) => sameTeacherLoose(load.teacher, teacherId)) ||
      (EPQA.slots || []).some((slot) => sameTeacherLoose(slot.teacher, teacherId));
  }).sort(naturalSort);
}

function exportGroupTargets() {
  return unique([
    ...(EPQA.data.groups || []).map((group) => group.id || group.name),
    ...(EPQA.data.loads || []).map((load) => load.group),
    ...(EPQA.slots || []).map((slot) => slot.group)
  ]).filter((groupId) => {
    return (EPQA.data.loads || []).some((load) => String(load.group) === String(groupId)) ||
      (EPQA.slots || []).some((slot) => String(slot.group) === String(groupId));
  }).sort(naturalSort);
}

function exportRoomTargets() {
  return unique([
    ...(EPQA.data.rooms || []).map((room) => room.id || room.name),
    ...(EPQA.data.loads || []).map((load) => load.roomId || load.room),
    ...(EPQA.slots || []).map((slot) => slot.roomId || slot.room)
  ]).filter((roomId) => {
    return (EPQA.data.loads || []).some((load) => normalizeKey(load.roomId || load.room) === normalizeKey(roomId)) ||
      (EPQA.slots || []).some((slot) => normalizeKey(slot.roomId || slot.room) === normalizeKey(roomId));
  }).sort(naturalSort);
}

function drawFinalCoverPage(doc, teachers) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 28;
  doc.setFillColor(245, 250, 255);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("EPQA Horario Final", margin, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Profesores: ${teachers.length} · => sum + slotDuration(slot), 0)}h`, margin, 58);
  doc.text(`P0 ${EPQA.audit?.counts?.P0 || 0} · 0}`, margin, 72);
  doc.setDrawColor(174, 197, 222);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 96, pageW - margin * 2, 120, 8, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.text("Contenido", margin + 14, 120);
  doc.setFont("helvetica", "normal");
  const lines = [
    "Cada pagina de docente incluye la cuadricula visual con colores, su carga laboral total, horas asignadas, pendientes y el listado de areas por grado.",
    "El archivo final mantiene el mismo lenguaje visual de la plataforma para entrega a los docentes."
  ];
  let y = 138;
  lines.forEach((line) => {
    doc.text(doc.splitTextToSize(line, pageW - margin * 2 - 28), margin + 14, y);
    y += 28;
  });
}

function drawTeacherPdfPage(doc, teacherId, mode = "teacher") {
  const teacher = findTeacher(teacherId) || { id: teacherId, name: teacherId, type: "secondary" };
  const teacherName = teacher.name || teacher.id || teacherId;
  const loads = (EPQA.data.loads || []).filter((load) => sameTeacherLoose(load.teacher, teacherId));
  const slots = (EPQA.slots || []).filter((slot) => sameTeacherLoose(slot.teacher, teacherId));
  const assignedHours = slots.reduce((sum, slot) => sum + slotDuration(slot), 0);
  const loadHours = loads.reduce((sum, load) => sum + Number(load.hours || 0), 0);
  const pendingHours = Math.max(0, loadHours - assignedHours);
  const level = normalizeLevel(teacher.type || teacher.level || slots[0]?.level || "secondary");
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const periods = pdfPeriodCountForTeacher(level, slots);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 26;
  const headerH = 70;
  const gridTop = 114;
  const gridLeft = margin;
  const rowHeaderW = 70;
  const gridW = pageW - margin * 2 - rowHeaderW;
  const cellW = gridW / days.length;
  const cellH = Math.max(20, Math.min(24, Math.floor((pageH - 360) / Math.max(1, periods))));
  const gridH = cellH * periods;
  const blockCount = countTeacherTwoHourBlocks(slots);

  doc.setFillColor(250, 252, 255);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`${teacherName}`, margin, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${mode === "final" ? "Final" : "Docente"} · "primary" ? "Primaria" : "Secundaria"} · ""}`, margin, 48);
  doc.text(`Carga total ${loadHours}h · ${pendingHours}h`, margin, 60);

  const summaryY = 72;
  const cardW = (pageW - margin * 2 - 18) / 4;
  const cards = [
    { title: "Cargas", value: `${loads.length}` },
    { title: "Horas", value: `${loadHours}h` },
    { title: "Asignadas", value: `${assignedHours}h` },
    { title: "Pendientes", value: `${pendingHours}h` }
  ];
  cards.forEach((card, index) => {
    const x = margin + index * (cardW + 6);
    const fill = index === 2 ? [225, 248, 238] : index === 3 ? [255, 247, 237] : [255, 255, 255];
    doc.setFillColor(...fill);
    doc.setDrawColor(196, 210, 225);
    doc.roundedRect(x, summaryY, cardW, 32, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(card.title, x + 8, summaryY + 12);
    doc.setFontSize(13);
    doc.text(card.value, x + 8, summaryY + 25);
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Bloques de 2h o mas: ${blockCount}`, margin, summaryY + 44);

  doc.setDrawColor(120, 139, 160);
  doc.setFontSize(8);
  days.forEach((day, index) => {
    const x = gridLeft + rowHeaderW + index * cellW;
    doc.setFillColor(236, 242, 248);
    doc.rect(x, gridTop, cellW, 18, "F");
    doc.text(day, x + 4, gridTop + 12);
  });
  for (let period = 1; period <= periods; period++) {
    const y = gridTop + 18 + (period - 1) * cellH;
    doc.setFillColor(240, 245, 250);
    doc.rect(gridLeft, y, rowHeaderW, cellH, "F");
    doc.text(`H${period}`, gridLeft + 18, y + cellH / 2 + 3);
    days.forEach((day, dayIndex) => {
      const x = gridLeft + rowHeaderW + dayIndex * cellW;
      const slot = slots.find((item) => item.day === day && occupiedPeriods(item).includes(`${day}-${period}`));
      const start = slot && Number(slot.period) === period;
      const fill = slot ? hexToRgb(colorForItem(slot, "teacher")) : [255, 255, 255];
      doc.setFillColor(...fill);
      doc.setDrawColor(194, 205, 216);
      doc.rect(x, y, cellW, cellH, "FD");
      if (slot) {
        drawPdfTwoLineCell(doc, x, y, cellW, cellH, teacherPdfBlockLines(slot), true);
      }
    });
  }

  const listsTop = gridTop + 18 + gridH + 18;
  const leftColW = (pageW - margin * 2 - 12) * 0.58;
  const rightX = margin + leftColW + 12;
  drawPdfSection(doc, margin, listsTop, leftColW, pageH - listsTop - 20, "Areas a dictar", loads.map((load) => ({
    title: `${load.subject} · ${load.group}`,
    body: `${Number(load.hours || 0)}h · "Aula"}`
  })));
  drawPdfSection(doc, rightX, listsTop, pageW - margin - rightX, pageH - listsTop - 20, "Resumen laboral", [
    { title: "Total", body: `${loadHours}h` },
    { title: "Asignadas", body: `${assignedHours}h` },
    { title: "Pendientes", body: `${pendingHours}h` },
    ...dailyTeacherSummary(slots)
  ]);
}

function drawGroupPdfPage(doc, groupId) {
  const group = groupObjectById(groupId) || { id: groupId, name: groupId, level: inferGroupLevel(groupId) };
  const groupName = group.name || group.id || groupId;
  const level = normalizeLevel(group.level || inferGroupLevel(group.id));
  const loads = (EPQA.data.loads || []).filter((load) => String(load.group) === String(groupId));
  const slots = (EPQA.slots || []).filter((slot) => String(slot.group) === String(groupId));
  const assignedHours = slots.reduce((sum, slot) => sum + slotDuration(slot), 0);
  const loadHours = loads.reduce((sum, load) => sum + Number(load.hours || 0), 0);
  const pendingHours = Math.max(0, loadHours - assignedHours);
  const requiredHours = level === "primary" ? 25 : 30;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 26;
  const gridTop = 114;
  const gridLeft = margin;
  const rowHeaderW = 70;
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const periods = maxPeriod(level);
  const gridW = pageW - margin * 2 - rowHeaderW;
  const cellW = gridW / days.length;
  const cellH = Math.max(20, Math.min(24, Math.floor((pageH - 360) / Math.max(1, periods))));
  const gridH = cellH * periods;

  doc.setFillColor(250, 252, 255);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(groupName, margin, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${level === "primary" ? "Primaria" : "Secundaria"} · semanales`, margin, 48);
  doc.text(`Carga total ${loadHours}h · ${pendingHours}h`, margin, 60);

  const summaryY = 72;
  const cardW = (pageW - margin * 2 - 18) / 4;
  const cards = [
    { title: "Materias", value: `${loads.length}` },
    { title: "Horas", value: `${loadHours}h` },
    { title: "Asignadas", value: `${assignedHours}h` },
    { title: "Pendientes", value: `${pendingHours}h` }
  ];
  cards.forEach((card, index) => {
    const x = margin + index * (cardW + 6);
    const fill = index === 2 ? [225, 248, 238] : index === 3 ? [255, 247, 237] : [255, 255, 255];
    doc.setFillColor(...fill);
    doc.setDrawColor(196, 210, 225);
    doc.roundedRect(x, summaryY, cardW, 32, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(card.title, x + 8, summaryY + 12);
    doc.setFontSize(13);
    doc.text(card.value, x + 8, summaryY + 25);
  });

  doc.setDrawColor(120, 139, 160);
  doc.setFontSize(8);
  days.forEach((day, index) => {
    const x = gridLeft + rowHeaderW + index * cellW;
    doc.setFillColor(236, 242, 248);
    doc.rect(x, gridTop, cellW, 18, "F");
    doc.text(day, x + 4, gridTop + 12);
  });
  for (let period = 1; period <= periods; period++) {
    const y = gridTop + 18 + (period - 1) * cellH;
    doc.setFillColor(240, 245, 250);
    doc.rect(gridLeft, y, rowHeaderW, cellH, "F");
    doc.text(`H${period}`, gridLeft + 18, y + cellH / 2 + 3);
    days.forEach((day, dayIndex) => {
      const x = gridLeft + rowHeaderW + dayIndex * cellW;
      const slot = slots.find((item) => item.day === day && occupiedPeriods(item).includes(`${day}-${period}`));
      const start = slot && Number(slot.period) === period;
      const fill = slot ? hexToRgb(colorForItem(slot, "group")) : [255, 255, 255];
      doc.setFillColor(...fill);
      doc.setDrawColor(194, 205, 216);
      doc.rect(x, y, cellW, cellH, "FD");
      if (slot) {
        drawPdfTwoLineCell(doc, x, y, cellW, cellH, groupPdfBlockLines(slot), true);
      }
    });
  }

  const listsTop = gridTop + 18 + gridH + 18;
  const leftColW = (pageW - margin * 2 - 12) * 0.58;
  const rightX = margin + leftColW + 12;
  drawPdfSection(doc, margin, listsTop, leftColW, pageH - listsTop - 20, "Asignaturas y docentes", loads.map((load) => ({
    title: `${load.subject} · ${load.teacher}`,
    body: `${Number(load.hours || 0)}h · "Aula"}`
  })));
  drawPdfSection(doc, rightX, listsTop, pageW - margin - rightX, pageH - listsTop - 20, "Resumen del grado", [
    { title: "Total", body: `${loadHours}h` },
    { title: "Asignadas", body: `${assignedHours}h` },
    { title: "Pendientes", body: `${pendingHours}h` },
    ...dailyTeacherSummary(slots)
  ]);
}

function drawRoomPdfPage(doc, roomId) {
  const room = (EPQA.data.rooms || []).find((item) => String(item.id) === String(roomId) || String(item.name) === String(roomId)) || { id: roomId, name: roomId };
  const roomNameValue = room.name || room.id || roomId;
  const roomSlots = (EPQA.slots || []).filter((slot) => normalizeKey(slot.roomId || slot.room) === normalizeKey(roomId) || normalizeKey(slot.room) === normalizeKey(roomNameValue));
  const roomLoads = (EPQA.data.loads || []).filter((load) => normalizeKey(load.roomId || load.room) === normalizeKey(roomId) || normalizeKey(load.room) === normalizeKey(roomNameValue));
  const loadHours = roomLoads.reduce((sum, load) => sum + Number(load.hours || 0), 0);
  const assignedHours = roomSlots.reduce((sum, slot) => sum + slotDuration(slot), 0);
  const pendingHours = Math.max(0, loadHours - assignedHours);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 26;
  const gridTop = 114;
  const gridLeft = margin;
  const rowHeaderW = 70;
  const days = EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const periods = Math.max(5, ...roomSlots.map((slot) => Number(slot.period || 1) + slotDuration(slot) - 1), ...roomLoads.map((load) => maxPeriod(load.level || "secondary")));
  const gridW = pageW - margin * 2 - rowHeaderW;
  const cellW = gridW / days.length;
  const cellH = Math.max(20, Math.min(24, Math.floor((pageH - 360) / Math.max(1, periods))));
  const gridH = cellH * periods;

  doc.setFillColor(250, 252, 255);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(roomNameValue, margin, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Espacio · ${loadHours}h`, margin, 48);
  doc.text(`Asignadas ${assignedHours}h · ${pendingHours}h`, margin, 60);

  const summaryY = 72;
  const cardW = (pageW - margin * 2 - 18) / 4;
  const cards = [
    { title: "Cargas", value: `${roomLoads.length}` },
    { title: "Horas", value: `${loadHours}h` },
    { title: "Asignadas", value: `${assignedHours}h` },
    { title: "Pendientes", value: `${pendingHours}h` }
  ];
  cards.forEach((card, index) => {
    const x = margin + index * (cardW + 6);
    const fill = index === 2 ? [225, 248, 238] : index === 3 ? [255, 247, 237] : [255, 255, 255];
    doc.setFillColor(...fill);
    doc.setDrawColor(196, 210, 225);
    doc.roundedRect(x, summaryY, cardW, 32, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(card.title, x + 8, summaryY + 12);
    doc.setFontSize(13);
    doc.text(card.value, x + 8, summaryY + 25);
  });

  doc.setDrawColor(120, 139, 160);
  doc.setFontSize(8);
  days.forEach((day, index) => {
    const x = gridLeft + rowHeaderW + index * cellW;
    doc.setFillColor(236, 242, 248);
    doc.rect(x, gridTop, cellW, 18, "F");
    doc.text(day, x + 4, gridTop + 12);
  });
  for (let period = 1; period <= periods; period++) {
    const y = gridTop + 18 + (period - 1) * cellH;
    doc.setFillColor(240, 245, 250);
    doc.rect(gridLeft, y, rowHeaderW, cellH, "F");
    doc.text(`H${period}`, gridLeft + 18, y + cellH / 2 + 3);
    days.forEach((day, dayIndex) => {
      const x = gridLeft + rowHeaderW + dayIndex * cellW;
      const slot = roomSlots.find((item) => item.day === day && occupiedPeriods(item).includes(`${day}-${period}`));
      const start = slot && Number(slot.period) === period;
      const fill = slot ? hexToRgb(colorForItem(slot, "group")) : [255, 255, 255];
      doc.setFillColor(...fill);
      doc.setDrawColor(194, 205, 216);
      doc.rect(x, y, cellW, cellH, "FD");
      if (slot) {
        drawPdfTwoLineCell(doc, x, y, cellW, cellH, roomPdfBlockLines(slot), true);
      }
    });
  }

  const listsTop = gridTop + 18 + gridH + 18;
  const leftColW = (pageW - margin * 2 - 12) * 0.58;
  const rightX = margin + leftColW + 12;
  drawPdfSection(doc, margin, listsTop, leftColW, pageH - listsTop - 20, "Asignaturas y docentes", roomLoads.map((load) => ({
    title: `${load.subject} · ${load.teacher}`,
    body: `${Number(load.hours || 0)}h · ""}`
  })));
  drawPdfSection(doc, rightX, listsTop, pageW - margin - rightX, pageH - listsTop - 20, "Resumen del espacio", [
    { title: "Total", body: `${loadHours}h` },
    { title: "Asignadas", body: `${assignedHours}h` },
    { title: "Pendientes", body: `${pendingHours}h` }
  ]);
}

function teacherPdfBlockLines(slot) {
  return [
    slot.subject || "",
    `${slot.teacher || ""} · ${slot.group || ""}`.trim(),
    `${Number(slot.hours || 0)}h · ${slot.room || slot.roomId || "Aula"}`.trim()
  ];
}

function groupPdfBlockLines(slot) {
  return [
    slot.subject || "",
    `${slot.teacher || ""} · ${slot.group || ""}`.trim(),
    `${Number(slot.hours || 0)}h · ${slot.room || slot.roomId || "Aula"}`.trim()
  ];
}

function roomPdfBlockLines(slot) {
  return [
    slot.subject || "",
    `${slot.teacher || ""} · ${slot.group || ""}`.trim(),
    `${Number(slot.hours || 0)}h · ${slot.source || "manual"}`.trim()
  ];
}

function drawPdfTwoLineCell(doc, x, y, cellW, cellH, lines, topBold = true) {
  const maxWidth = Math.max(10, cellW - 6);
  const topText = String(lines?.[0] || "");
  const bottomText = String(lines?.[1] || "");
  const topSize = fitPdfFontSize(doc, topText, maxWidth, 5.2, 3.8);
  const bottomSize = fitPdfFontSize(doc, bottomText, maxWidth, 4.9, 3.6);
  doc.setTextColor(24, 33, 43);
  doc.setFont("helvetica", topBold ? "bold" : "normal");
  doc.setFontSize(topSize);
  doc.text(topText, x + 3, y + 4.5, { maxWidth });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(bottomSize);
  doc.text(bottomText, x + 3, y + cellH - 4.5, { maxWidth });
}

function fitPdfFontSize(doc, text, maxWidth, startSize, minSize = 3.5) {
  let size = startSize;
  while (size > minSize) {
    doc.setFontSize(size);
    if (doc.getTextWidth(text) <= maxWidth) break;
    size -= 0.2;
  }
  return Math.max(minSize, Number(size.toFixed(1)));
}

function drawPdfSection(doc, x, y, w, h, title, rows) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(198, 210, 223);
  doc.roundedRect(x, y, w, h, 8, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, x + 8, y + 14);
  let cursorY = y + 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  (rows || []).forEach((row) => {
    const text = `${row.title} · ${row.body}`;
    const lines = doc.splitTextToSize(text, w - 16);
    if (cursorY + lines.length * 10 > y + h - 8) return;
    doc.text(lines, x + 8, cursorY);
    cursorY += lines.length * 10 + 4;
  });
}

function dailyTeacherSummary(slots) {
  const rows = [];
  const byDay = new Map();
  slots.forEach((slot) => {
    const day = normalizeDay(slot.day);
    byDay.set(day, (byDay.get(day) || 0) + slotDuration(slot));
  });
  [...byDay.entries()].sort((a, b) => naturalSort(a[0], b[0])).forEach(([day, hours]) => {
    rows.push({ title: day, body: `${hours}h` });
  });
  return rows;
}

function countTeacherTwoHourBlocks(slots) {
  const byDay = new Map();
  (slots || []).forEach((slot) => {
    const day = normalizeDay(slot.day);
    const periods = occupiedPeriods(slot).map((key) => Number(key.split("-")[1])).sort((a, b) => a - b);
    const list = byDay.get(day) || [];
    list.push({ start: periods[0], end: periods[periods.length - 1] });
    byDay.set(day, list);
  });
  let count = 0;
  byDay.forEach((blocks) => {
    const sorted = blocks.sort((a, b) => a.start - b.start);
    let current = null;
    sorted.forEach((block) => {
      if (!current) {
        current = { ...block };
        return;
      }
      if (block.start <= current.end + 1) {
        current.end = Math.max(current.end, block.end);
        return;
      }
      if (current.end - current.start + 1 >= 2) count++;
      current = { ...block };
    });
    if (current && current.end - current.start + 1 >= 2) count++;
  });
  return count;
}

function pdfPeriodCountForTeacher(level, slots) {
  const base = maxPeriod(level);
  const slotMax = Math.max(base, ...(slots || []).map((slot) => Number(slot.period || 1) + slotDuration(slot) - 1));
  return Math.max(base, slotMax || base);
}

function hexToRgb(hex) {
  const clean = String(hex || "").replace("#", "");
  if (clean.length !== 6) return [255, 255, 255];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16)
  ];
}

function subjectAbbrev(subject) {
  const text = String(subject || "").trim();
  if (!text) return "X";
  const key = normalizeKey(text);
  const raw = (EPQA.data?.subjects || []).find((item) => {
    const source = item && typeof item === "object" ? item : { id: item, name: item };
    return normalizeKey(source.id) === key || normalizeKey(source.name || source.nombre) === key || normalizeKey(source.abreviatura || source.abbreviation) === key;
  });
  const abbreviation = raw && typeof raw === "object" ? (raw.abreviatura || raw.abbreviation || raw.id) : "";
  if (abbreviation) return String(abbreviation).replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
  const cleaned = text.replace(/[^A-Za-z0-9]/g, "");
  return cleaned.slice(0, Math.min(4, Math.max(1, cleaned.length))).toUpperCase() || text.slice(0, 1).toUpperCase();
}

function teacherAbbrev(teacher) {
  const text = String(teacher || "").trim();
  if (!text) return "X";
  return text.replace(/[^A-Za-z0-9]/g, "").slice(0, 1).toUpperCase() || text.slice(0, 1).toUpperCase();
}

function slotHasConflict(slot) {
  return localP0Conflicts(EPQA.slots, slot.id).length > 0;
}

function findSlot(id) {
  return EPQA.slots.find((slot) => slot.id === id);
}

function findLoad(id) {
  return (EPQA.data.loads || []).find((load) => load.id === id);
}

function maxPeriod(level) {
  return normalizeLevel(level) === "primary" ? 5 : 6;
}

function boardPeriodCount(mode, filter, group = null) {
  const records = [];
  if (mode === "group") {
    const groupId = group?.id || filter || "";
    records.push(...(EPQA.data.loads || []).filter((load) => String(load.group) === String(groupId)));
    records.push(...(EPQA.slots || []).filter((slot) => String(slot.group) === String(groupId)));
  } else if (mode === "teacher") {
    const teacherId = filter && filter !== "__ALL_TEACHERS__" ? filter : "";
    records.push(...(EPQA.data.loads || []).filter((load) => !teacherId || sameTeacherLoose(load.teacher, teacherId)));
    records.push(...(EPQA.slots || []).filter((slot) => !teacherId || sameTeacherLoose(slot.teacher, teacherId)));
  } else if (mode === "room") {
    const roomNameFilter = filter && filter !== "__ALL_ROOMS__" ? filter : "";
    records.push(...(EPQA.data.loads || []).filter((load) => !roomNameFilter || sameRoom({ id: load.roomId || load.room, name: load.room || load.roomId }, load)));
    records.push(...(EPQA.slots || []).filter((slot) => !roomNameFilter || normalizeKey(slot.room) === normalizeKey(roomNameFilter) || normalizeKey(slot.roomId) === normalizeKey(roomNameFilter)));
  } else {
    records.push(...(EPQA.data.loads || []), ...(EPQA.slots || []));
  }

  const hasSecondary = records.some((item) => normalizeLevel(item.level) === "secondary");
  const hasLatePeriod = records.some((item) => Number(item.period || 0) > 5);
  return hasSecondary || hasLatePeriod ? 6 : 5;
}

function normalizeImportedData(input) {
  const data = canonicalScheduleInput(input);
  data.days = normalizeDays(data.days);
  data.groups = normalizeGroups(data.groups);
  data.teachers = normalizeTeachers(data.teachers);
  data.rooms = normalizeRooms(data.rooms);
  data.rules = data.rules || {
    general: { maxTeacherHoursPerDay: 6 },
    critical: data.criticalRules || data.constraints?.P0 || [],
    teacherSite: data.teacherSiteRules || [],
    room: data.roomRules || [],
    block: data.blockRules || []
  };
  data.rules.general = data.rules.general || { maxTeacherHoursPerDay: data.rules.maxTeacherHoursPerDay || 6, dailyExceptions: [] };
  data.rules.general.dailyExceptions = data.rules.general.dailyExceptions || [];
  (data.teachers || []).forEach((teacher) => {
    const defaultSite = teacher.siteId || teacher.site || teacher.baseSite || teacher.assignedSite || "";
    if (defaultSite) {
      const original = EPQA.data;
      EPQA.data = data;
      ensureTeacherDefaultAvailabilitySite(teacher, defaultSite);
      EPQA.data = original;
    }
  });

  if (Array.isArray(data.assignments) && data.assignments.some((item) => item.day && item.period)) {
    const normalized = normalizeCellAssignments(data.assignments, data);
    data.loads = normalized.loads;
    data.slots = normalized.slots;
    data.subjects = data.subjects || unique(data.loads.map((load) => load.subject));
    data.subjects = data.subjects.map(normalizeSubject);
    return data;
  }

  data.loads = (data.loads || data.assignments || []).map((load, index) => ({
    id: load.id || `load-${index + 1}`,
    site: load.site || load.siteId || "",
    siteId: load.siteId || load.site || "",
    level: normalizeLevel(load.level),
    group: load.group,
    subject: load.subject,
    teacher: load.teacher,
    room: load.room || roomName(load.roomId || load.requiredRoomId || "AULA"),
    roomId: load.roomId || load.requiredRoomId || roomId(load.room),
    hours: Number(load.hours || 0),
    blockHours: Number(load.blockHours || load.block_hours || 1),
    rulePriority: normalizeRulePriority(load.rulePriority || load.priority || load.blockPriority || "P0"),
    lockedTeacher: Boolean(load.lockedTeacher || load.locked || load.lockedOriginalAssignment),
  })).map((load) => ({ ...load, loadKey: loadSignature(load) }));
  data.subjects = (data.subjects && data.subjects.length ? data.subjects : unique(data.loads.map((load) => load.subject))).map(normalizeSubject);
  data.slots = data.slots || [];
  return data;
}

function canonicalScheduleInput(input) {
  const source = input && typeof input === "object" ? { ...input } : {};
  const wrapped = source.data && typeof source.data === "object" ? { ...source.data } : null;
  const sourceHasData = hasDirectScheduleData(source);
  const wrappedHasData = wrapped ? hasDirectScheduleData(wrapped) : false;
  const base = wrapped && (!sourceHasData || wrappedHasData) ? wrapped : source;
  const data = { ...base };
  const project = data.project && typeof data.project === "object" ? { ...data.project } : {};

  data.project = {
    institution: project.institution || project.name || data.institution_name || data.institution || data.schoolName || data.school || "",
    name: project.name || data.projectName || data.name || data.scheduleName || "",
    owner: project.owner || data.owner || data.responsible || "",
    year: project.year || data.year || data.academicYear || "",
    jornada: project.jornada || data.jornada || data.shift || ""
  };

  data.sites = data.sites || data.sedes || data.campus || [];
  data.rooms = data.rooms || data.espacios || data.spaces || [];
  data.teachers = data.teachers || data.docentes || data.profesores || [];
  data.groups = data.groups || data.grados || data.courses || [];
  data.subjects = data.subjects || data.materias || data.asignaturas || data.subjectList || [];
  data.loads = data.loads || data.cargas || data.asignaciones || data.assignments || data.academicLoads || [];
  data.slots = data.slots || data.matriz || data.schedule || data.grid || [];
  data.rules = data.rules || data.reglas || data.constraints || {};

  if (Array.isArray(data.groups)) {
    data.groups = data.groups.map((group) => {
      if (typeof group === "string") return { id: group, name: group };
      return { ...group };
    });
  }
  if (Array.isArray(data.subjects)) {
    data.subjects = data.subjects.map((subject) => typeof subject === "string" ? subject : { ...subject });
  }
  if (Array.isArray(data.sites)) {
    data.sites = data.sites.map((site) => typeof site === "string" ? { id: site, name: site } : { ...site });
  }
  if (Array.isArray(data.rooms)) {
    data.rooms = data.rooms.map((room) => typeof room === "string" ? { id: room, name: room } : { ...room });
  }

  return data;
}

function hasCanonicalScheduleData(input) {
  if (!input || typeof input !== "object") return false;
  const teachers = Array.isArray(input.teachers) ? input.teachers.length : 0;
  const groups = Array.isArray(input.groups)
    ? input.groups.length
    : (Array.isArray(input.groups?.primary) ? input.groups.primary.length : 0) + (Array.isArray(input.groups?.secondary) ? input.groups.secondary.length : 0);
  const subjects = Array.isArray(input.subjects) ? input.subjects.length : 0;
  const loads = Array.isArray(input.loads) ? input.loads.length : 0;
  const sites = Array.isArray(input.sites) ? input.sites.length : 0;
  const rooms = Array.isArray(input.rooms) ? input.rooms.length : 0;
  return Boolean(teachers || groups || subjects || loads || sites || rooms || projectShapeScore(input.project) || rulesShapeScore(input.rules));
}

function hasDirectScheduleData(input) {
  if (!input || typeof input !== "object") return false;
  return hasCanonicalScheduleData({
    teachers: input.teachers,
    groups: input.groups,
    subjects: input.subjects,
    loads: input.loads,
    sites: input.sites,
    rooms: input.rooms,
    project: input.project,
    rules: input.rules
  });
}

function projectShapeScore(project) {
  if (!project || typeof project !== "object") return 0;
  return Object.keys(project).filter((key) => String(project[key] || "").trim() !== "").length;
}

function rulesShapeScore(rules) {
  if (!rules || typeof rules !== "object") return 0;
  return Object.keys(rules).filter((key) => {
    const value = rules[key];
    return Array.isArray(value) ? value.length > 0 : (value && typeof value === "object" ? Object.keys(value).length > 0 : Boolean(value));
  }).length;
}

function normalizeCellAssignments(assignments, data) {
  const loadMap = new Map();
  const slots = assignments.map((assignment, index) => {
    const loadKey = [
      assignment.siteId || assignment.site || "",
      normalizeLevel(assignment.level),
      assignment.group || "",
      assignment.subject || "",
      assignment.teacher || "",
      assignment.requiredRoomId || assignment.roomId || "AULA"
    ].join("|");

    if (!loadMap.has(loadKey)) {
      loadMap.set(loadKey, {
        id: stableLoadId(loadKey, loadMap.size + 1),
        site: assignment.siteId || assignment.site || "",
        siteId: assignment.siteId || assignment.site || "",
        level: normalizeLevel(assignment.level),
        group: assignment.group,
        subject: assignment.subject,
        teacher: assignment.teacher,
        room: roomName(assignment.requiredRoomId || assignment.roomId || "AULA", data.rooms),
        roomId: assignment.requiredRoomId || assignment.roomId || "AULA",
        hours: 0,
        blockHours: 1,
        rulePriority: "P0",
        lockedTeacher: Boolean(assignment.lockedOriginalAssignment),
        source: assignment.source || "JSON",
        loadKey
      });
    }

    const load = loadMap.get(loadKey);
    load.hours += 1;
    return {
      id: assignment.id || `slot-${index + 1}`,
      loadId: load.id,
      day: normalizeDay(assignment.day),
      period: periodNumber(assignment.period),
      group: assignment.group,
      level: normalizeLevel(assignment.level),
      subject: assignment.subject,
      teacher: assignment.teacher,
      room: roomName(assignment.roomId || assignment.requiredRoomId || "AULA", data.rooms),
      roomId: assignment.roomId || assignment.requiredRoomId || "AULA",
      site: assignment.siteId || assignment.site || "",
      siteId: assignment.siteId || assignment.site || "",
      source: assignment.source || "JSON",
      locked: Boolean(assignment.lockedOriginalAssignment),
      duration: 1,
      loadKey
    };
  });

  return { loads: Array.from(loadMap.values()), slots };
}

function normalizeGroups(groups) {
  if (Array.isArray(groups)) {
    return groups;
  }
  return groups || { primary: [], secondary: [] };
}

function normalizeTeachers(teachers) {
  if (!Array.isArray(teachers)) return [];
  return teachers.map((teacher) => {
    const normalized = typeof teacher === "string" ? { id: teacher, name: teacher } : { ...teacher };
    normalized.availability = normalizeTeacherAvailability(normalized.availability);
    return normalized;
  });
}

function normalizeTeacherAvailability(availability) {
  if (!availability || typeof availability !== "object") return {};
  return Object.entries(availability).reduce((carry, [day, record]) => {
    carry[normalizeDay(day)] = record && typeof record === "object" ? { ...record } : record;
    return carry;
  }, {});
}

function normalizeRooms(rooms) {
  if (!Array.isArray(rooms)) return [];
  return rooms.map((room) => typeof room === "string" ? { id: room, name: room } : room);
}

function normalizeDays(days) {
  const fallback = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  return Array.isArray(days) && days.length ? days.map(normalizeDay) : fallback;
}

function normalizeDay(day) {
  const key = normalizeKey(day);
  if (key.includes("Miércoles")) return "Miércoles";
  return {
    LUNES: "Lunes",
    MARTES: "Martes",
    Miércoles: "Miércoles",
    JUEVES: "Jueves",
    VIERNES: "Viernes"
  }[key] || day;
}

function normalizeLevel(level) {
  const key = normalizeKey(level);
  if (key === "PRIMARIA" || key === "PRIMARY") return "primary";
  if (key === "SECUNDARIA" || key === "SECONDARY") return "secondary";
  return level || "secondary";
}

function periodNumber(period) {
  if (typeof period === "number") return period;
  const match = String(period || "").match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function roomName(idOrName, rooms = EPQA.data?.rooms || []) {
  const raw = String(idOrName || "AULA");
  const found = (rooms || []).find((room) => room.id === raw || room.name === raw);
  if (found) return found.name || found.id;
  if (raw.includes("SALA_TI")) return raw.includes("RECREO") ? "Sala TI Recreo" : "Sala TI Filo";
  if (raw.includes("CANCHA")) return raw.includes("RECREO") ? "Cancha Recreo" : "Cancha Filo";
  if (raw.includes("ESPACIO_ALTERNO")) return "Espacio alterno EF Filo";
  return raw === "AULA" ? "Aula" : raw;
}

function roomId(name) {
  const key = normalizeKey(name);
  if (key.includes("SALA") && key.includes("TI") && key.includes("RECREO")) return "SALA_TI_RECREO";
  if (key.includes("SALA") && key.includes("TI")) return "SALA_TI_FILO";
  if (key.includes("CANCHA") && key.includes("RECREO")) return "CANCHA_RECREO";
  if (key.includes("CANCHA")) return "CANCHA_FILO";
  return "AULA";
}

function isProtectedRoom(room) {
  return isTiRoom(room) || isCourtRoom(room) || normalizeKey(room).includes("ESPACIO ALTERNO EF");
}

function isTiRoom(room) {
  const key = normalizeKey(room);
  return key.includes("SALA TI") || key.includes("SALA_TI");
}

function isCourtRoom(room) {
  const key = normalizeKey(room);
  return key.includes("CANCHA") || key.includes("ESPACIO ALTERNO EF");
}

function isTiSubject(subject) {
  const key = normalizeKey(subject);
  return key.includes("TECNOLOGIA E INFORMATICA") || key === "DPC" || key.includes("EMPRENDIMIENTO") || key.includes("PENSAMIENTO COMPUTACIONAL");
}

function isPeSubject(subject) {
  const key = normalizeKey(subject);
  return key === "EDUFISICA" || key.includes("EDUCACION FISICA");
}

function stableLoadId(key, index) {
  return `load-${index}-${normalizeKey(key).replace(/[^A-Z0-9]+/g, "-").slice(0, 60)}`;
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .trim()
    .toUpperCase();
}

function teacherKey(teacher) {
  if (!teacher) return "";
  return teacher.id || teacher.name || String(teacher);
}

function loadSignature(load) {
  if (!load) return "";
  return [
    normalizeKey(load.teacher),
    normalizeKey(load.group),
    normalizeKey(load.subject),
    normalizeLevel(load.level),
    normalizeKey(load.siteId || load.site || ""),
    normalizeKey(load.roomId || load.room || ""),
    normalizeKey(load.blockHours || load.block_hours || 1),
    normalizeRulePriority(load.rulePriority || load.priority || load.blockPriority || "P0"),
    unique((load.preferredDays || []).map(normalizeDay)).sort(naturalSort).join(",")
  ].join("|");
}

function sameTeacher(a, b) {
  return normalizeKey(a) === normalizeKey(b);
}

function sameTeacherLoose(a, b) {
  const left = normalizeKey(a);
  const right = normalizeKey(b);
  return left === right || (left && right && (left.startsWith(right) || right.startsWith(left)));
}

function findTeacher(value) {
  const key = normalizeKey(value);
  if (!key) return null;
  return (EPQA.data?.teachers || []).find((teacher) =>
    normalizeKey(teacher.id) === key ||
    normalizeKey(teacher.name) === key ||
    normalizeKey(teacherKey(teacher)) === key
  ) || null;
}

function labelForMode(mode) {
  return { group: "Grado", teacher: "Profesor", room: "Espacio" }[mode] || mode;
}

function dayHeaderLabel(mode, filter, day) {
  if (mode !== "teacher" || !filter) return day;
  const site = siteForTeacherDay(filter, day);
  const siteLabel = siteNameForId(site);
  return siteLabel ? `${day} (${siteLabel})` : day;
}

function siteNameForId(siteId) {
  if (!siteId) return "";
  const site = siteOptions().find((item) => sameSite(item.id, siteId) || sameSite(item.name, siteId));
  return site?.name || siteId;
}

function notify(title, message = "", type = "info", modal = false) {
  playUiSound(type);
  const formattedMessage = formatAlertMessage(message);
  if (modal) {
    openUxModal(title, formattedMessage, type);
    return;
  }
  const stack = byId("toastStack");
  if (!stack) {
    window.alert(message ? `${title}\n${message}` : title);
    return;
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<strong>${escapeHtml(title)}</strong>${formattedMessage ? `<span>${escapeHtml(formattedMessage)}</span>` : ""}`;
  stack.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 20);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 220);
  }, type === "error" ? 5200 : 3200);
}

function confirmAction(title, message, onConfirm, confirmLabel = "Continúar") {
  openUxModal(title, formatAlertMessage(message), "warning", {
    confirmLabel,
    cancelLabel: "Cancelar",
    onConfirm
  });
}

function openUxModal(title, message, type = "info", options = null) {
  const modal = byId("uxModal");
  if (!modal) {
    window.alert(message ? `${title}\n${message}` : title);
    return;
  }
  byId("uxModalTitle").textContent = title;
  byId("uxModalMessage").textContent = formatAlertMessage(message);
  byId("uxModalIcon").className = `ux-modal-icon ${type}`;
  byId("uxModalIcon").textContent = { success: "OK", warning: "!", error: "!", info: "i" }[type] || "i";
  const okButton = byId("uxModalOk");
  const cancelButton = byId("uxModalCancel");
  const upgradeButton = byId("uxModalUpgrade");
  modal.querySelector(".ux-modal-card")?.classList.toggle("wide", Boolean(options?.wide));
  okButton.textContent = options?.confirmLabel || "Entendido";
  okButton.onclick = () => {
    const action = modal._onConfirm;
    closeUxModal();
    if (action) action();
  };
  if (options?.onConfirm) {
    modal._onConfirm = options.onConfirm;
    cancelButton.hidden = false;
    cancelButton.textContent = options.cancelLabel || "Cancelar";
  } else {
    modal._onConfirm = null;
    cancelButton.hidden = true;
  }
  if (upgradeButton) {
    upgradeButton.hidden = !options?.showUpgrade;
  }
  modal.hidden = false;
  modal.removeAttribute("hidden");
  document.body.classList.add("modal-open");
}

function formatAlertMessage(message) {
  return String(message || "")
    .replace(/\s*\|\s*/g, "\n")
    .replace(/;\s*/g, "\n")
    .replace(/(Faltaron|Pendientes|Restricciones|Porque|Origen|Destino):/gi, "\n$1:")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function closeUxModal() {
  const modal = byId("uxModal");
  if (!modal) return;
  modal._onConfirm = null;
  const okButton = byId("uxModalOk");
  if (okButton) {
    okButton.textContent = "Entendido";
    okButton.onclick = null;
  }
  modal.querySelector(".ux-modal-card")?.classList.remove("wide");
  const cancelButton = byId("uxModalCancel");
  if (cancelButton) cancelButton.hidden = true;
  const upgradeButton = byId("uxModalUpgrade");
  if (upgradeButton) upgradeButton.hidden = true;
  modal.hidden = true;
  modal.setAttribute("hidden", "");
  if (byId("availabilityModal")?.hidden !== false) {
    document.body.classList.remove("modal-open");
  }
}

function showGenerationModal(message, progress = 0) {
  const modal = byId("generationModal");
  if (!modal) return;
  byId("generationMessage").textContent = message;
  byId("generationProgress").style.width = `${Math.max(0, Math.min(100, progress))}%`;
  modal.hidden = false;
  modal.removeAttribute("hidden");
  document.body.classList.add("modal-open");
}

function hideGenerationModal() {
  const modal = byId("generationModal");
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("hidden", "");
  if (byId("availabilityModal")?.hidden !== false && byId("uxModal")?.hidden !== false) {
    document.body.classList.remove("modal-open");
  }
}

function waitFrame() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function seedRandom(seed) {
  const value = Math.sin(seed * 9301 + 49297) * 233280;
  return value - Math.floor(value);
}

function seededTie(seed, slot) {
  const text = `${slot.teacher}|${slot.group}|${slot.subject}|${slot.day}|${slot.period}|${slot.room}`;
  let hash = seed;
  for (let index = 0; index < text.length; index++) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }
  return seedRandom(hash);
}

function shuffleArray(items, seed = 1) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(seedRandom(seed + index) * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function playUiSound(type = "info") {
  if (!EPQA.ui.soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    EPQA.ui.audio = EPQA.ui.audio || new AudioContext();
    const ctx = EPQA.ui.audio;
    if (ctx.state === "suspended") ctx.resume();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const tones = {
      success: [660, 880],
      lift: [360, 520],
      drop: [760, 980],
      info: [520, 660],
      warning: [440, 330],
      error: [220, 180]
    }[type] || [520, 660];
    oscillator.type = type === "error" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(tones[0], ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(tones[1], ctx.currentTime + 0.11);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(type === "error" ? 0.045 : 0.035, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.18);
  } catch (error) {
    EPQA.ui.soundEnabled = false;
  }
}

function cellCycleLevel(mode, filter, primarySlot, day, period, groupId = "") {
  if (mode === "group" && filter && filter !== "__ALL_GROUPS__") {
    return normalizeLevel(groupObjectById(filter)?.level || inferGroupLevel(filter));
  }
  if (mode === "group" && groupId) {
    return normalizeLevel(groupObjectById(groupId)?.level || inferGroupLevel(groupId));
  }
  if (mode === "teacher" && filter && filter !== "__ALL_TEACHERS__") {
    const teacher = findTeacher(filter);
    return normalizeLevel(teacher?.type || teacher?.level || "secondary");
  }
  if (primarySlot?.level) return normalizeLevel(primarySlot.level);
  const contextual = (EPQA.slots || []).find((slot) => slot.day === day && Number(slot.period) === Number(period));
  if (contextual?.level) return normalizeLevel(contextual.level);
  return "secondary";
}

function teacherCycleLevel(teacher) {
  const raw = teacher?.type || teacher?.level || teacher?.cycle || teacher?.stage || "secondary";
  return normalizeLevel(raw);
}

function groupCycleLevel(group) {
  return normalizeLevel(group?.level || inferGroupLevel(group?.id));
}

function availableTeachersForCell(level, day, period) {
  const cycle = normalizeLevel(level || "secondary");
  const timeKey = `${day}-${Number(period)}`;
  return (EPQA.data.teachers || [])
    .filter((teacher) => teacherCycleLevel(teacher) === cycle)
    .filter((teacher) => {
      const teacherName = teacherKey(teacher);
      const occupied = (EPQA.slots || []).some((slot) => sameTeacherLoose(slot.teacher, teacherName) && occupiedPeriods(slot).includes(timeKey));
      if (occupied) return false;
      const availability = normalizeAvailabilityRecord(teacher.availability?.[day]);
      if (availability?.slots) {
        const periodKey = `H${Number(period)}`;
        const state = normalizeAvailabilityState(availability.slots?.[periodKey] || "available");
        if (state === "unavailable") return false;
      }
      return true;
    })
    .sort((a, b) => naturalSort(a.name || a.id || "", b.name || b.id || ""));
}

function availableGroupsForCell(level, day, period) {
  const cycle = normalizeLevel(level || "secondary");
  const timeKey = `${day}-${Number(period)}`;
  return groupOptions()
    .filter((group) => groupCycleLevel(group) === cycle)
    .filter((group) => {
      return !(EPQA.slots || []).some((slot) => String(slot.group) === String(group.id) && occupiedPeriods(slot).includes(timeKey));
    })
    .sort((a, b) => naturalSort(a.name || a.id || "", b.name || b.id || ""));
}

function buildCellAvailabilityTooltip(cell) {
  const mode = cell.dataset.mode || byId("viewMode")?.value || "";
  const filter = cell.dataset.filter || byId("viewFilter")?.value || "";
  const day = cell.dataset.day;
  const period = Number(cell.dataset.period || 0);
  if (!day || !period || cell.querySelector(".class-card, .panorama-card")) return "";

  const cycle = cell.dataset.level || cellCycleLevel(mode, filter, null, day, period, cell.dataset.group || "");
  const target = mode === "teacher" ? availableGroupsForCell(cycle, day, period) : availableTeachersForCell(cycle, day, period);
  const label = mode === "teacher" ? "Grados disponibles" : "Docentes disponibles";
  const emptyLabel = mode === "teacher" ? "Sin grados disponibles" : "Sin docentes disponibles";
  const limit = 8;
  const items = target.slice(0, limit).map((item) => {
    const name = escapeHtml(item.name || item.id || "");
    const site = escapeHtml(item.siteId || item.site || "");
    return `<span class="tooltip-chip">${name}${site ? `<small>${site}</small>` : ""}</span>`;
  }).join("");
  const suffix = target.length > limit ? `<span class="tooltip-more">+${target.length - limit} mas</span>` : "";
  return `
    <div class="cell-tooltip">
      <strong>${escapeHtml(day)} H${period} · "primary" ? "Primaria" : "Secundaria"}</strong>
      <p>${label} sin asignacion en esa franja.</p>
      <div class="tooltip-chip-list">${items || `<span class="tooltip-empty">${emptyLabel}</span>`}${suffix}</div>
    </div>
  `;
}

function ensureHoverInspector() {
  let inspector = byId("hoverInspector");
  if (inspector) return inspector;
  inspector = document.createElement("div");
  inspector.id = "hoverInspector";
  inspector.className = "hover-inspector";
  inspector.hidden = true;
  inspector.innerHTML = `
    <strong></strong>
    <span></span>
  `;
  document.body.appendChild(inspector);
  return inspector;
}

function updateHoverInspector(title, body, tone = "info") {
  const inspector = ensureHoverInspector();
  inspector.hidden = false;
  inspector.dataset.tone = tone;
  inspector.querySelector("strong").textContent = title || "";
  inspector.querySelector("span").textContent = body || "";
}

function clearHoverInspector() {
  const inspector = byId("hoverInspector");
  if (!inspector) return;
  inspector.hidden = true;
  inspector.dataset.tone = "";
  inspector.querySelector("strong").textContent = "";
  inspector.querySelector("span").textContent = "";
}

function activateTooltips() {
  if (!window.tippy || window.__EPQA_TIPPY_DISABLED) return;
  ensureHoverInspector();
  try {
    document.querySelectorAll(".slot-cell:not(.covered-cell)").forEach((cell) => {
      if (cell.querySelector(".class-card, .panorama-card") || cell._epqaCellTip) return;
      cell._epqaCellTip = tippy(cell, {
        content: () => buildCellAvailabilityTooltip(cell),
        allowHTML: true,
        placement: "top",
        delay: [120, 0],
        maxWidth: 420,
        theme: "epqa-availability",
        interactive: true,
        appendTo: () => document.body,
        onShow() {
          const mode = cell.dataset.mode || byId("viewMode")?.value || "";
          const filter = cell.dataset.filter || byId("viewFilter")?.value || "";
          const cycle = cell.dataset.level || cellCycleLevel(mode, filter, null, cell.dataset.day, Number(cell.dataset.period || 0), cell.dataset.group || "");
          const target = mode === "teacher" ? availableGroupsForCell(cycle, cell.dataset.day, Number(cell.dataset.period || 0)) : availableTeachersForCell(cycle, cell.dataset.day, Number(cell.dataset.period || 0));
          updateHoverInspector(
            `${cell.dataset.day} H${cell.dataset.period} · "primary" ? "Primaria" : "Secundaria"}`,
            `${mode === "teacher" ? "Grados" : "Docentes"} disponibles: ${target.slice(0, 6).map((item) => item.name || item.id).join(", ") || "ninguno"}`,
            "info"
          );
        },
        onHidden() {
          clearHoverInspector();
        }
      });
      cell.addEventListener("pointerenter", () => {
        if (cell.querySelector(".class-card, .panorama-card")) return;
        const mode = cell.dataset.mode || byId("viewMode")?.value || "";
        const filter = cell.dataset.filter || byId("viewFilter")?.value || "";
        const cycle = cell.dataset.level || cellCycleLevel(mode, filter, null, cell.dataset.day, Number(cell.dataset.period || 0), cell.dataset.group || "");
        const target = mode === "teacher" ? availableGroupsForCell(cycle, cell.dataset.day, Number(cell.dataset.period || 0)) : availableTeachersForCell(cycle, cell.dataset.day, Number(cell.dataset.period || 0));
        updateHoverInspector(
          `${cell.dataset.day} H${cell.dataset.period} · "primary" ? "Primaria" : "Secundaria"}`,
          `${mode === "teacher" ? "Grados" : "Docentes"} disponibles: ${target.slice(0, 6).map((item) => item.name || item.id).join(", ") || "ninguno"}`,
          "info"
        );
      });
      cell.addEventListener("pointerleave", clearHoverInspector);
    });
    document.querySelectorAll(".slot-cell.conflict").forEach((cell) => {
      if (cell._epqaConflictTip) return;
      cell._epqaConflictTip = tippy(cell, {
        content: cell.dataset.conflicts || "Esta hora tiene conflictos P0.",
        placement: "top",
        delay: [120, 0],
        maxWidth: 380,
        theme: "epqa-conflict"
      });
    });
    document.querySelectorAll(".class-card").forEach((card) => {
      const slot = findSlot(card.dataset.slotId);
      if (!slot) return;
      const conflicts = conflictDetailsForSlot(slot);
      const conflictText = conflicts.length ? ` | Conflictos: ${conflicts.join(" | ")}` : "";
      if (card._epqaCardTip) return;
      card._epqaCardTip = tippy(card, {
        content: `${slot.teacher} · ${slot.source}`,
        placement: "top",
        delay: [120, 0],
        maxWidth: 380,
        theme: conflicts.length ? "epqa-conflict" : "epqa",
        onShow(instance) {
          instance.setContent(`${slot.teacher} · ${slot.source}${conflictText}`);
        }
      });
      card.addEventListener("pointerenter", () => {
        updateHoverInspector(
          `${slot.teacher} · ${slot.subject}`,
          `${slot.group} · "Aula"} · ${slotDuration(slot)}h`,
          "slot"
        );
      });
      card.addEventListener("pointerleave", clearHoverInspector);
    });
    document.querySelectorAll(".pending-card").forEach((card) => {
      if (card._epqaPendingTip) return;
      card._epqaPendingTip = tippy(card, {
        content: card.dataset.duration ? `${card.dataset.duration}h pendiente` : "Pendiente por ubicar",
        placement: "top",
        delay: [120, 0],
        maxWidth: 320,
        theme: "epqa"
      });
      const load = findLoad(card.dataset.loadId);
      if (!load) return;
      card.addEventListener("pointerenter", () => {
        updateHoverInspector(
          `${load.teacher} · ${load.subject}`,
          `Pendiente ${card.dataset.duration || 1}h · "Aula"} · ubicar`,
          "warn"
        );
      });
      card.addEventListener("pointerleave", clearHoverInspector);
    });
  } catch (error) {
    window.__EPQA_TIPPY_DISABLED = true;
    console.warn("EPQA tooltips disabled", error);
  }
}

function borderColor(hex) {
  return hex.replace("#", "").length === 6 ? `#${hex.replace("#", "").slice(0, 4)}88` : "#2563a8";
}

function colorForItem(item, mode) {
  if (mode === "group" || mode === "pending") {
    return EPQA.palette[item.subject] || generatedPastel(item.subject || "base");
  }
  return generatedPastel(`${item.subject || ""}|${item.group || ""}`);
}

function generatedPastel(seed) {
  const palette = [
    "#fde2e4", "#dbeafe", "#dcfce7", "#ccfbf1", "#fef3c7",
    "#fed7aa", "#e0e7ff", "#fbcfe8", "#bbf7d0", "#cffafe",
    "#ddd6fe", "#fae8ff", "#f5f5f4", "#e7e5e4", "#fecdd3",
    "#bae6fd", "#c7d2fe", "#f0fdf4", "#ffedd5", "#e9d5ff"
  ];
  let hash = 0;
  const text = normalizeKey(seed);
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function naturalSort(a, b) {
  return String(a).localeCompare(String(b), "es", { numeric: true });
}

function byId(id) {
  return document.getElementById(id);
}

function byAnyId(...ids) {
  for (const id of ids) {
    const node = byId(id);
    if (node) return node;
  }
  return null;
}

function setTextAny(value, ...ids) {
  const node = byAnyId(...ids);
  if (node) node.textContent = value;
}

function onAny(eventName, handler, ...ids) {
  const node = byAnyId(...ids);
  if (node) node.addEventListener(eventName, handler);
  return node;
}

function openPanel(panelName) {
  document.querySelector(`.nav-item[data-panel="${cssEscape(panelName)}"]`)?.click();
}

function openConfigSection(sectionName) {
  const dataPanelButton = document.querySelector('.nav-item[data-panel="data"]');
  if (dataPanelButton) dataPanelButton.click();
  const targetMap = {
    docentes: "Docentes",
    grados: "Grados",
    materias: "Materias",
    asignaciones: "Asignaciones",
    disponibilidad: "Disponibilidad",
    reglas: "Reglas"
  };
  const label = targetMap[String(sectionName || "").toLowerCase()];
  if (!label) return;
  const button = [...document.querySelectorAll(".config-tab")].find((item) =>
    normalizeKey(item.textContent).includes(normalizeKey(label))
  );
  button?.click();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(String(value));
  return String(value).replace(/["\\]/g, "\\$&");
}
