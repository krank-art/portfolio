<?php

session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    http_response_code(403);
    echo "Access denied.";
    exit;
}

require __DIR__ . '/../../database.php';

$tableName = $config['comments_table'];
$perPage = 20;

// Get current page from query string
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$offset = ($page - 1) * $perPage;

try {
    // Get total number of entries
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM $tableName");
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($total / $perPage);
    // Fetch submissions
    $stmt = $pdo->prepare("SELECT * FROM $tableName ORDER BY created DESC LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database error: " . $e->getMessage());
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Submissions</title>
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
            border-collapse: collapse;
        }

        th,
        td {
            text-align: start;
            border-bottom: 0.1rem solid #888;
            padding: 0.5rem 1rem;
        }

        td>img {
            border: 0.1rem solid black;
        }

        .null {
            display: inline-block;
            border-radius: 0.25em;
            padding-left: 1em;
            padding-right: 1em;
            background-color: rgba(255, 0, 0, 0.2);
        }

        .faulty td {
            background-color: rgba(255, 0, 0, 0.1);
        }
    </style>
</head>

<body>

    <h1>Submissions (Page <?= $page ?> of <?= $totalPages ?>)</h1>

    <?php if ($entries): ?>
        <table>
            <thead>
                <th>ID</th>
                <th>Created</th>
                <th>Approved</th>
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
                <?php foreach ($entries as $row): ?>
                    <?php
                    $getValue = fn($field) => $row[$field] ? htmlspecialchars($row[$field]) : null;
                    $nullValue = '<span class="null" title="NULL">🚫</span>';
                    $id = $getValue('id');
                    $created = $getValue('created');
                    $approved = $getValue('approved');
                    $target = $getValue('target');
                    $username = $getValue('username');
                    $website = $getValue('website');
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
                        $website,
                        $imagePath,
                        $historyPath,
                        $hash,
                        $submissionId,
                        $imagePathSrc,
                        $historyPathSrc
                    ];
                    ?>
                    <tr class="entry<?= in_array(null, $fields, true) ? ' faulty' : '' ?>">
                        <td><?= $id ?? $nullValue ?></td>
                        <td><?= $created ?? $nullValue ?></td>
                        <td><?= $approved ?? $nullValue ?></td>
                        <td><?= $target ?? $nullValue ?></td>
                        <td><?= $username ?? $nullValue ?></td>
                        <td><?= $website ?? $nullValue ?></td>
                        <td>
                            <img src="<?= $imagePathSrc ?>" width="320" height="120" alt="Image"><br>
                            <b>Internal:</b> <?= $imagePath ?? $nullValue ?><br>
                            <b>Public:</b> <a href="<?= $imagePathSrc ?>"><?= $imagePathSrc ?? $nullValue ?></a>
                        </td>
                        <td>
                            <b>Internal:</b> <?= $historyPath ?? $nullValue ?><br>
                            <b>Public:</b> <a href="<?= $historyPathSrc ?>"><?= $historyPathSrc ?? $nullValue ?></a>
                        </td>
                        <td><?= $hash ?? $nullValue ?></td>
                        <td><?= $submissionId ?? $nullValue ?></td>
                        <td>TODO</to>
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

</body>

</html>