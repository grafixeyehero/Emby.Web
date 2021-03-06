(function () {

    document.addEventListener("viewinit-defaulttheme-nowplaying", function (e) {

        new nowPlayingPage(e.target, e.detail.params);
    });

    function nowPlayingPage(view, params) {

        var self = this;
        var currentPlayer;

        var nowPlayingVolumeSlider = view.querySelector('.nowPlayingVolumeSlider');
        var nowPlayingPositionSlider = view.querySelector('.nowPlayingPositionSlider');

        var nowPlayingPositionText = view.querySelector('.nowPlayingPositionText');
        var nowPlayingDurationText = view.querySelector('.nowPlayingDurationText');

        var btnRepeat = view.querySelector('.btnRepeat');

        function setCurrentItem(item) {

            if (item) {
                setTitle(item);

                DefaultTheme.Backdrop.setBackdrops([item]);

                DefaultTheme.CardBuilder.buildCards([item], {
                    shape: 'squareCard',
                    width: 640,
                    itemsContainer: view.querySelector('.nowPlayingCardContainer'),
                    scalable: true
                });

                var names = [];

                names.push(item.Name);

                if (item.ArtistItems && item.ArtistItems[0]) {
                    names.push(item.ArtistItems[0].Name);
                }

                if (item.Album) {
                    names.push(item.Album);
                }

                view.querySelector('.nowPlayingMetadata').innerHTML = names.join('<br/>');
                view.querySelector('.userDataIcons').innerHTML = DefaultTheme.UserData.getIconsHtml(item, false, 'xlargePaperIconButton');

                nowPlayingVolumeSlider.disabled = false;
                nowPlayingPositionSlider.disabled = false;

            } else {


                view.querySelector('.nowPlayingCardContainer').innerHTML = '';
                view.querySelector('.nowPlayingMetadata').innerHTML = '&nbsp;<br/>&nbsp;';
                view.querySelector('.userDataIcons').innerHTML = '';

                nowPlayingVolumeSlider.disabled = true;
                nowPlayingPositionSlider.disabled = true;

                DefaultTheme.Backdrop.setBackdrops([]);
            }

            updatePlaylist();
        }

        function setTitle(item) {

            var url = Emby.Models.logoImageUrl(item, {});

            if (url) {

                var pageTitle = document.querySelector('.pageTitle');
                pageTitle.style.backgroundImage = "url('" + url + "')";
                pageTitle.classList.add('pageTitleWithLogo');
                pageTitle.innerHTML = '';
                document.querySelector('.headerLogo').classList.add('hide');
            } else {
                Emby.Page.setTitle('');
            }
        }

        function onPlaybackStart(e, player) {

            bindToPlayer(player);
            setCurrentItem(Emby.PlaybackManager.currentItem(player));
        }

        function onPlaybackStop(e, stopInfo) {

            releasePlayer();
            setCurrentItem(null);

            if (stopInfo.nextMediaType != 'Audio') {
                Emby.Page.back();
            }
        }

        function bindToPlayer(player) {

            if (player != currentPlayer) {

                releasePlayer();

                Events.on(player, 'volumechange', onVolumeChange);
                Events.on(player, 'timeupdate', onTimeUpdate);
                Events.on(player, 'pause', onPlaystateChange);
                Events.on(player, 'playing', onPlaystateChange);
            }

            currentPlayer = player;
            updateVolume(player);
            updateTime(player);
            updatePlaystate(player);
            updatePlaylist();
        }

        function releasePlayer() {

            var player = currentPlayer;

            if (player) {
                Events.off(player, 'volumechange', onVolumeChange);
                Events.off(player, 'timeupdate', onTimeUpdate);
                Events.off(player, 'pause', onPlaystateChange);
                Events.off(player, 'playing', onPlaystateChange);
                currentPlayer = null;
            }
        }

        function onTimeUpdate(e) {
            updateTime(this);
        }

        function onVolumeChange(e) {
            updateVolume(this);
        }

        function onPlaystateChange(e) {
            updatePlaystate(this);
            updatePlaylist();
        }

        function updatePlaystate(player) {

            if (Emby.PlaybackManager.paused()) {
                view.querySelector('.btnPause').icon = 'play-arrow';
            } else {
                view.querySelector('.btnPause').icon = 'pause';
            }

            var repeatMode = Emby.PlaybackManager.getRepeatMode();

            if (repeatMode == 'RepeatAll') {
                btnRepeat.icon = "repeat";
                btnRepeat.classList.add('repeatActive');
            }
            else if (repeatMode == 'RepeatOne') {
                btnRepeat.icon = "repeat-one";
                btnRepeat.classList.add('repeatActive');
            } else {
                btnRepeat.icon = "repeat";
                btnRepeat.classList.remove('repeatActive');
            }
        }

        function onRepeatModeChanged() {
            updatePlaystate(currentPlayer);
        }

        function updateVolume(player) {

            if (!nowPlayingVolumeSlider.dragging) {
                nowPlayingVolumeSlider.value = Emby.PlaybackManager.volume();
            }

            if (Emby.PlaybackManager.isMuted()) {
                view.querySelector('.buttonMute').icon = 'volume-off';
            } else {
                view.querySelector('.buttonMute').icon = 'volume-up';
            }
        }

        function updatePlaylist() {

            var items = Emby.PlaybackManager.playlist();

            if (items.length > 1) {
                view.querySelector('.btnPlaylist').disabled = false;
            } else {
                view.querySelector('.btnPlaylist').disabled = true;
            }

            var index = Emby.PlaybackManager.currentPlaylistIndex();

            if (index == 0) {
                view.querySelector('.btnPreviousTrack').disabled = true;
            } else {
                view.querySelector('.btnPreviousTrack').disabled = false;
            }

            if (index >= items.length - 1) {
                view.querySelector('.btnNextTrack').disabled = true;
            } else {
                view.querySelector('.btnNextTrack').disabled = false;
            }
        }

        function updateTime(player) {

            if (!nowPlayingPositionSlider.dragging) {

                var state = Emby.PlaybackManager.getPlayerState(player);
                var playState = state.PlayState || {};
                var nowPlayingItem = state.NowPlayingItem || {};

                if (nowPlayingItem.RunTimeTicks) {

                    var pct = playState.PositionTicks / nowPlayingItem.RunTimeTicks;
                    pct *= 100;

                    nowPlayingPositionSlider.value = pct;

                } else {

                    nowPlayingPositionSlider.value = 0;
                }

                updateTimeText(nowPlayingPositionText, playState.PositionTicks);
                updateTimeText(nowPlayingDurationText, nowPlayingItem.RunTimeTicks, true);

                nowPlayingPositionSlider.disabled = !playState.CanSeek;
            }
        }

        function updateTimeText(elem, ticks, divider) {

            if (ticks == null) {
                elem.innerHTML = '';
                return;
            }

            require(['datetime'], function (datetime) {
                var html = datetime.getDisplayRunningTime(ticks);

                if (divider) {
                    html = '&nbsp;/&nbsp;' + html;
                }

                elem.innerHTML = html;
            });
        }

        function getHeaderElement() {
            return document.querySelector('.themeHeader');
        }

        view.addEventListener('viewshow', function (e) {

            getHeaderElement().classList.add('nowPlayingHeader');

            Emby.Page.setTitle('');
            Events.on(Emby.PlaybackManager, 'playbackstart', onPlaybackStart);
            Events.on(Emby.PlaybackManager, 'playbackstop', onPlaybackStop);
            Events.on(Emby.PlaybackManager, 'repeatmodechange', onRepeatModeChanged);

            onPlaybackStart(e, Emby.PlaybackManager.currentPlayer());
        });

        view.addEventListener('viewhide', function () {

            getHeaderElement().classList.remove('nowPlayingHeader');

            releasePlayer();
            Events.off(Emby.PlaybackManager, 'playbackstart', onPlaybackStart);
            Events.off(Emby.PlaybackManager, 'playbackstop', onPlaybackStop);
            Events.off(Emby.PlaybackManager, 'repeatmodechange', onRepeatModeChanged);
        });

        view.querySelector('.buttonMute').addEventListener('click', function () {

            Emby.PlaybackManager.toggleMute();
        });

        nowPlayingVolumeSlider.addEventListener('change', function () {

            Emby.PlaybackManager.volume(this.value);
        });

        nowPlayingPositionSlider.addEventListener('change', function () {

            Emby.PlaybackManager.seekPercent(parseFloat(this.value), currentPlayer);
        });

        view.querySelector('.btnPreviousTrack').addEventListener('click', function () {

            Emby.PlaybackManager.previousTrack();
        });

        view.querySelector('.btnPause').addEventListener('click', function () {

            Emby.PlaybackManager.playPause();
        });

        view.querySelector('.btnStop').addEventListener('click', function () {

            Emby.PlaybackManager.stop();
        });

        view.querySelector('.btnNextTrack').addEventListener('click', function () {

            Emby.PlaybackManager.nextTrack();
        });

        view.querySelector('.btnPlaylist').addEventListener('click', function () {

            Emby.Page.show(Emby.PluginManager.mapPath('defaulttheme', 'nowplaying/playlist.html'));
        });

        btnRepeat.addEventListener('click', function () {

            switch (Emby.PlaybackManager.getRepeatMode()) {
                case 'RepeatAll':
                    Emby.PlaybackManager.setRepeatMode('RepeatOne');
                    break;
                case 'RepeatOne':
                    Emby.PlaybackManager.setRepeatMode('RepeatNone');
                    break;
                default:
                    Emby.PlaybackManager.setRepeatMode('RepeatAll');
                    break;
            }
        });
    }

})();