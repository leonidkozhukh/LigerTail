<?php
define('DB_USER', 'len');
define('DB_PASSWORD', 'Ligertail543');
define('DB_HOST', 'meerror.db');
define('DB_NAME', 'meerror');

$dbc = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

if (mysqli_connect_errno()) {
   printf("Connect failed: %s\n", mysqli_connect_error());
   exit();
}