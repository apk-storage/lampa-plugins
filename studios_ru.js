(function () {
    'use strict';

    // Создаем отладочное табло, чтобы видеть лог прямо на ТВ
    var debugDiv = document.createElement('div');
    debugDiv.style = 'position:fixed;top:10px;right:10px;z-index:9999;background:black;color:lime;padding:10px;font-size:12px;border:1px solid lime;max-width:300px;word-break:break-all;opacity:0.8;';
    debugDiv.innerHTML = 'Diagnostic Start...<br>';
    document.body.appendChild(debugDiv);

    function log(msg) {
        debugDiv.innerHTML += msg + '<br>';
    }

    function scan() {
        // 1. Проверяем объект Lampa
        if (!window.Lampa) { log('Error: Lampa not found'); return; }
        log('Lampa object: OK');

        // 2. Ищем меню
        var menu = $('.menu__list, .nav-list, [data-component="menu"]').first();
        if (menu.length) {
            log('Menu found: OK');
            if (!$('#diag_btn').length) {
                menu.append('<li class="menu__item selector" id="diag_btn"><div class="menu__text">ТЕСТ СТУДИИ</div></li>');
            }
        } else {
            log('Menu: NOT FOUND');
        }

        // 3. Ищем активный компонент главной страницы
        var active = Lampa.Activity ? Lampa.Activity.active() : null;
        if (active) {
            log('Active component: ' + active.component);
            if (active.component === 'main') {
                // Пытаемся найти ЛЮБОЙ div внутри активной страницы
                var container = $('.activity.active').find('div').filter(function() {
                    return $(this).children().length > 3; // Ищем длинные ряды
                }).first();
                
                if (container.length) {
                    log('Home Container: OK');
                    if (!$('#diag_home').length) {
                        container.prepend('<div id="diag_home" style="padding:20px;background:blue;color:white;">БЛОК НАЙДЕН</div>');
                    }
                } else {
                    log('Home Container: NOT FOUND');
                }
            }
        } else {
            log('Activity: NOT READY');
        }
    }

    // Запускаем сканер каждые 2 секунды
    var timer = setInterval(scan, 2000);
    
    // Самоуничтожение через 30 секунд, чтобы не грузить систему
    setTimeout(function() { clearInterval(timer); log('Scan finished.'); }, 30000);
})();
