<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/flash.php';
require_once __DIR__ . '/../includes/auth.php';

start_secure_session();
require_login();

$authUser = current_user();
$user = [
    'id' => (int)($authUser['id'] ?? user_id() ?? 0),
    'name' => (string)($authUser['full_name'] ?? 'Usuario EPQA'),
    'email' => (string)($authUser['email'] ?? ''),
    'role' => (string)($authUser['role'] ?? 'user'),
];
$assetVersion = static function (string $path): string {
    $fullPath = __DIR__ . '/' . ltrim($path, '/');
    return is_file($fullPath) ? (string)filemtime($fullPath) : (string)time();
};
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>EPQA Horarios Inteligentes</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="/horarios/assets/styles.css?v=<?= htmlspecialchars($assetVersion('assets/styles.css'), ENT_QUOTES, 'UTF-8') ?>">
    <script defer src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/tippy.js@6/dist/tippy-bundle.umd.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <script defer src="/horarios/assets/app.js?v=<?= htmlspecialchars($assetVersion('assets/app.js'), ENT_QUOTES, 'UTF-8') ?>"></script>
</head>
<body>
    <div class="app-shell" data-role="<?= htmlspecialchars((string)$user['role'], ENT_QUOTES, 'UTF-8') ?>">
        <aside class="sidebar">
            <div class="brand">
                <span class="brand-mark"><i class="fa-solid fa-chalkboard-user" aria-hidden="true"></i></span>
                <div>
                    <strong>EPQA</strong>
                    <small>Horarios Inteligentes</small>
                </div>
                <button id="btnCollapseSidebar" class="sidebar-toggle" type="button" aria-label="Colapsar menu"><i class="fa-solid fa-angles-left" aria-hidden="true"></i></button>
            </div>
            <nav class="nav">
                <button class="nav-item active" data-panel="dashboard" title="Resumen"><i class="fa-solid fa-chart-simple" aria-hidden="true"></i><span>Resumen</span></button>
                <button class="nav-item" data-panel="data" title="Edición"><i class="fa-solid fa-sliders" aria-hidden="true"></i><span>Edición</span></button>
                <button class="nav-item" data-panel="editor" title="Propuesta"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i><span>Propuesta</span></button>
                <button class="nav-item" data-panel="audit" title="Auditoría"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i><span>Auditoría</span></button>
                <button class="nav-item" data-panel="exports" title="Consolidado"><i class="fa-solid fa-file-export" aria-hidden="true"></i><span>Consolidado</span></button>
            </nav>
            <div class="user-box">
                <span><?= htmlspecialchars((string)$user['name'], ENT_QUOTES, 'UTF-8') ?></span>
                <small><?= htmlspecialchars((string)$user['role'], ENT_QUOTES, 'UTF-8') ?></small>
                <a href="/auth/logout.php">Cerrar sesion</a>
            </div>
        </aside>

        <main class="workspace">
            <header class="topbar">
                <div>
                    <p class="eyebrow">Institucion rural/offline</p>
                    <h1>EPQA Horarios Inteligentes</h1>
                </div>
                <div class="top-actions">
                    <button id="btnGenerate" class="ghost">Generar propuesta de cero</button>
                    <button id="btnGenerateMissing" class="ghost">Generar desde lo actual</button>
                    <button id="btnRepair" class="ghost">Reparar conflictos</button>
                    <button id="btnSaveProgress" class="ghost">Guardar avance</button>
                    <button id="btnLoadProgress" class="ghost">Cargar avance</button>
                    <button id="btnBackupProgress" class="ghost">Descargar backup</button>
                    <label class="backup-upload">
                        Subir backup
                        <input id="backupInput" type="file" accept=".json,application/json">
                    </label>
                    <button id="btnSave" class="primary">Guardar version</button>
                </div>
            </header>

            <section class="schedule-switcher" aria-label="Horarios del usuario">
                <div>
                    <span id="planBadge" class="plan-badge">Plan gratuito</span>
                    <strong id="activeScheduleName">Horario activo</strong>
                    <small id="activeScheduleStatus">Borrador</small>
                </div>
                <label>Cambiar horario
                    <select id="scheduleSelect"></select>
                </label>
                <div class="schedule-actions">
                    <button id="btnNewSchedule" class="primary" type="button">Crear nuevo</button>
                    <button id="btnDuplicateSchedule" class="ghost" type="button">Duplicar</button>
                    <button id="btnExportJson" class="ghost" type="button">Exportar JSON</button>
                    <button id="btnDeleteSchedule" class="ghost danger" type="button">Eliminar</button>
                </div>
            </section>

            <section class="status-grid" aria-label="Estado de auditoria">
                <article class="status-card p0">
                    <span>P0</span>
                    <strong id="p0Count">0</strong>
                    <small>Criticas</small>
                </article>
                <article class="status-card p1">
                    <span>P1</span>
                    <strong id="p1Count">0</strong>
                    <small>Fuertes</small>
                </article>
                <article class="status-card p2">
                    <span>P2</span>
                    <strong id="p2Count">0</strong>
                    <small>Deseables</small>
                </article>
                <article class="status-card score">
                    <span>Score</span>
                    <strong id="scoreCount">100</strong>
                    <small>Cumplimiento</small>
                </article>
            </section>

            <section class="panel active" id="panel-dashboard">
                <div class="dashboard-grid">
                    <article class="wide-block">
                        <h2>Datos generales y consolidado</h2>
                        <p class="plain">Vista de lectura para revisar el estado general antes de editar, auditar o exportar.</p>
                        <div class="metrics-row">
                            <div><strong id="metricGroups">0</strong><span>Grupos</span></div>
                            <div><strong id="metricTeachers">0</strong><span>Docentes</span></div>
                            <div><strong id="metricLoads">0</strong><span>Cargas</span></div>
                            <div><strong id="metricSlots">0</strong><span>Horas ubicadas</span></div>
                        </div>
                    </article>
                    <article>
                        <h2>Auditoria</h2>
                        <canvas id="auditChart" height="190"></canvas>
                    </article>
                    <article>
                        <h2>Principio critico</h2>
                        <p class="plain">El optimizador solo mueve dia, hora y espacio. Docente, materia, grupo y horas pertenecen a la carga original.</p>
                    </article>
                </div>
            </section>

            <section class="panel" id="panel-data">
                <div class="catalog-grid">
                    <article class="catalog-card">
                        <h2>Edición de institución</h2>
                        <div class="compact-form">
                            <label>Nombre del colegio <input id="schoolName" type="text"></label>
                            <label>Responsable <input id="schoolOwner" type="text"></label>
                            <button id="btnSaveSchool" class="primary" type="button">Actualizar colegio</button>
                        </div>
                    </article>
                    <article class="catalog-card">
                        <h2>Sedes y espacios</h2>
                        <div class="compact-form">
                            <label>Nueva sede <input id="siteName" type="text" placeholder="FILO"></label>
                            <button id="btnAddSite" class="primary" type="button">Agregar sede</button>
                            <label>Sede del espacio <select id="roomSite"></select></label>
                            <label>Espacio <input id="roomName" type="text" placeholder="Sala TI Filo"></label>
                            <label>Tipo
                                <select id="roomType">
                                    <option value="AULA">Aula</option>
                                    <option value="SALA_TI">Sala TI</option>
                                    <option value="CANCHA">Cancha</option>
                                    <option value="EF_ALTERNO">EF alterno</option>
                                </select>
                            </label>
                            <button id="btnAddRoom" class="primary" type="button">Agregar espacio</button>
                        </div>
                        <div id="siteRoomManager" class="catalog-manager"></div>
                    </article>
                    <article class="catalog-card">
                        <h2>Edición de docentes</h2>
                        <div class="compact-form">
                            <label>Docente <input id="teacherName" type="text" placeholder="NOMBRE"></label>
                            <label>Tipo
                                <select id="teacherType">
                                    <option value="Primaria">Primaria</option>
                                    <option value="Secundaria">Secundaria</option>
                                </select>
                            </label>
                            <label>Sede por defecto <select id="teacherDefaultSite"></select></label>
                            <label>Min horas <input id="teacherMinHours" type="number" min="0" value="22"></label>
                            <button id="btnAddTeacher" class="primary" type="button">Agregar docente</button>
                        </div>
                        <div id="teacherManager" class="catalog-manager"></div>
                    </article>
                    <article class="catalog-card wide teacher-summary-card">
                        <h2>Resumen dinámico por docente</h2>
                        <div class="teacher-summary-toolbar">
                            <label>Elegir docente
                                <select id="teacherDetailSelect"></select>
                            </label>
                        </div>
                        <div id="teacherDetailPanel" class="teacher-detail-panel"></div>
                    </article>
                    <article class="catalog-card wide group-summary-card">
                        <h2>Resumen grados</h2>
                        <div class="teacher-summary-toolbar">
                            <label>Elegir grado
                                <select id="groupDetailSelect"></select>
                            </label>
                        </div>
                        <div id="groupDetailPanel" class="teacher-detail-panel"></div>
                    </article>
                    <article class="catalog-card">
                        <h2>Edición de grados</h2>
                        <div class="compact-form">
                            <label>Grado <input id="groupName" type="text" placeholder="10F"></label>
                            <label>Sede <select id="groupSite"></select></label>
                            <label>Nivel
                                <select id="groupLevel">
                                    <option value="primary">Primaria</option>
                                    <option value="secondary">Secundaria</option>
                                </select>
                            </label>
                            <button id="btnAddGroup" class="primary" type="button">Agregar grado</button>
                        </div>
                        <div id="groupManager" class="catalog-manager"></div>
                    </article>
                    <article class="catalog-card">
                        <h2>Edición de materias</h2>
                        <div class="compact-form">
                            <label>Materia <input id="subjectName" type="text" placeholder="TECNOLOGIA E INFORMATICA"></label>
                            <button id="btnAddSubject" class="primary" type="button">Agregar materia</button>
                        </div>
                        <div id="subjectManager" class="catalog-manager"></div>
                    </article>
                    <article class="catalog-card">
                        <h2>Reglas generales</h2>
                        <div class="compact-form">
                            <label>Máximo de horas por docente al día
                                <input id="maxTeacherHoursPerDay" name="maxTeacherHoursPerDay" type="number" min="1" max="12" value="6">
                            </label>
                            <button id="btnSaveGeneralRules" class="primary" type="button">Guardar reglas</button>
                        </div>
                        <div class="compact-form rule-exception-form">
                            <h3>Excepciones por docente/sede/día</h3>
                            <label>Docente <select id="dailyRuleTeacher" name="dailyRuleTeacher"></select></label>
                            <label>Sede <select id="dailyRuleSite" name="dailyRuleSite"></select></label>
                            <label>Día <select id="dailyRuleDay" name="dailyRuleDay"></select></label>
                            <label>Tipo de regla
                                <select id="dailyRuleType" name="dailyRuleType">
                                    <option value="allow">Permitir hasta</option>
                                    <option value="require">Exigir exactamente</option>
                                </select>
                            </label>
                            <label>Horas <input id="dailyRuleHours" name="dailyRuleHours" type="number" min="1" max="99" value="6" inputmode="numeric"></label>
                            <label>Importancia
                                <select id="dailyRulePriority" name="dailyRulePriority">
                                    <option value="P0">P0 obligatoria</option>
                                    <option value="P1">P1 fuerte</option>
                                    <option value="P2">P2 deseable</option>
                                </select>
                            </label>
                            <button id="btnAddDailyRule" class="primary" type="button">Agregar excepción</button>
                        </div>
                        <div id="dailyRulesManager" class="catalog-manager"></div>
                        <p class="plain block-help">Esta regla limita cuántas horas puede dictar un docente en un mismo día. Los bloques por materia se controlan en cada asignación.</p>
                    </article>
                    <article class="catalog-card wide">
                        <h2>Materias asignadas</h2>
                        <div class="load-builder">
                            <label>Docente <select id="loadTeacher" name="loadTeacher"></select></label>
                            <label>Grado <select id="loadGroup" name="loadGroup"></select></label>
                            <label>Materia <select id="loadSubject" name="loadSubject"></select></label>
                            <label>Espacio <select id="loadRoom" name="loadRoom"></select></label>
                            <label>Horas <input id="loadHours" name="loadHours" type="number" min="1" max="99" value="1" inputmode="numeric"></label>
                            <label>Bloque
                                <select id="loadBlockHours" name="loadBlockHours">
                                    <option value="1">No, horas sueltas</option>
                                    <option value="2">Bloque indivisible 2h</option>
                                    <option value="3">Bloque indivisible 3h</option>
                                </select>
                            </label>
                            <label>Importancia
                                <select id="loadRulePriority" name="loadRulePriority">
                                    <option value="P0">P0 obligatoria</option>
                                    <option value="P1">P1 fuerte</option>
                                    <option value="P2">P2 deseable</option>
                                </select>
                            </label>
                            <div class="preferred-days-field">
                                <label>Preferencia dias
                                    <select id="loadPreferredDaysPriority" name="loadPreferredDaysPriority">
                                        <option value="P2">P2 deseable</option>
                                        <option value="P1">P1 fuerte</option>
                                        <option value="P0">P0 obligatoria</option>
                                    </select>
                                </label>
                                <div class="day-checks" id="loadPreferredDays"></div>
                            </div>
                            <div class="load-builder-actions">
                                <button id="btnAddLoad" class="primary" type="button">Agregar asignacion</button>
                                <button id="btnOpenBulkLoad" class="primary" type="button">Asignar varias asignaturas</button>
                            </div>
                        </div>
                        <p class="plain block-help">Ejemplo: 3h con bloque 2h crea un bloque de 2h consecutivas y 1h suelta; 4h con bloque 2h crea dos bloques de 2h.</p>
                        <div class="loads-filter-bar">
                            <label>Buscar <input id="loadsFilterText" type="search" placeholder="Docente, grupo, materia..."></label>
                            <label>Docente <select id="loadsFilterTeacher"></select></label>
                            <label>Grupo <select id="loadsFilterGroup"></select></label>
                            <label>Materia <select id="loadsFilterSubject"></select></label>
                            <label>Importancia <select id="loadsFilterPriority"></select></label>
                            <button id="btnClearLoadFilters" class="ghost" type="button">Limpiar filtros</button>
                        </div>
                        <div class="table-scroll">
                            <table>
                                <thead><tr><th>Docente</th><th>Grupo</th><th>Materia</th><th>Horas</th><th>Bloque</th><th>Importancia</th><th>Dias pref.</th><th>Espacio</th><th></th></tr></thead>
                                <tbody id="loadsTable"></tbody>
                                <tfoot><tr><td colspan="9" id="loadsTableSummary">0 cargas | 0 horas</td></tr></tfoot>
                            </table>
                        </div>
                    </article>
                    <article class="catalog-card wide">
                        <h2>Sitios de trabajo y disponibilidad</h2>
                        <div class="availability-grid" id="availabilityGrid"></div>
                    </article>
                    <article class="catalog-card wide">
                        <h2>Importar y editar datos</h2>
                        <div class="import-strip">
                            <label>Archivo JSON/Excel
                                <input id="dataFileInput" type="file" accept=".json,.xlsx,.xls,application/json">
                            </label>
                            <button id="btnImportFile" class="ghost" type="button">Importar archivo</button>
                        </div>
                        <textarea id="jsonInput" spellcheck="false" placeholder="Pegue aqui horario_seed_epqa.json o una variante compatible"></textarea>
                        <button id="btnImportJson" class="primary">Validar y cargar</button>
                    </article>
                </div>
            </section>

            <section class="panel" id="panel-editor">
                <div class="editor-toolbar">
                    <label>Vista
                        <select id="viewMode">
                            <option value="group">Por grado</option>
                            <option value="teacher">Por profesor</option>
                            <option value="room">Por espacio</option>
                        </select>
                    </label>
                    <label>Filtro
                        <select id="viewFilter"></select>
                    </label>
                    <label class="toggle">
                        <input id="auditMode" type="checkbox" checked>
                        Modo auditor
                    </label>
                    <label class="toggle">
                        <input id="breakMode" type="checkbox" checked>
                        Modo no romper
                    </label>
                </div>
                <div class="available-tray-wrap">
                    <div class="tray-head">
                        <h2>Pendientes por ubicar</h2>
                        <span id="pendingCount">0 horas</span>
                    </div>
                    <div id="availableTray" class="available-tray"></div>
                </div>
                <div class="editor-layout">
                    <div class="board-wrap">
                        <div id="scheduleBoard" class="schedule-board"></div>
                    </div>
                    <aside class="conflict-panel">
                        <h2>Conflictos activos</h2>
                        <div id="conflictList" class="conflict-list"></div>
                    </aside>
                </div>
            </section>

            <section class="panel" id="panel-audit">
                <div class="audit-layout">
                    <article>
                        <h2>Revisión de auditoría</h2>
                        <div class="table-scroll">
                            <table>
                                <thead><tr><th>Prioridad</th><th>Estado</th><th>Regla</th><th>Explicacion</th><th>Sugerencia</th></tr></thead>
                                <tbody id="auditTable"></tbody>
                            </table>
                        </div>
                    </article>
                </div>
            </section>

            <section class="panel" id="panel-exports">
                <div class="export-grid">
                    <article>
                        <h2>Consolidado y exportación</h2>
                        <p class="plain">El boton final se habilita solo cuando P0 = 0.</p>
                        <div class="export-actions">
                            <button id="btnPdfTeachers" class="ghost">PDF profesores</button>
                            <button id="btnPdfGroups" class="ghost">PDF grados</button>
                            <button id="btnPdfRooms" class="ghost">PDF espacios</button>
                            <button id="btnExcel" class="ghost">Excel completo</button>
                            <button id="btnFinalPdf" class="primary" disabled>Publicar PDF final</button>
                        </div>
                    </article>
                    <article>
                        <h2>Historial de versiones</h2>
                        <div id="versionLog" class="version-log"></div>
                    </article>
                </div>
            </section>
        </main>
    </div>
    <div id="availabilityModal" class="modal-backdrop" hidden>
        <div class="modal-card availability-modal" role="dialog" aria-modal="true" aria-labelledby="availabilityModalTitle">
            <div class="modal-head">
                <div>
                    <p class="eyebrow">Disponibilidad por docente</p>
                    <h2 id="availabilityModalTitle">Editar disponibilidad</h2>
                </div>
                <button type="button" class="modal-close" data-modal-close aria-label="Cerrar">×</button>
            </div>
            <div class="modal-subhead">
                <strong id="availabilityModalTeacher">Docente</strong>
                <span id="availabilityModalStats"></span>
            </div>
            <div class="modal-toolbar">
                <label>Sede general
                    <select id="availabilityModalBaseSite"></select>
                </label>
                <div class="availability-legend">
                    <span class="legend-item available">Disponible</span>
                    <span class="legend-item flexible">Flexible</span>
                    <span class="legend-item unavailable">No disponible</span>
                </div>
            </div>
            <div id="availabilityModalGrid" class="availability-modal-grid"></div>
            <div class="modal-actions">
                <button type="button" class="ghost" id="availabilityModalReset">Restablecer</button>
                <button type="button" class="ghost" data-modal-close>Cancelar</button>
                <button type="button" class="primary" id="availabilityModalSave">Guardar disponibilidad</button>
            </div>
        </div>
    </div>
    <div id="bulkLoadModal" class="modal-backdrop" hidden>
        <div class="modal-card bulk-load-modal" role="dialog" aria-modal="true" aria-labelledby="bulkLoadModalTitle">
            <div class="modal-head">
                <div>
                    <p class="eyebrow">Asignación masiva</p>
                    <h2 id="bulkLoadModalTitle">Materias por docente</h2>
                </div>
                <button type="button" class="modal-close" id="bulkLoadModalClose" aria-label="Cerrar">x</button>
            </div>
            <div class="bulk-load-layout">
                <section class="bulk-load-form">
                    <label>Docente <select id="bulkLoadTeacher" name="bulkLoadTeacher"></select></label>
                    <label>Materia <select id="bulkLoadSubject" name="bulkLoadSubject"></select></label>
                    <label>Espacio <select id="bulkLoadRoom" name="bulkLoadRoom"></select></label>
                    <label>Horas por grado <input id="bulkLoadHours" name="bulkLoadHours" type="number" min="1" max="99" value="1" inputmode="numeric"></label>
                    <label>Bloque
                        <select id="bulkLoadBlockHours" name="bulkLoadBlockHours">
                            <option value="1">No, horas sueltas</option>
                            <option value="2">Bloque indivisible 2h</option>
                            <option value="3">Bloque indivisible 3h</option>
                        </select>
                    </label>
                    <label>Importancia
                        <select id="bulkLoadRulePriority" name="bulkLoadRulePriority">
                            <option value="P0">P0 obligatoria</option>
                            <option value="P1">P1 fuerte</option>
                            <option value="P2">P2 deseable</option>
                        </select>
                    </label>
                    <div class="preferred-days-field">
                        <label>Preferencia dias
                            <select id="bulkLoadPreferredDaysPriority" name="bulkLoadPreferredDaysPriority">
                                <option value="P2">P2 deseable</option>
                                <option value="P1">P1 fuerte</option>
                                <option value="P0">P0 obligatoria</option>
                            </select>
                        </label>
                        <div class="day-checks" id="bulkLoadPreferredDays"></div>
                    </div>
                    <div>
                        <div class="bulk-load-toolbar">
                            <strong>Grados compatibles</strong>
                            <button type="button" class="ghost" id="bulkLoadToggleGroups">Marcar todos</button>
                        </div>
                        <div id="bulkLoadGroups" class="bulk-load-groups"></div>
                    </div>
                    <button type="button" class="primary" id="bulkLoadAddDraft">Agregar a la lista</button>
                </section>
                <section class="bulk-load-summary">
                    <div class="bulk-load-total">
                        <span>Total preparado</span>
                        <strong id="bulkLoadTotalHours">0h</strong>
                    </div>
                    <div id="bulkLoadTeacherHours" class="bulk-load-teacher-hours"></div>
                    <div id="bulkLoadDraftList" class="bulk-load-draft-list"></div>
                </section>
            </div>
            <div class="modal-actions">
                <button type="button" class="ghost" id="bulkLoadModalCancel">Cancelar</button>
                <button type="button" class="primary" id="bulkLoadAssign">Asignar todas</button>
            </div>
        </div>
    </div>
    <div id="editLoadModal" class="modal-backdrop" hidden>
        <div class="modal-card edit-load-modal" role="dialog" aria-modal="true" aria-labelledby="editLoadModalTitle">
            <div class="modal-head">
                <div>
                    <p class="eyebrow">Editar asignación</p>
                    <h2 id="editLoadModalTitle">Carga académica</h2>
                </div>
                <button type="button" class="modal-close" id="editLoadModalClose" aria-label="Cerrar">x</button>
            </div>
            <div class="edit-load-summary" id="editLoadSummary"></div>
            <div class="edit-load-form">
                <label>Horas <input id="editLoadHours" name="editLoadHours" type="number" min="1" max="99" value="1" inputmode="numeric"></label>
                <label>Bloque
                    <select id="editLoadBlockHours" name="editLoadBlockHours">
                        <option value="1">No, horas sueltas</option>
                        <option value="2">Bloque indivisible 2h</option>
                        <option value="3">Bloque indivisible 3h</option>
                    </select>
                </label>
                <label>Importancia
                    <select id="editLoadRulePriority" name="editLoadRulePriority">
                        <option value="P0">P0 obligatoria</option>
                        <option value="P1">P1 fuerte</option>
                        <option value="P2">P2 deseable</option>
                    </select>
                </label>
                <label>Espacio <select id="editLoadRoom" name="editLoadRoom"></select></label>
                <div class="preferred-days-field">
                    <label>Preferencia días
                        <select id="editLoadPreferredDaysPriority" name="editLoadPreferredDaysPriority">
                            <option value="P2">P2 deseable</option>
                            <option value="P1">P1 fuerte</option>
                            <option value="P0">P0 obligatoria</option>
                        </select>
                    </label>
                    <div class="day-checks" id="editLoadPreferredDays"></div>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="ghost" id="editLoadModalCancel">Cancelar</button>
                <button type="button" class="primary" id="editLoadSave">Guardar cambios</button>
            </div>
        </div>
    </div>
    <div id="uxModal" class="modal-backdrop ux-modal-backdrop" hidden>
        <div class="modal-card ux-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="uxModalTitle" aria-describedby="uxModalMessage">
            <button type="button" class="modal-close" id="uxModalClose" aria-label="Cerrar">x</button>
            <div id="uxModalIcon" class="ux-modal-icon info">i</div>
            <h2 id="uxModalTitle">Aviso</h2>
            <p id="uxModalMessage"></p>
            <div class="modal-actions">
                <button type="button" class="ghost" id="uxModalCancel" hidden>Cancelar</button>
                <button type="button" class="ghost" id="uxModalUpgrade" hidden>Actualizar plan</button>
                <button type="button" class="primary" id="uxModalOk">Entendido</button>
            </div>
        </div>
    </div>
    <div id="generationModal" class="modal-backdrop generation-backdrop" hidden>
        <div class="modal-card generation-card" role="status" aria-live="polite" aria-labelledby="generationTitle">
            <div class="spinner-ring" aria-hidden="true"></div>
            <h2 id="generationTitle">Modelo generando propuesta</h2>
            <p id="generationMessage">Preparando cargas, restricciones y disponibilidad docente.</p>
            <div class="generation-progress"><span id="generationProgress"></span></div>
        </div>
    </div>
    <div id="toastStack" class="toast-stack" aria-live="polite" aria-atomic="true"></div>
</body>
</html>
