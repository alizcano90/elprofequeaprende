<?php

declare(strict_types=1);

function epqa_increment_visit_counter(string $storageFile): array
{
    $fallback = [
        'total' => 0,
        'today' => 0,
        'last_updated' => null,
    ];

    $directory = dirname($storageFile);
    if (!is_dir($directory)) {
        @mkdir($directory, 0775, true);
    }

    $handle = @fopen($storageFile, 'c+');
    if ($handle === false) {
        return $fallback;
    }

    if (!flock($handle, LOCK_EX)) {
        fclose($handle);
        return $fallback;
    }

    $raw = stream_get_contents($handle);
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data)) {
        $data = [];
    }

    $total = isset($data['total']) && is_numeric($data['total']) ? (int)$data['total'] : 0;
    $daily = isset($data['daily']) && is_array($data['daily']) ? $data['daily'] : [];
    $todayKey = date('Y-m-d');

    $total += 1;
    $daily[$todayKey] = (isset($daily[$todayKey]) && is_numeric($daily[$todayKey]) ? (int)$daily[$todayKey] : 0) + 1;

    ksort($daily);
    if (count($daily) > 180) {
        $daily = array_slice($daily, -180, null, true);
    }

    $updated = [
        'total' => $total,
        'daily' => $daily,
        'last_updated' => date('c'),
    ];

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($updated, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);

    return [
        'total' => $total,
        'today' => (int)$daily[$todayKey],
        'last_updated' => $updated['last_updated'],
    ];
}
