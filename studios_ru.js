(function () {
    'use strict';

    // ------------------------------------------------------------
    // STUDIOS MASTER (Unified) - RU safe build
    // - keeps ALL original categories (no cuts)
    // - default language ru
    // - fixed menu order (SYFY won't jump to the end)
    // - better Prime Video / Disney+ icons for TV (solid, crisp)
    // - fail-safe: never kills Lampa if something goes wrong
    // ------------------------------------------------------------

    function safeLog() {
        try { console.log.apply(console, arguments); } catch (e) {}
    }

    function currentDateYMD() {
        var d = new Date();
        return [
            d.getFullYear(),
            ('0' + (d.getMonth() + 1)).slice(-2),
            ('0' + d.getDate()).slice(-2)
        ].join('-');
    }

    function resolveValue(val) {
        return val === '{current_date}' ? currentDateYMD() : val;
    }

    // We keep URL building close to original (NO encode) to avoid double-encoding surprises in some builds
    function pushParam(params, key, val) {
        params.push(key + '=' + String(val));
    }

    // Crisp TV-friendly icons (solid shapes, not thin strokes)
    var ICONS = {
        netflix:
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M16.5 2L16.5 22" stroke="#E50914" stroke-width="4"/>' +
            '<path d="M7.5 2L7.5 22" stroke="#E50914" stroke-width="4"/>' +
            '<path d="M7.5 2L16.5 22" stroke="#E50914" stroke-width="4"/>' +
            '</svg>',

        apple:
            '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>' +
            '</svg>',

        hbo:
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M7.042 16.896H4.414v-3.754H2.708v3.754H.01L0 7.22h2.708v3.6h1.706v-3.6h2.628zm12.043.046C21.795 16.94 24 14.689 24 11.978a4.89 4.89 0 0 0-4.915-4.92c-2.707-.002-4.09 1.991-4.432 2.795.003-1.207-1.187-2.632-2.58-2.634H7.59v9.674l4.181.001c1.686 0 2.886-1.46 2.888-2.713.385.788 1.72 2.762 4.427 2.76zm-7.665-3.936c.387 0 .692.382.692.817 0 .435-.305.817-.692.817h-1.33v-1.634zm.005-3.633c.387 0 .692.382.692.817 0 .436-.305.818-.692.818h-1.33V9.373zm1.77 2.607c.305-.039.813-.387.992-.61-.063.276-.068 1.074.006 1.35-.204-.314-.688-.701-.998-.74zm3.43 0a2.462 2.462 0 1 1 4.924 0 2.462 2.462 0 0 1-4.925 0zm2.462 1.936a1.936 1.936 0 1 0 0-3.872 1.936 1.936 0 0 0 0 3.872z"/>' +
            '</svg>',

        // Prime Video: simple solid "smile" + play (crisp at 24px)
        amazon:
            '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M6 15.5c4.2 2.8 9.8 2.8 14 0-0.6-0.4-1.2-0.8-4.6-8.4-6.8 3.1-10.6 3.1-15.2 0 3.1 6.8 3.7 8 5.8 8.4z"/>' +
            '<path d="M16.2 9.2a1.2 1.2 0 0 1 1.2-1.2h2.2a1.2 1.2 0 0 1 1.2 1.2v2.2a1.2 1.2 0 0 1-1.2 1.2h-2.2a1.2 1.2 0 0 1-1.2-1.2z"/>' +
            '</svg>',

        // Disney+: arc + plus (solid)
        disney:
            '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
            // Smile (thick stroke, round caps) — crisp on TV
            '<path d="M4.2 14.2c3.7 2.6 11.9 2.6 15.6 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
            // Arrow head (filled) at the right end of the smile
            '<path d="M18.9 13.3l2.6 1.0-2.6 1.0c.3-.6.3-1.4 0-2.0z" fill="currentColor"/>' +
            '</svg>',

        hulu:
            '<svg viewBox="0 0 24 24" fill="#3DBB3D" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>' +
            '</svg>',

        paramount:
            '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 2L2 22H22L12 2ZM12 6.5L18.5 19.5H5.5L12 6.5Z"/>' +
            '</svg>',

        syfy:
            '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/>' +
            '</svg>',

        edu:
            '<svg viewBox="0 0 24 24" fill="#FF9800" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>' +
            '</svg>'
    };

    // FULL configs (same categories as your original, only RU titles)
    var SERVICE_CONFIGS = {
        netflix: {
            title: 'Netflix',
            icon: ICONS.netflix,
            categories: [
                { title: 'Новые фильмы', url: 'discover/movie', params: { with_watch_providers: '8', watch_region: 'UA', sort_by: 'primary_release_date.desc', 'primary_release_date.lte': '{current_date}', 'vote_count.gte': '5' } },
                { title: 'Новые сериалы', url: 'discover/tv', params: { with_networks: '213', sort_by: 'first_air_date.desc', 'first_air_date.lte': '{current_date}', 'vote_count.gte': '5' } },
                { title: 'В тренде на Netflix', url: 'discover/tv', params: { with_networks: '213', sort_by: 'popularity.desc' } },
                { title: 'Экшен и блокбастеры', url: 'discover/movie', params: { with_companies: '213', with_genres: '28,12', sort_by: 'popularity.desc' } },
                { title: 'Фантастические миры', url: 'discover/tv', params: { with_networks: '213', with_genres: '10765', sort_by: 'vote_average.desc', 'vote_count.gte': '200' } },
                { title: 'Реалити-шоу: хиты', url: 'discover/tv', params: { with_networks: '213', with_genres: '10764', sort_by: 'popularity.desc' } },
                { title: 'Криминальные драмы', url: 'discover/tv', params: { with_networks: '213', with_genres: '80', sort_by: 'popularity.desc' } },
                { title: 'K-Dramas (корейские сериалы)', url: 'discover/tv', params: { with_networks: '213', with_original_language: 'ko', sort_by: 'popularity.desc' } },
                { title: 'Аниме-коллекция', url: 'discover/tv', params: { with_networks: '213', with_genres: '16', with_keywords: '210024', sort_by: 'popularity.desc' } },
                { title: 'Документальное кино', url: 'discover/movie', params: { with_companies: '213', with_genres: '99', sort_by: 'release_date.desc' } },
                { title: 'Выбор критиков (высокий рейтинг)', url: 'discover/movie', params: { with_companies: '213', 'vote_average.gte': '7.5', 'vote_count.gte': '300', sort_by: 'vote_average.desc' } }
            ]
        },

        apple: {
            title: 'Apple TV+',
            icon: ICONS.apple,
            categories: [
                { title: 'Новые фильмы', url: 'discover/movie', params: { with_watch_providers: '350', watch_region: 'UA', sort_by: 'primary_release_date.desc', 'primary_release_date.lte': '{current_date}', 'vote_count.gte': '5' } },
                { title: 'Новые сериалы', url: 'discover/tv', params: { with_watch_providers: '350', watch_region: 'UA', sort_by: 'first_air_date.desc', 'first_air_date.lte': '{current_date}', 'vote_count.gte': '5' } },
                { title: 'Хиты Apple TV+', url: 'discover/tv', params: { with_watch_providers: '350', watch_region: 'UA', sort_by: 'popularity.desc' } },
                { title: 'Apple Original Films', url: 'discover/movie', params: { with_watch_providers: '350', watch_region: 'UA', sort_by: 'release_date.desc', 'vote_count.gte': '10' } },
                { title: 'Фантастика Apple', url: 'discover/tv', params: { with_watch_providers: '350', watch_region: 'UA', with_genres: '10765', sort_by: 'vote_average.desc', 'vote_count.gte': '200' } },
                { title: 'Комедии и feel-good', url: 'discover/tv', params: { with_watch_providers: '350', watch_region: 'UA', with_genres: '35', sort_by: 'popularity.desc' } },
                { title: 'Триллеры и детективы', url: 'discover/tv', params: { with_watch_providers: '350', watch_region: 'UA', with_genres: '9648,80', sort_by: 'popularity.desc' } }
            ]
        },

        hbo: {
            title: 'HBO',
            icon: ICONS.hbo,
            categories: [
                { title: 'Новые фильмы WB/HBO', url: 'discover/movie', params: { with_companies: '174|49', sort_by: 'primary_release_date.desc', 'primary_release_date.lte': '{current_date}', 'vote_count.gte': '10' } },
                { title: 'Новые сериалы HBO/Max', url: 'discover/tv', params: { with_networks: '49|3186', sort_by: 'first_air_date.desc', 'first_air_date.lte': '{current_date}', 'vote_count.gte': '5' } },
                { title: 'HBO: главные хиты', url: 'discover/tv', params: { with_networks: '49', sort_by: 'popularity.desc' } },
                { title: 'Max Originals', url: 'discover/tv', params: { with_networks: '3186', sort_by: 'popularity.desc' } },
                { title: 'Блокбастеры Warner Bros.', url: 'discover/movie', params: { with_companies: '174', sort_by: 'revenue.desc', 'vote_count.gte': '1000' } },
                { title: 'Золотая коллекция HBO (высокий рейтинг)', url: 'discover/tv', params: { with_networks: '49', sort_by: 'vote_average.desc', 'vote_count.gte': '500', 'vote_average.gte': '8.0' } },
                { title: 'Эпические миры (фэнтези)', url: 'discover/tv', params: { with_networks: '49|3186', with_genres: '10765', sort_by: 'popularity.desc' } },
                { title: 'Премиальные драмы', url: 'discover/tv', params: { with_networks: '49', with_genres: '18', without_genres: '10765', sort_by: 'popularity.desc' } },
                { title: 'Взрослая анимация (Adult Swim)', url: 'discover/tv', params: { with_networks: '3186|80', with_genres: '16', sort_by: 'popularity.desc' } },
                { title: 'Вселенная DC (фильмы)', url: 'discover/movie', params: { with_companies: '174', with_keywords: '9715', sort_by: 'release_date.desc' } }
            ]
        },

        amazon: {
            title: 'Prime Video',
            icon: ICONS.amazon,
            categories: [
                { title: 'В тренде на Prime Video', url: 'discover/tv', params: { with_networks: '1024', sort_by: 'popularity.desc' } },
                { title: 'Новые фильмы', url: 'discover/movie', params: { with_watch_providers: '119', watch_region: 'UA', sort_by: 'primary_release_date.desc', 'primary_release_date.lte': '{current_date}', 'vote_count.gte': '5' } },
                { title: 'Новые сериалы', url: 'discover/tv', params: { with_networks: '1024', sort_by: 'first_air_date.desc', 'first_air_date.lte': '{current_date}', 'vote_count.gte': '5' } },
                { title: 'Жёсткий экшен и антигерои', url: 'discover/tv', params: { with_networks: '1024', with_genres: '10765,10759', sort_by: 'popularity.desc' } },
                { title: 'Блокбастеры MGM и Amazon', url: 'discover/movie', params: { with_companies: '1024|21', sort_by: 'revenue.desc' } },
                { title: 'Комедии', url: 'discover/tv', params: { with_networks: '1024', with_genres: '35', sort_by: 'vote_average.desc' } },
                { title: 'Самый высокий рейтинг IMDb', url: 'discover/tv', params: { with_networks: '1024', 'vote_average.gte': '8.0', 'vote_count.gte': '500', sort_by: 'vote_average.desc' } }
            ]
        },

        disney: {
            title: 'Disney+',
            icon: ICONS.disney,
            categories: [
                { title: 'Новые фильмы на Disney+', url: 'discover/movie', params: { with_watch_providers: '337', watch_region: 'UA', sort_by: 'primary_release_date.desc', 'primary_release_date.lte': '{current_date}', 'vote_count.gte': '5' } },
                { title: 'Новые сериалы на Disney+', url: 'discover/tv', params: { with_watch_providers: '337', watch_region: 'UA', sort_by: 'first_air_date.desc', 'first_air_date.lte': '{current_date}', 'vote_count.gte': '5' } },
                { title: 'Marvel: киновселенная (MCU)', url: 'discover/movie', params: { with_companies: '420', sort_by: 'release_date.desc', 'vote_count.gte': '200' } },
                { title: 'Marvel: сериалы', url: 'discover/tv', params: { with_companies: '420', with_networks: '2739', sort_by: 'first_air_date.desc' } },
                { title: 'Звёздные войны: фильмы', url: 'discover/movie', params: { with_companies: '1', sort_by: 'release_date.asc' } },
                { title: 'Звёздные войны: «Мандалорец» и другие', url: 'discover/tv', params: { with_companies: '1', with_keywords: '1930', sort_by: 'popularity.desc' } },
                { title: 'Классика Disney', url: 'discover/movie', params: { with_companies: '6125', sort_by: 'popularity.desc' } },
                { title: 'Pixar: «до бесконечности и дальше»', url: 'discover/movie', params: { with_companies: '3', sort_by: 'popularity.desc' } },
                { title: 'FX: взрослые хиты (The Bear, Shogun)', url: 'discover/tv', params: { with_networks: '88', sort_by: 'popularity.desc' } },
                { title: 'Симпсоны и анимация FOX', url: 'discover/tv', params: { with_networks: '19', with_genres: '16', sort_by: 'popularity.desc' } }
            ]
        },

        hulu: {
            title: 'Hulu',
            icon: ICONS.hulu,
            categories: [
                { title: 'Hulu Originals: в тренде', url: 'discover/tv', params: { with_networks: '453', sort_by: 'popularity.desc' } },
                { title: 'Драмы и триллеры Hulu', url: 'discover/tv', params: { with_networks: '453', with_genres: '18,9648', sort_by: 'vote_average.desc' } },
                { title: 'Комедии и взрослая анимация', url: 'discover/tv', params: { with_networks: '453', with_genres: '35,16', sort_by: 'popularity.desc' } },
                { title: 'Мини-сериалы (Limited Series)', url: 'discover/tv', params: { with_networks: '453', with_keywords: '158718', sort_by: 'first_air_date.desc' } }
            ]
        },

        paramount: {
            title: 'Paramount+',
            icon: ICONS.paramount,
            categories: [
                { title: 'Блокбастеры Paramount Pictures', url: 'discover/movie', params: { with_companies: '4', sort_by: 'revenue.desc' } },
                { title: 'Paramount+ Originals', url: 'discover/tv', params: { with_networks: '4330', sort_by: 'popularity.desc' } },
                { title: 'Вселенная «Йеллоустоун»', url: 'discover/tv', params: { with_networks: '318|4330', with_genres: '37,18', sort_by: 'popularity.desc' } },
                { title: 'Star Trek: последняя граница', url: 'discover/tv', params: { with_networks: '4330', with_keywords: '159223', sort_by: 'first_air_date.desc' } },
                { title: 'Nickelodeon: для детей', url: 'discover/tv', params: { with_networks: '13', sort_by: 'popularity.desc' } }
            ]
        },

        syfy: {
            title: 'SYFY',
            icon: ICONS.syfy,
            categories: [
                { title: 'Хиты телеканала Syfy', url: 'discover/tv', params: { with_networks: '77', sort_by: 'popularity.desc' } },
                { title: 'Космические путешествия и научная фантастика', url: 'discover/tv', params: { with_networks: '77', with_genres: '10765', with_keywords: '3801', sort_by: 'vote_average.desc' } },
                { title: 'Мистика, ужасы и фэнтези', url: 'discover/tv', params: { with_networks: '77', with_genres: '9648,10765', without_keywords: '3801', sort_by: 'popularity.desc' } }
            ]
        },

        educational_and_reality: {
            title: 'Познавательное',
            icon: ICONS.edu,
            categories: [
                { title: 'Новые выпуски: Discovery, NatGeo, BBC', url: 'discover/tv', params: { with_networks: '64|91|43|2696|4|65', sort_by: 'first_air_date.desc', 'first_air_date.lte': '{current_date}', 'vote_count.gte': '0' } },

                { title: 'Discovery Channel: хиты', url: 'discover/tv', params: { with_networks: '64', sort_by: 'popularity.desc' } },
                { title: 'National Geographic: мир вокруг', url: 'discover/tv', params: { with_networks: '43', sort_by: 'popularity.desc' } },
                { title: 'Animal Planet: животные', url: 'discover/tv', params: { with_networks: '91', sort_by: 'popularity.desc' } },
                { title: 'BBC Earth: природа (высокий рейтинг)', url: 'discover/tv', params: { with_networks: '4', with_genres: '99', sort_by: 'vote_average.desc', 'vote_count.gte': '50' } },

                { title: 'Кулинарные баттлы и шеф-повара', url: 'discover/tv', params: { with_genres: '10764', with_keywords: '222083', without_keywords: '10636,5481', sort_by: 'popularity.desc' } },
                { title: 'Голос, танцы и шоу талантов', url: 'discover/tv', params: { with_genres: '10764', with_keywords: '4542|4568|2643', without_keywords: '5481,9714', sort_by: 'popularity.desc' } },
                { title: 'Шоу про выживание', url: 'discover/tv', params: { with_genres: '10764', with_keywords: '5481|10348', sort_by: 'popularity.desc' } },
                { title: 'Наука, техника и эксперименты', url: 'discover/tv', params: { with_genres: '99', with_keywords: '12554|4924', sort_by: 'popularity.desc' } },
                { title: 'Путешествия и туризм', url: 'discover/tv', params: { with_genres: '99,10764', with_keywords: '9714', sort_by: 'vote_average.desc', 'vote_count.gte': '20' } },
                { title: 'True Crime: реальные расследования', url: 'discover/tv', params: { with_genres: '99', with_keywords: '10714|9840', sort_by: 'popularity.desc' } }
            ]
        }
    };

    // Fixed order to avoid Object.keys order quirks in some JS engines
    var MENU_ORDER = [
        'netflix',
        'apple',
        'hbo',
        'amazon',
        'disney',
        'hulu',
        'paramount',
        'syfy',
        'educational_and_reality'
    ];

    // ------------------------------------------------------------
    // COMPONENTS (original logic, with ru default)
    // ------------------------------------------------------------
    function StudiosMain(object) {
        var comp = new Lampa.InteractionMain(object);
        var config = SERVICE_CONFIGS[object.service_id];

        comp.create = function () {
            var _this = this;

            try {
                this.activity.loader(true);

                if (!config || !config.categories || !config.categories.length) {
                    _this.empty();
                    return _this.render();
                }

                var categories = config.categories;
                var network = new Lampa.Reguest();
                var status = new Lampa.Status(categories.length);

                status.onComplite = function () {
                    var fulldata = [];

                    Object.keys(status.data)
                        .sort(function (a, b) { return a - b; })
                        .forEach(function (key) {
                            var data = status.data[key];
                            if (data && data.results && data.results.length) {
                                var cat = categories[parseInt(key, 10)];
                                Lampa.Utils.extendItemsParams(data.results, { style: { name: 'wide' } });
                                fulldata.push({
                                    title: cat.title,
                                    results: data.results,
                                    url: cat.url,
                                    params: cat.params,
                                    service_id: object.service_id
                                });
                            }
                        });

                    if (fulldata.length) {
                        _this.build(fulldata);
                        _this.activity.loader(false);
                    } else {
                        _this.empty();
                    }
                };

                categories.forEach(function (cat, index) {
                    var params = [];
                    pushParam(params, 'api_key', Lampa.TMDB.key());
                    pushParam(params, 'language', Lampa.Storage.get('language', 'ru'));

                    if (cat.params) {
                        for (var key in cat.params) {
                            if (!cat.params.hasOwnProperty(key)) continue;
                            var val = resolveValue(cat.params[key]);
                            pushParam(params, key, val);
                        }
                    }

                    var url = Lampa.TMDB.api(cat.url + '?' + params.join('&'));

                    network.silent(url, function (json) {
                        status.append(index.toString(), json);
                    }, function () {
                        status.error();
                    });
                });

                return this.render();
            } catch (e) {
                safeLog('[studios] create error', e);
                try { _this.empty(); } catch (e2) {}
                return this.render();
            }
        };

        comp.onMore = function (data) {
            Lampa.Activity.push({
                url: data.url,
                params: data.params,
                title: data.title,
                component: 'studios_view',
                page: 1
            });
        };

        return comp;
    }

    function StudiosView(object) {
        var comp = new Lampa.InteractionCategory(object);
        var network = new Lampa.Reguest();

        function buildUrl(page) {
            var params = [];
            pushParam(params, 'api_key', Lampa.TMDB.key());
            pushParam(params, 'language', Lampa.Storage.get('language', 'ru'));
            pushParam(params, 'page', page);

            if (object.params) {
                for (var key in object.params) {
                    if (!object.params.hasOwnProperty(key)) continue;
                    var val = resolveValue(object.params[key]);
                    pushParam(params, key, val);
                }
            }

            return Lampa.TMDB.api(object.url + '?' + params.join('&'));
        }

        comp.create = function () {
            var _this = this;
            try {
                network.silent(buildUrl(1), function (json) {
                    _this.build(json);
                }, _this.empty.bind(_this));
            } catch (e) {
                safeLog('[studios] view create error', e);
                _this.empty();
            }
        };

        comp.nextPageReuest = function (obj, resolve, reject) {
            try {
                network.silent(buildUrl(obj.page), resolve, reject);
            } catch (e) {
                safeLog('[studios] nextPage error', e);
                reject();
            }
        };

        return comp;
    }

    // ------------------------------------------------------------
    // INJECTION (fail-safe + stable ordering)
    // ------------------------------------------------------------
    function tryStart() {
        try {
            if (window.plugin_studios_master_ready) return;
            if (!window.Lampa || !window.$) return; // wait until Lampa + jQuery exist

            window.plugin_studios_master_ready = true;

            Lampa.Component.add('studios_main', StudiosMain);
            Lampa.Component.add('studios_view', StudiosView);

            if (!$('#studios-unified-css').length) {
                $('body').append(
                    '<style id="studios-unified-css">' +
                    '.studios_main .card--wide{width:18.3em!important;}' +
                    '.studios_view .card--wide{width:18.3em!important;}' +
                    '.studios_view .category-full{padding-top:1em;}' +
                    '</style>'
                );
            }

            function addMenuButtons() {
                var menu = $('.menu .menu__list').eq(0);
                if (!menu.length) return;

                MENU_ORDER.forEach(function (sid) {
                    var conf = SERVICE_CONFIGS[sid];
                    if (!conf) return;

                    if (menu.find('.menu__item[data-sid="' + sid + '"]').length) return;

                    var btn = $(
                        '<li class="menu__item selector" data-sid="' + sid + '">' +
                        '  <div class="menu__ico">' + conf.icon + '</div>' +
                        '  <div class="menu__text">' + conf.title + '</div>' +
                        '</li>'
                    );

                    btn.on('hover:enter', function () {
                        Lampa.Activity.push({
                            title: conf.title,
                            component: 'studios_main',
                            service_id: sid,
                            page: 1
                        });
                    });

                    menu.append(btn);
                });
            }

            if (window.appready) addMenuButtons();
            else {
                Lampa.Listener.follow('app', function (e) {
                    if (e.type === 'ready') addMenuButtons();
                });
            }

            // menu может пересоздаваться — подстрахуемся мягким observer
            try {
                var obs = new MutationObserver(function () {
                    if (window.appready) addMenuButtons();
                });
                if (document.body) obs.observe(document.body, { childList: true, subtree: true });
            } catch (e) {}

        } catch (e) {
            // главное: НЕ валим Lampa
            safeLog('[studios] start error', e);
        }
    }

    // try now + retry a few times (safe)
    tryStart();
    var tries = 0;
    var t = setInterval(function () {
        tries++;
        tryStart();
        if (window.plugin_studios_master_ready || tries > 40) clearInterval(t);
    }, 250);

})();
