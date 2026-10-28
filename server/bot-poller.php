<?php
// Поллер Telegram-бота Гавайи22 — запускается по крону раз в минуту (CLI).
//
// Модель:
//   • Общая группа — ТОЛЬКО уведомления о новых заявках (их шлёт request.php).
//     На сообщения в группе бот не отвечает.
//   • Управление занятостью — в ЛИЧКЕ с ботом, навигация inline-кнопками:
//       Меню → 🔴 Занять / 🟢 Освободить → кнопка домика → ввод дат → готово.
//
// Доступ: по паролю. Первое сообщение в ЛС → бот просит пароль
// (tg-config.php → 'bot_password', иначе 'admin_code'). Ввёл верно —
// chat_id записывается в state['authed'] и доступ остаётся навсегда.
// /logout — сбросить доступ на этом устройстве.
//
// НЕ лежит в docroot — деплоится вручную в ~/bot-poller.php.

declare(strict_types=1);

$DATA_DIR  = __DIR__;
$CFG_FILE   = $DATA_DIR . '/tg-config.php';
$DATA_FILE  = $DATA_DIR . '/site-data.json';
$STATE_FILE = $DATA_DIR . '/bot-state.json';
$SEED_FILE  = $DATA_DIR . '/www/hawaii22.ru/api/seed-data.json';
$LOG_FILE   = $DATA_DIR . '/bot-poller.log';

if (!is_file($CFG_FILE)) { fwrite(STDERR, "no config\n"); exit(1); }
$cfg = require $CFG_FILE;
if (empty($cfg['token'])) { fwrite(STDERR, "no token\n"); exit(1); }

// Не даём двум прогонам работать одновременно — иначе один читает state
// до того, как предыдущий его сохранил, и апдейты «проедаются».
$LOCK = fopen($DATA_DIR . '/bot-poller.lock', 'c');
if (!$LOCK || !flock($LOCK, LOCK_EX | LOCK_NB)) { exit(0); }

function plog(string $s): void {
    global $LOG_FILE;
    file_put_contents($LOG_FILE, date('d.m.y H:i:s') . ' ' . $s . "\n", FILE_APPEND | LOCK_EX);
}

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
    $p = ['chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true];
    if ($keyboard) $p['reply_markup'] = ['inline_keyboard' => $keyboard];
    tg($cfg, 'sendMessage', $p);
}

// Редактирование сообщения — чистая навигация без простыни сообщений.
function editMsg(array $cfg, $chatId, $msgId, string $text, ?array $keyboard = null): void {
    $p = ['chat_id' => $chatId, 'message_id' => $msgId, 'text' => $text, 'parse_mode' => 'HTML'];
    if ($keyboard) $p['reply_markup'] = ['inline_keyboard' => $keyboard];
    tg($cfg, 'editMessageText', $p);
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

// Обновить заявку в requests-log.jsonl: $mut меняет запись, возвращаем итог (null — не найдена)
function reqUpdate(string $file, string $id, callable $mut): ?array {
    if (!is_file($file)) return null;
    $fp = fopen($file, 'c+');
    if (!$fp || !flock($fp, LOCK_EX)) { if ($fp) fclose($fp); return null; }
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    $out = null;
    foreach ($lines as $i => $l) {
        $r = json_decode($l, true);
        if (is_array($r) && (string)($r['id'] ?? '') === $id) {
            $mut($r);
            $lines[$i] = json_encode($r, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $out = $r;
        }
    }
    if ($out !== null) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, implode("\n", $lines) . "\n");
    }
    flock($fp, LOCK_UN);
    fclose($fp);
    return $out;
}

function loadState(string $file): array {
    $j = is_file($file) ? json_decode((string)file_get_contents($file), true) : null;
    return is_array($j) ? $j : ['offset' => 0, 'pending' => []];
}

function saveState(string $file, array $st): void {
    file_put_contents($file, json_encode($st, JSON_UNESCAPED_UNICODE), LOCK_EX);
}

/* ---------------- Даты ---------------- */

// Даты: одиночные, диапазоны и списки.
// "10.11", "10.11-15.11", "10.11.2026 — 15.11.2026", "2026-11-10 — 2026-11-15",
// "10.11-15.11, 20.11-22.11, 25.11", "с 10.11 по 15.11"
// Внутри даты разделители — только "." и "/". "-" / "–" / "—" — разделители диапазона.
function parseDates(string $text): ?array {
    $all = [];
    foreach (preg_split('/[,;\n]+/u', trim($text)) as $seg) {
        $seg = trim($seg);
        if ($seg === '') continue;
        $days = parseDateSegment($seg);
        if ($days === null) return null;
        foreach ($days as $d) $all[$d] = true;
    }
    if (!$all) return null;
    $out = array_keys($all);
    sort($out);
    return $out;
}

function parseDateSegment(string $seg): ?array {
    $dates = [];
    // ISO yyyy-mm-dd
    if (preg_match_all('/(\d{4})-(\d{1,2})-(\d{1,2})/', $seg, $iso)) {
        for ($i = 0; $i < count($iso[0]); $i++) {
            [$y, $mo, $d] = [(int)$iso[1][$i], (int)$iso[2][$i], (int)$iso[3][$i]];
            if ($mo < 1 || $mo > 12 || $d < 1 || $d > 31) return null;
            $dates[] = sprintf('%04d-%02d-%02d', $y, $mo, $d);
        }
        // убираем съеденное, чтобы остаток не попал в dd.mm-парсер
        $seg = preg_replace('/\d{4}-\d{1,2}-\d{1,2}/', ' ', $seg);
    }
    if (preg_match_all('/(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?/u', $seg, $m)) {
        for ($i = 0; $i < count($m[0]); $i++) {
            $d = (int)$m[1][$i]; $mo = (int)$m[2][$i];
            $y = $m[3][$i] !== '' ? (int)$m[3][$i] : (int)date('Y');
            if ($y < 100) $y += 2000;
            if ($d < 1 || $d > 31 || $mo < 1 || $mo > 12) return null;
            $dates[] = sprintf('%04d-%02d-%02d', $y, $mo, $d);
        }
    }
    if (!$dates) return null;
    sort($dates);
    // 1 дата — один день; 2+ — диапазон от первой до последней
    $out = [];
    for ($t = strtotime($dates[0]), $end = strtotime(end($dates)); $t <= $end; $t += 86400) {
        $out[] = date('Y-m-d', $t);
        if (count($out) > 366) return null;
    }
    return $out;
}

// даты заявки: checkIn..checkOut (ISO) → все дни включительно
function reqDays(array $r): array {
    $ci = (string)($r['checkIn'] ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $ci)) return [];
    $co = (string)($r['checkOut'] ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $co) || $co < $ci) $co = $ci;
    $out = [];
    for ($t = strtotime($ci), $e = strtotime($co); $t <= $e && count($out) < 367; $t += 86400) {
        $out[] = date('Y-m-d', $t);
    }
    return $out;
}

// id домика для заявки: houseId, иначе точное совпадение по имени
function houseIdFor(array $houses, array $r): string {
    $ref = trim((string)($r['houseId'] ?? ''));
    if ($ref !== '') return $ref;
    $name = mb_strtolower(trim((string)($r['houseName'] ?? '')));
    if ($name === '') return '';
    foreach ($houses as $h) {
        if (mb_strtolower(trim((string)($h['name'] ?? ''))) === $name) return (string)$h['id'];
    }
    return '';
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

/* ---------------- Тексты и клавиатуры ---------------- */

function menuText($chatId): string {
    return "🏝 <b>Гавайи22 — занятость домиков</b>\n\nВыберите действие:";
}

function menuKeyboard(): array {
    return [
        [['text' => '📅 Занятость', 'callback_data' => 'status']],
        [
            ['text' => '🔴 Занять даты', 'callback_data' => 'busy'],
            ['text' => '🟢 Освободить', 'callback_data' => 'free'],
        ],
        [['text' => '🏠 Список домиков', 'callback_data' => 'houses']],
    ];
}

function backKeyboard(): array {
    return [[['text' => '◀️ В меню', 'callback_data' => 'menu']]];
}

function cancelKeyboard(): array {
    return [[['text' => '✖️ Отмена', 'callback_data' => 'cancel']]];
}

function housesKeyboard(array $houses, string $cmd): array {
    $kb = [];
    foreach ($houses as $i => $h) {
        $kb[] = [['text' => ($i + 1) . '. ' . $h['name'], 'callback_data' => $cmd . ':' . $h['id']]];
    }
    $kb[] = [['text' => '◀️ В меню', 'callback_data' => 'menu']];
    return $kb;
}

function statusText(array $houses): string {
    if (!$houses) return "🏠 Домиков пока нет — добавьте их в админке сайта.";
    $list = "📅 <b>Занятость:</b>\n";
    foreach ($houses as $i => $h) {
        $bd = $h['blockedDates'] ?? [];
        $list .= sprintf("%d. %s — %s\n", $i + 1, $h['name'], $bd ? fmtRanges($bd) : 'все даты свободны');
    }
    return $list;
}

function housesText(array $houses): string {
    if (!$houses) return "🏠 Домиков пока нет — добавьте их в админке сайта.";
    $list = "🏠 <b>Домики:</b>\n";
    foreach ($houses as $i => $h) {
        $n = count($h['blockedDates'] ?? []);
        $list .= sprintf("%d. %s — %s₽/ночь%s\n", $i + 1, $h['name'],
            number_format((float)($h['pricePerNight'] ?? 0), 0, '', ' '),
            $n ? " (занято {$n} дн.)" : '');
    }
    return $list;
}

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

/* ---------------- Логика ---------------- */

$state  = loadState($STATE_FILE);
// чистим pending, повисшие на id группы (остались от старой групповой эпохи)
foreach (array_keys($state['pending'] ?? []) as $pk) {
    if (str_starts_with((string)$pk, '-')) unset($state['pending'][$pk]);
}
$data   = loadData($DATA_FILE, $SEED_FILE);
$houses = $data['houses'] ?? [];

// Пароль доступа: bot_password, иначе admin_code. Пусто — открыто всем.
$BOT_PASS = trim((string)($cfg['bot_password'] ?? $cfg['admin_code'] ?? ''));
$isAuthed = function ($chatId) use (&$state, $BOT_PASS): bool {
    return $BOT_PASS === '' || isset($state['authed'][(string)$chatId]);
};

$updates = tg($cfg, 'getUpdates', ['offset' => $state['offset'], 'timeout' => 0, 'limit' => 50]);
if (!$updates['ok']) { sleep(1); exit(0); }
if (!empty($updates['result'])) plog('updates: ' . count((array)$updates['result']));

foreach ((array)$updates['result'] as $u) {
    $state['offset'] = max($state['offset'], (int)$u['update_id'] + 1);

    /* ---------- inline-кнопки ---------- */
    if (isset($u['callback_query'])) {
        $cq = $u['callback_query'];
        tg($cfg, 'answerCallbackQuery', ['callback_query_id' => $cq['id']]);

        $chatId   = (string)($cq['message']['chat']['id'] ?? '');
        $chatType = (string)($cq['message']['chat']['type'] ?? '');
        $msgId    = $cq['message']['message_id'] ?? null;

        // Кнопки «Подтвердить/Отклонить» под уведомлениями в ОБЩЕМ ЧАТЕ.
        // Привязаны к id заявки в callback_data — каждая кнопка работает со своей заявкой.
        if (preg_match('/^req_(ok|no):(.+)$/', (string)$cq['data'], $rm)) {
            $reqId = $rm[2];
            $newStatus = $rm[1] === 'ok' ? 'confirmed' : 'declined';
            $who = trim(($cq['from']['first_name'] ?? '') . ' ' . ($cq['from']['last_name'] ?? ''));
            if ($who === '') $who = '@' . ($cq['from']['username'] ?? 'кто-то');
            $occupChanged = false;
            $req = reqUpdate($DATA_DIR . '/requests-log.jsonl', $reqId, function (&$r) use ($newStatus, $who, &$houses, &$occupChanged) {
                $r['status'] = $newStatus;
                $r['statusBy'] = $who;
                $r['statusTs'] = time();
                // подтверждение → даты заявки заняты; отклонение → снять её даты
                if ($newStatus === 'confirmed') {
                    $hid = (string)($r['appliedHouse'] ?? '') ?: houseIdFor($houses, $r);
                    $days = reqDays($r);
                    if ($hid !== '' && $days) {
                        $houses = applyDates($houses, $hid, $days, true);
                        $r['appliedDates'] = $days;
                        $r['appliedHouse'] = $hid;
                        $occupChanged = true;
                    }
                } elseif (!empty($r['appliedDates']) && !empty($r['appliedHouse'])) {
                    $hid = (string)$r['appliedHouse'];
                    // в старых записях appliedHouse может быть именем — резолвим в id
                    $byId = false;
                    foreach ($houses as $h) if ((string)$h['id'] === $hid) { $byId = true; break; }
                    if (!$byId) $hid = houseIdFor($houses, ['houseName' => $hid]);
                    if ($hid !== '') {
                        $houses = applyDates($houses, $hid, (array)$r['appliedDates'], false);
                        unset($r['appliedDates'], $r['appliedHouse']);
                        $occupChanged = true;
                    }
                }
            });
            $ok = $req !== null;
            if ($occupChanged) {
                $data['houses'] = $houses;
                saveData($DATA_FILE, $data);
            }
            $orig = (string)($cq['message']['text'] ?? '');
            $mark = $newStatus === 'confirmed' ? "✅ <b>Подтверждена</b> — {$who}" : "❌ <b>Отклонена</b> — {$who}";
            if ($occupChanged && $newStatus === 'confirmed') $mark .= ' · 📅 даты заняты';
            $suffix = $ok ? $mark : "⚠️ Заявка не найдена в логе ({$who})";
            if ($msgId !== null && $chatId !== '') {
                editMsg($cfg, $chatId, $msgId, $orig . "\n\n" . $suffix);
            }
            plog("req {$reqId} -> {$newStatus} by {$who}" . ($ok ? '' : ' (not found)'));
            continue;
        }

        if ($chatType !== 'private' || $chatId === '' || $msgId === null) continue;

        if (!$isAuthed($chatId)) {
            sendMsg($cfg, $chatId, "🔐 Нужна авторизация. Отправьте пароль доступа.");
            continue;
        }

        $cb = (string)$cq['data'];
        if ($cb === 'menu') {
            unset($state['pending'][$chatId]);
            editMsg($cfg, $chatId, $msgId, menuText($chatId), menuKeyboard());
            continue;
        }
        if ($cb === 'cancel') {
            unset($state['pending'][$chatId]);
            editMsg($cfg, $chatId, $msgId, "Отменено.", backKeyboard());
            continue;
        }
        if ($cb === 'status') {
            editMsg($cfg, $chatId, $msgId, statusText($houses), backKeyboard());
            continue;
        }
        if ($cb === 'houses') {
            editMsg($cfg, $chatId, $msgId, housesText($houses), backKeyboard());
            continue;
        }
        if ($cb === 'busy' || $cb === 'free') {
            if (!$houses) { editMsg($cfg, $chatId, $msgId, 'Домиков пока нет — добавьте в админке сайта.', backKeyboard()); continue; }
            editMsg($cfg, $chatId, $msgId, $cb === 'busy' ? '🔴 Какой домик занять?' : '🟢 Какой домик освободить?', housesKeyboard($houses, $cb));
            continue;
        }
        if (preg_match('/^(busy|free):(.+)$/', $cb, $m)) {
            $house = null;
            foreach ($houses as $i => $h) {
                if ((string)$h['id'] === $m[2] || (string)($i + 1) === $m[2]) { $house = $h; break; }
            }
            if (!$house) { editMsg($cfg, $chatId, $msgId, 'Домик не найден.', backKeyboard()); continue; }
            $state['pending'][$chatId] = ['action' => $m[1], 'house' => $house['id'], 'ts' => time()];
            editMsg($cfg, $chatId, $msgId,
                ($m[1] === 'busy' ? "🔴 Занять «{$house['name']}»" : "🟢 Освободить «{$house['name']}»") .
                "\n\nВведите даты:\n<code>10.11-15.11</code> — диапазон\n<code>10.11</code> — один день\n<code>10.11-15.11, 20.11-22.11, 25.11</code> — список",
                cancelKeyboard());
            continue;
        }
        continue;
    }

    /* ---------- сообщения ---------- */
    $msg = $u['message'] ?? null;
    if (!$msg) continue;
    $chatId = (string)$msg['chat']['id'];
    if (($msg['chat']['type'] ?? '') !== 'private') continue; // группа — только уведомления
    $text = trim((string)($msg['text'] ?? ''));

    // запоминаем всех написавших — пригодится для аудита доступа
    $from = $msg['from'] ?? [];
    $state['users'][$chatId] = [
        'name' => trim(($from['first_name'] ?? '') . ' ' . ($from['last_name'] ?? '')),
        'username' => $from['username'] ?? '',
        'ts' => time(),
    ];
    if ($text === '') continue;

    // --- авторизация по паролю ---
    if (!$isAuthed($chatId)) {
        if ($BOT_PASS !== '' && hash_equals($BOT_PASS, $text)) {
            unset($state['await_pass'][$chatId]);
            $state['authed'][$chatId] = ['ts' => time()];
            plog("auth ok $chatId ({$state['users'][$chatId]['name']} @{$state['users'][$chatId]['username']})");
            sendMsg($cfg, $chatId, "✅ Доступ открыт!\n\n" . menuText($chatId), menuKeyboard());
        } elseif (isset($state['await_pass'][$chatId])) {
            sendMsg($cfg, $chatId, "⛔ Неверный пароль. Попробуйте ещё раз:");
        } else {
            $state['await_pass'][$chatId] = true;
            sendMsg($cfg, $chatId, "🏝 <b>Бот Гавайи22</b>\n\nВведите пароль доступа:");
        }
        continue;
    }

    // --- дальше только авторизованные ---
    if (preg_match('/^\/logout/i', $text)) {
        unset($state['authed'][$chatId], $state['pending'][$chatId]);
        plog("logout $chatId");
        sendMsg($cfg, $chatId, 'Выход выполнен. Для входа: /start');
        continue;
    }

    // меню
    if (preg_match('/^\/(start|menu|help)/i', $text)) {
        unset($state['pending'][$chatId]);
        sendMsg($cfg, $chatId, menuText($chatId), menuKeyboard());
        continue;
    }
    if (preg_match('/^\/cancel/i', $text)) {
        unset($state['pending'][$chatId]);
        sendMsg($cfg, $chatId, 'Отменено.', backKeyboard());
        continue;
    }
    if (preg_match('/^\/status/i', $text)) {
        sendMsg($cfg, $chatId, statusText($houses), backKeyboard());
        continue;
    }
    if (preg_match('/^\/houses/i', $text)) {
        sendMsg($cfg, $chatId, housesText($houses), backKeyboard());
        continue;
    }

    // power-user шорткат: /busy 1 10.11-15.11
    if (preg_match('/^\/(busy|free)(?:\s+(.*))?$/iu', $text, $m)) {
        $cmd = strtolower($m[1]);
        $args = trim((string)($m[2] ?? ''));
        unset($state['pending'][$chatId]);
        if ($args !== '' && preg_match('/^(\S+)\s+(.+)$/', $args, $am)) {
            [, $houseRef, $dateStr] = $am;
            $house = null;
            foreach ($houses as $i => $h) {
                if ((string)($i + 1) === $houseRef || (string)$h['id'] === $houseRef || mb_stripos((string)$h['name'], $houseRef) !== false) { $house = $h; break; }
            }
            if (!$house) { sendMsg($cfg, $chatId, "Домик «{$houseRef}» не найден.", backKeyboard()); continue; }
            $days = parseDates($dateStr);
            if (!$days) { sendMsg($cfg, $chatId, 'Не понял даты. Пример: <code>/busy 1 10.11-15.11</code>', backKeyboard()); continue; }
            $houses = applyDates($houses, $house['id'], $days, $cmd === 'busy');
            $data['houses'] = $houses;
            saveData($DATA_FILE, $data);
            plog("applyDates $cmd {$house['id']}: " . fmtRanges($days));
            sendMsg($cfg, $chatId, sprintf("%s «%s»: %s ✅", $cmd === 'busy' ? '🔴 Занято' : '🟢 Освобождено', $house['name'], fmtRanges($days)), backKeyboard());
            continue;
        }
        if (!$houses) { sendMsg($cfg, $chatId, 'Домиков пока нет — добавьте в админке сайта.', backKeyboard()); continue; }
        sendMsg($cfg, $chatId, $cmd === 'busy' ? '🔴 Какой домик занять?' : '🟢 Какой домик освободить?', housesKeyboard($houses, $cmd));
        continue;
    }

    // ожидание дат после выбора домика кнопкой
    $pending = $state['pending'][$chatId] ?? null;
    if ($pending) {
        $days = parseDates($text);
        if (!$days) { sendMsg($cfg, $chatId, 'Не понял даты. Примеры: <code>10.11-15.11</code>, <code>24.12</code>, <code>10.11-15.11, 20.11-22.11</code>', cancelKeyboard()); continue; }
        unset($state['pending'][$chatId]);
        $houses = applyDates($houses, $pending['house'], $days, $pending['action'] === 'busy');
        $data['houses'] = $houses;
        saveData($DATA_FILE, $data);
        $name = 'домик';
        foreach ($houses as $h) if ($h['id'] === $pending['house']) $name = $h['name'];
        plog("applyDates {$pending['action']} {$pending['house']}: " . fmtRanges($days));
        sendMsg($cfg, $chatId, sprintf("%s «%s»: %s ✅", $pending['action'] === 'busy' ? '🔴 Занято' : '🟢 Освобождено', $name, fmtRanges($days)), menuKeyboard());
        continue;
    }

    // любой другой текст в личке — показываем меню
    sendMsg($cfg, $chatId, menuText($chatId), menuKeyboard());
}

saveState($STATE_FILE, $state);
