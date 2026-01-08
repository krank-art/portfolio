<?php

function normalizePath($path)
{
    // Example input: 'etc/php/public/files/../../my-file.txt';
    // Example output: etc/php/my-file.txt
    $parts = [];
    foreach (explode('/', str_replace('\\', '/', $path)) as $segment) {
        if ($segment === '' || $segment === '.') {
            continue;
        }
        if ($segment === '..') {
            array_pop($parts);
        } else {
            $parts[] = $segment;
        }
    }
    return "/" . implode('/', $parts) . "/";
}

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function generateSecret($length = 16)
{
    return base64url_encode(random_bytes($length / 2));
}

function getUniqueSecretFromDatabase($pdo, $tableName, $column)
{
    // Guarantee that secret is unique
    $secret = generateSecret();
    $maxTries = 20;
    $attempts = 0;
    $secretIsUnique = false;
    while (!$secretIsUnique) {
        $attempts++;
        if ($attempts >= $maxTries) {
            throw new Exception("Too many attempts getting unique secret: $attempts");
        }
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM $tableName WHERE $column = ?");
        $stmt->execute([$secret]);
        $secretIsUnique = !($stmt->fetchColumn());
        //echo $secret;
        if (!$secretIsUnique) $secret = generateSecret();
    }
    return $secret;
}

function writeErrorLog(string $errorLogPath, string $message): void
{
    date_default_timezone_set('UTC');
    $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2);
    $callerFile = $trace[1]['file'] ?? 'unknown';
    $maxSize = 100 * 1024; // 100 KB max size, ~1000 Lines if short messages
    $linesToTrim = 5;
    $dir = dirname($errorLogPath);
    if (!is_dir($dir))
        mkdir($dir, 0755, true);
    $entry = sprintf("[%s] [%s] %s\n", date('Y-m-d H:i:s'), $callerFile, $message);
    file_put_contents($errorLogPath, $entry, FILE_APPEND | LOCK_EX);
    if (filesize($errorLogPath) <= $maxSize)
        return;
    $lines = file($errorLogPath, FILE_IGNORE_NEW_LINES);
    if ($lines === false || count($lines) <= $linesToTrim)
        return;
    $lines = array_slice($lines, $linesToTrim);
    file_put_contents($errorLogPath, implode("\n", $lines) . "\n", LOCK_EX);
}
