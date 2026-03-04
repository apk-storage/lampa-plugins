(function () {
    'use strict';

    // 1. НАПОЛНЕНИЕ (ТВОИ ОРИГИНАЛЬНЫЕ SVG И КОНФИГИ)
    var ICONS = {
        netflix: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 2L16.5 22" stroke="#E50914" stroke-width="4"/><path d="M7.5 2L7.5 22" stroke="#E50914" stroke-width="4"/><path d="M7.5 2L16.5 22" stroke="#E50914" stroke-width="4"/></svg>',
        apple: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
        hbo: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.042 16.896H4.414v-3.754H2.708v3.754H.01L0 7.22h2.708v3.6h1.706v-3.6h2.628zm12.043.046C21.795 16.94 24 14.689 24 11.978a4.89 4.89 0 0 0-4.915-4.92c-2.707-.002-4.09 1.991-4.432 2.795.003-1.207-1.187-2.632-2.58-2.634H7.59v9.674l4.181.001c1.686 0 2.886-1.46 2.888-2.713.385.788 1.72 2.762 4.427 2.76zm-7.665-3.936c.387 0 .692.382.692.817 0 .435-.305.817-.692.817h-1.33v-1.634zm.005-3.633c.387 0 .692.382.692.817 0 .436-.305.818-.692.818h-1.33V9.373zm1.77 2.607c.305-.039.813-.387.992-.61-.063.276-.068 1.074.006 1.35-.204-.314-.688-.701-.998-.74zm3.43 0a2.462 2.462 0 1 1 4.924 0 2.462 2.462 0 0 1-4.925 0zm2.462 1.936a1.936 1.936 0 1 0 0-3.872 1.936 1.936 0 0 0 0 3.872z"/></svg>',
        amazon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4.2 14.2c3.7 2.6 11.9 2.6 15.6 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M18.9 13.3l2.6 1.0-2.6 1.0c.3-.6.3-1.4 0-2.0z" fill="currentColor"/></svg>',
        disney: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3.2 9.8c2.7-3.3 7.1-5 11.3-4.1 2.5.5 4.7 1.8 6.3 3.6.3.3-.1.8-.5.5-1.9-1.2-4.2-1.9-6.6-1.9-3.6 0-6.9 1.4-9.6 3.4-.4.3-1-.1-.9-.5z"/><path d="M12 12.2c.6 0 1 .4 1 1v2.3h2.3c.6 0 1 .4 1 1s-.4 1-1 1H13v2.3c0 .6-.4 1-1 1s-1-.4-1-1v-2.3H8.7c-.6 0-1-.4-1-1s.4-1 1-1H11v-2.3c0-.6.4-1 1-1z"/></svg>',
        hulu: '<svg viewBox="0 0 24 24" fill="#3DBB3D" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>',
        paramount: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 22H22L12 2ZM12 6.5L18.5 19.5H5.5L12 6.5Z"/></svg>',
        syfy: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>',
        edu: '<svg viewBox="0 0 24 24" fill="#FF9800" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>'
    };

    var SERVICE_CONFIGS = {
        netflix: { title: 'Netflix', icon: ICONS.netflix, categories: [{ title: 'Netflix: Новые фильмы', url: 'discover/movie', params: { with_watch_providers: '8', watch_region: 'UA', sort_by: 'primary_release_date.desc', 'primary_release_date.lte': '{current_date}', 'vote_count.gte': '5' } }, { title: 'Netflix: Новые сериалы', url: 'discover/tv', params: { with_networks: '213', sort_by: 'first_air_date.desc', 'first_air_date.lte': '{current_date}', 'vote_count.gte': '5' } }, { title: 'K-Wave: Хиты Кореи', url: 'discover/tv', params: { with_networks: '213', with_original_language: 'ko', 'vote_average.gte': '7.0', sort_by: 'popularity.desc' } }, { title: 'True Crime: Расследования', url: 'discover/tv', params: { with_networks: '213', with_genres: '99', with_keywords: '10714|210350', sort_by: 'popularity.desc' } }] },
        apple: { title: 'Apple TV+', icon: ICONS.apple, categories: [{ title: 'Apple: Новинки', url: 'discover/movie', params: { with_watch_providers: '350', watch_region: 'UA', sort_by: 'primary_release_date.desc', 'primary_release_date.lte': '{current_date}', 'vote_count.gte': '5' } }, { title: 'Миры будущего (Sci-Fi)', url: 'discover/tv', params: { with_watch_providers: '350', watch_region: 'UA', with_genres: '10765', sort_by: 'vote_average.desc', 'vote_count.gte': '100' } }] },
        hbo: { title: 'HBO', icon: ICONS.hbo, categories: [{ title: 'HBO: Новинки Max', url: 'discover/tv', params: { with_networks: '49|3186', sort_by: 'first_air_date.desc', 'first_air_date.lte': '{current_date}', 'vote_count.gte': '5' } }, { title: 'Легенды HBO (ТОП 8.5+)', url: 'discover/tv', params: { with_networks: '49', 'vote_average.gte': '8.5', 'vote_count.gte': '1000', sort_by: 'vote_average.desc' } }, { title: 'Вселенная DC (Комиксы)', url: 'discover/movie', params: { with_companies: '174', with_keywords: '9715|180802', sort_by: 'release_date.desc' } }] },
        amazon: { title: 'Prime Video', icon: ICONS.amazon, categories: [{ title: 'Prime: Новинки', url: 'discover/tv', params: { with_networks: '1024', sort_by: 'first_air_date.desc', 'first_air_date.lte': '{current_date}' } }, { title: 'MGM: Золотой фонд', url: 'discover/movie', params: { with_companies: '21', sort_by: 'popularity.desc', 'vote_count.gte': '500' } }] },
        disney: { title: 'Disney+', icon: ICONS.disney, categories: [{ title: 'Disney+: Новинки', url: 'discover/movie', params: { with_companies: '2|3475', sort_by: 'primary_release_date.desc', 'primary_release_date.lte': '{current_date}', 'vote_count.gte': '20' } }, { title: 'Star Wars: Коллекция', url: 'discover/movie', params: { with_companies: '1', with_text_query: 'Star Wars', sort_by: 'release_date.desc', 'vote_count.gte': '20' } }, { title: 'Marvel: Киновселенная', url: 'discover/movie', params: { with_keywords: '180547|290666', sort_by: 'primary_release_date.desc', 'vote_count.gte': '50' } }, { title: 'Pixar: Мультфильмы', url: 'discover/movie', params: { with_companies: '3', sort_by: 'popularity.desc', 'vote_count.gte': '100' } }, { title: 'Disney: Золотая классика', url: 'discover/movie', params: { with_companies: '2', with_genres: '16', sort_by: 'vote_average.desc', 'vote_count.gte': '1000' } }, { title: '20th Century Studios (Star)', url: 'discover/movie', params: { with_companies: '25', sort_by: 'popularity.desc', 'vote_count.gte': '200' } }] },
        hulu: { title: 'Hulu', icon: ICONS.hulu, categories: [{ title: 'Hulu Originals: Тренды', url: 'discover/tv', params: { with_networks: '453', sort_by: 'popularity.desc' } }] },
        paramount: { title: 'Paramount+', icon: ICONS.paramount, categories: [{ title: 'Paramount+ Originals', url: 'discover/tv', params: { with_networks: '4330', sort_by: 'popularity.desc' } }, { title: 'Вселенная Йеллоустоун', url: 'discover/tv', params: { with_networks: '318|4330', with_genres: '37,18', sort_by: 'popularity.desc' } }] },
        syfy: { title: 'SYFY', icon: ICONS.syfy, categories: [{ title: 'Хиты телеканала Syfy', url: 'discover/tv', params: { with_networks: '77', sort_by: 'popularity.desc' } }] },
        educational_and_reality: { title: 'Познавательное', icon: ICONS.edu, categories: [{ title: 'Discovery Channel', url: 'discover/tv', params: { with_networks: '64', sort_by: 'popularity.desc' } }, { title: 'National Geographic', url: 'discover/tv', params: { with_networks: '43', sort_by: 'popularity.desc' } }, { title: 'BBC Earth', url: 'discover/tv', params: { with_networks: '4', with_genres: '99', sort_by: 'vote_average.desc' } }] }
    };

    var MENU_ORDER = ['netflix', 'apple', 'hbo', 'amazon', 'disney', 'hulu', 'paramount', 'syfy', 'educational_and_reality'];

    // 2. ВНУТРЕННЯЯ ЛОГИКА ( InteractionMain и InteractionCategory )
    function StudiosMain(object) {
        var comp = new Lampa.InteractionMain(object);
        var config = SERVICE_CONFIGS[object.service_id];
        comp.create = function () {
            var _this = this;
            try {
                this.activity.loader(true);
                var categories = config.categories;
                var network = new Lampa.Reguest();
                var status = new Lampa.Status(categories.length);
                status.onComplite = function () {
                    var fulldata = [];
                    Object.keys(status.data).sort(function (a, b) { return a - b; }).forEach(function (key) {
                        var data = status.data[key];
                        if (data && data.results && data.results.length) {
                            var cat = categories[parseInt(key, 10)];
                            Lampa.Utils.extendItemsParams(data.results, { style: { name: 'wide' } });
                            fulldata.push({ title: cat.title, results: data.results, url: cat.url, params: cat.params, service_id: object.service_id });
                        }
                    });
                    if (fulldata.length) { _this.build(fulldata); _this.activity.loader(false); } else { _this.empty(); }
                };
                categories.forEach(function (cat, index) {
                    var params = ['api_key=' + Lampa.TMDB.key(), 'language=' + Lampa.Storage.get('language', 'ru')];
                    if (cat.params) {
                        for (var key in cat.params) {
                            var val = cat.params[key] === '{current_date}' ? (new Date().toISOString().split('T')[0]) : cat.params[key];
                            params.push(key + '=' + val);
                        }
                    }
                    network.silent(Lampa.TMDB.api(cat.url + '?' + params.join('&')), function (json) { status.append(index.toString(), json); }, function () { status.error(); });
                });
                return this.render();
            } catch (e) { return _this.render(); }
        };
        comp.onMore = function (data) { Lampa.Activity.push({ url: data.url, params: data.params, title: data.title, component: 'studios_view', page: 1 }); };
        return comp;
    }

    function StudiosView(object) {
        var comp = new Lampa.InteractionCategory(object);
        var network = new Lampa.Reguest();
        comp.create = function () {
            var params = ['api_key=' + Lampa.TMDB.key(), 'language=' + Lampa.Storage.get('language', 'ru'), 'page=1'];
            if (object.params) for (var key in object.params) params.push(key + '=' + object.params[key]);
            network.silent(Lampa.TMDB.api(object.url + '?' + params.join('&')), function (json) { comp.build(json); }, comp.empty.bind(comp));
        };
        comp.nextPageReuest = function (obj, resolve, reject) {
            var params = ['api_key=' + Lampa.TMDB.key(), 'language=' + Lampa.Storage.get('language', 'ru'), 'page=' + obj.page];
            if (object.params) for (var key in object.params) params.push(key + '=' + object.params[key]);
            network.silent(Lampa.TMDB.api(object.url + '?' + params.join('&')), resolve, reject);
        };
        return comp;
    }

    // 3. ИНИЦИАЛИЗАЦИЯ И ИСПРАВЛЕННАЯ ИНТЕГРАЦИЯ
    function init() {
        if (window.plugin_studios_master_ready) return;
        window.plugin_studios_master_ready = true;

        Lampa.Component.add('studios_main', StudiosMain);
        Lampa.Component.add('studios_view', StudiosView);

        Lampa.ContentRows.add({
            name: 'studios_row',
            title: 'Киностудии',
            index: 1,
            screen: ['main'],
            call: function(params, screen) {
                return function(call) {
                    var items = [];
                    MENU_ORDER.forEach(function (sid) {
                        var c = SERVICE_CONFIGS[sid];
                        items.push({ title: c.title, icon: c.icon, service_id: sid });
                    });

                    items.forEach(item=>{
                        item.params = {
                            style: {
                                name: 'collection'
                            },
                            // ИСПРАВЛЕНИЕ: Внедряем SVG через принудительный рендеринг и CSS класс
                            createInstance: function(item){ 
                                var card = Lampa.Maker.make('Card', item, (module)=>module.only('Card','Style','Callback'));
                                var html = card.render();
                                // Добавляем иконку в контейнер вручную, игнорируя системные заглушки
                                html.find('.card__ico').append('<div class="studio-logo">' + item.icon + '</div>');
                                return card;
                            },
                            emit: {
                                onlyEnter: function(){
                                    Lampa.Activity.push({ title: item.title, component: 'studios_main', service_id: item.service_id });
                                }
                            }
                        }
                    })

                    call({
                        results: items,
                        title: 'Киностудии'
                    });
                };
            }
        });
       
        // ЛЕВОЕ МЕНЮ
        function addMenu() {
            var menu = $('.menu__list').first();
            if (!menu.length) return;
            MENU_ORDER.forEach(function (sid) {
                if (menu.find('[data-sid="' + sid + '"]').length) return;
                var c = SERVICE_CONFIGS[sid];
                var btn = $('<li class="menu__item selector" data-sid="' + sid + '"><div class="menu__ico">' + c.icon + '</div><div class="menu__text">' + c.title + '</div></li>');
                btn.on('hover:enter', function () { Lampa.Activity.push({ title: c.title, component: 'studios_main', service_id: sid }); });
                menu.append(btn);
            });
        }

        if (window.appready) addMenu();
        else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') addMenu(); });

        // УЛУЧШЕННЫЕ СТИЛИ (убирают пустые заглушки и центрируют иконки)
        $('body').append('<style>.studios_row .card{width:11em!important; height:6em!important;}.studios_row .card__ico{background: rgba(255,255,255,0.05); border-radius: 10px; display:flex!important; align-items:center!important; justify-content:center!important; position:relative; overflow:hidden;}.studios_row .card__ico:before{display:none!important;} .studio-logo{width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:10px;} .studio-logo svg{width:80%; height:80%; max-width: 100px;} .studios_row .card.focus .card__ico{background: rgba(255,255,255,0.15); border: 2px solid #fff;}</style>');
    }

    if (window.Lampa) init();
    else { var timer = setInterval(function () { if (window.Lampa) { clearInterval(timer); init(); } }, 500); }
})();
