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
 *  along with TsunAMP; see the file COPYING.  If not, see
 *  <http://www.gnu.org/licenses/>.
 *
 *
 *	UI-design/JS code by: 	Andrea Coiutti (aka ACX)
 * PHP/JS code by:			Simone De Gregori (aka Orion)
 * 
 * file:							mpd-status.js
 * version:						1.0
 *
 */

function sendCmd(inputcmd) {
	$.ajax({
		type: 'GET',
		url: 'command/?cmd=' + inputcmd,
		async: true,
		cache: false,
		success: function(data){
			GUI.halt = 1;
			// console.log('GUI.halt (sendCmd)= ', GUI.halt);
		},
    });
}

function sendPLCmd(inputcmd) {
	$.ajax({
		type: 'GET',
		url: 'db/?cmd=' + inputcmd,
		async: true,
		cache: false,
		success: function(data){
			GUI.halt = 1;
			// console.log('GUI.halt (sendPLcmd)= ', GUI.halt);
		},
    });
}

function backendRequest(){
    $.ajax({
		type: 'GET',
		url: '_player_engine.php?state=' + GUI.state,
		async: true,
		cache: false,
		success: function(data){
			// console.log('GUI.halt (backendRequest)= ', GUI.halt);
			renderUI(data);
			GUI.currentsong = GUI.json['currentsong'];
			// GUI.halt = 1;
			backendRequest(GUI.state);
		},
		error: function(){
			setTimeout(function(){
				GUI.state = 'disconnected';
				// console.log('GUI.state = ', GUI.state);
				// console.log('GUI.halt (disconnected) = ',GUI.halt);
				$('#loader').show();
				$('#countdown-display').countdown('pause');
				window.clearInterval(GUI.currentKnob);
				backendRequest(GUI.state);
			}, 5000);
		}
    });
}

function renderUI(data) {
	// aggiorna le variabili globali
	GUI.json = eval('(' + data + ')');
	GUI.state = GUI.json['state'];
	// console.log('current song = ', GUI.json['currentsong']);
	// console.log( 'GUI.state = ', GUI.state );
	updateGUI(GUI.json);
		if (GUI.state != 'disconnected') {
	$('#loader').hide();
	}
	refreshTimer(parseInt(GUI.json['elapsed']), parseInt(GUI.json['time']), GUI.json['state']);
	refreshKnob(GUI.json);
	if (GUI.json['playlist'] != GUI.playlist) {
		getPlaylist(GUI.json);
		GUI.playlist = GUI.json['playlist'];
		//console.log('playlist = ', GUI.playlist);
	}
	GUI.halt = 0;
	// console.log('GUI.halt (renderUI)= ', GUI.halt);
}

function getPlaylist(json){
    $.getJSON('db/?cmd=playlist', function(data) {
        var i = 0;
        var content = '';
        var output = '';
        for (i = 0; i < data.length; i++){
            if (json['state'] != 'stop' && i == parseInt(json['song'])) {
                content = '<li id="pl-' + (i + 1) + '" class="active clearfix">';
            } else {
                content = '<li id="pl-' + (i + 1) + '" class="clearfix">';
            }
			content += '<div class="pl-action"><a class="btn" href="#notarget" title="Remove song from playlist"><i class="icon-remove-sign"></i></a></div>';
            if (typeof data[i].Title != 'undefined') {
                content += '<div class="pl-entry">';
                content += data[i].Title + ' <em class="songtime">' + timeConvert(data[i].Time) + '</em>';
                content += ' <span>';
                content +=  data[i].Artist;
                content += ' - ';
                content +=  data[i].Album;
                content += '</span></div></li>';
                output = output + content;
            } else {
                songpath = parsePath(data[i].file);
                content += '<div class="pl-entry">';
                content += data[i].file.replace(songpath + '/', '') + ' <em class="songtime">' + timeConvert(data[i].Time) + '</em>';
                content += ' <span>';
                content += ' path \: ';
                content += songpath;
                content += '</span></div></li>';
                output = output + content;
            }
        }
        $('ul.playlist').html(output);
        var current = parseInt(json['song']);
        if (current != json && GUI.halt != 1) {
            customScroll('pl', current, 200); // attiva la current song
        }
    });
}

function parsePath(str) {
	var cutpos=str.lastIndexOf("/");
	// verificare utilità di questa condizionale (simone)
	if (cutpos !=-1) {
	//console.log('cutpos = ', cutpos);
	var songpath = str.slice(0,cutpos);
	//console.log('songpath = ', songpath);
	}  else {
	songpath = '';
	}
	return songpath;
}

function parseResponse(inputArr,respType,i,inpath) {		
	switch (respType) {
		case 'playlist':		
			// codice da eseguire
		break;
		
		case 'db':
			//console.log('inpath= :',inpath);
			//console.log('inputArr[i].file= :',inputArr[i].file);
			if (inpath == '' && typeof inputArr[i].file != 'undefined') {
			inpath = parsePath(inputArr[i].file)
			}
			if (typeof inputArr[i].file != 'undefined') {
				//debug
				//console.log('inputArr[i].file: ', inputArr[i].file);
				//console.log('inputArr[i].Title: ', inputArr[i].Title);
				//console.log('inputArr[i].Artist: ', inputArr[i].Artist);
				//console.log('inputArr[i].Album: ', inputArr[i].Album);
				if (typeof inputArr[i].Title != 'undefined') {
					content = '<li id="db-' + (i + 1) + '" class="clearfix" data-path="';
					content += inputArr[i].file;
					content += '"><div class="db-icon db-song db-browse"><i class="icon-music sx db-browse"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu"><i class="icon-reorder"></i></a></div><div class="db-entry db-song db-browse">';
					content += inputArr[i].Title + ' <em class="songtime">' + timeConvert(inputArr[i].Time) + '</em>';
					content += ' <span>';
					content +=  inputArr[i].Artist;
					content += ' - ';
					content +=  inputArr[i].Album;
					content += '</span></div></li>';

				} else {
					content = '<li id="db-' + (i + 1) + '" class="clearfix" data-path="';
					content += inputArr[i].file;
					content += '"><div class="db-icon db-song db-browse"><i class="icon-music sx db-browse"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu"><i class="icon-reorder"></i></a></div><div class="db-entry db-song db-browse">';
					content += inputArr[i].file.replace(inpath + '/', '') + ' <em class="songtime">' + timeConvert(inputArr[i].Time) + '</em>';
					content += ' <span>';
					content += ' path \: ';
					content += inpath;
					content += '</span></div></li>';
				}
			} else {
			//debug
			//console.log('inputArr[i].directory: ', data[i].directory);
				content = '<li id="db-' + (i + 1) + '" class="clearfix" data-path="';
				content += inputArr[i].directory;
				if (inpath != '') {
					content += '"><div class="db-icon db-folder db-browse"><i class="icon-folder-open sx"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu"><i class="icon-reorder"></i></a></div><div class="db-entry db-folder db-browse">';
				} else {
					content += '"><div class="db-icon db-folder db-browse"><i class="icon-hdd icon-root sx"></i></div><div class="db-action"><a class="btn" href="#notarget" title="Actions" data-toggle="context" data-target="#context-menu-root"><i class="icon-reorder"></i></a></div><div class="db-entry db-folder db-browse">';
				}
				content += inputArr[i].directory.replace(inpath + '/', '');
				content += '</div></li>';
			}
		break;
		
	}
	return content;
} // end parseResponse()

function getDB(cmd, path, browsemode, uplevel){
	if (cmd == 'filepath') {
		$.post('db/?cmd=filepath', { 'path': path }, function(data) {
			populateDB(data, path, uplevel);
		}, 'json');
	} else if (cmd == 'add') {
		$.post('db/?cmd=add', { 'path': path }, function(path) {
			// console.log('add= ', path);
		}, 'json');
	} else if (cmd == 'addplay') {
		$.post('db/?cmd=addplay', { 'path': path }, function(path) {
			// console.log('addplay= ',path);
		}, 'json');
	} else if (cmd == 'addreplaceplay') {
		$.post('db/?cmd=addreplaceplay', { 'path': path }, function(path) {
			// console.log('addreplaceplay= ',path);
		}, 'json');
	} else if (cmd == 'update') {
		$.post('db/?cmd=update', { 'path': path }, function(path) {
			// console.log('update= ',path);
		}, 'json');
	} else if (cmd == 'search') {
		var keyword = $('#db-search-keyword').val();
		$.post('db/?querytype=' + browsemode + '&cmd=search', { 'query': keyword }, function(data) {
			populateDB(data, path, uplevel, keyword);
		}, 'json');
	}
}

function populateDB(data, path, uplevel, keyword){
	if (path) GUI.currentpath = path;
	// console.log(' new GUI.currentpath = ', GUI.currentpath);
	var DBlist = $('ul.database');
	DBlist.html('');
	if (keyword) {
		var results = (data.length) ? data.length : '0';
		var s = (data.length == 1) ? '' : 's';
		DBlist.append('<li id="db-0" class="search-results clearfix" title="Close search results and go back to the DB"><div class="db-icon db-folder"><i class="icon-arrow-left sx"></i></div><div class="db-entry db-folder">' + results + ' result' + s + ' for "<em class="keyword">' + keyword + '</em>"</div></li>');
	} else if (path != '') {
		DBlist.append('<li id="db-0" class="clearfix"><div class="db-entry db-browse levelup"><i class="icon-arrow-left sx"></i> <em>back</em></div></li>');
	}
	var content = '';
	var i = 0;
	for (i = 0; i < data.length; i++){
		content = parseResponse(data,'db',i,path);
	 	DBlist.append(content);
	}
	$('#db-currentpath span').html(path);
	if (uplevel) {
		// console.log('PREV LEVEL');
		$('#db-' + GUI.currentDBpos[GUI.currentDBpos[10]]).addClass('active');
		customScroll('db', GUI.currentDBpos[GUI.currentDBpos[10]]);
	} else {
		// console.log('NEXT LEVEL');
		customScroll('db', 0, 0);
	}
	// debug
	// console.log('GUI.currentDBpos = ', GUI.currentDBpos);
	// console.log('livello = ', GUI.currentDBpos[10]);
	// console.log('elemento da illuminare = ', GUI.currentDBpos[GUI.currentDBpos[10]]);
}