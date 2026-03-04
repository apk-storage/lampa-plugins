(function () {
    'use strict';
    var debug = document.createElement('div');
    debug.style = 'position:fixed;top:10px;right:10px;z-index:9999;background:black;color:lime;padding:10px;font-size:10px;border:1px solid lime;max-width:350px;opacity:0.9;';
    document.body.appendChild(debug);

    function scan() {
        var active = $('.activity.active');
        var out = '<b>Diagnostic Mode</b><br>';
        out += 'Active Component: ' + (Lampa.Activity ? Lampa.Activity.active().component : 'none') + '<br>';
        
        // Ищем все заголовки на странице, чтобы понять их реальный класс
        var titles = [];
        active.find('div').each(function() {
            var txt = $(this).text().trim();
            if (txt.indexOf('Сейчас смотрят') > -1) {
                titles.push('Found Title Class: .' + $(this).attr('class'));
            }
        });
        
        // Ищем родительские контейнеры
        var containers = [];
        active.find('.card').first().parents('div').slice(0, 3).each(function() {
            containers.push('Parent Class: .' + $(this).attr('class'));
        });

        debug.innerHTML = out + titles.join('<br>') + '<br>' + containers.join('<br>');
    }
    setInterval(scan, 3000);
})();
