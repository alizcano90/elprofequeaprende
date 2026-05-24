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
  const labels = ["Institucion", "Sedes", "Docentes", "Resumen docente", "Resumen grados", "Grados", "Materias", "Reglas", "Asignaciones", "Disponibilidad", "JSON"];
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
  onAny("click", () => openPanel("audit"), "btnDashIrAuditoria", "btnDashVerAuditoria");
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
  byId("teacherDetailSelect")?.addEventListener("change", renderTeacherDetailPanel);
  byId("groupDetailSelect")?.addEventListener("change", renderGroupDetailPanel);
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
      EPQA.data = normalizeImportedData(hasCanonicalScheduleData(snapshotData) ? snapshotData : currentData);
      EPQA.slots = Array.isArray(payload.active.slots) ? payload.active.slots : (EPQA.data.slots || []);
      EPQA.audit = payload.active.audit || EPQA.audit;
      if (byId("jsonInput")) byId("jsonInput").value = JSON.stringify(EPQA.data, null, 2);
      updateDataLoadAlert({ data: EPQA.data, slots: EPQA.slots, audit: EPQA.audit });
      try {
        renderDataViews();
      } catch (renderError) {
        console.error("EPQA render error after loading schedule", renderError);
        showDataLoadAlert("El horario activo cargo con advertencias visuales. Revisa si faltan datos en Institución, Docentes, Grados, Materias o Cargas.");
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("EPQA load schedule error", error);
    return false;
  }
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
  if (!EPQA.audit || !Array.isArray(EPQA.audit.results)) missing.push("no hay auditoría cargada");
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
  renderDashboardOverview(active);
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
  setTextAny(critical > 0 ? "Corrección obligatoria" : strong > 0 ? "Revisar reglas importantes" : hasProposal ? "Listo para exportar" : "Listo para revisar", "workspaceNextActionBadge");

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
      <div class="epqa-flow-step-v2 ${step.state === "is-complete" ? "epqa-flow-step-v2--done" : step.label === "Generación" && step.state !== "is-complete" ? "epqa-flow-step-v2--active" : (step.label === "Auditoría" || step.label === "Consolidado") && critical > 0 ? "epqa-flow-step-v2--warning" : step.state === "is-pending" ? "epqa-flow-step-v2--pending" : "epqa-flow-step-v2--warning"}">
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
    if (strong > 0) rows.push(dashboardAlert("warning", `${strong} reglas importantes por revisar`, "Pueden aceptarse o ajustarse según el criterio institucional."));
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
  if (!hasBasics) return "Continuar construccion";
  if (!hasLoads) return "Asignar materias";
  if (!hasProposal) return "Generar horario";
  if (critical > 0) return "Revisar problemas";
  if (strong > 0) return "Revisar reglas importantes";
  if (pendingHours > 0) return "Completar pendientes";
  return "Ver horario generado";
}

function chooseDashboardNextHelp({ hasBasics, hasLoads, hasProposal, critical, strong, pendingHours }) {
  if (!hasBasics) return "Registra institucion, docentes, grupos y materias para empezar.";
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
  byId("loadsTable").innerHTML = rows.map((load) => `
    <tr data-load-id="${escapeHtml(load.id)}">
      <td>${escapeHtml(load.teacher)}</td>
      <td>${escapeHtml(load.group)}</td>
      <td>${escapeHtml(load.subject)}</td>
      <td>${Number(load.hours || 0)}h</td>
      <td>${blockHours(load) > 1 ? `${blockHours(load)}h` : "No"}</td>
      <td><span class="badge ${loadRulePriority(load)}">${loadRulePriority(load)}</span></td>
      <td>${escapeHtml(preferredDaysLabel(load))}</td>
      <td>${escapeHtml(load.room || load.roomId || "Aula disponible")}</td>
      <td class="load-row-actions">
        <button class="ghost edit-load" type="button" data-load-id="${escapeHtml(load.id)}">Editar</button>
        <button class="ghost danger delete-load" type="button" data-load-id="${escapeHtml(load.id)}">Quitar</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="9" class="teacher-empty">No hay cargas con esos filtros.</td></tr>`;
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
  if (byId("maxTeacherHoursPerDay")) byId("maxTeacherHoursPerDay").value = maxTeacherHoursPerDay();
  fillSelect("dailyRuleTeacher", teacherOptions(), "id", "name");
  fillSelect("dailyRuleSite", siteOptions(), "id", "name");
  fillSelect("dailyRuleDay", dayOptions(), "id", "name");
  fillSelect("groupSite", siteOptions(), "id", "name");
  fillSelect("roomSite", siteOptions(), "id", "name");
  fillSelect("teacherDefaultSite", siteOptionsWithEmpty(), "id", "name");
  fillSelect("loadTeacher", teacherOptions(), "id", "name");
  fillSelect("teacherDetailSelect", teacherOptions(), "id", "name");
  fillSelect("groupDetailSelect", groupOptions(), "id", "name");
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
  return unique([...(EPQA.data.subjects || []), ...(EPQA.data.loads || []).map((load) => load.subject)])
    .map((subject) => typeof subject === "string" ? { id: subject, name: subject } : { id: subject.name || subject.id, name: subject.name || subject.id });
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
    ? (EPQA.data?.days?.length ? EPQA.data.days : ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]).map(normalizeDay)
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
  days.forEach((day) => upsertDailyRuleException({
    ...baseRule,
    id: `daily-rule-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    day
  }));
  saveGeneralRules();
  notify("Excepcion agregada", selectedDay === "__ALL_DAYS__" ? "La regla quedo aplicada a todos los dias." : "La regla por docente, sede y dia quedo registrada.", "success");
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
  if (footerIcon) footerIcon.textContent = "♙";

  const layout = mainCard.querySelector(".epqa-docentes-layout-v3");
  if (layout) layout.classList.add("epqa-docentes-layout-v3--compact");

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
    if (teacherForm) modal.querySelector(".epqa-teacher-modal-body")?.appendChild(teacherForm);
    formPanel.remove();
    document.body.appendChild(modal);
  }

  if (!mainCard.querySelector(".epqa-docentes-actions-v4")) {
    const actions = document.createElement("section");
    actions.className = "epqa-docentes-actions-v4";
    actions.setAttribute("aria-label", "Acciones de docentes");
    actions.innerHTML = `
      <button class="epqa-docente-action-card-v4 epqa-docente-action-card-v4--blue" id="btnTeacherQuickCreate" type="button">
        <span class="epqa-docente-action-icon-v4">➕</span>
        <span class="epqa-docente-action-copy-v4">
          <strong>Nuevo docente</strong>
          <small>Agrega un docente rápidamente</small>
        </span>
        <span class="epqa-docente-action-arrow-v4">›</span>
      </button>

      <article class="epqa-docente-action-card-v4 epqa-docente-action-card-v4--green">
        <span class="epqa-docente-action-icon-v4">⬆️</span>
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

function populateTeacherFilterSites() {
  const select = byId("teacherSiteFilter");
  if (!select) return;
  const currentValue = select.value || "__ALL__";
  const options = [{ id: "__ALL__", name: "Todas las sedes" }, ...siteOptionsWithEmpty().filter((site) => site.id)];
  select.innerHTML = options.map((site) => `<option value="${escapeHtml(site.id)}">${escapeHtml(site.name)}</option>`).join("");
  select.value = options.some((site) => site.id === currentValue) ? currentValue : "__ALL__";
}

function applyTeacherFilters() {
  const target = byId("teacherManager");
  if (!target) return;
  const search = normalizeKey(byId("teacherSearchInput")?.value || "");
  const typeFilter = byId("teacherTypeFilter")?.value || "__ALL__";
  const siteFilter = byId("teacherSiteFilter")?.value || "__ALL__";
  const rows = target.querySelectorAll("tbody tr[data-teacher-index]");
  const noResultsRow = target.querySelector(".epqa-teacher-no-results-row");
  let visible = 0;
  rows.forEach((row) => {
    const label = normalizeKey(row.dataset.teacherLabel || row.textContent || "");
    const type = normalizeKey(row.dataset.teacherType || "");
    const site = row.dataset.teacherSite || "";
    const matchesSearch = !search || label.includes(search);
    const matchesType = typeFilter === "__ALL__" || normalizeKey(typeFilter) === type;
    const matchesSite = siteFilter === "__ALL__" || sameSite(site, siteFilter) || normalizeKey(site) === normalizeKey(siteFilter);
    const show = matchesSearch && matchesType && matchesSite;
    row.hidden = !show;
    if (show) visible += 1;
  });
  if (noResultsRow) noResultsRow.hidden = visible > 0;
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
  const input = byId("teacherName");
  setTimeout(() => input?.focus(), 0);
}

function closeTeacherModal() {
  const modal = byId("teacherFormModal");
  if (!modal) return;
  modal.hidden = true;
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

function renderGroupManager() {
  const target = byId("groupManager");
  if (!target) return;
  const groups = groupOptions().map((group) => groupObjectById(group.id));
  const groupRows = groups.map((group, index) => `
    <tr data-group-id="${escapeHtml(group.id || group.name || "")}">
      <td><input data-catalog-field="group-id" value="${escapeHtml(group.id || group.name || "")}"></td>
      <td><input data-catalog-field="group-name" value="${escapeHtml(group.name || group.id || "")}"></td>
      <td><select data-catalog-field="group-site">${siteOptionsWithEmpty().map((site) => `<option value="${escapeHtml(site.id)}" ${sameSite(site.id, group.siteId || group.site || "") ? "selected" : ""}>${escapeHtml(site.name)}</option>`).join("")}</select></td>
      <td><select data-catalog-field="group-level">
        <option value="primary" ${normalizeLevel(group.level) === "primary" ? "selected" : ""}>Primaria</option>
        <option value="secondary" ${normalizeLevel(group.level) === "secondary" ? "selected" : ""}>Secundaria</option>
      </select></td>
      <td class="catalog-actions">
        <button class="ghost" data-save-group="${escapeHtml(group.id || group.name || "")}" type="button">Guardar</button>
        <button class="ghost danger" data-delete-group="${escapeHtml(group.id || group.name || "")}" type="button">Borrar</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="5">Sin grados.</td></tr>`;
  target.innerHTML = `
    <section><h3>Grados creados</h3><div class="table-scroll"><table class="catalog-mini-table"><thead><tr><th>ID</th><th>Nombre</th><th>Sede</th><th>Nivel</th><th></th></tr></thead><tbody>${groupRows}</tbody></table></div></section>`;
  bindCatalogManagerActions(target);
}

function renderSubjectManager() {
  const target = byId("subjectManager");
  if (!target) return;
  const subjectRows = subjectOptions().map((subject, index) => `
    <tr data-subject-id="${escapeHtml(subject.id)}">
      <td><input data-catalog-field="subject-name" value="${escapeHtml(subject.name)}"></td>
      <td class="catalog-actions">
        <button class="ghost" data-save-subject="${escapeHtml(subject.id)}" type="button">Guardar</button>
        <button class="ghost danger" data-delete-subject="${escapeHtml(subject.id)}" type="button">Borrar</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="2">Sin materias.</td></tr>`;
  target.innerHTML = `
    <section><h3>Materias creadas</h3><div class="table-scroll"><table class="catalog-mini-table"><thead><tr><th>Materia</th><th></th></tr></thead><tbody>${subjectRows}</tbody></table></div></section>`;
  bindCatalogManagerActions(target);
}

function renderDailyRulesManager() {
  const target = byId("dailyRulesManager");
  if (!target) return;
  const rows = dailyRuleExceptions().map((rule) => `
    <tr>
      <td>${escapeHtml(teacherName(rule.teacher))}</td>
      <td>${escapeHtml(siteNameForId(rule.site) || "Cualquier sede")}</td>
      <td>${escapeHtml(rule.day)}</td>
      <td>${rule.type === "require" ? "Exigir exactamente" : "Permitir hasta"}</td>
      <td>${Number(rule.hours || 0)}h</td>
      <td><span class="badge ${escapeHtml(rule.priority || "P0")}">${escapeHtml(rule.priority || "P0")}</span></td>
      <td><button class="ghost danger" type="button" data-delete-daily-rule="${escapeHtml(rule.id)}">Borrar</button></td>
    </tr>
  `).join("") || `<tr><td colspan="7">Sin excepciones.</td></tr>`;
  target.innerHTML = `<section><h3>Excepciones creadas</h3><div class="table-scroll"><table class="catalog-mini-table"><thead><tr><th>Docente</th><th>Sede</th><th>Dia</th><th>Tipo</th><th>Horas</th><th>Prioridad</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  target.querySelectorAll("[data-delete-daily-rule]").forEach((button) => {
    button.addEventListener("click", () => {
      EPQA.data.rules.general.dailyExceptions = dailyRuleExceptions().filter((rule) => rule.id !== button.dataset.deleteDailyRule);
      saveGeneralRules();
    });
  });
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
  const subject = normalizeKey(byId("subjectName").value);
  if (!subject) {
    notify("Falta la materia", "Escribe el nombre de la materia antes de agregarla.", "warning", true);
    return;
  }
  EPQA.data.subjects = EPQA.data.subjects || [];
  if (subject) {
    if (!EPQA.data.subjects.includes(subject)) EPQA.data.subjects.push(subject);
  }
  byId("subjectName").value = "";
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
  const days = EPQA.data?.days || ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
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
  const newName = field(row, "subject-name") || oldId;
  replaceSubjectReferences(oldId, newName);
  EPQA.data.subjects = subjectOptions().map((subject) => subject.id === oldId ? newName : subject.name || subject.id);
  renderDataViews();
}

function deleteSubject(id) {
  if (usesSubject(id)) {
    notify("No se puede borrar", "Esta materia tiene cargas u horas en el horario.", "warning", true);
    return;
  }
  EPQA.data.subjects = (EPQA.data.subjects || []).filter((subject) => (typeof subject === "string" ? subject : subject.name || subject.id) !== id);
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
  renderBulkLoadGroups();
  renderBulkLoadDrafts();
  modal.hidden = false;
  modal.removeAttribute("hidden");
  document.body.classList.add("modal-open");
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
  const roomSite = roomSiteById(roomId);
  const groups = filterGroupsByRoomSite(groupsForTeacher(teacherId), roomId);
  target.innerHTML = groups.map((group) => `
    <label class="bulk-group-option">
      <input type="checkbox" name="bulkLoadGroups" value="${escapeHtml(group.id)}">
      <span>${escapeHtml(group.name)} <small>${normalizeLevel(group.level) === "primary" ? "Primaria" : "Secundaria"}${roomSite ? ` - sede ${escapeHtml(siteNameForId(roomSite))}` : ""}${group.needsLevelReview ? " - revisar ciclo" : ""}</small></span>
    </label>
  `).join("") || `<div class="teacher-empty">No hay grados para la sede del espacio seleccionado. Revisa la sede del grado o cambia el espacio.</div>`;
}

function toggleBulkLoadGroups() {
  const checks = [...document.querySelectorAll("#bulkLoadGroups input[type='checkbox']")];
  if (!checks.length) return;
  const shouldCheck = checks.some((input) => !input.checked);
  checks.forEach((input) => { input.checked = shouldCheck; });
  byId("bulkLoadToggleGroups").textContent = shouldCheck ? "Desmarcar todos" : "Marcar todos";
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
  groups.forEach((group) => {
    EPQA.ui.bulkLoadDraft.push({ teacher, group, subject, roomId, hours, blockHours, rulePriority });
  });
  document.querySelectorAll("#bulkLoadGroups input[type='checkbox']").forEach((input) => { input.checked = false; });
  byId("bulkLoadToggleGroups").textContent = "Marcar todos";
  renderBulkLoadDrafts();
}

function renderBulkLoadDrafts() {
  const list = byId("bulkLoadDraftList");
  const total = byId("bulkLoadTotalHours");
  const teacherHours = byId("bulkLoadTeacherHours");
  const drafts = EPQA.ui.bulkLoadDraft || [];
  if (total) total.textContent = `${drafts.reduce((sum, item) => sum + Number(item.hours || 0), 0)}h`;
  if (teacherHours) {
    const teacherId = byId("bulkLoadTeacher")?.value || "";
    const current = (EPQA.data.loads || []).filter((load) => sameTeacher(load.teacher, teacherId)).reduce((sum, load) => sum + Number(load.hours || 0), 0);
    const prepared = drafts.filter((load) => sameTeacher(load.teacher, teacherId)).reduce((sum, load) => sum + Number(load.hours || 0), 0);
    teacherHours.innerHTML = `<span>Docente seleccionado</span><strong>${current}h actuales + ${prepared}h preparadas = ${current + prepared}h</strong>`;
  }
  if (!list) return;
  list.innerHTML = drafts.map((item, index) => {
    const group = groupOptions().find((option) => option.id === item.group);
    return `
      <article class="bulk-load-draft">
        <div>
          <strong>${escapeHtml(item.subject)}</strong>
          <span>${escapeHtml(group?.name || item.group)} · ${Number(item.hours || 0)}h · bloque ${Number(item.blockHours || 1)}h · ${escapeHtml(item.rulePriority)}</span>
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

function assignBulkLoadDrafts() {
  const drafts = EPQA.ui.bulkLoadDraft || [];
  if (!drafts.length) {
    notify("Sin asignaciones", "Primero agrega materias a la lista.", "warning", true);
    return;
  }
  EPQA.data.loads = EPQA.data.loads || [];
  drafts.forEach((item) => {
    EPQA.data.loads.push(buildLoad(item));
  });
  const count = drafts.length;
  const hours = drafts.reduce((sum, item) => sum + Number(item.hours || 0), 0);
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
  const hours = Math.max(0, Math.min(periods.length, Number(record?.hours ?? periods.length)));
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
  const currentTeacherId = teacherId || modal.dataset.teacher || byId("teacherDetailSelect")?.value || teacherOptions()[0]?.id || "";
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

function renderTeacherDetailPanel() {
  const panel = byId("teacherDetailPanel");
  const select = byId("teacherDetailSelect");
  if (!panel || !select) return;
  const teacherId = select.value || teacherOptions()[0]?.id || "";
  const teacher = findTeacher(teacherId);
  if (!teacher) {
    panel.innerHTML = `<div class="teacher-empty">No hay docente disponible para mostrar.</div>`;
    return;
  }

  const teacherIdForData = teacherKey(teacher);
  const loads = (EPQA.data.loads || []).filter((load) => sameTeacher(load.teacher, teacherIdForData));
  const slots = (EPQA.slots || []).filter((slot) => sameTeacher(slot.teacher, teacherIdForData));
  const loadHours = loads.reduce((sum, load) => sum + Number(load.hours || 0), 0);
  const assignedHours = slots.reduce((sum, slot) => sum + slotDuration(slot), 0);
  const pendingHours = Math.max(0, loadHours - assignedHours);
  const availabilityStats = teacherAvailabilityTotals(teacher);
  const availabilityHours = availabilityStats.available;
  const usagePct = Math.min(100, availabilityStats.total ? Math.round((assignedHours / availabilityStats.total) * 100) : 0);
  const orderedLoads = unique(loads.map((load) => `${load.subject}|${load.group}`))
    .map((key) => {
      const [subject, group] = key.split("|");
      const itemLoads = loads.filter((load) => load.subject === subject && load.group === group);
      const itemSlots = slots.filter((slot) => slot.subject === subject && slot.group === group);
      const total = itemLoads.reduce((sum, load) => sum + Number(load.hours || 0), 0);
      const assigned = itemSlots.reduce((sum, slot) => sum + slotDuration(slot), 0);
      const color = generatedPastel(`${subject}|${group}`);
      return {
        subject,
        group,
        total,
        assigned,
        pending: Math.max(0, total - assigned),
        color
      };
    });
  const topColors = orderedLoads.slice(0, 3).map((item) => item.color);
  const background = topColors.length
    ? `linear-gradient(135deg, ${topColors[0]} 0%, ${topColors[1] || topColors[0]} 52%, ${topColors[2] || topColors[1] || topColors[0]} 100%)`
    : "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)";

  const barSegments = orderedLoads.length
    ? orderedLoads.map((item) => {
        const width = loadHours ? Math.max(8, Math.round((item.total / loadHours) * 100)) : 0;
        return `<span class="teacher-bar-segment" style="width:${width}%;background:${item.color}" title="${escapeHtml(item.subject)} ${escapeHtml(item.group)} · ${item.total}h"></span>`;
      }).join("")
    : `<span class="teacher-bar-empty"></span>`;

  panel.innerHTML = `
    <section class="teacher-summary-hero" style="background:${background}">
      <div>
        <p class="eyebrow">Docente seleccionado</p>
        <h3>${escapeHtml(teacher.name || teacher.id)}</h3>
        <p>${escapeHtml(teacher.type || "")} · mínimo ${Number(teacher.minWeeklyHours || 0)}h</p>
        <button type="button" class="ghost open-availability-btn" data-open-availability="${escapeHtml(teacherIdForData)}">Definir horas disponibles</button>
      </div>
      <div class="teacher-score">
        <strong>${assignedHours}h</strong>
        <span>asignadas</span>
      </div>
    </section>
    <div class="teacher-stats">
      <article><strong>${loadHours}h</strong><span>cargas definidas</span></article>
      <article><strong>${assignedHours}h</strong><span>en propuesta</span></article>
      <article><strong>${pendingHours}h</strong><span>pendientes</span></article>
      <article><strong>${availabilityStats.available}h</strong><span>disponibles</span></article>
    </div>
    <div class="teacher-progress" aria-label="Resumen de horas asignadas">
      <div class="teacher-progress-bar">${barSegments}</div>
      <small>${usagePct}% de la matriz usada · ${availabilityStats.flexible} flexibles · ${availabilityStats.unavailable} no disponibles</small>
    </div>
    <div class="teacher-load-list">
      ${orderedLoads.length ? orderedLoads.map((item) => `
        <div class="teacher-load-chip" style="--chip:${item.color}">
          <strong>${escapeHtml(item.subject)}</strong>
          <span>${escapeHtml(item.group)}</span>
          <em>${item.assigned}/${item.total}h</em>
        </div>
      `).join("") : `<div class="teacher-empty">Este docente todavía no tiene cargas asignadas.</div>`}
    </div>
  `;
  panel.querySelectorAll("[data-open-availability]").forEach((button) => {
    button.addEventListener("click", () => openAvailabilityModal(button.dataset.openAvailability));
  });
}

function renderGroupDetailPanel() {
  const panel = byId("groupDetailPanel");
  const select = byId("groupDetailSelect");
  if (!panel || !select) return;
  const groupId = select.value || groupOptions()[0]?.id || "";
  const group = groupOptions().find((item) => String(item.id) === String(groupId)) || null;
  if (!group) {
    panel.innerHTML = `<div class="teacher-empty">No hay grado disponible para mostrar.</div>`;
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
      `).join("") : `<div class="teacher-empty">Este grado todavia no tiene cargas asignadas.</div>`}
    </div>
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
  const days = EPQA.data.days || ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
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
  const days = EPQA.data.days || ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
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
  const tooltip = `${slot.teacher} · ${slot.group} · ${slot.subject} · ${slot.room || "Aula"} · ${slot.day} H${slot.period}`;
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
      ? `<span class="block-continuation">Continúa ${escapeHtml(covered[0].subject)} · ${escapeHtml(covered[0].teacher)}</span>`
      : "";
  const title = conflictText || (primary ? `${primary.subject} · ${primary.teacher} · ${primary.group}` : "");
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
      <small>Pendiente ${load.pendingIndex} · ${escapeHtml(load.room || load.roomId || "Aula disponible")}</small>
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
      <small>${escapeHtml(slot.room)} · ${escapeHtml(slot.source || "manual")}</small>
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
            renderBoard();
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
  const days = shuffleArray(EPQA.data.days || ["Lunes", "Martes", "MiÃ©rcoles", "Jueves", "Viernes"], seed);
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
      institution: byId("schoolName")?.value || "Institucion importada"
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
    .filter((row) => row.day || row.Dia || row.Día || row.period || row.Hora)
    .map((row, index) => ({
      id: row.id || row.ID || `excel-slot-${index + 1}`,
      siteId: row.siteId || row.Sede || "",
      site: row.site || row.Sede || "",
      level: row.level || row.Nivel || "secondary",
      group: row.group || row.Grupo || row.grado || row.Grado,
      day: row.day || row.Dia || row.Día,
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
  log.insertAdjacentHTML("afterbegin", `<div><strong>${escapeHtml(payload.status)}</strong> · ${new Date().toLocaleString()} · P0 ${EPQA.audit.counts.P0}</div>`);
  notify(final ? "Version final lista" : "Version guardada", final ? "Se iniciara la descarga del PDF final." : "La version quedo registrada.", "success");
  if (final) exportPdf("final");
}

function exportExcel() {
  if (!window.XLSX) return;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(EPQA.data.loads), "Base");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(EPQA.slots), "Matriz_Grados");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(EPQA.slots.map(({ teacher, day, period, group, subject, room }) => ({ teacher, day, period, group, subject, room }))), "Matriz_Profes");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(EPQA.audit.results || []), "Auditoria");
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
    doc.text(`Auditoria: P0 ${EPQA.audit.counts.P0 || 0} · P1 ${EPQA.audit.counts.P1 || 0} · P2 ${EPQA.audit.counts.P2 || 0}`, 36, 54);
    let y = 78;
    (EPQA.data.days || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]).forEach((day) => {
      doc.setFont("helvetica", "bold");
      doc.text(day, 36, y);
      y += 14;
      EPQA.slots.filter((slot) => slot[mode] === value && slot.day === day).sort((a, b) => a.period - b.period).forEach((slot) => {
        doc.setFont("helvetica", "normal");
        doc.text(`H${slot.period} · ${slot.subject} · ${slot.teacher} · ${slot.group} · ${slot.room}`, 52, y);
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
  doc.text(`Profesores: ${teachers.length} · Cargas: ${(EPQA.data.loads || []).length} · Horas ubicadas: ${(EPQA.slots || []).reduce((sum, slot) => sum + slotDuration(slot), 0)}h`, margin, 58);
  doc.text(`P0 ${EPQA.audit?.counts?.P0 || 0} · P1 ${EPQA.audit?.counts?.P1 || 0} · P2 ${EPQA.audit?.counts?.P2 || 0}`, margin, 72);
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
  doc.text(`${mode === "final" ? "Final" : "Docente"} · ${level === "primary" ? "Primaria" : "Secundaria"} · ${teacher.type || ""}`, margin, 48);
  doc.text(`Carga total ${loadHours}h · Asignadas ${assignedHours}h · Pendientes ${pendingHours}h`, margin, 60);

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
    body: `${Number(load.hours || 0)}h · ${load.room || load.roomId || "Aula"}`
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
  doc.text(`${level === "primary" ? "Primaria" : "Secundaria"} · meta ${requiredHours}h semanales`, margin, 48);
  doc.text(`Carga total ${loadHours}h · Asignadas ${assignedHours}h · Pendientes ${pendingHours}h`, margin, 60);

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
    body: `${Number(load.hours || 0)}h · ${load.room || load.roomId || "Aula"}`
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
  doc.text(`Espacio · Cargas ${roomLoads.length} · Horas definidas ${loadHours}h`, margin, 48);
  doc.text(`Asignadas ${assignedHours}h · Pendientes ${pendingHours}h`, margin, 60);

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
    body: `${Number(load.hours || 0)}h · ${load.group || ""}`
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
    `${slot.teacher || ""} · ${slot.group || ""} · ${slot.room || ""}`.trim().replace(/^[·\s]+|[·\s]+$/g, "")
  ];
}

function groupPdfBlockLines(slot) {
  return [
    slot.subject || "",
    `${slot.teacher || ""} · ${slot.room || ""}`.trim().replace(/^[·\s]+|[·\s]+$/g, "")
  ];
}

function roomPdfBlockLines(slot) {
  return [
    slot.subject || "",
    `${slot.teacher || ""} · ${slot.group || ""}`.trim().replace(/^[·\s]+|[·\s]+$/g, "")
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
  return text.replace(/[^A-Za-z0-9]/g, "").slice(0, 1).toUpperCase() || text.slice(0, 1).toUpperCase();
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
    lockedTeacher: load.lockedTeacher ?? load.locked ?? load.lockedOriginalAssignment ?? true
  })).map((load) => ({ ...load, loadKey: loadSignature(load) }));
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
    data.subjects = data.subjects.map((subject) => typeof subject === "string" ? subject : (subject.name || subject.id || subject.subject || subject));
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
  return Object.keys(project).filter((key) => String(project[key] ?? "").trim() !== "").length;
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
        lockedTeacher: assignment.lockedOriginalAssignment ?? true,
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
      locked: assignment.lockedOriginalAssignment ?? true,
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
  if (key.includes("MI") && key.includes("RCOLES")) return "Miercoles";
  return {
    LUNES: "Lunes",
    MARTES: "Martes",
    MIERCOLES: "Miércoles",
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

function confirmAction(title, message, onConfirm, confirmLabel = "Continuar") {
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
      <strong>${escapeHtml(day)} H${period} · ${cycle === "primary" ? "Primaria" : "Secundaria"}</strong>
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
  if (!window.tippy) return;
  ensureHoverInspector();
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
          `${cell.dataset.day} H${cell.dataset.period} · ${cycle === "primary" ? "Primaria" : "Secundaria"}`,
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
        `${cell.dataset.day} H${cell.dataset.period} · ${cycle === "primary" ? "Primaria" : "Secundaria"}`,
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
      content: `${slot.teacher} · ${slot.group} · ${slot.subject} · ${slot.room} · Fuente: ${slot.source}`,
      placement: "top",
      delay: [120, 0],
      maxWidth: 380,
      theme: conflicts.length ? "epqa-conflict" : "epqa",
      onShow(instance) {
        instance.setContent(`${slot.teacher} · ${slot.group} · ${slot.subject} · ${slot.room} · Fuente: ${slot.source}${conflictText}`);
      }
    });
    card.addEventListener("pointerenter", () => {
      updateHoverInspector(
        `${slot.teacher} · ${slot.subject}`,
        `${slot.group} · ${slot.day} H${slot.period} · ${slot.room || "Aula"} · ${slotDuration(slot)}h`,
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
        `Pendiente ${card.dataset.duration || 1}h · ${load.group} · ${load.room || load.roomId || "Aula"} · revisar impactos al ubicar`,
        "warn"
      );
    });
    card.addEventListener("pointerleave", clearHoverInspector);
  });
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
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
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
