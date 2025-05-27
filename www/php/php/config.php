<?php
require_once __DIR__ . '/load-env.php';
loadEnv(__DIR__ . (isProduction() ? '/.htpasswd.env.prod' : '/.htpasswd.env.dev'));

return [
    'newsletter_table' => 'krank_subscribers',
];
