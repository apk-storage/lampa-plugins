(function () {
    'use strict';

    // Console+ — улучшенная отладочная консоль Lampa (плагин). v0.2
    // Категории слева (на ТВ — колонка под пульт, на телефоне — лента снизу),
    // сводка сверху, список справа, отдельная вкладка «Запросы» с кодом и скоростью ответа.
    // Данные логов берём из стандартной Lampa.Console.export(); сетевые запросы меряем сами
    // (перехват XHR/fetch) — в export() времени ответа нет, а это главное, что просили.
    // Поверх базовой консоли добавлено: автодиагноз сверху (самый медленный/медиана/ошибки),
    // сортировка запросов по скорости и показ ВИСЯЩИХ запросов (pending) живьём.
    // Открывается штатно: Настройки → Остальное → Консоль (подменяет контроллер 'console').
    if (window.console_plus_plugin) return;
    window.console_plus_plugin = true;

    var PAGE = 300, NET_MAX = 250, PENDING_MAX = 60;
    var html, scroll_side, scroll_list;
    var records = [], net = [], pending = [];
    var filter = 'all';
    var net_sort = 'time';        // 'time' — по времени (новые сверху), 'slow' — по скорости ответа
    var from_controller = '';
    var refresh_timer;
    var shown_count = 0;
    var last_count = -1; // сколько записей было в ленте на момент последней отрисовки

    var LEVEL_TITLE = { log: 'Событие', warn: 'Предупреждение', error: 'Ошибка' };

    // ---------- перехват сети (свой замер времени ответа) ----------
    function nid() { return 'n' + (Date.now().toString(36)) + Math.random().toString(36).slice(2, 6); }
    function pushNet(r) {
        r.id = r.id || nid();
        r.level = (r.status === 0 || r.status >= 500) ? 'error' : (r.status >= 400 ? 'warn' : 'log');
        net.unshift(r);
        if (net.length > NET_MAX) net.pop();
    }
    function addPending(p) { pending.unshift(p); if (pending.length > PENDING_MAX) pending.pop(); }
    function donePending(id) { for (var i = 0; i < pending.length; i++) if (pending[i].id === id) { pending.splice(i, 1); return; } }
    try {
        var _open = XMLHttpRequest.prototype.open, _send = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (m, u) { try { this.__m = m; this.__u = u; } catch (e) {} return _open.apply(this, arguments); };
        XMLHttpRequest.prototype.send = function () {
            var x = this, t0 = Date.now(), id = nid();
            try { addPending({ id: id, method: x.__m || 'GET', url: x.__u || '', t: t0 }); } catch (e) {}
            try { x.addEventListener('loadend', function () { try { donePending(id); pushNet({ id: id, method: x.__m || 'GET', url: x.__u || '', status: x.status, ms: Date.now() - t0, t: t0 }); } catch (e) {} }); } catch (e) {}
            return _send.apply(this, arguments);
        };
    } catch (e) {}
    try {
        if (window.fetch) {
            var _f = window.fetch;
            window.fetch = function (input, init) {
                var t0 = Date.now(), id = nid();
                var u = typeof input === 'string' ? input : (input && input.url) || '';
                var m = (init && init.method) || (input && input.method) || 'GET';
                try { addPending({ id: id, method: m, url: u, t: t0 }); } catch (e) {}
                return _f.apply(this, arguments).then(function (res) {
                    try { donePending(id); pushNet({ id: id, method: m, url: u, status: res.status, ms: Date.now() - t0, t: t0 }); } catch (e) {}
                    return res;
                }, function (err) {
                    try { donePending(id); pushNet({ id: id, method: m, url: u, status: 0, ms: Date.now() - t0, t: t0 }); } catch (e) {}
                    throw err;
                });
            };
        }
    } catch (e) {}

    // ---------- данные логов ----------
    function unescapeEntities(str) {
        return String(str).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
    }
    function partsToText(parts) {
        if (!Array.isArray(parts)) parts = [parts];
        return parts.map(function (p) { return unescapeEntities(p == null ? '' : p); }).join(' ').replace(/<br\s*\/?>/gi, '\n');
    }
    function collect() {
        var data = {};
        try { data = Lampa.Console.export() || {}; } catch (e) { data = {}; }
        var errors = data.Errors || [], warnings = data.Warnings || [];
        var errMsgs = errors.map(function (r) { return r.message; });
        var warnMsgs = warnings.map(function (r) { return r.message; });
        var matched = [], list = [];
        Object.keys(data).forEach(function (name) {
            if (name == 'Errors' || name == 'Warnings') return;
            (data[name] || []).forEach(function (item) {
                var level = 'log';
                if (errMsgs.indexOf(item.message) >= 0) level = 'error';
                else if (warnMsgs.indexOf(item.message) >= 0) level = 'warn';
                if (level != 'log') matched.push(item.message);
                var parts = Array.isArray(item.message) ? item.message.slice() : [item.message];
                if (name != 'Other' && parts.length > 1) parts.shift();
                list.push({ time: item.time, name: name, level: level, text: partsToText(parts) });
            });
        });
        [[errors, 'error', 'Errors'], [warnings, 'warn', 'Warnings']].forEach(function (set) {
            set[0].forEach(function (item) {
                if (matched.indexOf(item.message) >= 0) return;
                list.push({ time: item.time, name: set[2], level: set[1], text: partsToText(item.message) });
            });
        });
        list.sort(function (a, b) { return b.time - a.time; });
        return list;
    }
    function count(level) { return records.filter(function (r) { return r.level == level; }).length; }
    function netCount(level) { return net.filter(function (r) { return r.level == level; }).length; }

    function categories() {
        var names = {};
        records.forEach(function (r) { names[r.name] = (names[r.name] || 0) + 1; });
        var cats = [
            { key: 'all', title: 'Все события', count: records.length, type: 'all' },
            { key: 'net', title: 'Запросы', count: net.length, type: 'net' },
            { key: 'error', title: 'Ошибки', count: count('error') + netCount('error'), type: 'error' },
            { key: 'warn', title: 'Предупреждения', count: count('warn') + netCount('warn'), type: 'warn' }
        ];
        Object.keys(names).sort(function (a, b) { return names[b] - names[a]; }).forEach(function (n) {
            cats.push({ key: 'name:' + n, title: n, count: names[n], type: 'tag' });
        });
        return cats;
    }
    function netAsRecords(level) {
        return net.filter(function (r) { return r.level == level; }).map(function (q) {
            return { time: q.t, name: 'Request', level: q.level, text: q.method + ' ' + statusText(q.status) + ' · ' + q.url };
        });
    }
    function filtered() {
        if (filter == 'net') return [];
        if (filter == 'all') return records;
        if (filter == 'error' || filter == 'warn') {
            var l = records.filter(function (r) { return r.level == filter; }).concat(netAsRecords(filter));
            l.sort(function (a, b) { return b.time - a.time; });
            return l;
        }
        var n = filter.slice(5);
        return records.filter(function (r) { return r.name == n; });
    }
    function filteredNet() {
        var list = (filter == 'error' || filter == 'warn') ? net.filter(function (r) { return r.level == filter; }) : net.slice();
        if (net_sort == 'slow') list.sort(function (a, b) { return b.ms - a.ms; });
        return list;
    }
    // сводка по запросам для строки-диагноза: самый медленный, медиана, число ошибок
    function netDiag() {
        if (!net.length) return null;
        var done = net.filter(function (r) { return r.status !== 0 || r.ms < 7000; });
        var slow = net.reduce(function (a, b) { return b.ms > a.ms ? b : a; }, net[0]);
        var msArr = net.map(function (r) { return r.ms; }).sort(function (a, b) { return a - b; });
        var median = msArr[Math.floor(msArr.length / 2)] || 0;
        var errors = net.filter(function (r) { return r.level == 'error' || r.level == 'warn'; }).length;
        return { slow: slow, median: median, errors: errors, pending: pending.length };
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function timeText(t) { var d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
    function shortText(str, len) { str = String(str); return str.length > len ? str.slice(0, len - 1) + '…' : str; }
    function statusText(s) { return s === 0 ? 'нет связи' : s; }
    function msColor(ms) { return ms >= 700 ? 'var(--cp-err)' : ms >= 250 ? 'var(--cp-warn)' : 'var(--cp-ok)'; }
    function plainLine(r) { return timeText(r.time) + ' [' + LEVEL_TITLE[r.level] + '] ' + r.name + ': ' + r.text; }

    function copy(text) {
        function ok() { try { Lampa.Noty.show('Скопировано в буфер обмена'); } catch (e) {} }
        function fail() { try { Lampa.Noty.show('Не удалось скопировать'); } catch (e) {} }
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok, fail); return; }
        try { var area = $('<textarea style="position:fixed;left:-9999px;top:0"></textarea>').val(text).appendTo('body'); area[0].select(); document.execCommand('copy') ? ok() : fail(); area.remove(); } catch (e) { fail(); }
    }

    // ---------- отрисовка ----------
    function el(tag, cls, text) { var e = $('<' + tag + '></' + tag + '>'); if (cls) e.addClass(cls); if (text != null) e.text(text); return e; }

    function drawStats() {
        var box = html.find('.cp__stats').empty();
        [['error', count('error') + netCount('error'), 'Ошибки'], ['warn', count('warn') + netCount('warn'), 'Предупр.'], ['net', net.length, 'Запросов'], ['total', records.length, 'Событий']]
            .forEach(function (s) {
                var stat = el('div', 'cp__stat cp__stat--' + s[0] + (s[1] ? '' : ' cp__stat--empty'));
                stat.append(el('div', 'cp__stat-count', s[1]));
                stat.append(el('div', 'cp__stat-title', s[2]));
                box.append(stat);
            });
    }

    function drawSide() {
        var cats = categories();
        if (!cats.some(function (c) { return c.key == filter; })) filter = 'all';
        scroll_side.clear(); scroll_side.reset();
        cats.forEach(function (c) {
            var item = el('div', 'cp__cat selector cp__cat--' + c.type + (c.key == filter ? ' cp__cat--active' : ''));
            item.attr('data-key', c.key);
            item.append(el('div', 'cp__cat-dot'));
            item.append(el('div', 'cp__cat-name', shortText(c.title, 20)));
            item.append(el('div', 'cp__cat-count', c.count));
            item.on('hover:focus', function (e) { scroll_side.update($(e.target)); });
            item.on('hover:enter', function () { select(c.key); Lampa.Controller.toggle('cpconsole-list'); });
            scroll_side.append(item);
        });
    }
    function select(key) {
        filter = key;
        html.find('.cp__cat').removeClass('cp__cat--active');
        html.find('.cp__cat').filter(function () { return $(this).attr('data-key') == key; }).addClass('cp__cat--active');
        drawList();
    }

    function drawList() {
        scroll_list.clear(); scroll_list.reset();
        last_count = (filter == 'net') ? (net.length + pending.length) : records.length;
        if (filter == 'net') { shown_count = net.length; return drawNet(); }
        shown_count = records.length;

        var list = filtered();
        if (!list.length) return drawEmpty();
        list.slice(0, PAGE).forEach(function (r) {
            var line = el('div', 'cp__line selector cp__line--' + r.level);
            line.append(el('div', 'cp__line-time', timeText(r.time)));
            var txt = el('div', 'cp__line-text');
            if (r.level != 'log') txt.append(el('span', 'cp__badge', r.level == 'error' ? 'ошибка' : 'предупр.'));
            txt.append(el('span', 'cp__nm', r.name + ': '));
            txt.append(document.createTextNode(shortText(r.text.replace(/\s+/g, ' '), 600)));
            line.append(txt);
            line.on('hover:focus', function (e) { scroll_list.update($(e.target)); });
            line.on('hover:enter', function () { detail(r); });
            scroll_list.append(line);
        });
        if (list.length > PAGE) scroll_list.append(el('div', 'cp__more', 'Показаны последние ' + PAGE + ' из ' + list.length));
    }

    function drawNet() {
        var list = filteredNet();
        if (!net.length && !pending.length) { scroll_list.append(netEmpty()); return; }

        // строка-диагноз: сразу видно виновника, не листая
        var d = netDiag();
        if (d) {
            var parts = ['медленный: ' + shortText(d.slow.url, 46) + ' · ' + (d.slow.ms >= 8000 ? 'таймаут' : d.slow.ms + 'мс'), 'медиана ' + d.median + 'мс'];
            if (d.errors) parts.push('ошибок ' + d.errors);
            if (d.pending) parts.push('висит ' + d.pending);
            scroll_list.append(el('div', 'cp__diag', '⏱ ' + parts.join('   ·   ')));
        }

        // переключатель сортировки (фокусируется пультом)
        if (net.length) {
            var sortPill = el('div', 'cp__sort selector', net_sort == 'slow' ? '⇅ Сначала самые медленные' : '🕐 Сначала новые');
            sortPill.on('hover:focus', function (e) { scroll_list.update($(e.target)); });
            sortPill.on('hover:enter', function () {
                net_sort = (net_sort == 'slow' ? 'time' : 'slow');
                drawList();
                Lampa.Controller.collectionSet(scroll_list.render());
                Lampa.Controller.collectionFocus(scroll_list.render().find('.cp__sort')[0], scroll_list.render());
            });
            scroll_list.append(sortPill);
        }

        var head = el('div', 'cp__req cp__req--head');
        ['Время', 'Код', 'Запрос', 'Ответ'].forEach(function (h) { head.append(el('div', null, h)); });
        scroll_list.append(head);

        // висящие запросы живьём — всегда сверху таблицы, со счётчиком «висит Nс»
        var now = Date.now();
        pending.slice(0, 20).forEach(function (p) {
            var sec = Math.round((now - p.t) / 1000);
            var prow = el('div', 'cp__req cp__req--pending selector');
            prow.append(el('div', 'cp__rtime', timeText(p.t)));
            prow.append(el('div', 'cp__status cp__spend', '•••'));
            var pu = el('div', 'cp__rurl'); pu.append(el('span', 'cp__meth', p.method)); pu.append(document.createTextNode(shortText(p.url, 90))); prow.append(pu);
            var pms = el('div', 'cp__rms'); pms.append(el('b', 'cp__pend-t', 'висит ' + sec + 'с')); prow.append(pms);
            prow.on('hover:focus', function (e) { scroll_list.update($(e.target)); });
            prow.on('hover:enter', function () { netDetail({ method: p.method, url: p.url, status: '…', ms: Math.round((Date.now() - p.t) / 1000) * 1000, t: p.t }); });
            scroll_list.append(prow);
        });

        list.slice(0, PAGE).forEach(function (q) {
            var row = el('div', 'cp__req selector cp__req--' + q.level);
            row.append(el('div', 'cp__rtime', timeText(q.t)));
            row.append(el('div', 'cp__status cp__s' + String(statusText(q.status)).toString().charAt(0), String(statusText(q.status))));
            var u = el('div', 'cp__rurl'); u.append(el('span', 'cp__meth', q.method)); u.append(document.createTextNode(shortText(q.url, 90))); row.append(u);
            var ms = el('div', 'cp__rms');
            var track = el('span', 'cp__bar'); var fill = el('i'); fill.css({ width: Math.min(100, Math.round(q.ms / 12)) + '%', background: msColor(q.ms) }); track.append(fill);
            ms.append(track); ms.append(el('b', null, q.ms >= 8000 ? 'таймаут' : q.ms + ' ms')); row.append(ms);
            row.on('hover:focus', function (e) { scroll_list.update($(e.target)); });
            row.on('hover:enter', function () { netDetail(q); });
            scroll_list.append(row);
        });
        if (list.length > PAGE) scroll_list.append(el('div', 'cp__more', 'Показаны последние ' + PAGE + ' из ' + list.length));
    }

    function drawEmpty() {
        var empty = el('div', 'cp__empty');
        empty.append(el('div', 'cp__empty-title', 'Здесь пока пусто'));
        empty.append(el('div', 'cp__empty-descr', 'Записи появятся, как только приложение что-то сделает'));
        scroll_list.append(empty);
    }
    function netEmpty() {
        var empty = el('div', 'cp__empty');
        empty.append(el('div', 'cp__empty-title', 'Запросов ещё не было'));
        empty.append(el('div', 'cp__empty-descr', 'Открой карточку или онлайн — здесь появятся запросы со временем ответа'));
        return empty;
    }

    function detail(r) {
        var box = el('div', 'cp-detail');
        box.append(el('div', 'cp-detail__meta', timeText(r.time) + ' · ' + LEVEL_TITLE[r.level] + ' · ' + r.name));
        box.append(el('pre', 'cp-detail__text', r.text));
        var btn = el('div', 'cp-detail__btn selector', 'Скопировать');
        btn.on('hover:enter', function () { copy(plainLine(r)); });
        box.append(btn);
        var url = r.text.match(/https?:\/\/[^\s"'<>]+/);
        if (url) { var open = el('div', 'cp-detail__btn selector', 'Открыть ссылку'); open.on('hover:enter', function () { window.open(url[0], '_blank'); }); box.append(open); }
        openModal(r.name, box);
    }
    function netDetail(q) {
        var box = el('div', 'cp-detail');
        box.append(el('div', 'cp-detail__meta', q.method + ' · ' + statusText(q.status) + ' · ' + q.ms + ' ms · ' + timeText(q.t)));
        box.append(el('div', 'cp-detail__label', 'URL'));
        box.append(el('pre', 'cp-detail__text', q.url));
        var b1 = el('div', 'cp-detail__btn selector', 'Скопировать URL'); b1.on('hover:enter', function () { copy(q.url); }); box.append(b1);
        var b2 = el('div', 'cp-detail__btn selector', 'Открыть запрос'); b2.on('hover:enter', function () { window.open(q.url, '_blank'); }); box.append(b2);
        openModal('Запрос', box);
    }
    function openModal(title, box) {
        Lampa.Modal.open({
            title: title, html: box, size: 'large',
            onBack: function () { Lampa.Modal.close(); Lampa.Controller.toggle('cpconsole-list'); }
        });
    }

    // лента категорий для телефона: нативный скролл (палец/колесо/перетаскивание)
    function nativeStrip() {
        var box = el('div', 'cp__tabs'); var node = box[0]; var drag = null;
        box.on('wheel', function (e) { var d = e.originalEvent; if (Math.abs(d.deltaY) > Math.abs(d.deltaX)) { node.scrollLeft += d.deltaY; e.preventDefault(); } });
        box.on('mousedown', function (e) { drag = { x: e.pageX, left: node.scrollLeft, moved: false }; });
        $(window).on('mousemove.cp', function (e) { if (!drag) return; var dx = e.pageX - drag.x; if (Math.abs(dx) > 5) drag.moved = true; node.scrollLeft = drag.left - dx; });
        $(window).on('mouseup.cp', function () { var moved = drag && drag.moved; drag = null; if (moved) { node.addEventListener('click', function stop(ev) { ev.stopPropagation(); ev.preventDefault(); node.removeEventListener('click', stop, true); }, true); } });
        return {
            render: function () { return box; }, clear: function () { box.empty(); }, reset: function () { node.scrollLeft = 0; },
            append: function (e) { box.append(e); },
            update: function (e) { var n = e && e[0]; if (n && n.scrollIntoView) n.scrollIntoView({ block: 'nearest', inline: 'nearest' }); },
            destroy: function () { $(window).off('mousemove.cp mouseup.cp'); box.remove(); }
        };
    }

    function refreshAll() { records = collect(); drawStats(); drawSide(); drawList(); html.find('.cp__pill').remove(); }
    function checkNew() {
        if (!html) return;
        records = collect();
        drawStats();
        categories().forEach(function (c) { html.find('.cp__cat').filter(function () { return $(this).attr('data-key') == c.key; }).find('.cp__cat-count').text(c.count); });
        // Список переотрисовываем сам ТОЛЬКО когда реально пришли новые записи И
        // пользователь стоит на самой первой строке (смотрит свежее). Стоит ему
        // сдвинуться хоть на строку вниз — не трогаем ленту, иначе фокус пульта
        // уедет наверх. Пилюли «обновить» нет: её не достать пультом.
        var cur = (filter == 'net') ? (net.length + pending.length) : records.length;
        var livePending = (filter == 'net' && pending.length > 0);  // тикающие счётчики «висит»
        if (cur === last_count && !livePending) return;             // ничего нового — не дёргаем
        var sel = scroll_list.render().find('.selector');
        var foc = scroll_list.render().find('.selector.focus')[0];
        var onList = Lampa.Controller.enabled().name === 'cpconsole-list';
        var atTop = !onList || !foc || sel.index(foc) <= 0;
        if (atTop) {
            drawList();
            if (onList) { Lampa.Controller.collectionSet(scroll_list.render()); Lampa.Controller.collectionFocus(false, scroll_list.render()); }
        }
    }

    function isMobile() { return !!(html && html.hasClass('cp--mobile')); }

    function build() {
        records = collect();
        html = el('div', 'cp');
        var head = el('div', 'cp__head');
        var titles = el('div', 'cp__titles');
        titles.append(el('div', 'cp__title', 'Консоль'));
        head.append(titles).append(el('div', 'cp__stats'));

        var mobile = false;
        try { mobile = $('body').hasClass('true--mobile') || (Lampa.Platform && Lampa.Platform.screen && Lampa.Platform.screen('mobile')); } catch (e) {}
        if (mobile) html.addClass('cp--mobile');

        var body = el('div', 'cp__body');
        var side = el('div', 'cp__side');
        var main = el('div', 'cp__main');
        scroll_side = mobile ? nativeStrip() : new Lampa.Scroll({ mask: true, over: true });
        scroll_list = new Lampa.Scroll({ mask: true, over: true });
        side.append(scroll_side.render());

        if (mobile) {
            main.append(el('div', 'cp__list').append(scroll_list.render()));
            body.append(main);
            html.append(head).append(body).append(el('div', 'cp__bottom').append(side));
        } else {
            main.append(el('div', 'cp__list').append(scroll_list.render()));
            body.append(side).append(main);
            html.append(head).append(body);
            html.append(el('div', 'cp__hint', 'Влево-вправо — между колонками, «ОК» — открыть запись, «Назад» — выход'));
        }
        $('body').append(html).addClass('cp--open');
        drawStats(); drawSide(); drawList();
        refresh_timer = setInterval(checkNew, 1500);
    }
    function destroy() {
        if (!html) return;
        clearInterval(refresh_timer);
        try { scroll_side.destroy(); } catch (e) {}
        try { scroll_list.destroy(); } catch (e) {}
        html.remove(); $('body').removeClass('cp--open'); html = null;
    }
    function back() { destroy(); Lampa.Controller.toggle(from_controller || 'head'); from_controller = ''; }
    function guard() { if (html) return false; Lampa.Controller.toggle(from_controller || 'head'); return true; }

    function controllers() {
        var main = {
            toggle: function () {
                if (!html) {
                    var en = Lampa.Controller.enabled();
                    if (en && en.name && en.name != 'console' && en.name.indexOf('cpconsole') !== 0) from_controller = en.name;
                    build();
                }
                Lampa.Controller.toggle('cpconsole-side');
            },
            back: back
        };
        // подменяем стандартную консоль: пункт меню «Консоль» и 10× «вверх» в шапке зовут toggle('console')
        Lampa.Controller.add('console', main);
        Lampa.Controller.add('cpconsole', main);

        Lampa.Controller.add('cpconsole-side', {
            toggle: function () {
                if (guard()) return;
                Lampa.Controller.collectionSet(scroll_side.render());
                Lampa.Controller.collectionFocus(scroll_side.render().find('.cp__cat--active')[0], scroll_side.render());
            },
            up: function () { if (isMobile()) Lampa.Controller.toggle('cpconsole-list'); else Navigator.move('up'); },
            down: function () { if (!isMobile()) Navigator.move('down'); },
            left: function () { if (isMobile()) Navigator.move('left'); },
            right: function () { if (isMobile()) Navigator.move('right'); else Lampa.Controller.toggle('cpconsole-list'); },
            back: back
        });
        Lampa.Controller.add('cpconsole-list', {
            toggle: function () {
                if (guard()) return;
                Lampa.Controller.collectionSet(scroll_list.render());
                Lampa.Controller.collectionFocus(false, scroll_list.render());
            },
            up: function () { Navigator.move('up'); },
            down: function () { if (Navigator.canmove('down')) Navigator.move('down'); else if (isMobile()) Lampa.Controller.toggle('cpconsole-side'); },
            left: function () { if (!isMobile()) Lampa.Controller.toggle('cpconsole-side'); },
            back: back
        });
    }

    function addStyles() {
        var css = '' +
            // Нижний логотип/навигация в APK Лампы — НАТИВНЫЕ (рисуются приложением поверх webview,
            // в DOM их нет, JS-моста нет), плагином их не скрыть. Поэтому отодвигаем нашу ленту разделов
            // вправо, чтобы плитки не попадали под логотип в левом-нижнем углу.
            '.cp--mobile .cp__tabs{padding-left:4.6em}' +
            // палитра Lampa + семантика
            '.cp{position:fixed;top:0;left:0;right:0;bottom:0;z-index:100;background:#1d1f20;color:#fff;display:flex;flex-direction:column;padding:1.5em 2em 1em;box-sizing:border-box;--cp-err:#ec6a5e;--cp-warn:#e6b53c;--cp-ok:#59c06a;--cp-info:#5aa7e6}' +
            '.cp *{box-sizing:border-box}' +
            '.cp__head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.2em;gap:1em}' +
            '.cp__title{font-size:1.7em;font-weight:300;line-height:1.4}' +
            '.cp__stats{display:flex;gap:.6em;flex-wrap:wrap}' +
            '.cp__stat{background:#262829;border-radius:.6em;padding:.5em 1em;text-align:center;min-width:5em}' +
            '.cp__stat-count{font-size:1.5em;font-weight:600}' +
            '.cp__stat-title{color:rgba(255,255,255,.5);font-size:.8em;margin-top:.2em}' +
            '.cp__stat--empty .cp__stat-count{color:rgba(255,255,255,.3)}' +
            '.cp__stat--error .cp__stat-count{color:var(--cp-err)}.cp__stat--warn .cp__stat-count{color:var(--cp-warn)}.cp__stat--net .cp__stat-count{color:var(--cp-info)}' +
            '.cp__body{flex:1;display:flex;gap:1.2em;min-height:0}' +
            '.cp__side{width:16em;flex-shrink:0;min-height:0;display:flex;flex-direction:column}.cp__side .scroll{height:100%}' +
            '.cp__main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column}' +
            '.cp__list{flex:1;min-height:0}.cp__list .scroll{height:100%}' +
            '.cp__cat{display:flex;align-items:center;gap:.6em;padding:.6em .8em;border-radius:.3em;margin-bottom:.2em}' +
            '.cp__cat-dot{width:.5em;height:.5em;border-radius:50%;background:rgba(255,255,255,.4);flex-shrink:0}' +
            '.cp__cat--error .cp__cat-dot{background:var(--cp-err)}.cp__cat--warn .cp__cat-dot{background:var(--cp-warn)}.cp__cat--net .cp__cat-dot{background:var(--cp-info)}.cp__cat--all .cp__cat-dot{background:#fff}' +
            '.cp__cat-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
            '.cp__cat--active{background:#3e3e3e}' +
            '.cp__cat.focus,.cp__cat.hover{background:#fff;color:#000}' +
            '.cp__cat-count{color:rgba(255,255,255,.5);font-size:.9em;margin-left:.6em}' +
            '.cp__cat.focus .cp__cat-count,.cp__cat.hover .cp__cat-count{color:rgba(0,0,0,.6)}' +
            '.cp__cat.focus .cp__cat-dot,.cp__cat.hover .cp__cat-dot{outline:2px solid rgba(0,0,0,.15)}' +
            // строки лога
            '.cp__line{display:flex;gap:1.2em;padding:.5em .8em;border-radius:.3em;align-items:flex-start;line-height:1.3;border-left:3px solid transparent}' +
            '.cp__line--error{border-left-color:var(--cp-err)}.cp__line--warn{border-left-color:var(--cp-warn)}' +
            '.cp__line.focus,.cp__line.hover{background:#fff;color:#000}' +
            '.cp__line-time{color:rgba(255,255,255,.5);flex-shrink:0;width:5.2em}' +
            '.cp__line-tag{color:rgba(255,255,255,.7);flex-shrink:0;width:13em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
            '.cp__line.focus .cp__line-time,.cp__line.focus .cp__line-tag,.cp__line.hover .cp__line-time,.cp__line.hover .cp__line-tag{color:rgba(0,0,0,.6)}' +
            '.cp__line-text{flex:1;min-width:0;word-break:break-word}' +
            '.cp__badge{display:inline-block;font-size:.75em;border:1px solid currentColor;border-radius:.3em;padding:0 .35em;margin-right:.5em;opacity:.8}' +
            '.cp__nm{color:rgba(255,255,255,.55);font-weight:600}.cp__line.focus .cp__nm,.cp__line.hover .cp__nm{color:rgba(0,0,0,.55)}' +
            // таблица запросов
            '.cp__req{display:grid;grid-template-columns:4.6em 4em 1fr 6.4em;gap:.9em;align-items:center;padding:.5em .8em;border-radius:.3em;border-left:3px solid transparent}' +
            '.cp__req--head{color:rgba(255,255,255,.5);font-size:.8em;text-transform:uppercase;letter-spacing:.04em;position:sticky;top:0;background:#1d1f20}' +
            '.cp__req--error{border-left-color:var(--cp-err)}.cp__req--warn{border-left-color:var(--cp-warn)}' +
            '.cp__req.focus,.cp__req.hover{background:#fff;color:#000}' +
            '.cp__rtime{color:rgba(255,255,255,.5)}.cp__req.focus .cp__rtime,.cp__req.hover .cp__rtime{color:rgba(0,0,0,.55)}' +
            '.cp__status{font-weight:700}.cp__s2{color:var(--cp-ok)}.cp__s3{color:var(--cp-info)}.cp__s4{color:var(--cp-warn)}.cp__s5,.cp__sн{color:var(--cp-err)}' +
            '.cp__req.focus .cp__s2,.cp__req.hover .cp__s2{color:#166a24}.cp__req.focus .cp__s5,.cp__req.hover .cp__s5,.cp__req.focus .cp__sн,.cp__req.hover .cp__sн{color:#9c1d12}' +
            '.cp__rurl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cp__meth{color:rgba(255,255,255,.5);margin-right:.4em;font-size:.85em}.cp__req.focus .cp__meth,.cp__req.hover .cp__meth{color:rgba(0,0,0,.5)}' +
            '.cp__rms{display:flex;align-items:center;gap:.5em;justify-content:flex-end}.cp__bar{flex:1;max-width:3em;height:.4em;border-radius:1em;background:rgba(255,255,255,.1);overflow:hidden}.cp__bar i{display:block;height:100%}.cp__rms b{font-size:.85em;min-width:3.1em;text-align:right}' +
            // диагноз, сортировка, висящие
            '.cp__diag{padding:.5em .8em;margin-bottom:.4em;border-radius:.3em;background:rgba(90,167,230,.12);color:#cfe4f7;font-size:.9em;border-left:3px solid var(--cp-info)}' +
            '.cp__sort{padding:.5em .8em;margin-bottom:.4em;border-radius:.3em;background:#262829;font-size:.9em}.cp__sort.focus,.cp__sort.hover{background:#fff;color:#000}' +
            '.cp__req--pending{opacity:.95}.cp__req--pending .cp__status.cp__spend{color:var(--cp-warn);letter-spacing:.1em;animation:cp-blink 1s steps(3,end) infinite}.cp__pend-t{color:var(--cp-warn)}' +
            '.cp__req--pending.focus .cp__spend,.cp__req--pending.hover .cp__spend,.cp__req--pending.focus .cp__pend-t,.cp__req--pending.hover .cp__pend-t{color:#000}' +
            '@keyframes cp-blink{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}' +
            // прочее
            '.cp__pill{background:#262829;text-align:center;border-radius:.3em;padding:.5em;margin-bottom:.6em}.cp__pill.focus,.cp__pill.hover{background:#fff;color:#000}' +
            '.cp__more,.cp__empty-descr,.cp__hint{color:rgba(255,255,255,.5)}.cp__more{padding:.8em;text-align:center}' +
            '.cp__empty{padding:3em 1em;text-align:center}.cp__empty-title{font-size:1.3em;margin-bottom:.4em}.cp__hint{margin-top:.8em;font-size:.85em}' +
            '.cp-detail__meta{color:rgba(255,255,255,.5);margin-bottom:.8em}.cp-detail__label{font-size:.8em;text-transform:uppercase;letter-spacing:.04em;color:rgba(255,255,255,.5);margin:.2em 0 .4em}' +
            '.cp-detail__text{white-space:pre-wrap;word-break:break-word;background:rgba(255,255,255,.05);border-radius:.3em;padding:1em;max-height:45vh;overflow:auto;font-size:.9em;margin:0 0 1em;color:#fff}' +
            '.cp-detail__btn{padding:.5em 1.1em;border-radius:.3em;background:#3e3e3e;display:inline-block;white-space:nowrap;margin-right:.6em}.cp-detail__btn.focus,.cp-detail__btn.hover{background:#fff;color:#000}' +
            // телефон
            '.cp--mobile{padding:1em .8em calc(1.8em + env(safe-area-inset-bottom,0px))}.cp--mobile .cp__head{flex-direction:column;margin-bottom:.8em}.cp--mobile .cp__title{font-size:1.4em}.cp--mobile .cp__stats{margin-top:.6em;width:100%}.cp--mobile .cp__stat{flex:1;min-width:0;padding:.4em .5em}' +
            '.cp--mobile .cp__line{flex-wrap:wrap;gap:.2em .8em;padding:.5em .6em}.cp--mobile .cp__line-time{width:auto}.cp--mobile .cp__line-tag{width:auto;max-width:60%}.cp--mobile .cp__line-text{flex-basis:100%}' +
            '.cp--mobile .cp__req{grid-template-columns:3.6em 1fr;grid-template-areas:"t u" "s m";row-gap:.2em}.cp--mobile .cp__rtime{grid-area:t}.cp--mobile .cp__status{grid-area:s}.cp--mobile .cp__rurl{grid-area:u}.cp--mobile .cp__rms{grid-area:m;justify-content:flex-start}' +
            '.cp__bottom{flex-shrink:0;border-top:1px solid rgba(255,255,255,.1);padding-top:1em;margin-top:1em}.cp--mobile .cp__side{width:auto;height:auto}' +
            '.cp__tabs{display:flex;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch;cursor:grab}.cp__tabs::-webkit-scrollbar{display:none}' +
            '.cp--mobile .cp__cat{flex-shrink:0;margin:0 .55em 0 0;padding:1.15em 1.5em;min-height:3.2em;font-size:1.2em;border-radius:.8em;background:#2f3133;white-space:nowrap;align-items:center}.cp--mobile .cp__cat:last-child{margin-right:1.4em}.cp--mobile .cp__cat--active{background:#4a4c4e}' +
            'body.cp--open .wrap,body.cp--open .head{visibility:hidden}';
        $('<style id="cpconsole-style"></style>').text(css).appendTo('head');
    }

    function start() {
        if (window.cpconsole_started) return; window.cpconsole_started = true;
        try { addStyles(); controllers(); } catch (e) { try { console.error('cpconsole', e); } catch (_) {} }
    }
    // грузимся после готовности Lampa
    (function waitLampa() {
        if (!window.Lampa || !Lampa.Controller || !Lampa.Scroll) return setTimeout(waitLampa, 200);
        if (window.appready) start();
        else { try { Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') start(); }); } catch (e) { setTimeout(start, 1500); } }
    })();
})();
