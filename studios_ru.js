(function () {
    'use strict';
    
    // Простейшая проверка: выведет сообщение в консоль (если есть доступ)
    console.log('Studios Plugin: Start Diagnostic');

    function init() {
        if (window.plugin_diag_ready) return;
        window.plugin_diag_ready = true;

        // 1. Прямая вставка в меню без условий
        var menu = $('.menu .menu__list').eq(0);
        if (menu.length) {
            menu.append('<li class="menu__item selector" id="diag_test"><div class="menu__text">ТЕСТ СТУДИИ</div></li>');
        }

        // 2. Попытка найти контейнер главной страницы через 3 секунды
        setTimeout(function() {
            var home = $('.activity.active .items, .activity.active .scroll__content').first();
            if (home.length) {
                home.prepend('<div class="studios-home-row" style="padding: 20px; background: red; color: white; text-align: center; font-size: 20px;">БЛОК ДИАГНОСТИКИ ЗДЕСЬ</div>');
            }
        }, 3000);
    }

    // Безопасный запуск без интервалов
    if (window.Lampa) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            if (window.Lampa) init();
        });
    }
})();
