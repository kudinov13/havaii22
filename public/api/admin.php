<?php
// /api/admin.php — операции админки. Авторизация: код (X-Admin-Code / code).
// action=ping      — проверка кода
// action=save      — POST {data:{houses?,services?,gallery?,aboutBg?}} → site-data.json
// action=requests  — список заявок из requests-log.jsonl (новые первыми)
// action=delete_request&id= — убрать заявку из лога

declare(strict_types=1);
require __DIR__ . '/_lib.php';

$cfg = g22_config();
if (!is_array($cfg)) g22_out(500, ['ok' => false, 'error' => 'not_configured']);
g22_require_admin($cfg);

$action = (string)($_GET['action'] ?? '');

if ($action === 'ping') {
    g22_out(200, ['ok' => true]);
}

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $j = json_decode((string)file_get_contents('php://input'), true);
    $data = is_array($j) ? ($j['data'] ?? null) : null;
    if (!is_array($data)) g22_out(422, ['ok' => false, 'error' => 'no_data']);
    $patch = [];
    foreach (['houses', 'services', 'gallery'] as $k) {
        if (isset($data[$k]) && is_array($data[$k])) $patch[$k] = $data[$k];
    }
    if (isset($data['aboutBg']) && is_string($data['aboutBg'])) $patch['aboutBg'] = $data['aboutBg'];
    if (!$patch) g22_out(422, ['ok' => false, 'error' => 'empty_patch']);
    g22_save_data($patch);
    g22_out(200, ['ok' => true]);
}

if ($action === 'requests') {
    $f = g22_requests_log();
    $items = [];
    if (is_file($f)) {
        $lines = file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach (array_slice($lines, -500) as $l) {
            $r = json_decode($l, true);
            if (is_array($r)) $items[] = $r;
        }
        $items = array_reverse($items);
    }
    g22_out(200, ['ok' => true, 'requests' => $items]);
}

if ($action === 'set_status') {
    $id = (string)($_GET['id'] ?? $_POST['id'] ?? '');
    $status = (string)($_GET['status'] ?? $_POST['status'] ?? '');
    if ($id === '' || !in_array($status, ['confirmed', 'declined', ''], true)) {
        g22_out(422, ['ok' => false, 'error' => 'bad_args']);
    }
    $f = g22_requests_log();
    $found = false;
    if (is_file($f)) {
        $lines = file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $i => $l) {
            $r = json_decode($l, true);
            if (is_array($r) && (string)($r['id'] ?? '') === $id) {
                if ($status === '') { unset($r['status'], $r['statusBy'], $r['statusTs']); }
                else { $r['status'] = $status; $r['statusBy'] = 'админка'; $r['statusTs'] = time(); }
                $lines[$i] = json_encode($r, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $found = true;
            }
        }
        if ($found) file_put_contents($f, implode("\n", $lines) . ($lines ? "\n" : ''), LOCK_EX);
    }
    g22_out($found ? 200 : 404, $found ? ['ok' => true] : ['ok' => false, 'error' => 'not_found']);
}

if ($action === 'delete_request') {
    $id = (string)($_GET['id'] ?? $_POST['id'] ?? '');
    $f = g22_requests_log();
    if ($id !== '' && is_file($f)) {
        $lines = file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        $keep = [];
        foreach ($lines as $l) {
            $r = json_decode($l, true);
            if (!is_array($r) || (string)($r['id'] ?? '') !== $id) $keep[] = $l;
        }
        file_put_contents($f, implode("\n", $keep) . ($keep ? "\n" : ''), LOCK_EX);
    }
    g22_out(200, ['ok' => true]);
}

g22_out(404, ['ok' => false, 'error' => 'unknown_action']);
