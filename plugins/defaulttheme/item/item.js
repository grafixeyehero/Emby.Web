(function () {

    document.addEventListener("viewshow-defaulttheme-item", function (e) {

        var element = e.detail.element;
        var params = e.detail.params;

        require(['loading'], function (loading) {

            loading.show();

            Emby.Models.item(params.id).then(function (item) {

                Emby.Backdrop.setBackdrops([item]);
                renderPeople(element, item);
                renderScenes(element, item);
                renderSimilar(element, item);
                createVerticalScroller(element);
            });
        });

        //initEvents(element);
    });

    function createVerticalScroller(view) {

        require(["Sly", 'loading'], function (Sly, loading) {

            var scrollFrame = view.querySelector('.scrollFrame');

            var options = {
                horizontal: 0,
                itemNav: 0,
                mouseDragging: 1,
                touchDragging: 1,
                slidee: view.querySelector('.scrollSlider'),
                itemSelector: '.card',
                smart: true,
                easing: 'easeOutQuart',
                releaseSwing: true,
                scrollBar: view.querySelector('.scrollbar'),
                scrollBy: 200,
                speed: 200,
                dragHandle: 1,
                dynamicHandle: 1,
                clickBar: 1
            };

            var bodySlyFrame = new Sly(scrollFrame, options).init();

            initFocusHandler(view, bodySlyFrame);
        });
    }

    function initFocusHandler(view, slyFrame) {

        var scrollSlider = view.querySelector('.scrollSlider');
        scrollSlider.addEventListener('focusin', function (e) {

            var card = Emby.Dom.parentWithClass(e.target, 'card');

            if (card) {
                Logger.log('Calling slyFrame.toCenter');
                slyFrame.toCenter(card);
            }
        });
    }

    function renderPeople(view, item) {

        Emby.Models.itemPeople(item, {

            limit: 24,
            images: [
            {
                type: 'Primary',
                width: 220
            }]

        }).then(function (people) {

            var section = view.querySelector('.peopleSection');

            if (!people.length) {
                section.classList.add('hide');
                return;
            }

            section.classList.remove('hide');

            require([Emby.PluginManager.mapRequire('defaulttheme', 'cards/peoplecardbuilder.js')], function () {
                DefaultTheme.PeopleCardBuilder.buildPeopleCards(people, {
                    parentContainer: section,
                    itemsContainer: section.querySelector('.itemsContainer'),
                    shape: 'portraitCard itemPersonThumb'
                });
            });
        });
    }

    function renderScenes(view, item) {

        Emby.Models.chapters(item, {
            images: [
            {
                type: 'Primary',
                width: 300
            }]

        }).then(function (chapters) {

            var section = view.querySelector('.scenesSection');

            if (!chapters.length) {
                section.classList.add('hide');
                return;
            }

            section.classList.remove('hide');

            require([Emby.PluginManager.mapRequire('defaulttheme', 'cards/chaptercardbuilder.js')], function () {
                DefaultTheme.ChapterCardBuilder.buildChapterCards(chapters, {
                    parentContainer: section,
                    itemsContainer: section.querySelector('.itemsContainer'),
                    shape: 'backdropCard itemScenesThumb',
                    coverImage: true
                });
            });
        });
    }

    function renderSimilar(view, item) {

        Emby.Models.similar(item, {

            Limit: 12

        }).then(function (result) {

            var section = view.querySelector('.similarSection');

            if (!result.Items.length) {
                section.classList.add('hide');
                return;
            }

            section.classList.remove('hide');

            DefaultTheme.CardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto'
            });
        });
    }

    function setHeaders(view, item) {

        var headers = [];

        headers.push({
            name: Globalize.translate('Overview'),
            type: 'overview'
        });


        if (item.People && item.People.length) {
            headers.push({
                name: Globalize.translate('People'),
                type: 'people'
            });
        }

        if (item.LocalTrailerCount && item.LocalTrailerCount > 1) {

            headers.push({
                name: Globalize.translate('Trailers'),
                type: 'trailers'
            });
        }

        if (item.Chapters && item.Chapters.length) {

            headers.push({
                name: Globalize.translate('Scenes'),
                type: 'scenes'
            });
        }

        if (item.SpecialFeatureCount > 0) {

            if (item.Type == 'Series') {
                headers.push({
                    name: Globalize.translate('Specials'),
                    type: 'specials'
                });
            } else {
                headers.push({
                    name: Globalize.translate('SpecialFeatures'),
                    type: 'specials'
                });
            }
        }

        if (item.Type == 'Movie' || item.Type == 'Series' || item.Type == 'MusicAlbum' || item.Type == 'Game') {
            headers.push({
                name: Globalize.translate('Similar'),
                type: 'similar'
            });
        }

        // TODO: Reviews

        view.querySelector('.scrollSlider').innerHTML = headers.map(function (i) {

            return '<paper-button class="flat btnUserViewHeader" data-type="' + i.type + '"><h2>' + i.name + '</h2></paper-button>';

        }).join('');

        createHeaderScroller(view);
    }

})();