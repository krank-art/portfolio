<?php
require_once __DIR__ . '/load-env.php';
require_once __DIR__ . '/util.php';

/*
 * Depending if we are on a live server or a development server, we need to load a different environment file.
 * Usually we would  call the file ".env", problem is the standard configuration of apache serves it straight up.
 * For maximum security, I want to utilize three security measures so the database information does not get leaked:
 * 
 * 1) Add a routing rule to '.htaccess' that forbids access to any file that starts with ".ht".
 * 2) Start the file name with ".htpasswd". Trying to access these special files always return a 403 Forbidden.
 *    Per definition, Apache servers should block all files that start with ".ht".
 *    But for some reason, this only worked in my local Apache server in Docker not on the production server.
 *    The environment files were previously named ".htenv", but they got served as plain text files -- very bad.
 * 3) Position the environment file outside of the served folder.
 *    I have to change my website folder structure, e.g. ".env, public/"  where 'public' includes all served files.
 */
loadEnv(__DIR__ . (isProduction() ? '/.htpasswd.env.prod' : '/.htpasswd.env.dev'));

return [
    'newsletter_table' => 'krank_subscribers',
    'comments_table' => 'krank_comments',
    'comments_rate_limit_table' => 'krank_comments_rate_limit',
    'comments_settings_table' => 'krank_comments_settings',

    'comments_rate_limit_burst_count'   => 3,
    'comments_rate_limit_burst_window'  => new DateInterval('PT30S'),
    'comments_rate_limit_mid_count'     => 10,
    'comments_rate_limit_mid_window'    => new DateInterval('PT10M'),
    'comments_rate_limit_long_count'    => 30,
    'comments_rate_limit_long_window'   => new DateInterval('PT24H'),
    'comments_rate_limit_global_count'  => 120,
    'comments_rate_limit_global_window' => new DateInterval('PT24H'),

    'commentsImageName'   => "comment_%s.png",
    'commentsHistoryName' => "comment_%s.brsh", // ".brsh" = brush history
    'commentsUploadDir'   => normalizePath(__DIR__ . '/uploads/'),
    'commentsErrorDir'    => normalizePath(__DIR__ . "/uploads_failed/"),
    'commentsDeletedDir'  => normalizePath(__DIR__ . "/uploads_deleted/"),
];
