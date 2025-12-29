<?php

namespace KrankWeb\Notifications;

function sendMessageToDiscordWebhook(string $webhookId, string $webhookToken, string $username, string $message) {
    $webhookUrl = "https://discord.com/api/webhooks/$webhookId/$webhookToken";
    $data = [
        "username" => $username,
        "content" => $message,
    ];
    $ch = curl_init($webhookUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => json_encode($data),
    ]);
    $response = curl_exec($ch);
    unset($ch);
    return $response;
}
