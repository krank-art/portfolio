<?php
require __DIR__ . '/../comment-decoder.php';

use function KrankWeb\CommentDecoder\decodeCommentFile;

if (!isset($_FILES["history"])) {
    http_response_code(400);
    exit('Missing argument history');
}
$historyFile = $_FILES['history']['tmp_name'];
$decodedCommentHistory = decodeCommentFile($historyFile);
header('Content-Type: application/json');
echo json_encode($decodedCommentHistory);
