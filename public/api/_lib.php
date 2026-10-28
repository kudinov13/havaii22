<?php
// Общие функции API Гавайи22: конфиг, вызовы Telegram, хранилище site-data.json,
// авторизация админки. Секреты — в tg-config.php ВНЕ docroot.

declare(strict_types=1);

function g22_out(int $code, array $data): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// --- конфиг: ищем вне docroot; фолбэки для локалки ---
function g22_config(): ?array {
    static $cfg = false;
    if ($cfg !== false) return $cfg;
    foreach ([
        dirname(__DIR__, 3) . '/tg-config.php', // /var/www/u3698395/data/tg-config.php
        dirname(__DIR__, 2) . '/tg-config.php',
        __DIR__ . '/tg-config.php',
    ] as $p) {
        if (is_file($p)) { $cfg = require $p; return $cfg; }
    }
    $cfg = null;
    return null;
}

// каталог данных (рядом с конфигом): site-data.json, uploads/, requests-log.jsonl
function g22_data_dir(): string {
    foreach ([
        dirname(__DIR__, 3),
        dirname(__DIR__, 2),
    ] as $d) {
        if (is_file($d . '/tg-config.php')) return $d;
    }
    return dirname(__DIR__, 3);
}

function g22_site_data_file(): string { return g22_data_dir() . '/site-data.json'; }
function g22_uploads_dir(): string    { return g22_data_dir() . '/uploads'; }
function g22_requests_log(): string   { return g22_data_dir() . '/requests-log.jsonl'; }

// --- Telegram Bot API через HTTP-прокси ---
function g22_tg(array $cfg, string $method, array $params): array {
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
    return ['ok' => ($code === 200 && is_array($j) && !empty($j['ok'])), 'http' => $code, 'err' => $err, 'result' => $j['result'] ?? null];
}

// --- site-data.json: чтение/запись с блокировкой ---
function g22_load_data(): array {
    $f = g22_site_data_file();
    if (!is_file($f)) return [];
    $j = json_decode((string)file_get_contents($f), true);
    return is_array($j) ? $j : [];
}

function g22_save_data(array $patch): void {
    $f = g22_site_data_file();
    $fp = fopen($f, 'c+');
    if (!$fp) return;
    flock($fp, LOCK_EX);
    $cur = json_decode((string)stream_get_contents($fp), true);
    if (!is_array($cur)) $cur = [];
    $data = array_merge($cur, $patch);
    $data['updatedAt'] = time();
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

// даты заявки: checkIn..checkOut (ISO Y-m-d) → все дни включительно
function g22_req_days(?string $ci, ?string $co): array {
    if (!is_string($ci) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $ci)) return [];
    $to = (is_string($co) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $co) && $co >= $ci) ? $co : $ci;
    $out = [];
    for ($t = strtotime($ci), $e = strtotime($to); $t <= $e && count($out) < 367; $t += 86400) {
        $out[] = date('Y-m-d', $t);
    }
    return $out;
}

// Занятость по заявке: $block=true → даты checkIn..checkOut заняты (домик по
// houseId или houseName), запоминаем в appliedDates/appliedHouse; $block=false —
// снимает ровно те даты, что ставила эта заявка (ручные периоды не трогает).
function g22_apply_request_occupancy(array &$req, bool $block): bool {
    if ($block) {
        $days = g22_req_days($req['checkIn'] ?? null, $req['checkOut'] ?? null);
        if (!$days) return false;
    } else {
        $days = is_array($req['appliedDates'] ?? null) ? $req['appliedDates'] : [];
        if (!$days) return false;
    }
    $ref = (string)($req['houseId'] ?? $req['appliedHouse'] ?? $req['houseName'] ?? '');
    if ($ref === '') return false;
    $houses = (g22_load_data()['houses'] ?? []);
    $hit = false;
    $hid = '';
    foreach ($houses as &$h) {
        $match = (string)($h['id'] ?? '') === $ref
            || mb_strtolower(trim((string)($h['name'] ?? ''))) === mb_strtolower($ref);
        if (!$match) continue;
        $cur = array_map('strval', (array)($h['blockedDates'] ?? []));
        if ($block) {
            $h['blockedDates'] = array_values(array_unique(array_merge($cur, $days)));
            sort($h['blockedDates']);
        } else {
            $del = array_flip($days);
            $h['blockedDates'] = array_values(array_filter($cur, fn($d) => !isset($del[$d])));
        }
        $hit = true;
        $hid = (string)($h['id'] ?? '');
    }
    unset($h);
    if (!$hit) return false;
    g22_save_data(['houses' => $houses]);
    if ($block) {
        $req['appliedDates'] = $days;
        $req['appliedHouse'] = $hid !== '' ? $hid : $ref;
    } else {
        unset($req['appliedDates'], $req['appliedHouse']);
    }
    return true;
}

// --- авторизация админки: код из tg-config.php['admin_code'] ---
function g22_admin_check(array $cfg, string $code): bool {
    $expected = (string)($cfg['admin_code'] ?? '');
    return $expected !== '' && hash_equals($expected, $code);
}

function g22_require_admin(array $cfg): void {
    $code = (string)($_SERVER['HTTP_X_ADMIN_CODE'] ?? $_POST['code'] ?? $_GET['code'] ?? '');
    if (!g22_admin_check($cfg, $code)) {
        g22_out(403, ['ok' => false, 'error' => 'forbidden']);
    }
}

// антиспам-лимитер по IP
function g22_rate_ok(string $bucket, int $minGapSec, int $maxPerDay): bool {
    $ip  = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $tmp = sys_get_temp_dir() . '/g22_rate_' . $bucket . '_' . md5($ip);
    $now = time();
    $hits = is_file($tmp) ? json_decode((string)file_get_contents($tmp), true) : null;
    $hits = is_array($hits) ? array_values(array_filter($hits, fn($t) => $now - $t < 86400)) : [];
    if ($hits && ($now - max($hits) < $minGapSec || count($hits) >= $maxPerDay)) return false;
    $hits[] = $now;
    @file_put_contents($tmp, json_encode($hits));
    return true;
}
