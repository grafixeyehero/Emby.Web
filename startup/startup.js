(function (document) {

    document.addEventListener("viewshow-welcome", function (e) {

        var element = e.detail.element;
        var params = e.detail.params;

        require(['loading'], function (loading) {
            loading.hide();
        });

        element.querySelector('.btnWelcomeNext').addEventListener('click', function () {

            require(['loading', 'connectionManager'], function (loading, connectionManager) {
                connectionManager.connect().done(function (result) {

                    loading.hide();

                    handleConnectionResult(result);
                });
            });
        });
    });

    document.addEventListener("viewshow-manuallogin", function (e) {

        var element = e.detail.element;
        var params = e.detail.params;

        element.querySelector('.txtUserName').value = params.user || '';
        element.querySelector('.txtPassword').value = '';

        if (params.user) {
            Emby.FocusManager.focus(element.querySelector('.txtPassword'));
        } else {
            Emby.FocusManager.focus(element.querySelector('.txtUserName'));
        }

        element.querySelector('form').addEventListener('submit', function (e) {

            var username = this.querySelector('.txtUserName').value;
            var password = this.querySelector('.txtPassword').value;

            require(['connectionManager', 'loading'], function (connectionManager, loading) {

                loading.show();

                var serverId = params.serverid;

                authenticateUser(connectionManager.getApiClient(serverId), username, password);
            });

            e.preventDefault();
            return false;
        });

        element.querySelector('.buttonCancel').addEventListener('click', function (e) {

            history.back();
        });

        element.querySelector('.paperSubmit').addEventListener('click', function (e) {

            // Do a fake form submit this the button isn't a real submit button
            var fakeSubmit = document.createElement('input');
            fakeSubmit.setAttribute('type', 'submit');
            fakeSubmit.style.display = 'none';
            var form = element.querySelector('form');
            form.appendChild(fakeSubmit);
            fakeSubmit.click();
            form.removeChild(fakeSubmit);
        });
    });

    document.addEventListener("viewshow-manualserver", function (e) {

        var element = e.detail.element;
        var params = e.detail.params;

        element.querySelector('.txtServerHost').value = '';
        element.querySelector('.txtServerPort').value = '';

        element.querySelector('form').addEventListener('submit', function (e) {

            var address = this.querySelector('.txtServerHost').value;
            var port = this.querySelector('.txtServerPort').value;

            if (port) {
                address += ':' + port;
            }

            require(['connectionManager', 'loading'], function (connectionManager, loading) {

                loading.show();

                connectionManager.connectToAddress(address).done(function (result) {

                    loading.hide();

                    handleConnectionResult(result);
                });
            });

            e.preventDefault();
            return false;
        });

        element.querySelector('.buttonCancel').addEventListener('click', function (e) {

            page.show('/startup/selectserver.html');
        });

        element.querySelector('.paperSubmit').addEventListener('click', function (e) {

            // Do a fake form submit this the button isn't a real submit button
            var fakeSubmit = document.createElement('input');
            fakeSubmit.setAttribute('type', 'submit');
            fakeSubmit.style.display = 'none';
            var form = element.querySelector('form');
            form.appendChild(fakeSubmit);
            fakeSubmit.click();
            form.removeChild(fakeSubmit);
        });
    });

    document.addEventListener("viewshow-connectlogin", function (e) {

        var element = e.detail.element;
        var params = e.detail.params;

        element.querySelector('form').addEventListener('submit', function (e) {

            signIntoConnect(element);
            e.preventDefault();
            return false;
        });

        element.querySelector('.btnSkipConnect').addEventListener('click', function (e) {

            require(['connectionManager', 'loading'], function (connectionManager, loading) {

                loading.show();

                connectionManager.connect().done(function (result) {

                    loading.hide();

                    if (result.State == MediaBrowser.ConnectionState.ConnectSignIn) {
                        page.show('/startup/manualserver.html');
                    } else {
                        handleConnectionResult(result);
                    }
                });
            });
        });

        element.querySelector('.paperSubmit').addEventListener('click', function (e) {

            // Do a fake form submit this the button isn't a real submit button
            var fakeSubmit = document.createElement('input');
            fakeSubmit.setAttribute('type', 'submit');
            fakeSubmit.style.display = 'none';
            var form = element.querySelector('form');
            form.appendChild(fakeSubmit);
            fakeSubmit.click();
            form.removeChild(fakeSubmit);
        });
    });

    function signIntoConnect(view) {

        var username = view.querySelector('.txtConnectUserName').value;
        var password = view.querySelector('.txtConnectPassword').value;

        require(['connectionManager', 'loading'], function (connectionManager, loading) {

            loading.show();

            connectionManager.loginToConnect(username, password).done(function () {

                loading.hide();

                page.show('/startup/selectserver.html');

            }).fail(function () {

                loading.hide();

                Emby.elements.alert({
                    text: Globalize.translate('MessageInvalidUser'),
                    title: Globalize.translate('HeaderLoginFailure')
                });

            });
        });
    }

    function onServerUserSignedIn() {
        Emby.ThemeManager.loadUserTheme();
    }

    function handleConnectionResult(result) {

        switch (result.State) {

            case MediaBrowser.ConnectionState.SignedIn:
                {
                    onServerUserSignedIn();
                }
                break;
            case MediaBrowser.ConnectionState.ServerSignIn:
                {
                    require(['loading'], function (loading) {

                        loading.show();
                        result.ApiClient.getPublicUsers().done(function (users) {
                            loading.hide();

                            if (users.length) {

                                page.show('/startup/login.html?serverid=' + result.Servers[0].Id);
                            } else {
                                page.show('/startup/manuallogin.html?serverid=' + result.Servers[0].Id);
                            }
                        });
                    });
                }
                break;
            case MediaBrowser.ConnectionState.ServerSelection:
                {
                    page.show('/startup/selectserver.html');
                }
                break;
            case MediaBrowser.ConnectionState.ConnectSignIn:
                {
                    page.show('/startup/connectlogin.html');
                }
                break;
            case MediaBrowser.ConnectionState.Unavailable:
                {
                    Emby.elements.alert({
                        text: Globalize.translate("MessageUnableToConnectToServer"),
                        title: Globalize.translate("HeaderConnectionFailure")
                    });
                }
                break;
            default:
                break;
        }
    }

    document.addEventListener("viewshow-login", function (e) {

        var element = e.detail.element;
        var params = e.detail.params;

        var serverId = params.serverid;

        require(['connectionManager', 'loading'], function (connectionManager, loading) {

            loading.show();

            var apiClient = connectionManager.getApiClient(serverId);
            apiClient.getPublicUsers().done(function (result) {

                renderLoginUsers(element, apiClient, result, serverId);

            }).fail(function (result) {

                renderLoginUsers(element, apiClient, [], serverId);
            });
        });
    });

    function renderLoginUsers(view, apiClient, users, serverId) {

        var items = users.map(function (user) {

            var imgUrl = user.PrimaryImageTag ?
                apiClient.getUserImageUrl(user.Id, {
                    width: 400,
                    tag: user.PrimaryImageTag,
                    type: "Primary"
                }) :
                '';

            var url = user.HasPassword ?
                ('/startup/manuallogin.html?serverid=' + serverId + '&user=' + user.Name) :
                '';

            return {
                name: user.Name,
                showIcon: !imgUrl,
                showImage: imgUrl,
                icon: 'person',
                lastActive: getLastActiveText(user),
                cardImageStyle: "background-image:url('" + imgUrl + "');",
                cardType: '',
                hasLastActive: true,
                id: user.Id,
                url: url
            };

        });

        items.push({
            name: Globalize.translate('ButtonManualLogin'),
            showIcon: true,
            showImage: false,
            icon: 'lock',
            cardImageStyle: '',
            cardType: 'manuallogin',
            defaultText: true,
            url: '/startup/manuallogin.html?serverid=' + serverId
        });

        items.push({
            name: Globalize.translate('HeaderSignInWithConnect'),
            showIcon: true,
            showImage: false,
            icon: 'cloud',
            cardImageStyle: '',
            cardType: 'embyconnect',
            defaultText: true,
            url: '/startup/connectlogin.html'
        });

        items.push({
            name: Globalize.translate('ButtonChangeServer'),
            showIcon: true,
            showImage: false,
            icon: 'cast',
            cardImageStyle: '',
            cardType: 'changeserver',
            defaultText: true,
            url: '/startup/selectserver.html'
        });

        view.querySelector('.itemTemplate').items = items;

        // TODO: Is there a better way to figure out the polymer elements have loaded besides a timeout?
        setTimeout(function () {

            require(["Sly", 'loading'], function (Sly, loading) {

                loading.hide();

                createHorizontalScroller(view);
            });

        }, 500);

        view.querySelector('.scrollSlider').addEventListener('click', function (e) {

            var model = view.querySelector('.itemTemplate').itemForElement(e.target);

            if (model.url) {
                page.show(model.url);
            } else {
                authenticateUser(apiClient, model.name);
            }

        });
    }

    function authenticateUser(apiClient, username, password) {

        require(['loading'], function (loading) {

            loading.show();

            apiClient.authenticateUserByName(username, password).done(function (result) {

                loading.hide();

                onServerUserSignedIn();

            }).fail(function (result) {

                loading.hide();

                require(['alert'], function (alert) {
                    alert({
                        text: Globalize.translate('MessageInvalidUser')
                    });
                });
            });
        });
    }

    document.addEventListener("viewshow-selectserver", function (e) {

        var element = e.detail.element;
        var params = e.detail.params;

        require(['connectionManager', 'loading'], function (connectionManager, loading) {

            loading.show();

            connectionManager.getAvailableServers().done(function (result) {

                renderSelectServerItems(element, result);

            }).fail(function (result) {

                renderSelectServerItems(element, []);
            });
        });
    });

    function createHorizontalScroller(view) {

        var scrollFrame = view.querySelector('.scrollFrame');

        require(['loading'], function (loading) {
            loading.hide();
        });

        scrollFrame.style.display = 'block';

        var options = {
            horizontal: 1,
            itemNav: 'forceCentered',
            mouseDragging: 1,
            touchDragging: 1,
            slidee: view.querySelector('.scrollSlider'),
            itemSelector: '.card',
            activateOn: 'click focus',
            smart: true,
            easing: 'swing',
            releaseSwing: true,
            scrollBar: view.querySelector('.scrollbar'),
            scrollBy: 1,
            speed: 600,
            moveBy: 600,
            elasticBounds: 1,
            dragHandle: 1,
            dynamicHandle: 1,
            clickBar: 1
        };
        var frame = new Sly(scrollFrame, options).init();

        var keyframes = [
         { opacity: '0', transform: 'translate3d(100%, 0, 0)', offset: 0 },
         { opacity: '1', transform: 'none', offset: 1 }];

        scrollFrame.animate(keyframes, {
            duration: 900,
            iterations: 1
        });
    }

    function renderSelectServerItems(view, servers) {

        var items = servers.map(function (server) {

            return {
                name: server.Name,
                showIcon: true,
                icon: 'cast',
                cardType: '',
                id: server.Id,
                server: server
            };

        });

        items.push({
            name: Globalize.translate('ButtonNewServer'),
            showIcon: true,
            showImage: false,
            icon: 'add',
            cardImageStyle: '',
            cardType: 'changeserver',
            defaultText: true,
            url: '/startup/manualserver.html'
        });

        view.querySelector('.itemTemplate').items = items;

        // TODO: Is there a better way to figure out the polymer elements have loaded besides a timeout?
        setTimeout(function () {

            require(["Sly", 'loading'], function (Sly, loading) {
                loading.hide();

                createHorizontalScroller(view);
            });

        }, 500);

        view.querySelector('.scrollSlider').addEventListener('click', function (e) {

            var model = view.querySelector('.itemTemplate').itemForElement(e.target);

            if (model.url) {
                page.show(model.url);
            } else {

                require(['connectionManager', 'loading'], function (connectionManager, loading) {

                    loading.show();

                    connectionManager.connectToServer(model.server).done(function (result) {

                        loading.hide();

                        handleConnectionResult(result);
                    });
                });
            }
        });
    }


    function getLastActiveText(user) {

        if (!user.LastActivityDate) {
            return "Last seen never";
        }

        return "Last seen " + humane_date(user.LastActivityDate);
    }

    /*
 * Javascript Humane Dates
 * Copyright (c) 2008 Dean Landolt (deanlandolt.com)
 * Re-write by Zach Leatherman (zachleat.com)
 *
 * Adopted from the John Resig's pretty.js
 * at http://ejohn.org/blog/javascript-pretty-date
 * and henrah's proposed modification
 * at http://ejohn.org/blog/javascript-pretty-date/#comment-297458
 *
 * Licensed under the MIT license.
 */

    function humane_date(date_str) {
        var time_formats = [[90, 'a minute'], // 60*1.5
        [3600, 'minutes', 60], // 60*60, 60
        [5400, 'an hour'], // 60*60*1.5
        [86400, 'hours', 3600], // 60*60*24, 60*60
        [129600, 'a day'], // 60*60*24*1.5
        [604800, 'days', 86400], // 60*60*24*7, 60*60*24
        [907200, 'a week'], // 60*60*24*7*1.5
        [2628000, 'weeks', 604800], // 60*60*24*(365/12), 60*60*24*7
        [3942000, 'a month'], // 60*60*24*(365/12)*1.5
        [31536000, 'months', 2628000], // 60*60*24*365, 60*60*24*(365/12)
        [47304000, 'a year'], // 60*60*24*365*1.5
        [3153600000, 'years', 31536000] // 60*60*24*365*100, 60*60*24*365
        ];

        var dt = new Date;
        var date = parseISO8601Date(date_str);

        var seconds = ((dt - date) / 1000);
        var token = ' ago';
        var i = 0;
        var format;

        if (seconds < 0) {
            seconds = Math.abs(seconds);
            token = '';
        }

        while (format = time_formats[i++]) {
            if (seconds < format[0]) {
                if (format.length == 2) {
                    return format[1] + token;
                } else {
                    return Math.round(seconds / format[2]) + ' ' + format[1] + token;
                }
            }
        }

        // overflow for centuries
        if (seconds > 4730400000)
            return Math.round(seconds / 4730400000) + ' centuries' + token;

        return date_str;
    }

    function parseISO8601Date(s, toLocal) {

        // parenthese matches:
        // year month day    hours minutes seconds
        // dotmilliseconds
        // tzstring plusminus hours minutes
        var re = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|([+-])(\d{2}):(\d{2}))?/;

        var d = s.match(re);

        // "2010-12-07T11:00:00.000-09:00" parses to:
        //  ["2010-12-07T11:00:00.000-09:00", "2010", "12", "07", "11",
        //     "00", "00", ".000", "-09:00", "-", "09", "00"]
        // "2010-12-07T11:00:00.000Z" parses to:
        //  ["2010-12-07T11:00:00.000Z",      "2010", "12", "07", "11",
        //     "00", "00", ".000", "Z", undefined, undefined, undefined]

        if (!d) {

            throw "Couldn't parse ISO 8601 date string '" + s + "'";
        }

        // parse strings, leading zeros into proper ints
        var a = [1, 2, 3, 4, 5, 6, 10, 11];
        for (var i in a) {
            d[a[i]] = parseInt(d[a[i]], 10);
        }
        d[7] = parseFloat(d[7]);

        // Date.UTC(year, month[, date[, hrs[, min[, sec[, ms]]]]])
        // note that month is 0-11, not 1-12
        // see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date/UTC
        var ms = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6]);

        // if there are milliseconds, add them
        if (d[7] > 0) {
            ms += Math.round(d[7] * 1000);
        }

        // if there's a timezone, calculate it
        if (d[8] != "Z" && d[10]) {
            var offset = d[10] * 60 * 60 * 1000;
            if (d[11]) {
                offset += d[11] * 60 * 1000;
            }
            if (d[9] == "-") {
                ms -= offset;
            } else {
                ms += offset;
            }
        } else if (toLocal === false) {
            ms += new Date().getTimezoneOffset() * 60000;
        }

        return new Date(ms);
    }


})(document);