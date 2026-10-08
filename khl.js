(function () {
    'use strict';

    // Хоккей КХЛ в Лампе. v0.1
    // Данные — публичный API puckdata.net (матчи/таблица/бомбардиры, read-only, CORS).
    // Раздел в меню «🏒 Хоккей»: матчи (живые/результаты/ближайшие), таблица, бомбардиры.
    if (window.khl_plugin) return;
    window.khl_plugin = true;

    var API = 'https://puckdata.net/api';
    var SEASON = 18;   // текущий сезон, уточняется из /api/seasons

    function get(path, ok, err) {
        try {
            var net = new Lampa.Reguest();
            net.silent(API + path, function (j) { ok(j); }, function (a, c) { if (err) err(a, c); });
        } catch (e) { if (err) err(e); }
    }
    function el(tag, cls, text) { var e = $('<' + tag + '></' + tag + '>'); if (cls) e.addClass(cls); if (text != null) e.text(text); return e; }
    function esc(s) { return String(s == null ? '' : s); }

    // ---- форматирование матча ----
    function scoreLine(g) {
        var home = g.home || g.home_name, away = g.away || g.away_name;
        var hs = g.home_score, as = g.away_score;
        var suff = g.shootout ? ' Б' : g.overtime ? ' ОТ' : '';
        return { home: home, away: away, score: (hs != null && as != null) ? (hs + ':' + as + suff) : '' };
    }

    function KHL() {
        var html, scroll, tabsEl, listEl, cur = 'games', cache = {};
        var TABS = [['games', 'Матчи'], ['table', 'Таблица'], ['scorers', 'Бомбардиры']];

        function drawTabs() {
            tabsEl.empty();
            TABS.forEach(function (t) {
                var p = el('div', 'khl-tab selector' + (t[0] === cur ? ' khl-tab--active' : ''), t[1]);
                p.on('hover:focus', function (e) { scroll.update($(e.target), true); });
                p.on('hover:enter', function () { if (cur !== t[0]) { cur = t[0]; drawTabs(); render(); refocus('.khl-tab--active'); } });
                tabsEl.append(p);
            });
        }

        function loader() { listEl.empty().append(el('div', 'khl-empty', 'Загрузка…')); }
        function emptyMsg(m) { listEl.empty().append(el('div', 'khl-empty', m || 'Пусто')); }

        function head(t) { return el('div', 'khl-head', t); }
        function row(cls) { return el('div', 'khl-row selector' + (cls ? ' ' + cls : '')); }

        function gameRow(g, live) {
            var s = scoreLine(g);
            var r = row(live ? 'khl-row--live' : '');
            var left = el('div', 'khl-g-teams');
            left.append(el('span', 'khl-g-home', s.home));
            left.append(el('span', 'khl-g-vs', '—'));
            left.append(el('span', 'khl-g-away', s.away));
            r.append(left);
            var right = el('div', 'khl-g-score');
            if (live) right.append(el('span', 'khl-badge-live', 'ЖИВО'));
            right.append(el('span', 'khl-g-num', s.score || (g.time_msk ? g.time_msk : '')));
            r.append(right);
            var sub = el('div', 'khl-g-sub', [g.played_on, g.arena].filter(Boolean).join(' · '));
            r.append(sub);
            r.on('hover:focus', function (e) { scroll.update($(e.target), true); });
            return r;
        }

        function tableRow(c) {
            var r = row();
            r.append(el('div', 'khl-t-place', c.place_league));
            r.append(el('div', 'khl-t-name', c.name));
            r.append(el('div', 'khl-t-gp', 'И ' + c.games));
            r.append(el('div', 'khl-t-pts', c.points));
            r.append(el('div', 'khl-t-gd', (c.gf != null ? c.gf + '–' + c.ga : '')));
            r.on('hover:focus', function (e) { scroll.update($(e.target), true); });
            return r;
        }

        function scorerRow(p, i) {
            var r = row();
            r.append(el('div', 'khl-s-rank', (i + 1)));
            r.append(el('div', 'khl-s-name', (p.last_name || '') + (p.first_name ? ' ' + p.first_name : '')));
            r.append(el('div', 'khl-s-club', p.clubs || (p.club_list && p.club_list[0] && p.club_list[0].name) || ''));
            r.append(el('div', 'khl-s-pts', (p.goals + '+' + p.assists + '=' + p.points)));
            r.on('hover:focus', function (e) { scroll.update($(e.target), true); });
            return r;
        }

        function fill(items) {
            listEl.empty();
            items.forEach(function (n) { listEl.append(n); });
            if (Lampa.Controller.enabled().name === 'content') { Lampa.Controller.collectionSet(html); }
        }

        // ---- загрузка секций ----
        function render() {
            if (cache[cur]) return fill(cache[cur]);
            loader();
            if (cur === 'games') return loadGames();
            if (cur === 'table') return loadTable();
            if (cur === 'scorers') return loadScorers();
        }

        function loadGames() {
            var out = [], done = 0, live = null, up = null, res = null;
            function finish() {
                done++; if (done < 3) return;
                var nodes = [];
                if (live && live.live && live.live.length) {
                    nodes.push(head('Идут сейчас'));
                    live.live.forEach(function (g) { nodes.push(gameRow(g, true)); });
                }
                if (up && up.rows && up.rows.length) {
                    nodes.push(head('Ближайшие'));
                    up.rows.slice(0, 10).forEach(function (g) { nodes.push(gameRow(g, false)); });
                }
                if (res && res.length) {
                    nodes.push(head('Результаты'));
                    res.slice(0, 12).forEach(function (g) { nodes.push(gameRow(g, false)); });
                }
                if (!nodes.length) return emptyMsg('Матчей не найдено');
                cache.games = nodes; fill(nodes);
            }
            get('/live', function (j) { live = j; finish(); }, function () { finish(); });
            get('/upcoming?limit=12', function (j) { up = j; finish(); }, function () { finish(); });
            get('/games?limit=12', function (j) { res = j; finish(); }, function () { finish(); });
        }

        function loadTable() {
            get('/standings', function (j) {
                if (!j || !j.length) return emptyMsg('Таблица недоступна');
                var nodes = [head('Турнирная таблица')];
                j.forEach(function (c) { nodes.push(tableRow(c)); });
                cache.table = nodes; fill(nodes);
            }, function () { emptyMsg('Таблица недоступна'); });
        }

        function loadScorers() {
            get('/leaders?season=' + SEASON, function (j) {
                if (!j || !j.length) return emptyMsg('Данных нет');
                var nodes = [head('Бомбардиры · очки (Г+П)')];
                j.slice(0, 40).forEach(function (p, i) { nodes.push(scorerRow(p, i)); });
                cache.scorers = nodes; fill(nodes);
            }, function () { emptyMsg('Данных нет'); });
        }

        function refocus(sel) {
            try {
                Lampa.Controller.collectionSet(html);
                Lampa.Controller.collectionFocus(html.find(sel)[0] || false, html);
            } catch (e) {}
        }

        // ---- жизненный цикл компонента ----
        this.create = function () {
            html = $('<div class="khl"></div>');
            tabsEl = $('<div class="khl-tabs"></div>');
            scroll = new Lampa.Scroll({ mask: true, over: true });
            listEl = $('<div class="khl-list"></div>');
            scroll.append(listEl);
            html.append(tabsEl);
            html.append($('<div class="khl-body"></div>').append(scroll.render()));
            drawTabs();
            // актуальный сезон
            get('/seasons', function (j) { if (j && j[0] && j[0].id) SEASON = j[0].id; }, function () {});
            if (this.activity) this.activity.loader(false);
            render();
            return this.render();
        };
        this.render = function () { return html; };
        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () { Lampa.Controller.collectionSet(html); Lampa.Controller.collectionFocus(false, html); },
                up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { Navigator.move('down'); },
                left: function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right: function () { Navigator.move('right'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };
        this.pause = function () {};
        this.stop = function () {};
        this.destroy = function () { try { scroll.destroy(); } catch (e) {} if (html) html.remove(); html = null; cache = {}; };
    }

    function addMenu() {
        var menu = $('.menu__list').first();
        if (!menu.length) return;
        if (menu.find('[data-action="khl"]').length) return;
        var icon = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h2.2l3.1 10.3L12.5 4h2.3l3.2 10.3L21.1 4H23l-4.3 14h-2.3l-3.1-10.1L10.2 18H7.9L3.6 4H4zM3 20h18v2H3z"/></svg>';
        var btn = $('<li class="menu__item selector" data-action="khl"><div class="menu__ico">🏒</div><div class="menu__text">Хоккей</div></li>');
        btn.on('hover:enter', function () { Lampa.Activity.push({ title: 'Хоккей КХЛ', component: 'khl' }); });
        menu.append(btn);
    }

    function addStyles() {
        if ($('#khl-style').length) return;
        var css = '' +
            '.khl{height:100%;display:flex;flex-direction:column;padding:1.5em 2em 1em;box-sizing:border-box}' +
            '.khl-tabs{display:flex;gap:.6em;flex-shrink:0;margin-bottom:1em;flex-wrap:wrap}' +
            '.khl-tab{padding:.7em 1.4em;border-radius:.6em;background:#262829;font-size:1.05em}' +
            '.khl-tab--active{background:#3e3e3e}' +
            '.khl-tab.focus,.khl-tab.hover{background:#fff;color:#000}' +
            '.khl-body{flex:1;min-height:0}.khl-body .scroll{height:100%}' +
            '.khl-list{display:flex;flex-direction:column}' +
            '.khl-head{color:rgba(255,255,255,.5);font-size:.85em;text-transform:uppercase;letter-spacing:.04em;margin:1em .4em .4em}' +
            '.khl-row{position:relative;padding:.7em 1em;border-radius:.4em;border-left:3px solid transparent;display:flex;align-items:center;gap:1em;flex-wrap:wrap}' +
            '.khl-row.focus,.khl-row.hover{background:#fff;color:#000}' +
            '.khl-row--live{border-left-color:#59c06a}' +
            // матч
            '.khl-g-teams{flex:1;min-width:0;display:flex;align-items:center;gap:.6em;font-size:1.05em}' +
            '.khl-g-home,.khl-g-away{font-weight:600}.khl-g-vs{color:rgba(255,255,255,.4)}' +
            '.khl-row.focus .khl-g-vs,.khl-row.hover .khl-g-vs{color:rgba(0,0,0,.4)}' +
            '.khl-g-score{display:flex;align-items:center;gap:.6em}.khl-g-num{font-weight:700;font-size:1.1em;min-width:3.2em;text-align:right}' +
            '.khl-badge-live{background:#59c06a;color:#06340f;font-size:.7em;font-weight:700;border-radius:.3em;padding:.1em .5em}' +
            '.khl-g-sub{flex-basis:100%;color:rgba(255,255,255,.45);font-size:.8em;margin-top:.15em}' +
            '.khl-row.focus .khl-g-sub,.khl-row.hover .khl-g-sub{color:rgba(0,0,0,.5)}' +
            // таблица
            '.khl-t-place{width:1.8em;text-align:center;color:rgba(255,255,255,.5);font-weight:700}' +
            '.khl-row.focus .khl-t-place,.khl-row.hover .khl-t-place{color:rgba(0,0,0,.5)}' +
            '.khl-t-name{flex:1;min-width:0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
            '.khl-t-gp{width:4em;color:rgba(255,255,255,.5);font-size:.9em}' +
            '.khl-row.focus .khl-t-gp,.khl-row.hover .khl-t-gp{color:rgba(0,0,0,.5)}' +
            '.khl-t-pts{width:2.6em;text-align:right;font-weight:700;font-size:1.1em}' +
            '.khl-t-gd{width:4.5em;text-align:right;color:rgba(255,255,255,.45);font-size:.85em}' +
            '.khl-row.focus .khl-t-gd,.khl-row.hover .khl-t-gd{color:rgba(0,0,0,.5)}' +
            // бомбардиры
            '.khl-s-rank{width:1.8em;text-align:center;color:rgba(255,255,255,.5);font-weight:700}' +
            '.khl-row.focus .khl-s-rank,.khl-row.hover .khl-s-rank{color:rgba(0,0,0,.5)}' +
            '.khl-s-name{flex:1;min-width:0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
            '.khl-s-club{width:9em;color:rgba(255,255,255,.5);font-size:.9em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
            '.khl-row.focus .khl-s-club,.khl-row.hover .khl-s-club{color:rgba(0,0,0,.5)}' +
            '.khl-s-pts{width:5em;text-align:right;font-weight:700}' +
            '.khl-empty{padding:2.5em 1em;text-align:center;color:rgba(255,255,255,.5)}';
        $('<style id="khl-style"></style>').text(css).appendTo('head');
    }

    function init() {
        if (!window.Lampa || !Lampa.Component || !Lampa.Controller) return;
        addStyles();
        Lampa.Component.add('khl', KHL);
        if (window.appready) addMenu();
        else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') addMenu(); });
    }

    if (window.Lampa) init();
    else { var t = setInterval(function () { if (window.Lampa) { clearInterval(t); init(); } }, 300); }
})();
