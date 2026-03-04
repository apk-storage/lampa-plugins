(function () {
    'use strict';

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

    var MENU_ORDER = ['netflix', 'apple', 'hbo', 'amazon', 'disney', 'hulu', 'paramount', 'syfy', 'educational_and_reality'];

    function init() {
        if (window.plugin_studios_ready) return;
        window.plugin_studios_ready = true;

        if (Lampa.SettingsApi) {
            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: { name: 'studios_display_type', type: 'select', values: { menu: 'Левое меню', home: 'Блоком на главной' }, default: 'menu' },
                field: { name: 'Отображение Студий', description: 'Где отображать иконки стриминг-сервисов' }
            });
        }

        function drawUI() {
            var mode = Lampa.Storage.get('studios_display_type', 'menu');
            
            if (mode === 'menu') {
                $('.studios-home-row').remove();
                var menu = $('.menu__list').first();
                if (menu.length) {
                    MENU_ORDER.forEach(function (sid) {
                        if (menu.find('[data-sid="' + sid + '"]').length) return;
                        var btn = $('<li class="menu__item selector" data-sid="' + sid + '"><div class="menu__ico">' + ICONS[sid] + '</div></li>');
                        btn.on('hover:enter', function () { 
                             Lampa.Activity.push({ component: 'studios_main', service_id: sid }); 
                        });
                        menu.append(btn);
                    });
                }
            } else {
                // ЛОГИКА ДЛЯ ГЛАВНОЙ CUB
                var active = $('.activity.active[data-component="main"]');
                if (active.length && !active.find('.studios-home-row').length) {
                    // Ищем ряд "Сейчас смотрят" по тексту заголовка
                    var firstRow = active.find('.card-line__title').filter(function() {
                        return $(this).text().indexOf('Сейчас смотрят') > -1;
                    }).closest('.card-line');

                    if (firstRow.length) {
                        var items = [];
                        MENU_ORDER.forEach(function (sid) { 
                            items.push({ title: sid.toUpperCase(), icon: ICONS[sid], service_id: sid }); 
                        });

                        var line = new Lampa.CardLine({ 
                            title: 'Киностудии', 
                            items: items, 
                            onSelect: function (d) { 
                                Lampa.Activity.push({ component: 'studios_main', service_id: d.service_id }); 
                            } 
                        });

                        var rendered = line.render();
                        rendered.addClass('studios-home-row');
                        firstRow.after(rendered);
                        
                        // Пробуем обновить навигацию через системный вызов
                        if (Lampa.Activity.active().toggle) Lampa.Activity.active().toggle();
                    }
                }
            }
        }

        setInterval(drawUI, 2000);
        
        $('body').append('<style>.studios-home-row{margin: 20px 0 !important;}.studios-home-row .card{width:11em!important; height:6em!important;}.studios-home-row .card__ico{display:flex; align-items:center; justify-content:center; height:100%; padding:15px; background: rgba(255,255,255,0.05); border-radius: 10px;}.studios-home-row .card.focus .card__ico{background: rgba(255,255,255,0.15); outline: 2px solid #fff;}</style>');
    }

    if (window.Lampa) init();
    else {
        var timer = setInterval(function() { if (window.Lampa) { clearInterval(timer); init(); } }, 500);
    }
})();
