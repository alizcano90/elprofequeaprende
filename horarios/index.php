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
                <div class="topbar-copy">
                    <p class="eyebrow">PLATAFORMA EDUCATIVA PARA CONSTRUIR HORARIOS</p>
                    <h1>EPQA Horarios Inteligentes</h1>
                    <p class="plain topbar-lead">Construye, revisa, ajusta y exporta horarios escolares con una interfaz guiada para coordinadores y docentes.</p>
                </div>
            </header>

            <section class="schedule-switcher epqa-active-schedule-card" aria-label="Horarios del usuario">
                <div class="schedule-summary">
                    <span id="planBadge" class="plan-badge">Plan gratuito</span>
                    <strong id="activeScheduleName">Horario activo</strong>
                    <small id="activeScheduleStatus">Borrador</small>
                    <p class="plain schedule-copy">Selecciona un horario o crea uno nuevo para continuar desde su estado actual.</p>
                </div>
                <div class="schedule-select-wrap">
                    <label>Cambiar horario
                        <select id="scheduleSelect"></select>
                    </label>
                </div>
                <div class="schedule-actions">
                    <button id="btnNewSchedule" class="primary" type="button">Crear nuevo</button>
                </div>
            </section>

            <section class="panel active" id="panel-dashboard">
                <section class="epqa-dashboard-v2">
                    <section class="epqa-topbar-v2">
                        <div class="epqa-welcome-v2">
                            <div class="epqa-eyebrow-v2">PLATAFORMA EDUCATIVA PARA CONSTRUIR HORARIOS</div>
                            <h1>¡Hola, Andrés!</h1>
                            <p>Construye horarios escolares de forma inteligente y sin complicaciones.</p>
                            <div class="epqa-next-inline-v2">
                                <strong id="dashNextActionTitle">Continuar construcción</strong>
                                <span id="dashNextActionHelp">Empieza por completar la información base para poder generar una propuesta clara y publicable.</span>
                            </div>
                        </div>

                        <div class="epqa-status-strip-v2">
                            <article class="epqa-status-cell-v2 epqa-status-cell-v2--first">
                                <div class="epqa-status-label-v2">Horario activo</div>
                                <div class="epqa-status-value-v2" id="dashHorarioActivo">IE EL RECREO HORARIO</div>
                                <div class="epqa-status-help-v2">Borrador</div>

                                <div class="epqa-status-controls-v2">
                                    <select id="dashHorarioSelect" class="epqa-status-select-v2" aria-label="Cambiar horario"></select>
                                    <div class="epqa-status-buttons-v2">
                                        <button type="button" class="epqa-btn-v2 epqa-btn-primary-v2" id="btnDashCrearNuevo">Crear nuevo</button>
                                        <button type="button" class="epqa-btn-v2 epqa-btn-soft-v2" id="btnDashDuplicar">Duplicar</button>
                                    </div>
                                </div>
                            </article>

                            <article class="epqa-status-cell-v2">
                                <div class="epqa-status-label-v2">Estado</div>
                                <div class="epqa-status-value-v2 epqa-status-value-v2--warning">
                                    <span class="epqa-dot-v2 epqa-dot-v2--warning"></span>
                                    <span id="dashEstadoHorario">Publicable con observaciones</span>
                                </div>
                                <div class="epqa-status-help-v2">Horario en revisión</div>
                            </article>

                            <article class="epqa-status-cell-v2 epqa-status-cell-v2--last">
                                <div class="epqa-status-label-v2">Última actualización</div>
                                <div class="epqa-status-value-v2" id="dashUltimaActualizacion">23/05/2026 8:15 p.m.</div>
                                <div class="epqa-status-help-v2">Se guarda cada avance para no perder el progreso.</div>
                            </article>
                        </div>
                    </section>

                    <section class="epqa-panel-v2 epqa-actions-v2">
                        <div class="epqa-section-title-row-v2">
                            <h2>Acciones principales</h2>
                        </div>

                        <div class="epqa-actions-grid-v2">
                            <button type="button" class="epqa-action-card-v2 epqa-action-card-v2--blue" id="btnDashGenerarCero">
                                <span class="epqa-action-icon-v2">✦</span>
                                <span class="epqa-action-copy-v2">
                                    <strong>Generar horario inteligente</strong>
                                    <small>Crear propuesta desde cero respetando todas las reglas.</small>
                                </span>
                                <span class="epqa-action-arrow-v2">→</span>
                            </button>

                            <button type="button" class="epqa-action-card-v2 epqa-action-card-v2--green" id="btnDashGenerarActual">
                                <span class="epqa-action-icon-v2">↻</span>
                                <span class="epqa-action-copy-v2">
                                    <strong>Generar desde lo actual</strong>
                                    <small>Usar la configuración registrada para generar una nueva propuesta.</small>
                                </span>
                                <span class="epqa-action-arrow-v2">→</span>
                            </button>

                            <button type="button" class="epqa-action-card-v2 epqa-action-card-v2--orange" id="btnDashRevisarProblemas">
                                <span class="epqa-action-icon-v2">!</span>
                                <span class="epqa-action-copy-v2">
                                    <strong>Revisar y reparar conflictos</strong>
                                    <small>Detecta problemas y sugiere soluciones.</small>
                                </span>
                                <span class="epqa-action-arrow-v2">→</span>
                            </button>

                            <aside class="epqa-more-actions-v2">
                                <button type="button" class="epqa-more-trigger-v2" id="btnDashMasAcciones">
                                    Más acciones
                                    <span>⌄</span>
                                </button>

                                <div class="epqa-more-menu-v2" id="dashMasAccionesMenu">
                                    <button type="button" id="btnDashGuardarAvance">Guardar avance</button>
                                    <button type="button" id="btnDashCargarAvance">Cargar avance</button>
                                    <button type="button" id="btnDashDescargarBackup">Descargar backup</button>
                                    <button type="button" id="btnDashSubirBackup">Subir backup</button>
                                    <button type="button" id="btnDashGuardarVersion">Guardar versión</button>
                                    <button type="button" id="btnDashExportarJson">Exportar JSON</button>
                                </div>
                            </aside>
                        </div>
                    </section>

                    <section class="epqa-panel-v2 epqa-summary-v2">
                        <div class="epqa-section-title-row-v2">
                            <h2>Resumen ejecutivo</h2>
                        </div>

                        <div class="epqa-summary-grid-v2">
                            <article class="epqa-metric-card-v2">
                                <div class="epqa-metric-top-v2"><span class="epqa-metric-icon-v2 epqa-metric-icon-v2--blue"><i class="fa-solid fa-user-group" aria-hidden="true"></i></span><span>Docentes</span></div>
                                <strong id="metricDocentes">24</strong>
                                <a href="#" data-target-tab="docentes">Ver detalle</a>
                            </article>
                            <article class="epqa-metric-card-v2">
                                <div class="epqa-metric-top-v2"><span class="epqa-metric-icon-v2 epqa-metric-icon-v2--green"><i class="fa-solid fa-school" aria-hidden="true"></i></span><span>Grados</span></div>
                                <strong id="metricGrados">12</strong>
                                <a href="#" data-target-tab="grados">Ver detalle</a>
                            </article>
                            <article class="epqa-metric-card-v2">
                                <div class="epqa-metric-top-v2"><span class="epqa-metric-icon-v2 epqa-metric-icon-v2--blue"><i class="fa-solid fa-book-open" aria-hidden="true"></i></span><span>Materias</span></div>
                                <strong id="metricMaterias">28</strong>
                                <a href="#" data-target-tab="materias">Ver detalle</a>
                            </article>
                            <article class="epqa-metric-card-v2">
                                <div class="epqa-metric-top-v2"><span class="epqa-metric-icon-v2 epqa-metric-icon-v2--green"><i class="fa-solid fa-layer-group" aria-hidden="true"></i></span><span>Cargas académicas</span></div>
                                <strong id="metricCargas">188</strong>
                                <a href="#" data-target-tab="asignaciones">Ver detalle</a>
                            </article>
                            <article class="epqa-metric-card-v2">
                                <div class="epqa-metric-top-v2"><span class="epqa-metric-icon-v2 epqa-metric-icon-v2--yellow"><i class="fa-regular fa-clock" aria-hidden="true"></i></span><span>Horas asignadas</span></div>
                                <strong id="metricHorasAsignadas">1.532</strong>
                                <a href="#" data-target-tab="propuesta">Ver detalle</a>
                            </article>
                            <article class="epqa-metric-card-v2">
                                <div class="epqa-metric-top-v2"><span class="epqa-metric-icon-v2 epqa-metric-icon-v2--red"><i class="fa-regular fa-hourglass-half" aria-hidden="true"></i></span><span>Horas pendientes</span></div>
                                <strong id="metricHorasPendientes">156</strong>
                                <a href="#" data-target-tab="propuesta">Ver detalle</a>
                            </article>
                        </div>
                    </section>

                    <section class="epqa-middle-v2">
                        <article class="epqa-panel-v2 epqa-rules-card-v2">
                            <div class="epqa-section-title-row-v2">
                                <h2>Cumplimiento de reglas</h2>
                            </div>

                            <div class="epqa-rules-grid-v2">
                                <div class="epqa-rule-mini-v2 epqa-rule-mini-v2--danger">
                                    <strong id="metricP0">0</strong>
                                    <span>Críticas (P0)</span>
                                </div>
                                <div class="epqa-rule-mini-v2 epqa-rule-mini-v2--warning">
                                    <strong id="metricP1">17</strong>
                                    <span>Fuertes (P1)</span>
                                </div>
                                <div class="epqa-rule-mini-v2 epqa-rule-mini-v2--preference">
                                    <strong id="metricP2">32</strong>
                                    <span>Deseables (P2)</span>
                                </div>
                            </div>
                        </article>

                        <article class="epqa-panel-v2 epqa-compliance-card-v2">
                            <div class="epqa-section-title-row-v2">
                                <h2>Cumplimiento general</h2>
                            </div>

                            <div class="epqa-compliance-content-v2">
                                <div class="epqa-donut-v2" style="--percent:87;">
                                    <span id="metricCumplimiento">87%</span>
                                </div>

                                <div class="epqa-compliance-copy-v2">
                                    <strong>Excelente</strong>
                                    <p>Tu horario tiene buen nivel de cumplimiento. Revisa las advertencias para mejorar aún más.</p>
                                    <button type="button" class="epqa-btn-v2 epqa-btn-soft-v2" id="btnDashVerAuditoria">Ver auditoría</button>
                                </div>
                            </div>
                        </article>

                        <article class="epqa-panel-v2 epqa-flow-card-v2">
                            <div class="epqa-section-title-row-v2">
                                <h2>Flujo de construcción</h2>
                            </div>

                            <div class="epqa-flow-v2">
                                <div class="epqa-flow-line-v2"></div>

                                <div class="epqa-flow-step-v2 epqa-flow-step-v2--done"><span>✓</span><small>Institución</small></div>
                                <div class="epqa-flow-step-v2 epqa-flow-step-v2--done"><span>✓</span><small>Sedes y espacios</small></div>
                                <div class="epqa-flow-step-v2 epqa-flow-step-v2--done"><span>✓</span><small>Docentes</small></div>
                                <div class="epqa-flow-step-v2 epqa-flow-step-v2--done"><span>✓</span><small>Grados</small></div>
                                <div class="epqa-flow-step-v2 epqa-flow-step-v2--done"><span>✓</span><small>Materias</small></div>
                                <div class="epqa-flow-step-v2 epqa-flow-step-v2--done"><span>✓</span><small>Cargas</small></div>
                                <div class="epqa-flow-step-v2 epqa-flow-step-v2--done"><span>✓</span><small>Disponibilidad</small></div>
                                <div class="epqa-flow-step-v2 epqa-flow-step-v2--done"><span>✓</span><small>Reglas</small></div>
                                <div class="epqa-flow-step-v2 epqa-flow-step-v2--active"><span>9</span><small>Generación</small></div>
                                <div class="epqa-flow-step-v2"><span>10</span><small>Auditoría</small></div>
                                <div class="epqa-flow-step-v2"><span>11</span><small>Consolidado</small></div>
                            </div>
                        </article>
                    </section>

                    <section class="epqa-bottom-v2">
                        <article class="epqa-bottom-card-v2">
                            <div>
                                <h2>Pendientes por ubicar</h2>
                                <strong id="metricPendientesTexto">156 horas pendientes</strong>
                            </div>
                            <button type="button" class="epqa-btn-v2 epqa-btn-outline-v2" id="btnDashIrPropuesta">Ir a propuesta</button>
                        </article>

                        <article class="epqa-bottom-card-v2">
                            <div>
                                <h2>Alertas importantes</h2>
                                <strong id="metricAlertasTexto">17 reglas fuertes necesitan revisión</strong>
                            </div>
                            <button type="button" class="epqa-btn-v2 epqa-btn-outline-v2" id="btnDashIrAuditoria">Ver auditoría</button>
                        </article>
                    </section>
                </section>

                <article class="epqa-hero">
                    <div class="epqa-hero-copy">
                        <p class="eyebrow">PLATAFORMA EDUCATIVA PARA CONSTRUIR HORARIOS</p>
                        <h2 id="workspaceHeroTitle">EPQA Horarios Inteligentes</h2>
                        <p id="workspaceDiagnostic" class="plain">Construye, revisa, ajusta y exporta horarios escolares con una interfaz guiada para coordinadores y docentes.</p>
                        <div class="epqa-hero-badges">
                            <span class="product-pill" id="workspaceStatusBadge">Horario activo</span>
                            <span class="product-pill" id="workspaceAvailabilityBadge">Estado: cargando</span>
                        </div>
                    </div>
                    <div class="epqa-hero-actions">
                        <button id="btnGenerate" class="primary action-main" type="button">Generar horario</button>
                        <details class="more-actions">
                            <summary>Más acciones</summary>
                            <div class="more-actions-menu">
                                <button id="btnGenerateMissing" class="ghost" type="button">Generar desde lo actual</button>
                                <button id="btnRepair" class="ghost" type="button">Revisar problemas</button>
                                <button id="btnSaveProgress" class="ghost" type="button">Guardar avance</button>
                                <button id="btnLoadProgress" class="ghost" type="button">Cargar avance</button>
                                <button id="btnBackupProgress" class="ghost" type="button">Descargar copia de seguridad</button>
                                <label class="backup-upload">
                                    Subir copia de seguridad
                                    <input id="backupInput" type="file" accept=".json,application/json">
                                </label>
                                <button id="btnSave" class="primary" type="button">Guardar versión</button>
                                <button id="btnDuplicateSchedule" class="ghost" type="button">Duplicar horario</button>
                                <button id="btnExportJson" class="ghost" type="button">Exportar datos técnicos</button>
                                <button id="btnDeleteSchedule" class="ghost danger" type="button">Eliminar horario</button>
                            </div>
                        </details>
                    </div>
                </article>

                <section class="epqa-rule-summary" aria-label="Estado de auditoria">
                    <article class="status-card p0">
                        <span>Problemas obligatorios</span>
                        <strong id="p0Count">0</strong>
                        <small>P0 críticas</small>
                    </article>
                    <article class="status-card p1">
                        <span>Reglas importantes</span>
                        <strong id="p1Count">0</strong>
                        <small>P1 fuertes</small>
                    </article>
                    <article class="status-card p2">
                        <span>Preferencias</span>
                        <strong id="p2Count">0</strong>
                        <small>P2 deseables</small>
                    </article>
                    <article class="status-card score">
                        <span>Cumplimiento</span>
                        <strong id="scoreCount">100%</strong>
                        <small>Estado general</small>
                    </article>
                </section>

                <section class="epqa-home-grid">
                    <div class="epqa-home-main">
                        <article class="epqa-diagnosis-card">
                            <h2>Diagnóstico del horario</h2>
                            <div id="workspaceNextActionBadge" class="product-pill">Listo para revisar</div>
                            <p id="workspaceNextActionHelp" class="plain">Revisa el estado del horario para saber qué completar, qué corregir y qué exportar.</p>
                        </article>

                        <article class="epqa-executive-summary">
                            <div class="section-head">
                                <div>
                                    <h2>Resumen ejecutivo</h2>
                                    <p class="plain">Lectura rápida de la información cargada en el horario.</p>
                                </div>
                            </div>
                            <div id="executiveMetrics" class="epqa-metric-grid"></div>
                        </article>

                        <article class="epqa-quick-actions">
                            <div class="section-head">
                                <div>
                                    <h2>Accesos rápidos</h2>
                                    <p class="plain">Saltos directos a las tareas más frecuentes del módulo.</p>
                                </div>
                            </div>
                            <div class="quick-actions-grid">
                                <button class="nav-item quick-action" data-panel="data" type="button"><i class="fa-solid fa-user-group" aria-hidden="true"></i><span>Registrar docentes</span></button>
                                <button class="nav-item quick-action" data-panel="data" type="button"><i class="fa-solid fa-school" aria-hidden="true"></i><span>Crear grados</span></button>
                                <button class="nav-item quick-action" data-panel="data" type="button"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Asignar materias</span></button>
                                <button class="nav-item quick-action" data-panel="data" type="button"><i class="fa-solid fa-clock" aria-hidden="true"></i><span>Definir disponibilidad</span></button>
                                <button class="nav-item quick-action" data-panel="audit" type="button"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><span>Revisar problemas</span></button>
                                <button class="nav-item quick-action" data-panel="exports" type="button"><i class="fa-solid fa-file-export" aria-hidden="true"></i><span>Ver exportación</span></button>
                            </div>
                        </article>
                    </div>
                    <aside class="epqa-home-side">
                        <article class="epqa-next-step-card">
                            <p class="eyebrow">Siguiente paso recomendado</p>
                            <h3 id="workspaceNextAction">Continuar construcción</h3>
                            <p class="plain">Completa la información base para poder generar un horario claro y publicable.</p>
                        </article>
                        <article class="epqa-progress-card">
                            <div class="section-head">
                                <div>
                                    <h2>Progreso de construcción</h2>
                                    <p class="plain">Guía visual del flujo real del módulo.</p>
                                </div>
                            </div>
                            <div id="workflowStepper" class="workflow-stepper"></div>
                        </article>
                        <article class="epqa-alerts-card">
                            <div class="section-head">
                                <div>
                                    <h2>Alertas importantes</h2>
                                    <p class="plain">Situaciones que conviene revisar antes de publicar.</p>
                                </div>
                            </div>
                            <div id="dashboardAlerts" class="dashboard-alerts"></div>
                            <button class="ghost dashboard-alert-action nav-item" data-panel="audit" type="button">Ver revisión de problemas</button>
                        </article>
                    </aside>
                </section>
            </section>

            <section class="panel" id="panel-data">
                <div class="catalog-grid">
                    <article class="catalog-card wide epqa-institution-card-v3">
                        <header class="epqa-institution-header-v3">
                            <div class="epqa-institution-icon-v3"><i class="fa-solid fa-building-columns" aria-hidden="true"></i></div>
                            <div class="epqa-institution-copy-v3">
                                <h1>Información de la institución</h1>
                                <p>Edita los datos generales de tu institución educativa.</p>
                            </div>
                        </header>

                        <div id="dataLoadAlert" class="panel-inline-alert" hidden></div>

                        <form class="epqa-institution-form-v3" onsubmit="return false;">
                            <div class="epqa-field-v3">
                                <label for="schoolName">Nombre del colegio</label>
                                <div class="epqa-input-shell-v3">
                                    <span class="epqa-input-icon-v3"><i class="fa-solid fa-building-columns" aria-hidden="true"></i></span>
                                    <input id="schoolName" type="text">
                                </div>
                            </div>

                            <div class="epqa-field-v3">
                                <label for="schoolOwner">Responsable</label>
                                <div class="epqa-input-shell-v3">
                                    <span class="epqa-input-icon-v3"><i class="fa-solid fa-user" aria-hidden="true"></i></span>
                                    <input id="schoolOwner" type="text">
                                </div>
                            </div>

                            <button id="btnSaveSchool" class="primary epqa-primary-action-v3" type="button">
                                <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
                                <span>Actualizar colegio</span>
                            </button>
                        </form>
                    </article>
                    <article class="catalog-card wide epqa-sedes-view-v3">
                        <section class="epqa-sedes-main-card-v3">
                            <header class="epqa-sedes-header-v3">
                                <div class="epqa-sedes-header-icon-v3"><i class="fa-solid fa-location-dot" aria-hidden="true"></i></div>
                                <div>
                                    <h1>Sedes y espacios</h1>
                                    <p>Administra las sedes de tu institución y los espacios disponibles.</p>
                                </div>
                            </header>

                            <div class="epqa-sedes-grid-v3">
                                <section class="epqa-panel-v3 epqa-panel-sedes-v3">
                                    <div class="epqa-panel-header-v3">
                                        <div>
                                            <h2>Sedes</h2>
                                            <p>Lista de sedes registradas</p>
                                        </div>
                                        <button id="btnAddSite" class="primary epqa-add-btn-v3" type="button">
                                            <span>＋</span>
                                            <span>Nueva sede</span>
                                        </button>
                                    </div>

                                    <div class="epqa-sede-create-v3">
                                        <label>Nueva sede <input id="siteName" type="text" placeholder="FILO"></label>
                                    </div>

                                    <div id="siteRoomSitesManager" class="epqa-table-wrap-v3"></div>

                                    <div class="epqa-panel-footer-v3">
                                        <span class="epqa-footer-icon-v3">▣</span>
                                        <span><span id="siteCountLabel" class="accent">0</span> sedes registradas</span>
                                    </div>
                                </section>

                                <section class="epqa-panel-v3 epqa-panel-espacios-v3">
                                    <div class="epqa-panel-header-v3">
                                        <div>
                                            <h2>Espacios / sitios</h2>
                                            <p>Lista de espacios y su tipo</p>
                                        </div>
                                        <button id="btnAddRoom" class="primary epqa-add-btn-v3" type="button">
                                            <span>＋</span>
                                            <span>Nuevo espacio</span>
                                        </button>
                                    </div>

                                    <div class="epqa-room-create-v3">
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
                                    </div>

                                    <div id="siteRoomRoomsManager" class="epqa-table-wrap-v3"></div>

                                    <div class="epqa-panel-footer-v3">
                                        <span class="epqa-footer-icon-v3">⊞</span>
                                        <span><span id="roomCountLabel" class="accent">0</span> espacios registrados</span>
                                    </div>
                                </section>
                            </div>
                        </section>
                    </article>
                    <article class="catalog-card wide epqa-docentes-view-v3">
                        <section class="epqa-docentes-main-card-v3">
                            <header class="epqa-docentes-header-v3">
                                <div class="epqa-docentes-header-icon-v3"><i class="fa-solid fa-users" aria-hidden="true"></i></div>
                                <div>
                                    <h1>Gestión de docentes</h1>
                                    <p>Registra, edita y administra los docentes junto con su sede base, nivel y carga mínima semanal.</p>
                                </div>
                            </header>

                            <div class="epqa-docentes-layout-v3">
                                <section class="epqa-panel-v3 epqa-docentes-form-panel-v3">
                                    <h2>Nuevo docente</h2>
                                    <p>Completa la información base para agregar un docente al sistema.</p>

                                    <form class="epqa-docente-form-v3" onsubmit="return false;">
                                        <div class="epqa-form-group-v3">
                                            <label for="teacherName">Docente</label>
                                            <div class="epqa-input-icon-v3">
                                                <span><i class="fa-solid fa-user" aria-hidden="true"></i></span>
                                                <input id="teacherName" class="epqa-input-v3 with-icon" type="text" placeholder="NOMBRE">
                                            </div>
                                        </div>

                                        <div class="epqa-form-group-v3">
                                            <label for="teacherType">Tipo</label>
                                            <div class="epqa-input-icon-v3">
                                                <span><i class="fa-solid fa-user-graduate" aria-hidden="true"></i></span>
                                                <select id="teacherType" class="epqa-select-v3 with-icon">
                                                    <option value="Primaria">Primaria</option>
                                                    <option value="Secundaria">Secundaria</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="epqa-form-group-v3">
                                            <label for="teacherDefaultSite">Sede por defecto</label>
                                            <div class="epqa-input-icon-v3">
                                                <span><i class="fa-solid fa-building-columns" aria-hidden="true"></i></span>
                                                <select id="teacherDefaultSite" class="epqa-select-v3 with-icon"></select>
                                            </div>
                                        </div>

                                        <div class="epqa-form-group-v3">
                                            <label for="teacherMinHours">Min horas</label>
                                            <input id="teacherMinHours" class="epqa-number-v3" type="number" min="0" value="22">
                                        </div>

                                        <button id="btnAddTeacher" class="primary epqa-submit-btn-v3" type="button">
                                            <span>＋</span>
                                            <span>Agregar docente</span>
                                        </button>
                                    </form>
                                </section>

                                <section class="epqa-panel-v3 epqa-docentes-table-panel-v3">
                                    <div class="epqa-table-header-v3">
                                        <div>
                                            <h2>Docentes creados</h2>
                                            <p>Listado editable de docentes registrados en el horario.</p>
                                        </div>

                                        <input class="epqa-table-search-v3" type="search" placeholder="Buscar docente, sede o tipo...">
                                    </div>

                                    <div id="teacherManager" class="epqa-table-wrap-v3"></div>

                                    <div class="epqa-panel-footer-v3">
                                        <span class="epqa-footer-icon-v3">♙</span>
                                        <span><span id="teacherCountLabel" class="accent">0</span> docentes registrados</span>
                                    </div>
                                </section>
                            </div>
                        </section>
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
