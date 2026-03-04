(function () {
    'use strict';
    var d = document.createElement('div');
    d.style = 'position:fixed;top:40px;left:10px;z-index:9999;background:rgba(0,0,0,0.9);color:cyan;padding:10px;font-size:11px;border:1px solid cyan;max-width:400px;opacity:0.9;pointer-events:none;';
    document.body.appendChild(d);

    function probe() {
        var active = $('.activity.active');
        var report = '<b>Structural Probe</b><br>';
        report += 'Component: ' + (Lampa.Activity.active() ? Lampa.Activity.active().component : 'none') + '<br>';

        // Ищем заголовок "Сейчас смотрят" и смотрим на его окружение
        var titleElem = active.find('div, h1, h2, span').filter(function() {
            return $(this).text().trim() === 'Сейчас смотрят';
        }).first();

        if (titleElem.length) {
            report += '<span style="color:lime">Target Found!</span><br>';
            report += 'Elem Class: .' + (titleElem.attr('class') || 'no-class') + '<br>';
            
            // Анализируем родителей (цепочку контейнеров)
            var parents = [];
            titleElem.parents().slice(0, 4).each(function() {
                var cls = $(this).attr('class') ? '.' + $(this).attr('class').split(' ').join('.') : 'div';
                parents.push(cls);
            });
            report += 'DOM Path: ' + parents.reverse().join(' > ') + '<br>';
        } else {
            report += '<span style="color:red">Target "Сейчас смотрят" NOT found</span><br>';
        }

        d.innerHTML = report;
    }
    setInterval(probe, 2000);
})();
