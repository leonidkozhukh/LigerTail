<?php
define('DB_USER', 'root');
define('DB_PASSWORD', 'oojah');
define('DB_HOST', 'localhost');
define('DB_NAME', 'meerror');

$dbc = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

if (mysqli_connect_errno()) {
   printf("Connect failed: %s\n", mysqli_connect_error());
   exit();
}