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
 * file:							scripts-playback.js
 * version:						1.0
 *
 */
 
// SET DI VARIABILI GLOBALI
// ----------------------------------------------------------------------------------------------------
var GUI = {
    json: 0,
    cmd: 'status',
    playlist: null,
    currentsong: null,
    currentknob: null,
    state: '',
    currentpath: '',
    halt: 0,
    volume: null,
    currentDBpos: new Array(0,0,0,0,0,0,0,0,0,0,0),
    browsemode: 'file',
    DBentry: new Array('', '', ''),
    visibility: 'visible',
	DBupdate: 0
};

jQuery(document).ready(function($){ 'use strict';

    // INIZIALIZZAZIONE
    // ----------------------------------------------------------------------------------------------------
    // prima connessione col demone MPD
    backendRequest(GUI.state);

    // aggiorna per la prima volta l'interfaccia
    updateGUI(GUI.json);
    getDB('filepath', GUI.currentpath, GUI.browsemode);
    $.pnotify.defaults.history = false;

    // REFRESH GUI
    // ----------------------------------------------------------------------------------------------------
    // aggiornamento ciclico dell'interfaccia
    // setInterval(function() {
        // if (GUI.halt) {
            // GUI.halt = 0;
            // console.log('inspect GUI.halt= ', GUI.halt)
            // }
        // }, 1000);

    if (GUI.state != 'disconnected') {
    $('#loader').hide();
    }

    // PULSANTI
    // ----------------------------------------------------------------------------------------------------
    // comportamento dei pulsanti di playback
    $('.btn-cmd').click(function(){
        var cmd;
        // stop
        if ($(this).attr('id') == 'stop') {
            $(this).addClass('btn-primary');
            $('#play').removeClass('btn-primary');
            refreshTimer(0, 0, 'stop')
			window.clearInterval(GUI.currentKnob);
            $('.playlist li').removeClass('active');
            $('#total').html('');
        }
        // play/pause
        else if ($(this).attr('id') == 'play') {
            //if (json['currentsong'] != null) {
                if (GUI.state == 'play') {
                    cmd = 'pause';
                    $('#countdown-display').countdown('pause');
                } else if (GUI.state == 'pause') {
                    cmd = 'play';
                    $('#countdown-display').countdown('resume');
                } else if (GUI.state == 'stop') {
                    cmd = 'play';
                    $('#countdown-display').countdown({since: 0, compact: true, format: 'MS'});
                }
                //$(this).find('i').toggleClass('icon-play').toggleClass('icon-pause');
                window.clearInterval(GUI.currentKnob);
                sendCmd(cmd);
                //console.log('sendCmd(' + cmd + ');');
                return;
            // } else {
                // $(this).addClass('btn-primary');
                // $('#stop').removeClass('btn-primary');
                // $('#time').val(0).trigger('change');
                // $('#countdown-display').countdown({since: 0, compact: true, format: 'MS'});
            // }
        }
        // previous/next
        else if ($(this).attr('id') == 'previous' || $(this).attr('id') == 'next') {
            GUI.halt = 1;
            // console.log('GUI.halt (next/prev)= ', GUI.halt);
			$('#countdown-display').countdown('pause');
			window.clearInterval(GUI.currentKnob);
        }
        // controllo volume a step
        else if ($(this).hasClass('btn-volume')) {
            if (GUI.volume == null ) {
                GUI.volume = $('#volume').val();
            }
            if ($(this).attr('id') == 'volumedn') {
                var vol = parseInt(GUI.volume) - 3;
                GUI.volume = vol;
                $('#volumemute').removeClass('btn-primary');
            } else if ($(this).attr('id') == 'volumeup') {
                var vol = parseInt(GUI.volume) + 3;
                GUI.volume = vol;
                $('#volumemute').removeClass('btn-primary');
            } else if ($(this).attr('id') == 'volumemute') {
                if ($('#volume').val() != 0 ) {
                    GUI.volume = $('#volume').val();
                    $(this).addClass('btn-primary');
                    var vol = 0;
                } else {
                    $(this).removeClass('btn-primary');
                    var vol = GUI.volume;
                }
            }
            //console.log('volume = ', GUI.volume);
            sendCmd('setvol ' + vol);
            return;
        }

        // pulsanti a toggle
        if ($(this).hasClass('btn-toggle')) {
            if ($(this).hasClass('btn-primary')) {
                cmd = $(this).attr('id') + ' 0';
            } else {
                cmd = $(this).attr('id') + ' 1';
            }
            $(this).toggleClass('btn-primary');
        // invio comando
        } else {
            cmd = $(this).attr('id');
        }
        sendCmd(cmd);
        //console.log('sendCmd(' + cmd + ');');
    });

    // KNOBS
    // ----------------------------------------------------------------------------------------------------
    // avanzamento playback
    $('.playbackknob').knob({
        change : function (value) {
            if (GUI.state != 'stop') {
				// console.log('GUI.halt (Knobs)= ', GUI.halt);
				window.clearInterval(GUI.currentKnob)
				//$('#time').val(value);
				//console.log('click percent = ', value);
				// implementare comando
			} else $('#time').val(0);
        },
        release : function (value) {
			if (GUI.state != 'stop') {
				//console.log('release percent = ', value);
				GUI.halt = 1;
				// console.log('GUI.halt (Knobs2)= ', GUI.halt);
				window.clearInterval(GUI.currentKnob);
				var seekto = Math.floor((value * parseInt(GUI.json['time'])) / 1000);
				sendCmd('seek ' + GUI.json['song'] + ' ' + seekto);
				//console.log('seekto = ', seekto);
				$('#time').val(value);
				$('#countdown-display').countdown('destroy');
				$('#countdown-display').countdown({since: -seekto, compact: true, format: 'MS'});
			}
        },
        cancel : function () {
            //console.log('cancel : ', this);
        },
        draw : function () {}
    });

    // pomello volume
    $('.volumeknob').knob({
        change : function (value) {
            setvol(value);
        },
        release : function (value) {
            setvol(value);
        },
        cancel : function () {
            //console.log('cancel : ', this);
        },
        draw : function () {
            // "tron" case
            if(this.$.data('skin') == 'tron') {

                var a = this.angle(this.cv)  // Angle
                    , sa = this.startAngle          // Previous start angle
                    , sat = this.startAngle         // Start angle
                    , ea                            // Previous end angle
                    , eat = sat + a                 // End angle
                    , r = true;

                this.g.lineWidth = this.lineWidth;

                this.o.cursor
                    && (sat = eat - 0.05)
                    && (eat = eat + 0.05);

                if (this.o.displayPrevious) {
                    ea = this.startAngle + this.angle(this.value);
                    this.o.cursor
                        && (sa = ea - 0.1)
                        && (ea = ea + 0.1);
                    this.g.beginPath();
                    this.g.strokeStyle = this.previousColor;
                    this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, sa, ea, false);
                    this.g.stroke();
                }

                this.g.beginPath();
                this.g.strokeStyle = r ? this.o.fgColor : this.fgColor ;
                this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, sat, eat, false);
                this.g.stroke();

                this.g.lineWidth = 2;
                this.g.beginPath();
                this.g.strokeStyle = this.o.fgColor;
                this.g.arc(this.xy, this.xy, this.radius - this.lineWidth + 10 + this.lineWidth * 2 / 3, 0, 20 * Math.PI, false);
                this.g.stroke();

                return false;
            }
        }
    });

    //effetto estetico pulsazione knob
    /*
    setInterval(function() {
        if (GUI.json['state'] == 'play') {
            if (GUI.json['state'] == 'play') {
                $('#timeflow').toggleClass('pulse');
                setTimeout(function(){
                    $('#timeknob').toggleClass('pulse');
                }, 1000);
            }
        }
    }, 1000);
    */


    // PLAYLIST
    // ----------------------------------------------------------------------------------------------------

    // click su una entry della playlist
    $('.playlist').on('click', '.pl-entry', function() {
        var pos = $('.playlist .pl-entry').index(this);
        var cmd = 'play ' + pos;
        sendCmd(cmd);
        GUI.halt = 1;
        // console.log('GUI.halt (playlist)= ', GUI.halt);
        $('.playlist li').removeClass('active');
        $(this).parent().addClass('active');
    });

    // click sulle azioni della playlist
    $('.playlist').on('click', '.pl-action', function(event) {
        event.preventDefault();
        var pos = $('.playlist .pl-action').index(this);
        var cmd = 'trackremove&songid=' + pos;
        var path = $(this).parent().data('path');
        notify('remove', 'RECUPERARE DATA-PATH!');
        sendPLCmd(cmd);
    });

    // click sul tab della playlist
    $('#open-panel-dx a').click(function(){
        var current = parseInt(GUI.json['song']);
        customScroll('pl', current, 200); // da eseguire sul tab ready!
    });

    // click sul tab del playback
    $('#open-playback a').click(function(){
        // fai qualcosa
        // console.log('JSON = ', GUI.json);
    });


    // DATABASE
    // ----------------------------------------------------------------------------------------------------

    // click su una entry del database
    $('.database').on('click', '.db-browse', function() {
        $('.database li').removeClass('active');
        $(this).parent().addClass('active');
        if (!$(this).hasClass('sx')) {
            var path = $(this).parent().data('path');
            if ($(this).hasClass('levelup')) {
                --GUI.currentDBpos[10];
                var path = GUI.currentpath;
                var cutpos=path.lastIndexOf("/");
                if (cutpos !=-1) {
                //console.log('cutpos = ', cutpos);
                var path = path.slice(0,cutpos);
                //console.log('oldpath = ', path);
                }  else {
                path = '';
                }
                getDB('filepath', path, GUI.browsemode, 1);
            }
            else if ($(this).hasClass('db-folder')) {
                //GUI.currentDBpos[GUI.currentDBpos[10]] = $('.database .db-entry').index(this);
                var entryID = $(this).parent().attr('id');
                entryID = entryID.replace('db-','');
                GUI.currentDBpos[GUI.currentDBpos[10]] = entryID;
                ++GUI.currentDBpos[10];
                //console.log('getDB path = ', path);
                getDB('filepath', path, GUI.browsemode, 0);
            }
        }
    });

    $('.database').on('dblclick', '.db-song', function() {
        $('.database li').removeClass('active');
        $(this).parent().addClass('active');
        var path = $(this).parent().data('path');
        //console.log('doubleclicked path = ', path);
        getDB('addplay', path);
        notify('add', path);
    });

    // click sul pulsante aggiungi
    $('.database').on('click', '.db-action', function() {
        var path = $(this).parent().attr('data-path');
        GUI.DBentry[0] = path;
        // console.log('getDB path = ', GUI.DBentry);
    });

    // chiudi i risultati di ricerca nel DB
    $('.database').on('click', '.search-results', function() {
        getDB('filepath', GUI.currentpath);
    });

    $('.context-menu a').click(function(){
        var path = GUI.DBentry[0];
        GUI.DBentry[0] = '';
        if ($(this).data('cmd') == 'add') {
            getDB('add', path);
            notify('add', path);
        }
        if ($(this).data('cmd') == 'addplay') {
            getDB('addplay', path);
            notify('add', path);
        }
        if ($(this).data('cmd') == 'addreplaceplay') {
            getDB('addreplaceplay', path);
            notify('addreplaceplay', path);
        }
        if ($(this).data('cmd') == 'update') {
            getDB('update', path);
            notify('update', path);
        }
    });

    // browse mode menu
    $('.browse-mode a').click(function(){
        $('.browse-mode').removeClass('active');
        $(this).parent().addClass('active').closest('.dropdown').removeClass('open');
        var browsemode = $(this).find('span').html();
        GUI.browsemode = browsemode.slice(0,-1);
        $('#browse-mode-current').html(GUI.browsemode);
        getDB('filepath', '', GUI.browsemode);
        // console.log('Browse mode set to: ', GUI.browsemode);
    });

    // tasti di scroll
    $('.db-firstPage').click(function(){
        $.scrollTo(0 , 500);
    });
    $('.db-prevPage').click(function(){
        var scrolloffset = '-=' + $(window).height() + 'px';
        $.scrollTo(scrolloffset , 500);
    });
    $('.db-nextPage').click(function(){
        var scrolloffset = '+=' + $(window).height() + 'px';
        $.scrollTo(scrolloffset , 500);
    });
    $('.db-lastPage').click(function(){
        $.scrollTo('100%', 500);
    });

    $('.pl-firstPage').click(function(){
        $.scrollTo(0 , 500);
    });
    $('.pl-prevPage').click(function(){
        var scrollTop = $(window).scrollTop();
        var scrolloffset = scrollTop - $(window).height();
        $.scrollTo(scrolloffset , 500);
    });
    $('.pl-nextPage').click(function(){
        var scrollTop = $(window).scrollTop();
        var scrolloffset = scrollTop + $(window).height();
        $.scrollTo(scrolloffset , 500);
    });
    $('.pl-lastPage').click(function(){
        $.scrollTo('100%', 500);
    });

    // multipurpose debug buttons
    $('#db-debug-btn').click(function(){
        var scrollTop = $(window).scrollTop();
        // console.log('scrollTop = ', scrollTop);
    });
    $('#pl-debug-btn').click(function(){
        randomScrollPL();
    });

    // aprire tab da pagina esterna
    var url = document.location.toString();
    if (url.match('#')) {
        $('#menu-bottom a[href=#'+url.split('#')[1]+']').tab('show') ;
    }
    // evita lo scroll con le HTML5 history API
    $('#menu-bottom a').on('shown', function (e) {
        if(history.pushState) {
            history.pushState(null, null, e.target.hash);
        } else {
            window.location.hash = e.target.hash; //Polyfill for old browsers
        }
    });

    // ricerca nella playlist
    $("#pl-filter").keyup(function(){
        $.scrollTo(0 , 500);
        var filter = $(this).val(), count = 0;
        $(".playlist li").each(function(){
            if ($(this).text().search(new RegExp(filter, "i")) < 0) {
                $(this).hide();
            } else {
                $(this).show();
                count++;
            }
        });
        var numberItems = count;
        var s = (count == 1) ? '' : 's';
        if (filter != '') {
            $('#pl-filter-results').html('<i class="icon-search sx"></i> ' + (+count) + ' result' + s + ' for "<em class="keyword">' + filter + '</em>"');
        } else {
            $('#pl-filter-results').html('');
        }
    });

    // tooltips
    if( $('.ttip').length ){
        $('.ttip').tooltip();
    }

});



// FUNZIONI
// ----------------------------------------------------------------------------------------------------

// aggiorna le info sull'interfaccia
function updateGUI(json){
    // logica stato attuale
    refreshState(GUI.state);
    // controllo cambio canzone
    //console.log('A = ', json['currentsong']); console.log('B = ', GUI.currentsong);
    if (GUI.currentsong != json['currentsong']) {
        countdownRestart(0);
        if ($('#panel-dx').hasClass('active')) {
            var current = parseInt(json['song']);
            customScroll('pl', current);
        }
    }
    // azioni comuni
    // console.log('GUI.halt (azioni comuni)= ', GUI.halt);
    //if (!GUI.halt) {
        //refreshTimer(parseInt(json['elapsed']), parseInt(json['time']), json['state']);

        $('#volume').val((json['volume'] == '-1') ? 100 : json['volume']).trigger('change');
        $('#currentartist').html(json['currentartist']);
        $('#currentsong').html(json['currentsong']);
        $('#currentalbum').html(json['currentalbum']);
        if (json['repeat'] == 1) {
            $('#repeat').addClass('btn-primary');
        } else {
            $('#repeat').removeClass('btn-primary');
        }
        if (json['random'] == 1) {
            $('#random').addClass('btn-primary');
        } else {
            $('#random').removeClass('btn-primary');
        }
        if (json['consume'] == 1) {
            $('#consume').addClass('btn-primary');
        } else {
            $('#consume').removeClass('btn-primary');
        }
        if (json['single'] == 1) {
            $('#single').addClass('btn-primary');
        } else {
            $('#single').removeClass('btn-primary');
        }

    //}
    GUI.halt = 0;
    // console.log('GUI.halt (azioni comuni2)= ', GUI.halt);
    GUI.currentsong = json['currentsong'];
}

// aggiorna lo status
function refreshState(state) {
    if (state == 'play') {
        $('#play').addClass('btn-primary');
        $('#play i').removeClass('icon-pause').addClass('icon-play');
        $('#stop').removeClass('btn-primary');
    } else if (state == 'pause') {
        $('#playlist-position').html('Not playing');
        $('#play').addClass('btn-primary');
        $('#play i').removeClass('icon-play').addClass('icon-pause');
        $('#stop').removeClass('btn-primary');
    } else if (state == 'stop') {
        $('#play').removeClass('btn-primary');
        $('#play i').removeClass('icon-pause').addClass('icon-play');
        $('#stop').addClass('btn-primary');
        $('#countdown-display').countdown('destroy');
        $('#elapsed').html('00:00');
        $('#total').html('');
        $('#time').val(0).trigger('change');
        $('#format-bitrate').html('&nbsp;');
        $('.playlist li').removeClass('active');
    }
    if (state == 'play' || state == 'pause') {
        $('#elapsed').html(timeConvert(GUI.json['elapsed']));
        $('#total').html(timeConvert(GUI.json['time']));
        //$('#time').val(json['song_percent']).trigger('change');
        $('#playlist-position').html('Playlist position ' + (parseInt(GUI.json['song']) + 1) +'/'+GUI.json['playlistlength']);
        var fileinfo = (GUI.json['audio_channels'] && GUI.json['audio_sample_depth'] && GUI.json['audio_sample_rate']) ? (GUI.json['audio_channels'] + ', ' + GUI.json['audio_sample_depth'] + ' bit, ' + GUI.json['audio_sample_rate'] +' kHz, '+GUI.json['bitrate']+' kbps') : '&nbsp;';
        $('#format-bitrate').html(fileinfo);
        $('.playlist li').removeClass('active');
        var current = parseInt(GUI.json['song']) + 1;
        $('.playlist li:nth-child(' + current + ')').addClass('active');
    }
	
	// mostra icona UpdateDB
	// console.log('dbupdate = ', GUI.json['updating_db']);
	if (typeof GUI.json['updating_db'] != 'undefined') {
		$('.open-panel-sx').html('<i class="icon-refresh icon-spin"></i> Updating');
	} else {
		$('.open-panel-sx').html('<i class="icon-music sx"></i> Browse');
	}
}

// aggiorna il countdown
function refreshTimer(startFrom, stopTo, state){
    //console.log('startFrom = ', startFrom);
    //console.log('state = ', state);
    if (state == 'play') {
        $('#countdown-display').countdown('destroy');
        $('#countdown-display').countdown({since: -(startFrom), compact: true, format: 'MS'});
    } else if (state == 'pause') {
        //console.log('startFrom = ', startFrom);
        $('#countdown-display').countdown('destroy');
        $('#countdown-display').countdown({since: -(startFrom), compact: true, format: 'MS'});
        $('#countdown-display').countdown('pause');
    } else if (state == 'stop') {
        $('#countdown-display').countdown('destroy');
        $('#countdown-display').countdown({since: 0, compact: true, format: 'MS'});
        $('#countdown-display').countdown('pause');
    }
}

// aggiorna il knob di avanzamento
function refreshKnob(json){
    window.clearInterval(GUI.currentKnob)
    var initTime = json['song_percent'];
    //console.log('percent = ', initTime);
    var delta = json['time'] / 1000;
    $('#time').val(initTime*10).trigger('change');
    if (GUI.state == 'play') {
        GUI.currentKnob = setInterval(function() {
            // console.log('initTime = ', initTime);
            // console.log('delta = ', delta);
            if (GUI.visibility == 'visible') {
                initTime = initTime + 0.1;
            } else {
                initTime = initTime + 100/json['time'];
            }
            $('#time').val(initTime*10).trigger('change');
            //document.title = Math.round(initTime*10) + ' - ' + GUI.visibility;
        }, delta * 1000);
    }
}

// conversione temporale
function timeConvert(seconds) {
    minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    mm = (minutes < 10) ? ('0' + minutes) : minutes;
    ss = (seconds < 10) ? ('0' + seconds) : seconds;
    display = mm + ':' + ss;
    return display;
}

// resetta il countdown
function countdownRestart(startFrom) {
    $('#countdown-display').countdown('destroy');
    $('#countdown-display').countdown({since: -(startFrom), compact: true, format: 'MS'});
}

// setta il volume da knob
function setvol(val) {
    $('#volume').val(val);
    GUI.volume = val;
    GUI.halt = 1;
    // console.log('GUI.halt (setvol)= ', GUI.halt);
    $('#volumemute').removeClass('btn-primary');
    sendCmd('setvol ' + val);
}

// scrolling
function customScroll(list, destination, speed) {
    if (typeof(speed) === 'undefined') speed = 500;
    var entryheight = parseInt(1 + $('#' + list + '-1').height());
    var centerheight = parseInt($(window).height()/2);
    var scrolltop = $(window).scrollTop();
    if (list == 'db') {
        var scrollcalc = parseInt((destination)*entryheight - centerheight);
        var scrolloffset = scrollcalc;
    } else if (list == 'pl') {
        //var scrolloffset = parseInt((destination + 2)*entryheight - centerheight);
        var scrollcalc = parseInt((destination + 2)*entryheight - centerheight);
        if (scrollcalc > scrolltop) {
            var scrolloffset = '+=' + Math.abs(scrollcalc - scrolltop) + 'px';
        } else {
            var scrolloffset = '-=' + Math.abs(scrollcalc - scrolltop) + 'px';
        }
    }
    // debug
    // console.log('-------------------------------------------');
    // console.log('customScroll parameters = ' + list + ', ' + destination + ', ' + speed);
    // console.log('scrolltop = ', scrolltop);
    // console.log('scrollcalc = ', scrollcalc);
    // console.log('scrolloffset = ', scrolloffset);
    if (scrollcalc > 0) {
        $.scrollTo( scrolloffset , speed );
    } else {
        $.scrollTo( 0 , speed );
    }
    //$('#' + list + '-' + (destination + 1)).addClass('active');
}

function randomScrollPL() {
    var n = $(".playlist li").size();
    var random = 1 + Math.floor(Math.random() * n);
    customScroll('pl', random);
}
function randomScrollDB() {
    var n = $(".database li").size();
    var random = 1 + Math.floor(Math.random() * n);
    customScroll('db', random);
}

// rileva se la tab c attiva o meno
(function() {
    hidden = 'hidden';
    // Standards:
    if (hidden in document)
        document.addEventListener('visibilitychange', onchange);
    else if ((hidden = 'mozHidden') in document)
        document.addEventListener('mozvisibilitychange', onchange);
    else if ((hidden = "webkitHidden") in document)
        document.addEventListener('webkitvisibilitychange', onchange);
    else if ((hidden = "msHidden") in document)
        document.addEventListener('msvisibilitychange', onchange);
    // IE 9 and lower:
    else if ('onfocusin' in document)
        document.onfocusin = document.onfocusout = onchange;
    // All others:
    else
        window.onpageshow = window.onpagehide
            = window.onfocus = window.onblur = onchange;

    function onchange (evt) {
        var v = 'visible', h = 'hidden',
            evtMap = {
                focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h
            };

        evt = evt || window.event;
        if (evt.type in evtMap) {
            document.body.className = evtMap[evt.type];
            // console.log('boh? = ', evtMap[evt.type]);
        } else {
            document.body.className = this[hidden] ? 'hidden' : 'visible';
            if (this[hidden]) {
                GUI.visibility = 'hidden';
                // console.log('focus = hidden');
            } else {
                GUI.visibility = 'visible';
                // console.log('focus = visible');
            }
        }
    }
})();