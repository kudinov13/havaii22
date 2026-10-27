<?php
// POST /api/upload.php — загрузка фото из админки (multipart: file + code).
// Сохраняет в ~/data/uploads/, отдаёт URL /uploads/<file> (симлинк в docroot).

declare(strict_types=1);
require __DIR__ . '/_lib.php';

$cfg = g22_config();
if (!is_array($cfg)) g22_out(500, ['ok' => false, 'error' => 'not_configured']);
g22_require_admin($cfg);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') g22_out(405, ['ok' => false, 'error' => 'method_not_allowed']);
if (!g22_rate_ok('upload', 2, 200)) g22_out(429, ['ok' => false, 'error' => 'rate_limited']);

$f = $_FILES['file'] ?? null;
if (!$f || !is_uploaded_file($f['tmp_name'])) g22_out(422, ['ok' => false, 'error' => 'no_file']);
if ($f['size'] > 12 * 1024 * 1024) g22_out(413, ['ok' => false, 'error' => 'too_big']);

$mime = mime_content_type($f['tmp_name']);
$ext  = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime] ?? null;
if (!$ext) g22_out(415, ['ok' => false, 'error' => 'bad_type', 'mime' => $mime]);

$dir = g22_uploads_dir();
if (!is_dir($dir)) @mkdir($dir, 0755, true);

$name = 'u_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $name)) {
    g22_out(500, ['ok' => false, 'error' => 'save_failed']);
}
@chmod($dir . '/' . $name, 0644);

g22_out(200, ['ok' => true, 'url' => '/uploads/' . $name]);
