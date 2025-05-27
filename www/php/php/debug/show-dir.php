<?php
$files = scandir(__DIR__ . "/../../..");

foreach ($files as $file) {
    if ($file !== '.' && $file !== '..') {
        echo $file . PHP_EOL;
    }
}