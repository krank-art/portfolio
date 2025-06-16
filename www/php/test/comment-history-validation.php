<?php
require __DIR__ . '/../comment-decoder.php';

use function KrankWeb\CommentDecoder\{decodeCommentFile, validateFile};

if (!isset($_FILES["history"])) {
    http_response_code(400);
    exit('Missing argument history');
}
$historyFile = $_FILES['history']['tmp_name'];
$decodedCommentHistory = decodeCommentFile($historyFile, true);
$violations = validateFile($decodedCommentHistory, [
    'maxWidth' => 320,
    'maxHeight' => 120,
]);
$report = $violations === true ? "Everything fine and dandy!" : implode("\n", $violations);
header('Content-Type: text/plain; charset=utf-8');
echo $report;
