<?php
// Endpoint заявок Гавайи22: принимает POST из форм сайта и шлёт уведомление
// в общий чат Telegram через бота. Telegram API идёт через HTTP(S)-прокси.
// Секреты — в tg-config.php ВНЕ docroot (/var/www/u3698395/data/tg-config.php),
// файл переживает деплои и недоступен из веба. В репозиторий не коммитится.

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

function out(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// --- конфиг (вне docroot; фолбэки для локальной разработки) ---
$cfgPath = null;
foreach ([
    dirname(__DIR__, 3) . '/tg-config.php', // /var/www/u3698395/data/tg-config.php
    dirname(__DIR__, 2) . '/tg-config.php',
    __DIR__ . '/tg-config.php',
] as $p) {
    if (is_file($p)) { $cfgPath = $p; break; }
}
$cfg = $cfgPath ? require $cfgPath : null;
$dataDir = $cfgPath ? dirname($cfgPath) : __DIR__;

// --- вызов Telegram Bot API через прокси ---
function tgCall(array $cfg, string $method, array $params): array {
    $ch = curl_init('https://api.telegram.org/bot' . $cfg['token'] . '/' . $method);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($params, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    if (!empty($cfg['proxy'])) {
        curl_setopt($ch, CURLOPT_PROXY, $cfg['proxy']);
    }
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    $j = json_decode((string)$resp, true);
    return ['ok' => ($code === 200 && is_array($j) && !empty($j['ok'])), 'http' => $code, 'err' => $err, 'result' => $j['result'] ?? null, 'raw' => $j];
}

// --- chat_id: из конфига, из кэша, либо авто-поиск по апдейтам группы ---
function chatId(array $cfg, string $dataDir): ?string {
    if (!empty($cfg['chat_id'])) return (string)$cfg['chat_id'];
    $cache = $dataDir . '/tg-chatid.txt';
    if (is_file($cache)) {
        $id = trim((string)file_get_contents($cache));
        if ($id !== '') return $id;
    }
    $r = tgCall($cfg, 'getUpdates', ['timeout' => 0, 'limit' => 100]);
    foreach ((array)($r['result'] ?? []) as $u) {
        $chat = $u['message']['chat'] ?? $u['my_chat_member']['chat'] ?? $u['channel_post']['chat'] ?? null;
        if (is_array($chat) && in_array($chat['type'] ?? '', ['group', 'supergroup'], true)) {
            @file_put_contents($cache, (string)$chat['id']);
            return (string)$chat['id'];
        }
    }
    return null;
}

// --- healthcheck: GET ?ping=1 (без секретов в ответе) ---
if (($_GET['ping'] ?? '') === '1') {
    if (!is_array($cfg) || empty($cfg['token'])) out(500, ['ok' => false, 'error' => 'not_configured']);
    $cid = chatId($cfg, $dataDir);
    out(200, ['ok' => true, 'service' => 'gavai22-requests', 'chat_ready' => $cid !== null]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(405, ['ok' => false, 'error' => 'method_not_allowed']);
}
if (!is_array($cfg) || empty($cfg['token'])) {
    out(500, ['ok' => false, 'error' => 'not_configured']);
}

// --- входные данные: JSON или form ---
$in = $_POST;
if (empty($in)) {
    $raw = file_get_contents('php://input');
    $j = json_decode((string)$raw, true);
    if (is_array($j)) $in = $j;
}
// honeypot: боты заполняют скрытое поле — молча "успех"
if (!empty($in['website'])) {
    out(200, ['ok' => true]);
}

$field = fn(string $k): string => trim(mb_substr((string)($in[$k] ?? ''), 0, 500));
$name  = $field('name');
$phone = $field('phone');
if (mb_strlen($name) < 2 || mb_strlen($phone) < 6) {
    out(422, ['ok' => false, 'error' => 'validation']);
}

// --- простой антиспам: не чаще 1 заявки / 20 сек с IP, максимум 15 в сутки ---
$ip  = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$tmp = sys_get_temp_dir() . '/g22_rate_' . md5($ip);
$now = time();
$hits = is_file($tmp) ? json_decode((string)file_get_contents($tmp), true) : null;
$hits = is_array($hits) ? array_filter($hits, fn($t) => $now - $t < 86400) : [];
if ($hits && ($now - max($hits) < 20 || count($hits) >= 15)) {
    out(200, ['ok' => true]); // не говорим спамеру, что отказали
}
$hits[] = $now;
@file_put_contents($tmp, json_encode(array_values($hits)));

// --- текст сообщения ---
$e = fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$lines = ["\u{1F3DD} <b>Новая заявка — Гавайи22</b>", ''];
$lines[] = "\u{1F464} Имя: <b>{$e($name)}</b>";
$lines[] = "\u{1F4DE} Телефон: <b>{$e($phone)}</b>";
if (($v = $field('houseName')) !== '') $lines[] = "\u{1F3E0} Домик: {$e($v)}";
if (($v = $field('service')) !== '')   $lines[] = "\u{1F6CE} Услуга: {$e($v)}";
$ci = $field('checkIn'); $co = $field('checkOut');
if ($ci !== '') $lines[] = "\u{1F4C5} Даты: {$e($ci)}" . ($co !== '' ? " — {$e($co)}" : '');
if (($v = $field('comment')) !== '') $lines[] = "\u{1F4AC} Комментарий: {$e($v)}";
if (($v = $field('source')) !== '')  $lines[] = "\u{1F4CD} Источник: {$e($v)}";
$lines[] = '';
$lines[] = "\u{1F550} " . date('d.m.Y H:i');
$text = implode("\n", $lines);

$cid = chatId($cfg, $dataDir);
$tg = ['ok' => false, 'http' => 0, 'err' => 'no_chat_id'];
if ($cid !== null) {
    $tg = tgCall($cfg, 'sendMessage', [
        'chat_id' => $cid,
        'text' => $text,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true,
    ]);
}

// --- бэкап-лог заявок (вне docroot, рядом с конфигом) ---
$logLine = json_encode([
    'ts' => $now, 'ip' => $ip, 'name' => $name, 'phone' => $phone,
    'houseName' => $in['houseName'] ?? null, 'service' => $in['service'] ?? null,
    'checkIn' => $ci ?: null, 'checkOut' => $co ?: null,
    'comment' => $in['comment'] ?? null, 'source' => $in['source'] ?? null,
    'tg' => $tg['ok'], 'tg_http' => $tg['http'],
], JSON_UNESCAPED_UNICODE);
@file_put_contents($dataDir . '/requests-log.jsonl', $logLine . "\n", FILE_APPEND | LOCK_EX);

out($tg['ok'] ? 200 : 502, $tg['ok'] ? ['ok' => true] : ['ok' => false, 'error' => 'telegram_failed', 'tg_code' => $tg['http'], 'tg_err' => $tg['err']]);
