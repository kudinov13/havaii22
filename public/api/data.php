<?php
// GET /api/data.php — публичные данные сайта: домики (+занятые даты), услуги,
// галерея, фон «О базе». Без авторизации — то же самое отображается на сайте.

declare(strict_types=1);
require __DIR__ . '/_lib.php';

header('Cache-Control: public, max-age=15');

$data = g22_load_data();
if (!$data) {
    g22_out(200, ['ok' => true, 'data' => null]); // сайт покажет встроенные дефолты
}

// только публичные поля
g22_out(200, [
    'ok' => true,
    'data' => [
        'houses'   => $data['houses']   ?? null,
        'services' => $data['services'] ?? null,
        'gallery'  => $data['gallery']  ?? null,
        'aboutBg'  => $data['aboutBg']  ?? null,
    ],
    'updatedAt' => $data['updatedAt'] ?? null,
]);
