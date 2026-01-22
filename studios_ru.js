(function () {
    'use strict';

    /**
     * STUDIOS MASTER (Unified)
     * Developed by: Syvyj
     * Version: 1.2.0-ru
     * Description: Unified studio collections for Lampa (Netflix, HBO, Disney+, etc.)
     */

    function currentDateYMD() {
        var d = new Date();
        return [d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2), ('0' + d.getDate()).slice(-2)].join('-');
    }

    function resolveValue(val) {
        if (val === '{current_date}') return currentDateYMD();
        return val;
    }

    function pushParam(params, key, val) {
        params.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(val)));
    }

    var SERVICE_CONFIGS = {
        netflix: {
            title: 'Netflix',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 2L16.5 22" stroke="#E50914" stroke-width="4"/><path d="M7.5 2L7.5 22" stroke="#E50914" stroke-width="4"/><path d="M7.5 2L16.5 22" stroke="#E50914" stroke-width="4"/></svg>',
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
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
            categories: []
        },

        amazon: {
            title: 'Prime Video',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M18.6 15.4c-1.9 1.5-4.6 2.3-7 2.3-3.3 0-6.2-1.2-8.5-3.2-.3-.2 0-.6.3-.4 2.5 1.4 5.6 2.3 8.7 2.3 2.1 0 4.4-.4 6.5-1.3.3-.1.6.2.3.3z"/>' +
            '<path d="M19.3 14.6c-.2-.3-1.3-.2-1.8-.1-.2 0-.2-.2-.1-.3.9-.6 2.4-.4 2.5-.2.2.2 0 1.7-.9 2.4-.1.1-.3 0-.2-.1.2-.5.6-1.5.4-1.7z"/>' +
            '</svg>',
            categories: []
        },

        disney: {
            title: 'Disney+',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M3.2 10.2c2.6-3.5 7.1-5.1 11.3-4.2 2.5.5 4.7 1.8 6.3 3.7.2.2 0 .5-.3.3-2-1.4-4.4-2.2-6.9-2.2-3.7 0-7.1 1.6-9.9 3.7-.3.2-.7-.1-.5-.3z"/>' +
            '<path d="M12.9 13.3h-1.8v3.1H8.1v1.8h3v3h1.8v-3h3v-1.8h-3v-3.1z"/>' +
            '</svg>',
            categories: []
        },

        hulu: {
            title: 'Hulu',
            icon: '<svg viewBox="0 0 24 24" fill="#3DBB3D"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>',
            categories: []
        },

        paramount: {
            title: 'Paramount+',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22H22L12 2ZM12 6.5L18.5 19.5H5.5L12 6.5Z"/></svg>',
            categories: []
        },

        syfy: {
            title: 'SYFY',
            icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>',
            categories: []
        },

        educational_and_reality: {
            title: 'Познавательное',
            icon: '<svg viewBox="0 0 24 24" fill="#FF9800"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2z"/></svg>',
            categories: []
        }
    };

    function startPlugin() {
        if (window.plugin_studios_master_ready) return;
        window.plugin_studios_master_ready = true;

        function addMenuButtons() {
            var menu = $('.menu .menu__list').eq(0);
            if (!menu.length) return;

            Object.keys(SERVICE_CONFIGS).forEach(function (sid) {
                var conf = SERVICE_CONFIGS[sid];
                if (menu.find('[data-sid="' + sid + '"]').length) return;

                var btn = $(
                    '<li class="menu__item selector" data-sid="' + sid + '">' +
                    '<div class="menu__ico">' + conf.icon + '</div>' +
                    '<div class="menu__text">' + conf.title + '</div>' +
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
    }

    if (!window.plugin_studios_master_ready) startPlugin();
})();
