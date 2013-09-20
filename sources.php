<?php 
/*
 *      PlayerUI Copyright (C) 2013 Andrea Coiutti & Simone De Gregori
 *		 Tsunamp Team
 *      http://www.tsunamp.com
 *
 *  This Program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 3, or (at your option)
 *  any later version.
 *
 *  This Program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with RaspyFi; see the file COPYING.  If not, see
 *  <http://www.gnu.org/licenses/>.
 *
 *
 *	UI-design/JS code by: 	Andrea Coiutti (aka ACX)
 * PHP/JS code by:			Simone De Gregori (aka Orion)
 * 
 * file:							sources.php
 * version:						1.0
 *
 */
 
// common include
include('inc/connection.php');
playerSession('open',$db,'',''); 
?>

<?php
// handle (reset)
if (isset($_POST['reset']) && $_POST['reset'] == 1) {
	// tell worker to write new MPD config
	if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
	session_start();
	$_SESSION['w_queue'] = "sourcecfgman";
	$_SESSION['w_queueargs']  = 'sourcecfgreset';
	$_SESSION['w_active'] = 1;
	// set UI notify
	$_SESSION['notify']['title'] = 'auto.nas modified';
	$_SESSION['notify']['msg'] = 'remount shares in progress...';
	session_write_close();
	} else {
	session_start();
	$_SESSION['notify']['title'] = 'Job Failed';
	$_SESSION['notify']['msg'] = 'background worker is busy.';
	session_write_close();
	}
unset($_POST);
}

if (isset($_GET['updatempd']) && $_GET['updatempd'] == '1' ){
	if ( !$mpd) {
		session_start();
		$_SESSION['notify']['title'] = 'Error';
		$_SESSION['notify']['msg'] = 'Cannot connect to MPD Daemon';
	} else {
		sendMpdCommand($mpd,'update');
		session_start();
		$_SESSION['notify']['title'] = 'MPD Update';
		$_SESSION['notify']['msg'] = 'database update started...';
	}
}

// handle POST
if(isset($_POST['mount']) && !empty($_POST['mount'])) {
// convert slashes for remotedir path
$_POST['mount']['remotedir'] = str_replace('\\', '/', $_POST['mount']['remotedir']);

	if ($_POST['mount']['wsize'] == '') {
	$_POST['mount']['wsize'] = 4096;
	}

	if ($_POST['mount']['rsize'] == '') {
	$_POST['mount']['rsize'] = 2048;
	}
// activate worker
if (isset($_POST['delete']) && $_POST['delete'] == 1) {
// delete an existing entry
		if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
		session_start();
		$_SESSION['w_queue'] = "sourcecfg";
		$_POST['mount']['action'] = 'delete';
		$_SESSION['w_queueargs'] = $_POST;
		$_SESSION['w_active'] = 1;
		// set UI notify
		$_SESSION['notify']['title'] = 'mount point deleted';
		$_SESSION['notify']['msg'] = 'Update DB in progress...';
		session_write_close();
		} else {
		session_start();
		$_SESSION['notify']['title'] = 'Job Failed';
		$_SESSION['notify']['msg'] = 'background worker is busy.';
		session_write_close();
		}
	
	} else {
	
		if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
		session_start();
		$_SESSION['w_queue'] = "sourcecfg";
		$_SESSION['w_queueargs']  = $_POST;
		$_SESSION['w_active'] = 1;
		// set UI notify
		$_SESSION['notify']['title'] = 'mount point modified';
		$_SESSION['notify']['msg'] = 'Update DB in progress...';
		session_write_close();
		} else {
		session_start();
		$_SESSION['notify']['title'] = 'Job Failed';
		$_SESSION['notify']['msg'] = 'background worker is busy.';
		session_write_close();
		} 
	}
}
	
// handle manual config
// rel 1.0 autoFS 
/*
if(isset($_POST['sourceconf']) && !empty($_POST['sourceconf'])) {
	// tell worker to write new MPD config
		if ($_SESSION['w_lock'] != 1 && $_SESSION['w_queue'] == '') {
		session_start();
		$_SESSION['w_queue'] = "sourcecfgman";
		$_SESSION['w_queueargs'] = $_POST['sourceconf'];
		$_SESSION['w_active'] = 1;
		// set UI notify
		$_SESSION['notify']['title'] = 'auto.nas modified';
		$_SESSION['notify']['msg'] = 'remount shares in progress...';
		session_write_close();
		} else {
		session_start();
		$_SESSION['notify']['title'] = 'Job Failed';
		$_SESSION['notify']['msg'] = 'background worker is busy.';
		session_write_close();
		}
} */

// wait for worker output if $_SESSION['w_active'] = 1
waitWorker(5,'sources');

// check integrity of /etc/network/interfaces
/* rel 1.0 autoFS
if(!hashCFG('check_source',$db)) {
$_sourceconf = file_get_contents('/etc/auto.nas');
// set manual config template
$tpl = "source-manual.html";
} else {
*/
$dbh = cfgdb_connect($db);
$source = cfgdb_read('cfg_source',$dbh);
$dbh = null;
// set normal config template
$tpl = "sources.html";
// } rel 1.0 autoFS
// unlock session files
playerSession('unlock',$db,'','');
foreach ($source as $mp) {
if (wrk_checkStrSysfile('/proc/mounts',$mp['name']) ) {
	$icon = "<i class='icon-ok green sx'></i>";
	} else {
	$icon = "<i class='icon-remove red sx'></i>";
	}
$_mounts .= "<p><a href=\"sources.php?p=edit&id=".$mp['id']."\" class='btn btn-large btn-block'> ".$icon." NAS/".$mp['name']."&nbsp;&nbsp;&nbsp;&nbsp;//".$mp['address']."/".$mp['remotedir']." </a></p>";
}
?>

<?php
$sezione = basename(__FILE__, '.php');
include('_header.php'); 
?>

<!-- content --!>
<?php
if (isset($_GET['p']) && !empty($_GET['p'])) {

	if (isset($_GET['id']) && !empty($_GET['id'])) {
	$_id = $_GET['id'];
		foreach ($source as $mount) {
			if ($mount['id'] == $_id) {
			$_name = $mount['name'];
			$_address = $mount['address'];
			$_remotedir = $mount['remotedir'];
			$_username = $mount['username'];
			$_password = $mount['password'];
			$_rsize = $mount['rsize'];
			$_wsize = $mount['wsize'];
			$_type = $mount['type'];
			$_charset = $mount['charset'];
			}
		}
	$_title = 'Edit network mount';
	$_action = 'edit';
	} else {
	$_title = 'Add new network mount';
	$_hide = 'hide';
	$_action = 'add';
	}
	$tpl = 'source.html';
} 
debug($_POST);
eval("echoTemplate(\"".getTemplate("templates/$tpl")."\");");
?>
<!-- content -->

<?php include('_footer.php'); ?>