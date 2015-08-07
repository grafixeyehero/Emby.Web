(function (globalScope) {

    function loadItemIntoSpotlight(card, item, width, apiClient) {

        if (!item.BackdropImageTags || !item.BackdropImageTags.length) {
            return;
        }

        var imgUrl = apiClient.getScaledImageUrl(item.Id, {
            type: "Backdrop",
            maxWidth: width,
            tag: item.BackdropImageTags[0]
        });

        var cardImageContainer = card.querySelector('.cardImageContainer');

        var newCardImageContainer = document.createElement('div');
        newCardImageContainer.className = cardImageContainer.className;

        newCardImageContainer.style.backgroundImage = "url('" + imgUrl + "')";

        card.querySelector('.cardText').innerHTML = item.Name;
        card.setAttribute('data-id', item.Id);
        cardImageContainer.parentNode.appendChild(newCardImageContainer);

        var keyframes = [
                { opacity: '0', offset: 0 },
                { opacity: '1', offset: 1 }];
        var timing = { duration: 900, iterations: 1 };
        newCardImageContainer.animate(keyframes, timing).onfinish = function () {

            var parentNode = cardImageContainer.parentNode;
            if (parentNode) {
                parentNode.removeChild(cardImageContainer);
            }
        };
    }

    function spotlight(card, items, width, apiClient) {

        var self = this;

        if (!items.length) {
            return;
        }

        loadItemIntoSpotlight(card, items[0], width, apiClient);

        if (items.length == 1) {
            return;
        }

        var index = 1;

        self.interval = setInterval(function () {

            if (!Emby.Dom.isInDocument(card)) {
                clearInterval(self.interval);
                return;
            }

            if (!Emby.Dom.visibleInViewport(card, true, 0)) {
                // If it's not visible on screen, skip it
                return;
            }

            if (index >= items.length) {
                index = 0;
            }

            loadItemIntoSpotlight(card, items[index], width, apiClient);
            index++;

        }, 10000);
    }

    if (!globalScope.DefaultTheme) {
        globalScope.DefaultTheme = {};
    }

    globalScope.DefaultTheme.spotlight = spotlight;

})(this);