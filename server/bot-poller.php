<?php
// Поллер Telegram-бота Гавайи22 — запускается по крону раз в минуту (CLI).
// Читает getUpdates, обрабатывает команды админов в общем чате:
//   /start, /help          — справка
//   /houses                — список домиков
//   /status                — домики + занятые периоды
//   /busy                  — выбрать домик кнопками → ввести даты → занято
//   /free                  — то же, но снимает занятость
//   /busy 1 10.11-12.11    — одной командой
//   /free 1 10.11-12.11
// Занятые даты пишутся в site-data.json → сайт сразу блокирует их в форме.
//
// НЕ лежит в docroot — деплоится вручную в ~/bot-poller.php.

declare(strict_types=1);

$DATA_DIR = __DIR__; // ~/data — поллер лежит рядом с конфигом
$CFG_FILE = $DATA_DIR . '/tg-config.php';
$DATA_FILE = $DATA_DIR . '/site-data.json';
$STATE_FILE = $DATA_DIR . '/bot-state.json';
$SEED_FILE = $DATA_DIR . '/www/hawaii22.ru/api/seed-data.json';

if (!is_file($CFG_FILE)) { fwrite(STDERR, "no config\n"); exit(1); }
$cfg = require $CFG_FILE;
if (empty($cfg['token'])) { fwrite(STDERR, "no token\n"); exit(1); }

/* ---------------- Telegram API ---------------- */

function tg(array $cfg, string $method, array $params): array {
    $ch = curl_init('https://api.telegram.org/bot' . $cfg['token'] . '/' . $method);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($params, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);
    if (!empty($cfg['proxy'])) curl_setopt($ch, CURLOPT_PROXY, $cfg['proxy']);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    $j = json_decode((string)$resp, true);
    return ['ok' => $code === 200 && is_array($j) && !empty($j['ok']), 'result' => $j['result'] ?? null];
}

function sendMsg(array $cfg, $chatId, string $text, ?array $keyboard = null): void {
    $p = ['chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'HTML'];
    if ($keyboard) $p['reply_markup'] = ['inline_keyboard' => $keyboard];
    tg($cfg, 'sendMessage', $p);
}

/* ---------------- Хранилище ---------------- */

function loadData(string $file, string $seedFile): array {
    if (is_file($file)) {
        $j = json_decode((string)file_get_contents($file), true);
        if (is_array($j)) return $j;
    }
    if (is_file($seedFile)) {
        $j = json_decode((string)file_get_contents($seedFile), true);
        if (is_array($j)) return $j;
    }
    return [];
}

function saveData(string $file, array $data): void {
    $data['updatedAt'] = time();
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function loadState(string $file): array {
    $j = is_file($file) ? json_decode((string)file_get_contents($file), true) : null;
    return is_array($j) ? $j : ['offset' => 0, 'pending' => []];
}

function saveState(string $file, array $st): void {
    file_put_contents($file, json_encode($st), LOCK_EX);
}

/* ---------------- Даты ---------------- */

// "10.11-12.11", "10.11.2026 — 12.11.2026", "2026-11-10 2026-11-12", "10.11"
function parseDates(string $text): ?array {
    $text = trim($text);
    $rx = '/(\d{1,2})[.\-\/](\d{1,2})(?:[.\-\/](\d{2,4}))?/u';
    preg_match_all($rx, $text, $m);
    $dates = [];
    if (preg_match_all('/(\d{4})-(\d{2})-(\d{2})/', $text, $iso) && count($iso[0]) >= 1 && count($m[0]) < 2) {
        // ISO-формат
        for ($i = 0; $i < count($iso[0]); $i++) $dates[] = sprintf('%04d-%02d-%02d', $iso[1][$i], $iso[2][$i], $iso[3][$i]);
    } else {
        for ($i = 0; $i < count($m[0]); $i++) {
            $d = (int)$m[1][$i]; $mo = (int)$m[2][$i]; $y = $m[3][$i] !== '' ? (int)$m[3][$i] : (int)date('Y');
            if ($y < 100) $y += 2000;
            if ($d < 1 || $d > 31 || $mo < 1 || $mo > 12) return null;
            $dates[] = sprintf('%04d-%02d-%02d', $y, $mo, $d);
        }
    }
    if (!$dates) return null;
    sort($dates);
    $from = $dates[0]; $to = end($dates);
    $out = [];
    for ($t = strtotime($from); $t <= strtotime($to); $t += 86400) {
        $out[] = date('Y-m-d', $t);
        if (count($out) > 366) return null;
    }
    return $out;
}

function fmtRanges(array $dates): string {
    sort($dates);
    $ranges = [];
    $start = $prev = null;
    foreach ($dates as $d) {
        $t = strtotime($d);
        if ($prev !== null && $t - strtotime($prev) > 86400) { $ranges[] = [$start, $prev]; $start = $d; }
        if ($start === null) $start = $d;
        $prev = $d;
    }
    if ($start !== null) $ranges[] = [$start, $prev];
    return implode(', ', array_map(
        fn($r) => date('d.m', strtotime($r[0])) . ($r[0] !== $r[1] ? '–' . date('d.m', strtotime($r[1])) : ''),
        $ranges
    ));
}

/* ---------------- Логика команд ---------------- */

$state = loadState($STATE_FILE);
$data  = loadData($DATA_FILE, $SEED_FILE);
$houses = $data['houses'] ?? [];

$allowedChat = (string)($cfg['chat_id'] ?? '');

$help = "🏝 <b>Бот Гавайи22</b>\n\n" .
    "/houses — список домиков\n" .
    "/status — занятые даты\n" .
    "/busy — отметить занятость (выбор домика кнопками)\n" .
    "/free — снять занятость\n\n" .
    "Или сразу: <code>/busy 1 10.11-15.11</code>";

$updates = tg($cfg, 'getUpdates', ['offset' => $state['offset'], 'timeout' => 0, 'limit' => 50]);
if (!$updates['ok']) { sleep(1); exit(0); }

foreach ((array)$updates['result'] as $u) {
    $state['offset'] = max($state['offset'], (int)$u['update_id'] + 1);

    // --- inline-кнопки: выбор домика ---
    if (isset($u['callback_query'])) {
        $cq = $u['callback_query'];
        $chatId = (string)($cq['message']['chat']['id'] ?? '');
        if ($allowedChat !== '' && $chatId !== $allowedChat) { tg($cfg, 'answerCallbackQuery', ['callback_query_id' => $cq['id']]); continue; }
        $cb = (string)$cq['data'];
        if (preg_match('/^(busy|free):(.+)$/', $cb, $m)) {
            $house = null;
            foreach ($houses as $i => $h) {
                if ((string)$h['id'] === $m[2] || (string)($i + 1) === $m[2]) { $house = $h; break; }
            }
            tg($cfg, 'answerCallbackQuery', ['callback_query_id' => $cq['id']]);
            if (!$house) { sendMsg($cfg, $chatId, 'Домик не найден.'); continue; }
            $state['pending'][$chatId] = ['action' => $m[1], 'house' => $house['id'], 'ts' => time()];
            sendMsg($cfg, $chatId, ($m[1] === 'busy' ? "🔴 Занять «{$house['name']}»" : "🟢 Освободить «{$house['name']}»") .
                "\n\nВведите даты: <code>10.11-15.11</code> или одну дату <code>10.11</code>");
        }
        continue;
    }

    $msg = $u['message'] ?? null;
    if (!$msg) continue;
    $chatId = (string)$msg['chat']['id'];
    $text = trim((string)($msg['text'] ?? ''));

    // только наша группа (или личка админа из cfg['admin_chats'])
    $adminChats = array_map('strval', (array)($cfg['admin_chats'] ?? []));
    if ($allowedChat !== '' && $chatId !== $allowedChat && !in_array($chatId, $adminChats, true)) continue;
    if ($text === '') continue;

    // команды
    if (preg_match('/^\/(start|help)/i', $text)) { sendMsg($cfg, $chatId, $help); continue; }

    if (preg_match('/^\/houses/i', $text)) {
        if (!$houses) { sendMsg($cfg, $chatId, 'Домиков пока нет — добавьте в админке сайта.'); continue; }
        $list = "🏠 <b>Домики:</b>\n";
        foreach ($houses as $i => $h) {
            $n = count($h['blockedDates'] ?? []);
            $list .= sprintf("%d. %s — %s₽/ночь%s\n", $i + 1, $h['name'], number_format((float)($h['pricePerNight'] ?? 0), 0, '', ' '), $n ? " (занято {$n} дн.)" : '');
        }
        sendMsg($cfg, $chatId, $list);
        continue;
    }

    if (preg_match('/^\/status/i', $text)) {
        if (!$houses) { sendMsg($cfg, $chatId, 'Домиков пока нет.'); continue; }
        $list = "📅 <b>Занятость:</b>\n";
        foreach ($houses as $i => $h) {
            $bd = $h['blockedDates'] ?? [];
            $list .= sprintf("%d. %s — %s\n", $i + 1, $h['name'], $bd ? fmtRanges($bd) : 'все даты свободны');
        }
        sendMsg($cfg, $chatId, $list);
        continue;
    }

    if (preg_match('/^\/(busy|free)(?:\s+(.*))?$/iu', $text, $m)) {
        $cmd = strtolower($m[1]);
        $args = trim((string)($m[2] ?? ''));
        // одной строкой: /busy 1 10.11-12.11
        if ($args !== '' && preg_match('/^(\S+)\s+(.+)$/', $args, $am)) {
            [$all, $houseRef, $dateStr] = $am;
            $house = null;
            foreach ($houses as $i => $h) {
                if ((string)($i + 1) === $houseRef || (string)$h['id'] === $houseRef || mb_stripos((string)$h['name'], $houseRef) !== false) { $house = $h; break; }
            }
            if (!$house) { sendMsg($cfg, $chatId, "Домик «{$houseRef}» не найден. /houses — список."); continue; }
            $days = parseDates($dateStr);
            if (!$days) { sendMsg($cfg, $chatId, 'Не понял даты. Пример: <code>/busy 1 10.11-15.11</code>'); continue; }
            $houses = applyDates($houses, $house['id'], $days, $cmd === 'busy');
            $data['houses'] = $houses;
            saveData($DATA_FILE, $data);
            sendMsg($cfg, $chatId, sprintf("%s «%s»: %s ✅", $cmd === 'busy' ? '🔴 Занято' : '🟢 Освобождено', $house['name'], fmtRanges($days)));
            continue;
        }
        // без аргументов — кнопки
        if (!$houses) { sendMsg($cfg, $chatId, 'Домиков пока нет.'); continue; }
        $kb = [];
        foreach ($houses as $i => $h) {
            $kb[] = [['text' => ($i + 1) . '. ' . $h['name'], 'callback_data' => $cmd . ':' . $h['id']]];
        }
        sendMsg($cfg, $chatId, $cmd === 'busy' ? '🔴 Какой домик занять?' : '🟢 Какой домик освободить?', $kb);
        continue;
    }

    // ожидание дат после выбора домика кнопкой
    $pending = $state['pending'][$chatId] ?? null;
    if ($pending && time() - (int)$pending['ts'] < 600) {
        $days = parseDates($text);
        if (!$days) { sendMsg($cfg, $chatId, 'Не понял даты. Пример: <code>10.11-15.11</code> или <code>24.12</code>'); continue; }
        unset($state['pending'][$chatId]);
        $houses = applyDates($houses, $pending['house'], $days, $pending['action'] === 'busy');
        $data['houses'] = $houses;
        saveData($DATA_FILE, $data);
        $name = 'домик';
        foreach ($houses as $h) if ($h['id'] === $pending['house']) $name = $h['name'];
        sendMsg($cfg, $chatId, sprintf("%s «%s»: %s ✅", $pending['action'] === 'busy' ? '🔴 Занято' : '🟢 Освобождено', $name, fmtRanges($days)));
        continue;
    }
}

saveState($STATE_FILE, $state);

function applyDates(array $houses, string $houseId, array $days, bool $block): array {
    foreach ($houses as &$h) {
        if ((string)$h['id'] !== $houseId) continue;
        $cur = array_map('strval', (array)($h['blockedDates'] ?? []));
        if ($block) {
            $h['blockedDates'] = array_values(array_unique(array_merge($cur, $days)));
            sort($h['blockedDates']);
        } else {
            $del = array_flip($days);
            $h['blockedDates'] = array_values(array_filter($cur, fn($d) => !isset($del[$d])));
        }
    }
    return $houses;
}
