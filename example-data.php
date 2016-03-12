<?php

$data = array(
    array(1, 1, 1, 1, 1),
    array(2, 2, 2, 2, 2),
    array(3, 3, 3, 3, 3),
    array(4, 4, 4, 4, 4),
    array(5, 5, 5, 5, 5),
    array(6, 6, 6, 6, 6),
    array(7, 7, 7, 7, 7),
    array(8, 8, 8, 8, 8),
    array(9, 9, 9, 9, 9),
    array(10, 10, 10, 10, 10),
    array(11, 11, 11, 11, 11),
    array(12, 12, 12, 12, 12),
    array(13, 13, 13, 13, 13),
    array(14, 14, 14, 14, 14),
    array(15, 15, 15, 15, 15),
    array(16, 16, 16, 16, 16),
    array(17, 17, 17, 17, 17),
    array(18, 18, 18, 18, 18),
    array(19, 19, 19, 19, 19),
    array(20, 20, 20, 20, 20),
    array(21, 21, 21, 21, 21),
    array(22, 22, 22, 22, 22),
    array(23, 23, 23, 23, 23),
    array(24, 24, 24, 24, 24),
    array(25, 25, 25, 25, 25)
);

// indexes - search, limit, start, order

$_data = array();
$start = intval($_GET['start']);
if (isset($_GET['sort']) && $_GET['sort']['dir'] == 'desc')
        $data = array_reverse($data);
foreach ($data as $key => $value) {
    if ($key < $start) continue;
    $_data[] = $value;
    if ($_GET['limit'] && $key + 1 === $start + intval($_GET['limit'])) break;
}

$response = array(
    'data' => $_data,
    'start' => $start,
    'total' => count($data),
);

die(json_encode($response));
