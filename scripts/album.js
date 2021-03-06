var setSong = function(songNumber) {
    if (currentSoundFile) {
         setCurrentlyPlayingSongTime(0);
         currentSoundFile.stop();
     }
    
    currentlyPlayingSongNumber = parseInt(songNumber);
    currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
    
    currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
         formats: [ 'mp3' ],
         preload: true
     });
    setVolume(currentVolume);
};

 var seek = function(time) {
     if (currentSoundFile) {
         currentSoundFile.setTime(time);
     }
 };
 
var setVolume = function(volume) {
     if (currentSoundFile) {
         currentSoundFile.setVolume(volume);
     }
};

var getSongNumberCell = function(number) {
    return $('.song-item-number[data-song-number="' + number + '"]')
};

var createSongRow = function(songNumber, songName, songLength) {
     var template =
        '<tr class="album-view-song-item">'
      + '  <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
      + '  <td class="song-item-title">' + songName + '</td>'
      + '  <td class="song-item-duration">' + songLength + '</td>'
      + '</tr>'
      ;
 
     var $row = $(template);
        var clickHandler = function() {
            var songNumber = parseInt($(this).attr('data-song-number'));
            
            if (currentlyPlayingSongNumber !== null) {
                // Revert to song number for currently playing song because user started playing new song.
                var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);

                currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
                currentlyPlayingCell.html(currentlyPlayingSongNumber);
            }
        
             if (currentlyPlayingSongNumber !== songNumber) {
                 // Switch from Play -> Pause button to indicate new song is playing.
                 setSong(songNumber);
                 currentSoundFile.play();
                 updateSeekBarWhileSongPlays();
                 currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
                 
                 var $volumeFill = $('.volume .fill');
                 var $volumeThumb = $('.volume .thumb');
                 $volumeFill.width(currentVolume + '%');
                 $volumeThumb.css({left: currentVolume + '%'});

                 $(this).html(pauseButtonTemplate);
                 updatePlayerBarSong();
             } else if (currentlyPlayingSongNumber === songNumber) {
                    if (currentSoundFile.isPaused()) {
                        $(this).html(pauseButtonTemplate);
                        $('.main-controls .play-pause').html(playerBarPauseButton);
                        currentSoundFile.play();
                        updateSeekBarWhileSongPlays();
                    } else {
                        $(this).html(playButtonTemplate);
                        $('.main-controls .play-pause').html(playerBarPlayButton);
                        currentSoundFile.pause();   
                    }
            }
        };
        var onHover = function(event) {
            var songNumberCell = $(this).find('.song-item-number');
            var songNumber = parseInt(songNumberCell.attr('data-song-number'));

            if (songNumber !== currentlyPlayingSongNumber) {
                songNumberCell.html(playButtonTemplate);
            }
         };
         var offHover = function(event) {
            var songNumberCell = $(this).find('.song-item-number');
            var songNumber = parseInt(songNumberCell.attr('data-song-number'));

            if (songNumber !== currentlyPlayingSongNumber) {
                songNumberCell.html(songNumber);
            }
         };
         $row.find('.song-item-number').click(clickHandler);
         $row.hover(onHover, offHover);
         return $row;
 };

var setCurrentAlbum = function(album) {
     currentAlbum = album;
     var $albumTitle = $('.album-view-title');
     var $albumArtist = $('.album-view-artist');
     var $albumReleaseInfo = $('.album-view-release-info');
     var $albumImage = $('.album-cover-art');
     var $albumSongList = $('.album-view-song-list');
    
     $albumTitle.text(album.title);
     $albumArtist.text(album.artist);
     $albumReleaseInfo.text(album.year + ' ' + album.label);
     $albumImage.attr('src', album.albumArtUrl);
 
     $albumSongList.empty();
 
     for (var i = 0; i < album.songs.length; i++) {
         var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
         $albumSongList.append($newRow);
     }
 };

 var updateSeekBarWhileSongPlays = function() {
     if (currentSoundFile) {
         currentSoundFile.bind('timeupdate', function(event) {
             var seekBarFillRatio = this.getTime() / this.getDuration();
             var $seekBar = $('.seek-control .seek-bar');
 
             updateSeekPercentage($seekBar, seekBarFillRatio);
             var currentTime = this.getTime();
             setCurrentTimeInPlayerBar(currentTime);
         });
     }
 };

 var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    var offsetXPercent = seekBarFillRatio * 100;

    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);

    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});
 };

var setupSeekBars = function() {
     var $seekBars = $('.player-bar .seek-bar');
 
     $seekBars.click(function(event) {
        var offsetX = event.pageX - $(this).offset().left;
        var barWidth = $(this).width();
        var seekBarFillRatio = offsetX / barWidth;
        
        if ($(this).parent().attr('class') == 'seek-control') {
            seek(seekBarFillRatio * currentSoundFile.getDuration());
        } else {
            setVolume(seekBarFillRatio * 100);   
        }
        
        updateSeekPercentage($(this), seekBarFillRatio);
    });

    $seekBars.find('.thumb').mousedown(function(event) {

        var $seekBar = $(this).parent();

        $(document).bind('mousemove.thumb', function(event){
            var offsetX = event.pageX - $seekBar.offset().left;
            var barWidth = $seekBar.width();
            var seekBarFillRatio = offsetX / barWidth;
            
            if ($seekBar.parent().attr('class') == 'seek-control') {
                seek(seekBarFillRatio * currentSoundFile.getDuration());   
            } else {
                setVolume(seekBarFillRatio);
            }
            
            updateSeekPercentage($seekBar, seekBarFillRatio);
        });
 });
};
var trackIndex = function(album, song) {
     return album.songs.indexOf(song);
 };

var nextSong = function() {
    
    var getLastSongNumber = function(index) {
        return index == 0 ? currentAlbum.songs.length : index;
    };
    
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    // Note that we're _incrementing_ the song here
    currentSongIndex++;
    
    if (currentSongIndex >= currentAlbum.songs.length) {
        currentSongIndex = 0;
    }
    
    // Set a new current song
    currentlyPlayingSongNumber = currentSongIndex + 1;
    currentSongFromAlbum = currentAlbum.songs[currentSongIndex];
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();
    
    // Update the Player Bar information
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.title);
    $('.main-controls .play-pause').html(playerBarPauseButton);
    
    var lastSongNumber = parseInt(getLastSongNumber(currentSongIndex));
    var $nextSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');
    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');
    
    $nextSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);  
};


var previousSong = function() {
    
    // Note the difference between this implementation and the one in
    // nextSong()
    var getLastSongNumber = function(index) {
        return index == (currentAlbum.songs.length - 1) ? 1 : index + 2;
    };
    
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    // Note that we're _decrementing_ the index here
    currentSongIndex--;
    
    if (currentSongIndex < 0) {
        currentSongIndex = currentAlbum.songs.length - 1;
    }
    
    // Set a new current song
    currentlyPlayingSongNumber = currentSongIndex + 1;
    currentSongFromAlbum = currentAlbum.songs[currentSongIndex];
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();
    
    // Update the Player Bar information
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.title);
    $('.main-controls .play-pause').html(playerBarPauseButton);
    
    var lastSongNumber = parseInt(getLastSongNumber(currentSongIndex));
    var $previousSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');
    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');
    
    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
    
};

var updatePlayerBarSong = function() {

    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);
    $('.main-controls .play-pause').html(playerBarPauseButton);
};

var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
var playerBarPlayButton = '<span class="ion-play"></span>';
var playerBarPauseButton = '<span class="ion-pause"></span>';

var currentAlbum = null;
var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;
var currentSoundFile = null;
var currentVolume = 80;
var currentlyPlayingSongTime = 0;

var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');
 

/// Assignment-y Stuff Below ///

var $playButton =  $('.main-controls .play-pause');

var setCurrentlyPlayingSongTime = function(time) {
  currentlyPlayingSongTime = time; 
}

var togglePlayFromPlayerBar = function() {
    var songNumber = currentlyPlayingSongNumber || 1;
    
    if (!currentSoundFile) {
        setSong(songNumber);
    }
    
    if (!currentSoundFile || currentSoundFile.isPaused()) {
        var $songNumberCell = $('.song-item-number[data-song-number="' + songNumber + '"]');
        
        // Change song number cell from play button to pause button
        $songNumberCell.html(pauseButtonTemplate);
        
        // Change HTML of player bar's play to pause
        $('.main-controls .play-pause').html(playerBarPauseButton);
        
        setTotalTimeInPlayerBar(currentSongFromAlbum.duration);
        updateSeekBarWhileSongPlays();
        
        
        // Play song
        currentSoundFile.play();
        
    } else {
        
        var $songNumberCell = $('.song-item-number[data-song-number="' + songNumber + '"]');
        
        // Change song number cell to play button
        $songNumberCell.html(playButtonTemplate);
        
        // Change HTML of player bar's pause to play
        $('.main-controls .play-pause').html(playerBarPlayButton);
        
        setTotalTimeInPlayerBar(currentSongFromAlbum.duration);
        updateSeekBarWhileSongPlays();
        setCurrentlyPlayingSongTime(currentSoundFile.getTime());
        
        // Play song
        currentSoundFile.pause();  
    }
};

//Assignment 34 #1
var setCurrentTimeInPlayerBar = function(currentTime) {
    $(".current-time").html(filterTimeCode(currentTime)); 
};

// #2
var setTotalTimeInPlayerBar = function(totalTime) {
    $(".total-time").html(filterTimeCode(totalTime));
};

// #3
var filterTimeCode = function(timeInSeconds) {
    var formattedMinutes = Math.floor(timeInSeconds / 60)
    var formattedSeconds = timeInSeconds % 60

    var formattedTime = "";

    formattedTime += "" + formattedMinutes + ":" + (formattedSeconds < 10 ? "0" : "");
    formattedTime += "" + Math.floor(formattedSeconds);
    return formattedTime;
};

$(document).ready(function() {
     setCurrentAlbum(albumPicasso);
     setupSeekBars();
     $previousButton.click(previousSong);
     $nextButton.click(nextSong);
     $playButton.click(function(){
         togglePlayFromPlayerBar();
     });
});

