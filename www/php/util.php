<?php

function normalizePath($path) {
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
    return implode('/', $parts);
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function generateSecret($length = 16) {
    return base64url_encode(random_bytes($length / 2));
}

function getUniqueSecretFromDatabase($pdo, $tableName, $column) {
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
        if(!$secretIsUnique) $secret = generateSecret();
    }
    return $secret;
}
