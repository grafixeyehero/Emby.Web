(function (document) {

    var currentOwnerId;
    var currentThemeIds = [];

    function playThemeMedia(items, ownerId) {

        if (items.length) {

            // Stop if a theme song from another ownerId
            // Leave it alone if anything else (e.g user playing a movie)
            if (!currentOwnerId && Emby.PlaybackManager.isPlaying()) {
                return;
            }

            currentThemeIds = items.map(function (i) {
                return i.Id;
            });

            currentOwnerId = ownerId;

            Emby.PlaybackManager.play({
                items: items,
                fullscreen: false
            });

        } else {

            if (currentOwnerId) {
                Emby.PlaybackManager.stop();
            }

            currentOwnerId = null;
        }
    }

    function enabled() {

        return true;
    }

    function loadThemeMedia(item) {

        require(['connectionManager'], function (connectionManager) {

            var apiClient = connectionManager.currentApiClient();
            apiClient.getThemeMedia(apiClient.getCurrentUserId(), item.Id, true).then(function (themeMediaResult) {

                var ownerId = themeMediaResult.ThemeVideosResult.Items.length ? themeMediaResult.ThemeVideosResult.OwnerId : themeMediaResult.ThemeSongsResult.OwnerId;

                if (ownerId != currentOwnerId) {

                    var items = themeMediaResult.ThemeVideosResult.Items.length ? themeMediaResult.ThemeVideosResult.Items : themeMediaResult.ThemeSongsResult.Items;

                    playThemeMedia(items, ownerId);
                }
            });

        });
    }

    document.addEventListener('viewshow', function (e) {

        if (enabled()) {

            var state = e.detail.state || {};
            var item = state.item;

            if (item) {
                loadThemeMedia(item);
                return;
            }

            var viewOptions = e.detail.options || {};

            if (viewOptions.supportsThemeMedia) {
                // Do nothing here, allow it to keep playing
            }
            else {
                playThemeMedia([], null);
            }
        }

    }, true);

    //Events.on(Emby.PlaybackManager, 'playbackstart', function (e, player) {
    //    var item = Emby.PlaybackManager.currentItem(player);
    //    // User played something manually
    //    if (currentThemeIds.indexOf(item.Id) == -1) {
    //        currentOwnerId = null;
    //    }
    //});

})(document);
