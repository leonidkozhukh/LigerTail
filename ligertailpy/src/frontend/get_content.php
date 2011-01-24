<?php
include("db_connect.php");

if(isset($_GET["location"])){ 
	$query = "SELECT * FROM content WHERE location='{$_GET["location"]}' ORDER BY datetime DESC LIMIT 25";

	if($result = $dbc->query($query)){
		$rows = array();
		while($r = mysqli_fetch_assoc($result)){
			$rows[] = $r;
		}

		print_r('{"items":' . json_encode($rows) . '}');

		$result->close();
	}
	else{ echo "No Results! " . $query; }
}
else{
	echo "No Location Set!";
}

$dbc->close();
?>