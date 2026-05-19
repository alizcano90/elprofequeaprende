<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/flash.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/dashboard.php';
require_once __DIR__ . '/includes/sinapsis.php';

start_secure_session();

$allowedPages = [
    'home' => [
        'file' => __DIR__ . '/pages/home.php',
        'title' => 'El Profe Que Aprende | Plataforma educativa para docentes',
        'description' => 'Plataforma practica para docentes que quieren crear, organizar y dinamizar sus clases con IA, recursos offline y herramientas digitales.',
    ],
    'recursos' => [
        'file' => __DIR__ . '/pages/recursos.php',
        'title' => 'Recursos educativos offline | El Profe Que Aprende',
        'description' => 'Guias interactivas HTML, simuladores y herramientas educativas para usar en clase incluso con baja conectividad.',
    ],
    'capacitaciones' => [
        'file' => __DIR__ . '/pages/capacitaciones.php',
        'title' => 'Capacitaciones con IA para docentes | El Profe Que Aprende',
        'description' => 'Formaciones practicas para crear guias interactivas, recursos digitales y materiales de clase usando inteligencia artificial.',
    ],
    'herramientas' => [
        'file' => __DIR__ . '/pages/herramientas.php',
        'title' => 'Herramientas online para docentes | El Profe Que Aprende',
        'description' => 'Utilidades docentes, generador de horarios, ruletas, grupos aleatorios y herramientas Pro para organizar clases.',
    ],
    'tips' => [
        'file' => __DIR__ . '/pages/tips.php',
        'title' => 'Tips y contenido gratuito | El Profe Que Aprende',
        'description' => 'Tutoriales de ofimatica, IA practica, productividad docente, Excel, Word y organizacion escolar.',
    ],
    'instituciones' => [
        'file' => __DIR__ . '/pages/instituciones.php',
        'title' => 'Servicios para instituciones | El Profe Que Aprende',
        'description' => 'Capacitaciones, licencias institucionales, kits offline y acompanamiento STEM para sedes educativas.',
    ],
    'planes' => [
        'file' => __DIR__ . '/pages/planes.php',
        'title' => 'Planes y productos premium | El Profe Que Aprende',
        'description' => 'Planes gratuitos, Pro Docente e institucionales para acceder a recursos, herramientas y capacitaciones.',
    ],
    'contacto' => [
        'file' => __DIR__ . '/pages/contacto.php',
        'title' => 'Contacto | El Profe Que Aprende',
        'description' => 'Contacta a El Profe Que Aprende para recursos, capacitaciones, herramientas o propuestas institucionales.',
    ],
    'dashboard' => [
        'file' => __DIR__ . '/pages/dashboard.php',
        'title' => 'Dashboard | El Profe Que Aprende',
        'description' => 'Centro de control para usuarios de El Profe Que Aprende.',
    ],
    'sinapsis' => [
        'file' => __DIR__ . '/pages/sinapsis.php',
        'title' => 'TecnoClan Sinapsis | El Profe Que Aprende',
        'description' => 'Escuela presencial de pensamiento computacional para ninos y jovenes en Garzon, Huila.',
    ],
    'sinapsis-familia' => [
        'file' => __DIR__ . '/pages/sinapsis-familia.php',
        'title' => 'Familia Sinapsis | El Profe Que Aprende',
        'description' => 'Panel familiar para consultar avances de estudiantes de TecnoClan Sinapsis.',
    ],
    'admin-sinapsis' => [
        'file' => __DIR__ . '/pages/admin-sinapsis.php',
        'title' => 'Admin Sinapsis | El Profe Que Aprende',
        'description' => 'Administracion de estudiantes y avances de TecnoClan Sinapsis.',
    ],
    'quien-soy' => [
        'file' => __DIR__ . '/pages/quien-soy.php',
        'title' => 'Quien soy | El Profe Que Aprende',
        'description' => 'Perfil de Andres Fabian Lizcano Corrales, creador de El Profe Que Aprende.',
    ],
    'login' => [
        'file' => __DIR__ . '/pages/login.php',
        'title' => 'Ingresar | El Profe Que Aprende',
        'description' => 'Inicia sesion con correo, celular, Google o Microsoft.',
    ],
    'registro' => [
        'file' => __DIR__ . '/pages/registro.php',
        'title' => 'Crear cuenta | El Profe Que Aprende',
        'description' => 'Crea tu cuenta docente para acceder a recursos, herramientas y planes.',
    ],
    'mi-cuenta' => [
        'file' => __DIR__ . '/pages/mi-cuenta.php',
        'title' => 'Mi cuenta | El Profe Que Aprende',
        'description' => 'Gestiona tu perfil, proveedores vinculados y acceso a la plataforma.',
    ],
    'recuperar-password' => [
        'file' => __DIR__ . '/pages/recuperar-password.php',
        'title' => 'Recuperar contrasena | El Profe Que Aprende',
        'description' => 'Solicita un enlace para recuperar el acceso a tu cuenta.',
    ],
    'verificar-correo' => [
        'file' => __DIR__ . '/pages/verificar-correo.php',
        'title' => 'Verificar correo | El Profe Que Aprende',
        'description' => 'Verifica el correo electronico asociado a tu cuenta.',
    ],
];

$rawPage = filter_input(INPUT_GET, 'pg', FILTER_UNSAFE_RAW);
$page = is_string($rawPage) ? strtolower(trim($rawPage)) : 'home';
$page = preg_replace('/[^a-z0-9_-]/', '', $page) ?: 'home';

if (!array_key_exists($page, $allowedPages)) {
    http_response_code(404);
    $currentPage = '404';
    $pageMeta = [
        'title' => 'Pagina no encontrada | El Profe Que Aprende',
        'description' => 'La pagina solicitada no existe o fue movida.',
    ];
    $pageFile = __DIR__ . '/pages/404.php';
} else {
    $currentPage = $page;
    $pageMeta = [
        'title' => $allowedPages[$page]['title'],
        'description' => $allowedPages[$page]['description'],
    ];
    $pageFile = $allowedPages[$page]['file'];
}

require __DIR__ . '/includes/header.php';
require $pageFile;
require __DIR__ . '/includes/footer.php';
