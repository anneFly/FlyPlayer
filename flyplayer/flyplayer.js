"use strict";

// HTML5 PLAYER
(function($) { 
	
window.FlyPlayer = {};
	   
FlyPlayer.init = function(params){
	
	var isPlaying = false,
		playInterval,
		currentVol = 0.5;
		
	var audioPath,
		audioTitles,
		audioFiles;
	
	var $audioWrapper = $(params.audiocontainer),
		$player = $(params.html5player),
		$fallback = $(params.fallback),
		$playBtn = $(params.play),
		$nextBtn = $(params.next),
		$prevBtn = $(params.prev),
		$stopBtn = $(params.stop),
		$muteBtn = $(params.mute),
		$tracklist = $(params.tracklist),
		$tracks,
		$outerBar = $(params.outerBar),
		$innerBar = $(params.innerBar),
		$vcanvas = $(params.volumeCanvas),
		$audio;
	
	$playBtn.click(function(){
		playPauseCurrentTrack()
	});
	$nextBtn.click(function(){
		setNextTrack()
	});
	$prevBtn.click(function(){
		setPreviousTrack()
	});
	$stopBtn.click(function(){
		removeAudio()
	});
	$muteBtn.click(function(){
		setMute()
	});
	
	var checkAudio = function(){
		var audioTagSupport = !!(document.createElement('audio').canPlayType);
		if (audioTagSupport === false) {
			$player.remove();
		} else {
			$fallback.remove();
			initCanvas();
			initTracklist();
		}
	};
	
	var playerPlay = function(){
		$playBtn.addClass('isPlaying');
	};
	
	var playerPause = function(){
		$playBtn.removeClass('isPlaying');
	};
	
	var playPauseCurrentTrack = function(){
		$audio = $audioWrapper.find('audio');
		if ($audio.length == 0) {
			setTrack($tracks.attr('id'));
			playPauseCurrentTrack();
		}
		if (isPlaying == false) {
			$audio[0].play();
			isPlaying = true;
			
		} else if (isPlaying == true) {
			$audio[0].pause();
			isPlaying = false;
		}
	};
	
	
	var setNextTrack = function(){
		$audio = $audioWrapper.find('audio');
		if ($audio.length == 0) {
			setTrack($tracks.attr('id'));
		} else {
			var isLast = false;
			var nextTrack;
			var lastTrack = $tracklist.find("div:last-child");
			$tracks.each(function(){
				if($(this).is('.active')){
					if($(this).is(lastTrack)) {
						isLast = true;
					} else {
						nextTrack = $(this).next().attr('id');
					}
				}
			});
			if (!isLast) {
				setTrack(nextTrack);
			} else {
				removeAudio();
			}
		}
	};
	
	var setPreviousTrack = function(){
		$audio = $audioWrapper.find('audio');
		if ($audio.length == 0) {
			$tracks.each(function(){
				if($(this).is(':last-child')) {
					setTrack($(this).attr('id'));
					return false;
				}
			});		
		} else {
			var isFirst = false;
			var prevTrack;
			var firstTrack = $tracklist.find('div:first-child');
			$tracks.each(function(){
				if($(this).is('.active')){
					if($(this).is(firstTrack)) {
						isFirst = true;
					} else {
						prevTrack = $(this).prev().attr('id');
					}
				}
			});
			if (!isFirst) {
				setTrack(prevTrack);
			} else {
				removeAudio();
			}
		}
	};
	
	var removeAudio = function(){
		clearProgress();
		$audioWrapper.find('audio').detach();
		isPlaying = false;
		
		$tracks.each(function(){
			$(this).removeClass('active')
		});
		
	};
	
	var appendAudio = function(audioid, files, types){
		removeAudio(); 
		var $newAudio = $("<audio id='"+audioid+"'>");
		$audioWrapper.append($newAudio);
		for (var i=0; i<files.length; i++) {
			var $newSource = $(document.createElement('source')).attr({ 'src': String(files[i]), 'type': String(types[i]) });
			$newAudio.append($newSource);
		}
	};
	
	
	var setTrack = function(trackid){
		clearProgress();
		
		var j = parseInt(trackid.charAt(trackid.length-1));
		
		var files = [];
		var types = [];
		
		for (var k=0; k<audioFiles[j].length; k++) {
			if (audioFiles[j][k].slice( -3 ) == "mp3") {
				files.push(audioPath+audioFiles[j][k]);
				types.push("audio/mp3");
			} else if (audioFiles[j][k].slice( -3 ) == "ogg") {
				files.push(audioPath+audioFiles[j][k]);
				types.push("audio/ogg");
			} else {
				console.log('invalid file type');
			}
		}
		
		appendAudio("audioEl", files, types);
		
		$tracks.removeClass('active');
		
		$tracklist.find('#' + trackid).addClass('active');
		
		$audio = $audioWrapper.find('audio');	
		if ($audio.length != 0) {
			$audio[0].volume = currentVol;
			$audio.bind({
				pause: playerPause,
				play: playerPlay,
				playing: makeProgress,
				ended: setNextTrack
			});
		} ;
		
		
		
	//	$audio.bind("volumechange", volBarChange);
	//	$audio.bind("loadstart", getload);
		
		playPauseCurrentTrack();
	};
	
	// progress Bar
	var progressBar = function(){
		$audio = $audioWrapper.find('audio');
		if ($audio.length == 0) {
			return false;
		}
		var now = parseFloat($audio[0].currentTime * $outerBar.attr('width') / $audio[0].duration);
		$innerBar.attr("width", now);
	};
	
	
	var makeProgress = function(){
		playInterval = setInterval(progressBar, 100 );
	};
	
	var clearProgress = function(){
		clearInterval(playInterval);
		$innerBar.attr("width", "0");
	};
	
	
	// volume canvas	
	var changeVol = function(newvol){
		currentVol = newvol;
		$audio = $audioWrapper.find('audio');
		if ($audio.length != 0) {
			$audio[0].volume = newvol;
		} 
	};
	
	var setMute = function(){
		$audio = $audioWrapper.find('audio');
		if ($audio.length != 0) {
			if ($audio[0].muted == false) {
				$audio[0].muted = true;
				$muteBtn.addClass('muted');
			} else if ($audio[0].muted == true) {
				$audio[0].muted = false;
				$muteBtn.removeClass('muted');
			}
		}
	};
	
	var clearCanvas = function(ctx){
		ctx.clearRect(0, 0, $vcanvas.width(), $vcanvas.height());
	};
	
	var draw = function(event, ctx){
		var clickY = event.clientY + window.pageYOffset;
		var posInCanvas = clickY - $vcanvas.offset().top;
		var newvol = 1-(posInCanvas/$vcanvas.height());
		clearCanvas(ctx);
		var volGrad = ctx.createLinearGradient(0, 0, $vcanvas.width(), 0);
		volGrad.addColorStop(0,"#888888");
		volGrad.addColorStop(0.3,"#ffffff");
		volGrad.addColorStop(1,"#888888");
		ctx.fillStyle = volGrad;
		ctx.fillRect(0, posInCanvas, $vcanvas.width(), $vcanvas.height());
		changeVol(newvol);
	};	
	
	var initCanvas = function(){
		var ctx, volGrad;

		ctx = $vcanvas[0].getContext("2d");
		
		$vcanvas.bind('mousedown', function(e){
			draw(e, ctx);
		});
	
		volGrad = ctx.createLinearGradient(0, 0, $vcanvas.width(), 0);
		volGrad.addColorStop(0,"#888888");
		volGrad.addColorStop(0.3,"#ffffff");
		volGrad.addColorStop(1,"#888888");
		ctx.fillStyle = volGrad;
		ctx.fillRect(0, $vcanvas.height()/2, $vcanvas.width(), $vcanvas.height());
	};
	
	var initTracklist = function(){
		$.ajax({
			url: "flyplayer/tracklist.json",
			dataType: 'json',
			success: function(data) {
				audioPath = data.path;
				audioTitles = data.titles;
				audioFiles = data.filenames;
				
				for (var i = 0; i<audioTitles.length; i++) {
					$tracklist.append("<div id='track"+i+"' class='playerTrack'>"+audioTitles[i]+"</div>");
				}
				$tracks = $('#tracklist > div');
				$tracks.click(function(){
					setTrack($(this).attr('id'))
				});
			}
		})
	};
		
	checkAudio();
};

})(jQuery);