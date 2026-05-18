<?php
declare(strict_types=1);

return [
    'app_url' => 'https://www.elprofequeaprende.com',
    'development' => false,

    'google' => [
        'client_id' => 'GOOGLE_CLIENT_ID',
        'client_secret' => 'GOOGLE_CLIENT_SECRET',
        'redirect_uri' => 'https://www.elprofequeaprende.com/auth/google-callback.php',
    ],

    'microsoft' => [
        'client_id' => 'MICROSOFT_CLIENT_ID',
        'client_secret' => 'MICROSOFT_CLIENT_SECRET',
        'tenant' => 'common',
        'redirect_uri' => 'https://www.elprofequeaprende.com/auth/microsoft-callback.php',
    ],
];
