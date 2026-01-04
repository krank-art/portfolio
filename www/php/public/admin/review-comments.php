<?php

session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require __DIR__ . '/../../database.php';

function getDataFromReferrer()
{
    $result = ['page' => null, 'bucket' => null];
    if (empty($_SERVER['HTTP_REFERER']))
        return $result;
    $refUrl = parse_url($_SERVER['HTTP_REFERER']);
    if (!isset($refUrl['scheme']) || !isset($refUrl['host']))
        return $result;
    $currentScheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $currentHost = $_SERVER['HTTP_HOST']; // includes port if non-standard
    $currentOrigin = "$currentScheme://$currentHost";
    $refPort = isset($refUrl['port']) ? ':' . $refUrl['port'] : '';
    $refOrigin = $refUrl['scheme'] . '://' . $refUrl['host'] . $refPort;
    if ($currentOrigin !== $refOrigin)
        return $result;
    if (!isset($refUrl['query']))
        return $result;
    parse_str($refUrl['query'], $refQueryParams);
    if (isset($refQueryParams['page']))
        $result['page'] = intval($refQueryParams['page']);
    if (isset($refQueryParams['bucket']))
        $result['bucket'] = $refQueryParams['bucket'];
    return $result;
}

function runActionAndRedirect(array $options)
{
    $pdo = $options['pdo'];
    $tableName = $options['tableName'];
    $commentId = $options['commentId'];
    $action = $options['action'];

    $action($pdo, $tableName, $commentId);

    $actionName = $options['actionName'];
    $referrerData = $options['referrerData'] ?? null;
    $pageFromReferrer = $referrerData['page'] ?? null;
    $bucketFromReferrer = $referrerData['bucket'] ?? null;

    $query = $_GET;
    unset($query[$actionName]);
    if (!isset($query['page']) && isset($pageFromReferrer))
        $query['page'] = $pageFromReferrer;
    if (!isset($query['bucket']) && isset($bucketFromReferrer))
        $query['bucket'] = $bucketFromReferrer;

    // Build redirect URL
    $redirectUrl = strtok($_SERVER["REQUEST_URI"], '?') . '?' . http_build_query($query);
    header("Location: $redirectUrl");
    exit;
}


$tableName = $config['comments_table'];
$perPage = 10;

$bucket = (isset($_GET['bucket']) && $_GET['bucket'] === "trash") ? "trash" : "comments";
$inTrashBin = $bucket === "trash";

// Get current page from query string
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$offset = ($page - 1) * $perPage;

$referrerData = getDataFromReferrer();

if (isset($_GET['delete'])) {
    $hash = $_GET['hash'];
    if (!isset($hash))
        throw new InvalidArgumentException('Missing hash to delete');
    $imageName = "comment_$hash.png";
    $historyName = "comment_$hash.brsh";
    $uploadDir = normalizePath(__DIR__ . '/../../uploads/');
    $deletedDir = normalizePath(__DIR__ . '/../../uploads_deleted/');
    if (!file_exists($deletedDir))
        mkdir($deletedDir, 0755, true);
    /*
     * Note: Should there already be a file with the same name, then the target gets overwritten.
     * It is rather rare that some randomly generated comments have the same hash, but it can happen.
     * But since this is already the trash, we don't really care if it gets overwritten. We move the files instead
     * of deleting them, because that is a very dangerous operation and I'd rather delete the trash via FTP occasionally.
     */
    if (!rename($uploadDir . $imageName, $deletedDir . $imageName))
        throw new RuntimeException('Failed to move file: ' . $imageName);
    if (!rename($uploadDir . $historyName, $deletedDir . $historyName))
        throw new RuntimeException('Failed to move file: ' . $historyName);

    runActionAndRedirect([
        'pdo' => $pdo,
        'tableName' => $tableName,
        'commentId' => intval($_GET['delete']),
        'referrerData' => $referrerData,
        'actionName' => 'delete',
        'action' => function ($pdo, $tableName, $commentId) {
            $stmt = $pdo->prepare("DELETE FROM $tableName WHERE id = :id");
            $stmt->bindValue(':id', $commentId, PDO::PARAM_INT);
            $stmt->execute();
        },
    ]);
}

if (isset($_GET['trash']))
    runActionAndRedirect([
        'pdo' => $pdo,
        'tableName' => $tableName,
        'commentId' => intval($_GET['trash']),
        'referrerData' => $referrerData,
        'actionName' => 'trash',
        'action' => function ($pdo, $tableName, $commentId) {
            $stmt = $pdo->prepare("UPDATE $tableName SET trashed = NOW() WHERE id = :id");
            $stmt->bindValue(':id', $commentId, PDO::PARAM_INT);
            $stmt->execute();
        },
    ]);

if (isset($_GET['restore']))
    runActionAndRedirect([
        'pdo' => $pdo,
        'tableName' => $tableName,
        'commentId' => intval($_GET['restore']),
        'referrerData' => $referrerData,
        'actionName' => 'restore',
        'action' => function ($pdo, $tableName, $commentId) {
            $stmt = $pdo->prepare("UPDATE $tableName SET trashed = null WHERE id = :id");
            $stmt->bindValue(':id', $commentId, PDO::PARAM_INT);
            $stmt->execute();
        },
    ]);

if (isset($_GET['approve']))
    runActionAndRedirect([
        'pdo' => $pdo,
        'tableName' => $tableName,
        'commentId' => intval($_GET['approve']),
        'referrerData' => $referrerData,
        'actionName' => 'approve',
        'action' => function ($pdo, $tableName, $commentId) {
            $stmt = $pdo->prepare("UPDATE $tableName SET approved = NOW() WHERE id = :id");
            $stmt->bindValue(':id', $commentId, PDO::PARAM_INT);
            $stmt->execute();
        },
    ]);

if (isset($_GET['disapprove']))
    runActionAndRedirect([
        'pdo' => $pdo,
        'tableName' => $tableName,
        'commentId' => intval($_GET['disapprove']),
        'referrerData' => $referrerData,
        'actionName' => 'disapprove',
        'action' => function ($pdo, $tableName, $commentId) {
            $stmt = $pdo->prepare("UPDATE $tableName SET approved = null WHERE id = :id");
            $stmt->bindValue(':id', $commentId, PDO::PARAM_INT);
            $stmt->execute();
        },
    ]);

try {
    // Get total number of entries
    $trashFilter = $inTrashBin ? "NOT NULL" : "NULL";
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM $tableName WHERE trashed IS $trashFilter");
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($total / $perPage);
    // Fetch submissions
    $stmt = $pdo->prepare("
        SELECT * FROM $tableName 
        WHERE trashed IS $trashFilter 
        ORDER BY created DESC 
        LIMIT :limit 
        OFFSET :offset");
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $commentIds = array_column($entries, 'id');
} catch (PDOException $e) {
    die("Database error: " . $e->getMessage());
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title><?= $inTrashBin ? "Trash Bin" : "Comments" ?></title>
    <link rel="stylesheet" type="text/css" href="/bundle.css">
</head>

<body>
    <div class="admin-panel-wrapper-xxl">
        <h1 class="admin-panel-heading"><?= $inTrashBin ? "Trash Bin" : "Comments" ?></h1>
        <?php /* <span class="page-label">(Page <?= $page ?> of <?= $totalPages ?>)</span> */ ?>
        <div class="admin-panel-body">
            <header class="admin-panel-header">
                <a class="button-secondary" href="./">&larr; Go back to overview</a>
                <?php if ($inTrashBin): ?>
                    <a class="button-secondary" href="?bucket=comments">🗨️ Show comments</a>
                <?php else: ?>
                    <a class="button-secondary" href="?bucket=trash">🗑️ Show trash bin</a>
                <?php endif; ?>
                <?php if ($totalPages > 1): ?>
                    <div class="pagination flex-end">
                        <span>page:</span>
                        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                            <?php if ($i == $page): ?>
                                <strong class="button-like"><?= $i ?></strong>
                            <?php else: ?>
                                <a class="button-secondary" href="?bucket=<?= $bucket ?>&page=<?= $i ?>"><?= $i ?></a>
                            <?php endif; ?>
                        <?php endfor; ?>
                    </div>
                <?php endif; ?>
            </header>
            <div class="table-container flush">
                <?php if ($entries): ?>
                    <table class="table-striped">
                        <thead>
                            <th>ID</th>
                            <th>Created</th>
                            <th>Approved</th>
                            <th>Trashed</th>
                            <th>Target</th>
                            <th>Username</th>
                            <th>Website</th>
                            <th>Image Path</th>
                            <th>History Path</th>
                            <th>Hash</th>
                            <th>Submission ID</th>
                            <th>Actions</th>
                        </thead>
                        <tbody>
                            <?php foreach ($entries as $index => $row): ?>
                                <?php
                                $getValue = fn($field) => $row[$field] ? htmlspecialchars($row[$field]) : null;
                                $nullValue = '<span class="null" title="NULL">🚫</span>';
                                $nullValueOptional = '<span class="null-optional" title="NULL (optional)">🚫</span>';
                                $id = $getValue('id');
                                $created = $getValue('created');
                                $approved = $getValue('approved');
                                $trashed = $getValue('trashed'); // Not required, optional field
                                $target = $getValue('target');
                                $username = $getValue('username');
                                $website = $getValue('website'); // Not required, optional field
                                $imagePath = $getValue('imagePath');
                                $historyPath = $getValue('historyPath');
                                $hash = $getValue('hash');
                                $submissionId = $getValue('submissionId');
                                $imagePathSrc = $imagePath ? str_replace($_SERVER["DOCUMENT_ROOT"], '', $imagePath) : null;
                                $historyPathSrc = $historyPath ? str_replace($_SERVER["DOCUMENT_ROOT"], '', $historyPath) : null;
                                $fields = [
                                    $id,
                                    $created,
                                    $approved,
                                    $target,
                                    $username,
                                    $imagePath,
                                    $historyPath,
                                    $hash,
                                    $submissionId,
                                    $imagePathSrc,
                                    $historyPathSrc
                                ];
                                $previousCommentIdIndex = $index === 0 ? 0 : $index - 1;
                                $previousCommentId = $commentIds[$previousCommentIdIndex];
                                $targetHash = "#comment-$previousCommentId"
                                ?>
                                <tr <?= $id ? 'id="comment-' . $id . '"' : '' ?> class="entry<?= in_array(null, $fields, true) ? ' faulty' : '' ?>">
                                    <td><?= $id ?? $nullValue ?></td>
                                    <td><?= $created ?? $nullValue ?></td>
                                    <td><?= $approved ?? $nullValue ?></td>
                                    <td><?= $trashed ?? $nullValueOptional ?></td>
                                    <td><a href="<?= $target ?>"><?= $target ?? $nullValue ?></a></td>
                                    <td><?= $username ?? $nullValue ?></td>
                                    <td><?= $website ?? $nullValueOptional ?></td>
                                    <td>
                                        <img src="<?= $imagePathSrc ?>" width="320" height="120" alt="Image">
                                        <b>Internal:</b> <?= $imagePath ?? $nullValue ?><br>
                                        <b>Public:</b> <a href="<?= $imagePathSrc ?>"><?= $imagePathSrc ?? $nullValue ?></a>
                                    </td>
                                    <td>
                                        <div class="comment-replayable" data-history-src="<?= $historyPathSrc ?>" data-playback-repeat="2000">
                                        </div>
                                        <b>Internal:</b> <?= $historyPath ?? $nullValue ?><br>
                                        <b>Public:</b> <a href="<?= $historyPathSrc ?>"><?= $historyPathSrc ?? $nullValue ?></a>
                                    </td>
                                    <td><?= $hash ?? $nullValue ?></td>
                                    <td><?= $submissionId ?? $nullValue ?></td>
                                    <td class="actions-cell">
                                        <?php if ($inTrashBin): ?>
                                            <a class="button-danger" href="?delete=<?= $id ?>&hash=<?= $hash . $targetHash ?>">Delete permanently</a>
                                            <a class="button-primary" href="?restore=<?= $id . $targetHash ?>">Restore</a>
                                        <?php else: ?>
                                            <a class="button-primary" href="?trash=<?= $id . $targetHash ?>">Move to trash</a>
                                            <?php if ($approved): ?>
                                                <a class="button-primary" href="?disapprove=<?= $id . $targetHash ?>">Disapprove</a>
                                            <?php else: ?>
                                                <a class="button-primary" href="?approve=<?= $id . $targetHash ?>">Approve</a>
                                            <?php endif; ?>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p>No entries found.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <script type="text/javascript" src="/bundle.js"></script>
</body>

</html>