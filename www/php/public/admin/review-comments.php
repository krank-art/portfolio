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

if (isset($_GET['delete']))
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
    <style>
        body {
            font-family: sans-serif;
            padding: 2em;
        }

        .entry {
            margin-bottom: 2em;
            border-bottom: 1px solid #ccc;
            padding-bottom: 1em;
        }

        .pagination a {
            margin: 0 5px;
            text-decoration: none;
        }

        .pagination strong {
            margin: 0 5px;
        }

        table {
            border-collapse: separate;
            border-spacing: 0;
        }

        thead th {
            position: sticky;
            top: 0;
            background-color: #eee;
            border-right: 0.1rem solid #ccc;
        }

        th,
        td {
            text-align: start;
            border-bottom: 0.1rem solid #888;
            border-right: 0.1rem solid rgba(0, 0, 0, 0.08);
            padding: 0.5rem 1rem;
        }

        td>img,
        td>.comment-replayable {
            border: 0.1rem solid black;
        }

        .null,
        .null-optional {
            display: inline-block;
            border-radius: 0.25em;
            padding-left: 1em;
            padding-right: 1em;
        }

        .null {
            background-color: rgba(255, 0, 0, 0.2);
        }

        .null-optional {
            background-color: rgba(255, 136, 0, 0.2);
        }

        .faulty td {
            background-color: rgba(255, 0, 0, 0.1);
        }

        .actions-cell a {
            display: inline-block;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }
    </style>
    <link rel="stylesheet" type="text/css" href="/bundle.css">
</head>

<body>
    <h1>
        <?= $inTrashBin ? "Trash Bin" : "Comments" ?>
        <span class="page-label">(Page <?= $page ?> of <?= $totalPages ?>)</span>
    </h1>
    <p><a href="./">Go back to overview</a></p>

    <?php if ($inTrashBin): ?>
        <a href="?bucket=comments">Show comments</a>
    <?php else: ?>
        <a href="?bucket=trash">Show trash bin</a>
    <?php endif; ?>

    <?php if ($entries): ?>
        <table>
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
                                <a class="" href="?delete=<?= $id . $targetHash ?>">Delete permanently</a>
                                <a class="" href="?restore=<?= $id . $targetHash ?>">Restore</a>
                            <?php else: ?>
                                <a class="" href="?trash=<?= $id . $targetHash ?>">Move to trash</a>
                                <?php if ($approved): ?>
                                    <a class="" href="?disapprove=<?= $id . $targetHash ?>">Disapprove</a>
                                <?php else: ?>
                                    <a class="" href="?approve=<?= $id . $targetHash ?>">Approve</a>
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

    <div class="pagination">
        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
            <?php if ($i == $page): ?>
                <strong><?= $i ?></strong>
            <?php else: ?>
                <a href="?page=<?= $i ?>"><?= $i ?></a>
            <?php endif; ?>
        <?php endfor; ?>
    </div>

    <script type="text/javascript" src="/bundle.js"></script>
</body>

</html>