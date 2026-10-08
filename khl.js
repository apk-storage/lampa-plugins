(function () {
    'use strict';

    // Хоккей КХЛ в Лампе. v0.4
    // Данные — публичный API puckdata.net (read-only, CORS).
    // Вкладки: Матчи (живой счёт с автообновлением) / Таблица / Бомбардиры.
    // Карточка матча — таймлайн голов + живые факты. Ряд «Хоккей сегодня» на главной.
    // Цвета/монограммы команд — свой дизайн, не официальные логотипы.
    if (window.khl_plugin) return;
    window.khl_plugin = true;

    var API = 'https://puckdata.net/api';
    var SEASON = 18;
    var LIVE_MS = 45000;

    var TEAM = {
        avangard: '#E2231A', ak_bars: '#1E7A46', ska: '#1B4DA1', cska: '#C8102E',
        dynamo_msk: '#2A6CF0', dinamo_mn: '#D11A2A', dinamo_r: '#7A1F2B',
        metallurg_mg: '#D7142C', lokomotiv: '#E39B00', traktor: '#6A7580', salavat_yulaev: '#0E9D4E',
        torpedo: '#1565C0', severstal: '#C9A227', neftekhimik: '#0E86C7', amur: '#179A54',
        barys: '#F2C200', avtomobilist: '#D12A2A', admiral: '#17407A', spartak: '#D7142C',
        sibir: '#1668B3', lada: '#1557A5', vityaz: '#8E1B2E', hc_sochi: '#00A3DA',
        dragons: '#C8102E', kunlun: '#C8102E', atlant: '#1668B3', donbass: '#D7142C'
    };
    function teamColor(id) {
        if (TEAM[id]) return TEAM[id];
        var h = 0; id = String(id || 'x');
        for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffff;
        return 'hsl(' + (h % 360) + ',55%,45%)';
    }
    var SHORT = {
        avangard: 'АВГ', avtomobilist: 'АВТ', admiral: 'АДМ', ak_bars: 'АКБ', amur: 'АМР', barys: 'БАР', vityaz: 'ВИТ',
        dynamo_msk: 'ДИН', dinamo_mn: 'ДМН', dinamo_r: 'ДР', donbass: 'ДОН', dragons: 'ДРК', kunlun: 'КНЛ', atlant: 'АТЛ',
        lada: 'ЛАД', lokomotiv: 'ЛОК', metallurg_mg: 'ММГ', neftekhimik: 'НХК', salavat_yulaev: 'СЮЛ', severstal: 'СЕВ',
        sibir: 'СИБ', spartak: 'СПА', ska: 'СКА', cska: 'ЦСКА', torpedo: 'ТОР', traktor: 'ТРК', hc_sochi: 'СОЧ'
    };
    function abbr(name) {
        name = String(name || '').trim(); if (!name) return '?';
        if (name.length <= 4) return name.toUpperCase();
        var w = name.split(/\s+/); if (w.length > 1) return (w[0][0] + w[1][0]).toUpperCase();
        return name.slice(0, 3).toUpperCase();
    }
    function badgeText(id, name) { return SHORT[id] || abbr(name); }

    function get(path, ok, err) {
        try { var net = new Lampa.Reguest(); net.silent(API + path, function (j) { ok(j); }, function (a, c) { if (err) err(a, c); }); }
        catch (e) { if (err) err(e); }
    }
    function el(tag, cls, text) { var e = $('<' + tag + '></' + tag + '>'); if (cls) e.addClass(cls); if (text != null) e.text(text); return e; }
    function fmtDate(s) { if (!s) return ''; var p = String(s).split('-'); return p.length === 3 ? (p[2] + '.' + p[1]) : s; }
    function badge(id, name, cls) { return el('span', cls || 'khl-badge', badgeText(id, name)).css('background', teamColor(id)); }
    function gid(g) { return g.id || g.game_id; }

    // карточка матча (общая для вкладки «Матчи» и ряда на главной)
    function buildGameCard(g, live, onEnter) {
        var home = g.home || g.home_name, away = g.away || g.away_name;
        var hs = g.home_score, as = g.away_score, hasScore = (hs != null && as != null);
        var c = el('div', 'khl-card selector' + (live ? ' khl-card--live' : ''));
        c.attr('data-gid', gid(g));
        var body = el('div', 'khl-card__body');
        [[home, g.home_club_id, hasScore ? hs : '', hasScore && hs > as], [away, g.away_club_id, hasScore ? as : '', hasScore && as > hs]].forEach(function (t) {
            var r = el('div', 'khl-mt' + (t[3] ? ' khl-mt--win' : ''));
            r.append(badge(t[1], t[0]));
            r.append(el('span', 'khl-mt__n', t[0]));
            if (t[2] !== '') r.append(el('span', 'khl-mt__s', t[2]));
            body.append(r);
        });
        c.append(body);
        var foot = el('div', 'khl-card__foot');
        var left = el('div', 'khl-card__meta');
        if (live) left.append(el('span', 'khl-live', 'ЖИВО'));
        if (!hasScore && g.time_msk) left.append(el('span', 'khl-time', g.time_msk));
        if (hasScore) left.append(el('span', 'khl-res', g.shootout ? 'буллиты' : g.overtime ? 'овертайм' : 'основное'));
        foot.append(left);
        foot.append(el('div', 'khl-card__place', [g.arena, fmtDate(g.played_on)].filter(Boolean).join(' · ')));
        c.append(foot);
        if (onEnter) c.on('hover:enter', function () { onEnter(g); });
        return c;
    }
    function openGame(g) {
        var id = gid(g); if (!id) return;
        Lampa.Activity.push({ title: (g.home || g.home_name || '') + ' — ' + (g.away || g.away_name || ''), component: 'khl_game', khl_game_id: id });
    }

    // ============ раздел «Хоккей» ============
    function KHL() {
        var html, scroll, tabsEl, listEl, cur = 'games', cache = {}, live_timer = 0, live_ids = '';
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
        function emptyMsg(m) { listEl.empty().append(el('div', 'khl-empty', m || 'Пусто')); }
        function head(t, sub) { var h = el('div', 'khl-head'); h.append(el('span', 'khl-head__t', t)); if (sub) h.append(el('span', 'khl-head__s', sub)); return h; }
        function cardFocus(c) { c.on('hover:focus', function (e) { scroll.update($(e.target), true); }); return c; }

        function tableRow(c, zone) {
            var r = el('div', 'khl-trow selector' + (zone ? ' khl-trow--po' : ''));
            r.append(el('span', 'khl-trow__pl', c.place_league));
            r.append(badge(c.id, c.name, 'khl-tbadge'));
            r.append(el('span', 'khl-trow__n', c.name));
            r.append(el('span', 'khl-trow__gp', c.games));
            r.append(el('span', 'khl-trow__pts', c.points));
            r.append(el('span', 'khl-trow__gd', (c.gf != null ? c.gf + ':' + c.ga : '')));
            return cardFocus(r);
        }
        function scorerRow(p, i) {
            var cid = p.club_list && p.club_list[0] && p.club_list[0].id;
            var r = el('div', 'khl-srow selector');
            r.append(el('span', 'khl-srow__r' + (i < 3 ? ' khl-srow__r--top khl-srow__r--' + (i + 1) : ''), (i + 1)));
            r.append(el('span', 'khl-srow__dot').css('background', teamColor(cid)));
            var nm = el('div', 'khl-srow__nm');
            nm.append(el('span', 'khl-srow__n', (p.last_name || '') + (p.first_name ? ' ' + p.first_name : '')));
            nm.append(el('span', 'khl-srow__c', p.clubs || (p.club_list && p.club_list[0] && p.club_list[0].name) || ''));
            r.append(nm);
            var pts = el('div', 'khl-srow__pts');
            pts.append(el('span', 'khl-srow__ga', p.goals + '+' + p.assists));
            pts.append(el('span', 'khl-srow__o', p.points));
            r.append(pts);
            return cardFocus(r);
        }

        function fill(nodes) {
            listEl.empty();
            nodes.forEach(function (n) { listEl.append(n); });
            if (Lampa.Controller.enabled().name === 'content') Lampa.Controller.collectionSet(html);
        }
        function render() {
            if (cache[cur]) { fill(cache[cur]); return; }
            listEl.empty().append(el('div', 'khl-empty', 'Загрузка…'));
            if (cur === 'games') return loadGames();
            if (cur === 'table') return loadTable();
            if (cur === 'scorers') return loadScorers();
        }

        function loadGames() {
            var done = 0, live = null, up = null, res = null;
            function finish() {
                if (++done < 3) return;
                var nodes = [];
                var lv = (live && live.live) || [];
                live_ids = lv.map(gid).join(',');
                if (lv.length) {
                    nodes.push(head('Идут сейчас'));
                    var g1 = el('div', 'khl-grid'); lv.forEach(function (g) { g1.append(cardFocus(buildGameCard(g, true, openGame))); }); nodes.push(g1);
                }
                if (up && up.rows && up.rows.length) {
                    var t = up.total || {};
                    nodes.push(head('Ближайшие матчи', t.season ? (t.season + ' · ' + (t.stage || '')) : ''));
                    var g2 = el('div', 'khl-grid'); up.rows.slice(0, 10).forEach(function (g) { g2.append(cardFocus(buildGameCard(g, false, openGame))); }); nodes.push(g2);
                }
                if (res && res.length) {
                    nodes.push(head('Результаты'));
                    var g3 = el('div', 'khl-grid'); res.slice(0, 12).forEach(function (g) { g3.append(cardFocus(buildGameCard(g, false, openGame))); }); nodes.push(g3);
                }
                if (!nodes.length) return emptyMsg('Матчей не найдено');
                cache.games = nodes; fill(nodes);
                startLive(lv.length > 0);
            }
            get('/live', function (j) { live = j; finish(); }, function () { finish(); });
            get('/upcoming?limit=12', function (j) { up = j; finish(); }, function () { finish(); });
            get('/games?limit=12', function (j) { res = j; finish(); }, function () { finish(); });
        }
        // живой счёт: раз в LIVE_MS обновляем /live; счёт тикает, при смене состава секции — перезагрузка вкладки «Матчи»
        function startLive(has) {
            if (live_timer) { clearInterval(live_timer); live_timer = 0; }
            if (!has) return;
            live_timer = setInterval(function () {
                if (!html) { clearInterval(live_timer); return; }
                get('/live', function (j) {
                    var lv = (j && j.live) || [];
                    var ids = lv.map(gid).join(',');
                    if (ids !== live_ids) { cache.games = null; live_ids = ids; if (cur === 'games') { var onTop = !listEl.find('.selector.focus').length || listEl.find('.selector').index(listEl.find('.selector.focus')[0]) <= 2; if (onTop) render(); } return; }
                    // те же матчи — обновляем счёт на месте, без перерисовки
                    lv.forEach(function (g) {
                        var card = html.find('.khl-card--live').filter(function () { return $(this).data('gid') == gid(g); });
                        if (card.length && g.home_score != null) {
                            var sc = card.find('.khl-mt__s');
                            sc.eq(0).text(g.home_score); sc.eq(1).text(g.away_score);
                        }
                    });
                }, function () {});
            }, LIVE_MS);
        }
        function loadTable() {
            get('/standings', function (j) {
                if (!j || !j.length) return emptyMsg('Таблица недоступна');
                var nodes = [head('Турнирная таблица', 'топ-8 — зона плей-офф')];
                var hdr = el('div', 'khl-trow khl-trow--hdr');
                hdr.append(el('span', 'khl-trow__pl', '#')); hdr.append(el('span', 'khl-tbadge')); hdr.append(el('span', 'khl-trow__n', 'Клуб'));
                hdr.append(el('span', 'khl-trow__gp', 'И')); hdr.append(el('span', 'khl-trow__pts', 'О')); hdr.append(el('span', 'khl-trow__gd', 'Ш'));
                nodes.push(hdr);
                j.forEach(function (c, i) { nodes.push(tableRow(c, (c.place_conference || i + 1) <= 8)); });
                cache.table = nodes; fill(nodes);
            }, function () { emptyMsg('Таблица недоступна'); });
        }
        function loadScorers() {
            get('/leaders?season=' + SEASON, function (j) {
                if (!j || !j.length) return emptyMsg('Данных нет');
                var nodes = [head('Бомбардиры', 'шайбы + передачи = очки')];
                j.slice(0, 40).forEach(function (p, i) { nodes.push(scorerRow(p, i)); });
                cache.scorers = nodes; fill(nodes);
            }, function () { emptyMsg('Данных нет'); });
        }
        function refocus(sel) { try { Lampa.Controller.collectionSet(html); Lampa.Controller.collectionFocus(html.find(sel)[0] || false, html); } catch (e) {} }

        this.create = function () {
            html = $('<div class="khl"></div>');
            tabsEl = $('<div class="khl-tabs"></div>');
            scroll = new Lampa.Scroll({ mask: true, over: true });
            listEl = $('<div class="khl-list"></div>');
            scroll.append(listEl);
            html.append(tabsEl);
            html.append($('<div class="khl-body"></div>').append(scroll.render()));
            drawTabs();
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
        this.pause = function () {}; this.stop = function () {};
        this.destroy = function () { if (live_timer) clearInterval(live_timer); live_timer = 0; try { scroll.destroy(); } catch (e) {} if (html) html.remove(); html = null; cache = {}; };
    }

    // ============ карточка матча ============
    function KHLGame(object) {
        var html, scroll, body;
        var game_id = object.khl_game_id;
        function goalRow(g) {
            var ptime = Math.max(0, (g.time_sec || 0) - ((g.period || 1) - 1) * 1200);
            var mm = Math.floor(ptime / 60), ss = ptime % 60;
            var r = el('div', 'khl-goal');
            r.append(el('span', 'khl-goal__p', g.period + 'п'));
            r.append(el('span', 'khl-goal__t', mm + ':' + (ss < 10 ? '0' : '') + ss));
            r.append(el('span', 'khl-goal__sc', (g.score_home != null ? g.score_home + ':' + g.score_away : '')));
            var who = el('div', 'khl-goal__who');
            who.append(el('span', 'khl-goal__n', g.scorer || ''));
            var ass = [g.assist1, g.assist2].filter(Boolean).join(', ');
            if (ass) who.append(el('span', 'khl-goal__a', '(' + ass + ')'));
            r.append(who);
            if (g.situation_raw) r.append(el('span', 'khl-goal__s' + (g.situation === 'pp' ? ' khl-goal__s--pp' : ''), g.situation_raw));
            return r;
        }
        function renderGame(d) {
            var g = d.game || d;
            body.empty();
            var hs = g.home_score, as = g.away_score, has = hs != null;
            var hd = el('div', 'khl-gh');
            var sideH = el('div', 'khl-gh__side');
            sideH.append(badge(g.home_club_id, g.home, 'khl-gbadge')); sideH.append(el('div', 'khl-gh__n', g.home));
            var mid = el('div', 'khl-gh__mid');
            mid.append(el('div', 'khl-gh__sc', has ? (hs + ' : ' + as) : (g.time_msk || '')));
            mid.append(el('div', 'khl-gh__st', has ? (g.shootout ? 'буллиты' : g.overtime ? 'овертайм' : 'матч завершён') : ((fmtDate(g.played_on) || '') + (g.time_msk ? ' · ' + g.time_msk : ''))));
            var sideA = el('div', 'khl-gh__side');
            sideA.append(badge(g.away_club_id, g.away, 'khl-gbadge')); sideA.append(el('div', 'khl-gh__n', g.away));
            hd.append(sideH); hd.append(mid); hd.append(sideA);
            body.append(hd);
            body.append(el('div', 'khl-gmeta', [g.arena, g.city, g.attendance ? (g.attendance + ' зрителей') : ''].filter(Boolean).join(' · ')));
            var goals = d.goals || [];
            if (goals.length) {
                body.append(el('div', 'khl-gsec', 'Шайбы'));
                var gl = el('div', 'khl-goals'); goals.forEach(function (x) { gl.append(goalRow(x)); }); body.append(gl);
            }
            // живые факты (если включён публичный эндпоинт)
            loadFacts(g);
        }
        function loadFacts(g) {
            get('/facts/public?game_id=' + game_id, function (j) {
                var arr = (j && (j.facts || j.rows || (Array.isArray(j) ? j : null))) || [];
                if (!arr.length) return;
                body.append(el('div', 'khl-gsec', 'Факты'));
                var fx = el('div', 'khl-facts');
                arr.slice(0, 12).forEach(function (f) { fx.append(el('div', 'khl-fact', (typeof f === 'string' ? f : (f.text || f.fact || f.title || '')))); });
                body.append(fx);
            }, function () {});
        }
        this.create = function () {
            html = $('<div class="khl khl-game"></div>');
            scroll = new Lampa.Scroll({ mask: true, over: true });
            body = el('div', 'khl-glist');
            scroll.append(body);
            html.append($('<div class="khl-body"></div>').append(scroll.render()));
            body.append(el('div', 'khl-empty', 'Загрузка матча…'));
            if (this.activity) this.activity.loader(false);
            get('/games/' + game_id, function (d) { renderGame(d); if (Lampa.Controller.enabled().name === 'content') Lampa.Controller.collectionSet(scroll.render()); }, function () { body.empty().append(el('div', 'khl-empty', 'Матч не найден')); });
            return this.render();
        };
        this.render = function () { return html; };
        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); },
                up: function () { Navigator.move('up'); }, down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };
        this.pause = function () {}; this.stop = function () {};
        this.destroy = function () { try { scroll.destroy(); } catch (e) {} if (html) html.remove(); html = null; };
    }

    // ============ ряд «Хоккей сегодня» на главной ============
    function addMainRow() {
        Lampa.ContentRows.add({
            name: 'khl_today', title: 'Хоккей сегодня', index: 2, screen: ['main'],
            call: function () {
                return function (call) {
                    var live = null, up = null, done = 0;
                    function fin() {
                        if (++done < 2) return;
                        var items = [];
                        ((live && live.live) || []).forEach(function (g) { items.push({ g: g, live: true }); });
                        var today = (up && up.total && up.total['ближайший']) || '';
                        ((up && up.rows) || []).forEach(function (g) { if (!today || g.played_on === today) items.push({ g: g, live: false }); });
                        if (!items.length) return call({ results: [], title: 'Хоккей сегодня' });
                        var results = items.slice(0, 12).map(function (it) {
                            var item = { title: (it.g.home || it.g.home_name) + ' — ' + (it.g.away || it.g.away_name), __g: it.g, __live: it.live };
                            item.params = {
                                style: { name: 'collection' },
                                createInstance: function (x) { return Lampa.Maker.make('Card', x, function (m) { return m.only('Card', 'Style', 'Callback'); }); },
                                emit: {
                                    onlyEnter: function () { openGame(it.g); },
                                    onlyFocus: function () {},
                                    onCreate: function () {
                                        try {
                                            this.img.addClass('hide'); this.html.removeClass('card--loaded'); this.html.addClass('khl-hcard');
                                            var view = this.html.find('.card__view');
                                            view.append(buildGameCard(it.g, it.live)[0]);
                                        } catch (e) {}
                                    }
                                }
                            };
                            return item;
                        });
                        call({ results: results, title: 'Хоккей сегодня' });
                    }
                    get('/live', function (j) { live = j; fin(); }, function () { fin(); });
                    get('/upcoming?limit=10', function (j) { up = j; fin(); }, function () { fin(); });
                };
            }
        });
    }

    var MENU_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 15.5l12.8-4.2 1.2 1.9-14 4.6zM18.5 9.2a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM4 18h17v2H4z"/></svg>';
    function addMenu() {
        var menu = $('.menu__list').first();
        if (!menu.length || menu.find('[data-action="khl"]').length) return;
        var btn = $('<li class="menu__item selector" data-action="khl"><div class="menu__ico">' + MENU_SVG + '</div><div class="menu__text">Хоккей</div></li>');
        btn.on('hover:enter', function () { Lampa.Activity.push({ title: 'Хоккей КХЛ', component: 'khl' }); });
        menu.append(btn);
    }

    function addStyles() {
        if ($('#khl-style').length) return;
        var css = '' +
            '.khl{position:relative;height:100%;display:flex;flex-direction:column;padding:1.4em 2em 1em;box-sizing:border-box;background:#0d0f14;--khl-ac:#3ea6ff}' +
            '.khl *{box-sizing:border-box}' +
            '.khl-tabs{display:flex;gap:.6em;flex-shrink:0;margin-bottom:1em;flex-wrap:wrap}' +
            '.khl-tab{padding:.65em 1.4em;border-radius:2em;background:#1b1e26;font-size:1.05em;color:rgba(255,255,255,.75)}' +
            '.khl-tab--active{background:#2a2f3a;color:#fff}.khl-tab.focus,.khl-tab.hover{background:#fff;color:#000}' +
            '.khl-body{flex:1;min-height:0}.khl-body .scroll{height:100%}' +
            '.khl-list,.khl-glist{display:flex;flex-direction:column;padding-bottom:1em}' +
            '.khl-head{display:flex;align-items:baseline;gap:.7em;margin:1.1em .2em .6em}' +
            '.khl-head__t{color:#fff;font-size:1.15em;font-weight:600}.khl-head__s{color:rgba(255,255,255,.4);font-size:.85em}' +
            '.khl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(20em,1fr));gap:.8em}' +
            '.khl-card{background:#171a21;border-radius:.8em;padding:.9em 1em;border-left:4px solid transparent;overflow:hidden}' +
            '.khl-card.focus,.khl-card.hover{background:#fff;color:#000}.khl-card--live{border-left-color:#59c06a}' +
            '.khl-card__body{display:flex;flex-direction:column;gap:.45em}' +
            '.khl-mt{display:flex;align-items:center;gap:.7em}' +
            '.khl-badge{width:2.3em;height:2.3em;border-radius:.5em;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.72em;line-height:1;flex-shrink:0;text-shadow:0 1px 2px rgba(0,0,0,.35);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}' +
            '.khl-mt__n{flex:1;min-width:0;font-size:1.1em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(255,255,255,.92)}' +
            '.khl-card.focus .khl-mt__n,.khl-card.hover .khl-mt__n{color:#000}' +
            '.khl-mt__s{font-size:1.25em;font-weight:700;min-width:1.3em;text-align:right;color:rgba(255,255,255,.7)}' +
            '.khl-card.focus .khl-mt__s,.khl-card.hover .khl-mt__s{color:#000}' +
            '.khl-mt--win .khl-mt__n,.khl-mt--win .khl-mt__s{color:#fff;font-weight:700}' +
            '.khl-card.focus .khl-mt--win .khl-mt__n,.khl-card.focus .khl-mt--win .khl-mt__s{color:#000}' +
            '.khl-card__foot{display:flex;justify-content:space-between;align-items:center;margin-top:.7em;gap:.6em}' +
            '.khl-card__meta{display:flex;align-items:center;gap:.5em}' +
            '.khl-time{font-size:1.1em;font-weight:700;color:var(--khl-ac)}.khl-card.focus .khl-time,.khl-card.hover .khl-time{color:#1565c0}' +
            '.khl-res{font-size:.75em;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.03em}' +
            '.khl-card.focus .khl-res,.khl-card.hover .khl-res{color:rgba(0,0,0,.45)}' +
            '.khl-live{background:#59c06a;color:#06340f;font-size:.72em;font-weight:800;border-radius:.3em;padding:.15em .5em;letter-spacing:.03em}' +
            '.khl-card__place{color:rgba(255,255,255,.4);font-size:.82em;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
            '.khl-card.focus .khl-card__place,.khl-card.hover .khl-card__place{color:rgba(0,0,0,.5)}' +
            // таблица
            '.khl-trow{display:flex;align-items:center;gap:.9em;padding:.55em .8em;border-radius:.5em}' +
            '.khl-trow.focus,.khl-trow.hover{background:#fff;color:#000}.khl-trow--po{background:rgba(89,192,106,.07)}' +
            '.khl-trow--hdr{color:rgba(255,255,255,.4);font-size:.8em;text-transform:uppercase;letter-spacing:.04em;padding-bottom:.2em}' +
            '.khl-tbadge{width:1.9em;height:1.9em;border-radius:.4em;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.6em;line-height:1;flex-shrink:0;text-shadow:0 1px 2px rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}' +
            '.khl-trow__pl{width:1.8em;text-align:center;color:rgba(255,255,255,.45);font-weight:700}' +
            '.khl-trow.focus .khl-trow__pl,.khl-trow.hover .khl-trow__pl{color:rgba(0,0,0,.5)}' +
            '.khl-trow__n{flex:1;min-width:0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
            '.khl-trow__gp{width:2.5em;text-align:center;color:rgba(255,255,255,.5)}.khl-trow.focus .khl-trow__gp,.khl-trow.hover .khl-trow__gp{color:rgba(0,0,0,.5)}' +
            '.khl-trow__pts{width:2.6em;text-align:center;font-weight:800;font-size:1.15em;color:#fff}.khl-trow.focus .khl-trow__pts,.khl-trow.hover .khl-trow__pts{color:#000}' +
            '.khl-trow__gd{width:4.5em;text-align:right;color:rgba(255,255,255,.4);font-size:.85em}.khl-trow.focus .khl-trow__gd,.khl-trow.hover .khl-trow__gd{color:rgba(0,0,0,.5)}' +
            // бомбардиры
            '.khl-srow{display:flex;align-items:center;gap:.8em;padding:.5em .8em;border-radius:.5em}.khl-srow.focus,.khl-srow.hover{background:#fff;color:#000}' +
            '.khl-srow__r{width:1.9em;height:1.9em;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#20242e;color:rgba(255,255,255,.55);font-weight:700;font-size:.9em}' +
            '.khl-srow__r--top{color:#1a1200}.khl-srow__r--1{background:#F2C94C}.khl-srow__r--2{background:#C7CDD6}.khl-srow__r--3{background:#D08B54}' +
            '.khl-srow__dot{width:.6em;height:.6em;border-radius:50%;flex-shrink:0}' +
            '.khl-srow__nm{flex:1;min-width:0;display:flex;flex-direction:column}.khl-srow__n{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
            '.khl-srow__c{color:rgba(255,255,255,.4);font-size:.8em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.khl-srow.focus .khl-srow__c,.khl-srow.hover .khl-srow__c{color:rgba(0,0,0,.5)}' +
            '.khl-srow__pts{display:flex;align-items:baseline;gap:.5em}.khl-srow__ga{color:rgba(255,255,255,.4);font-size:.85em}.khl-srow.focus .khl-srow__ga,.khl-srow.hover .khl-srow__ga{color:rgba(0,0,0,.45)}' +
            '.khl-srow__o{font-weight:800;font-size:1.2em;min-width:1.4em;text-align:right}' +
            '.khl-empty{padding:3em 1em;text-align:center;color:rgba(255,255,255,.5)}' +
            // карточка матча
            '.khl-gh{display:flex;align-items:center;justify-content:center;gap:1.5em;padding:1em 0 .5em}' +
            '.khl-gh__side{display:flex;flex-direction:column;align-items:center;gap:.5em;width:9em;text-align:center}' +
            '.khl-gbadge{width:3.4em;height:3.4em;border-radius:.7em;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1em;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}' +
            '.khl-gh__n{font-size:1.1em;font-weight:600}' +
            '.khl-gh__mid{display:flex;flex-direction:column;align-items:center;min-width:6em}' +
            '.khl-gh__sc{font-size:2.6em;font-weight:800;line-height:1}.khl-gh__st{color:rgba(255,255,255,.5);font-size:.85em;margin-top:.3em;text-transform:uppercase;letter-spacing:.03em}' +
            '.khl-gmeta{text-align:center;color:rgba(255,255,255,.45);font-size:.9em;margin-bottom:1em}' +
            '.khl-gsec{color:rgba(255,255,255,.5);font-size:.85em;text-transform:uppercase;letter-spacing:.04em;margin:1em .2em .5em;border-top:1px solid rgba(255,255,255,.08);padding-top:1em}' +
            '.khl-goals{display:flex;flex-direction:column;gap:.1em}' +
            '.khl-goal{display:flex;align-items:center;gap:.8em;padding:.5em .6em;border-radius:.4em}' +
            '.khl-goal__p{width:1.8em;color:var(--khl-ac);font-weight:700;font-size:.85em}' +
            '.khl-goal__t{width:3em;color:rgba(255,255,255,.5);font-size:.9em}' +
            '.khl-goal__sc{width:2.6em;font-weight:700}' +
            '.khl-goal__who{flex:1;min-width:0}.khl-goal__n{font-weight:600}.khl-goal__a{color:rgba(255,255,255,.45);font-size:.85em;margin-left:.4em}' +
            '.khl-goal__s{font-size:.72em;color:rgba(255,255,255,.4);text-transform:uppercase}.khl-goal__s--pp{color:#F2C94C}' +
            '.khl-facts{display:flex;flex-direction:column;gap:.4em}.khl-fact{background:#171a21;border-left:3px solid var(--khl-ac);border-radius:.4em;padding:.6em .8em;color:rgba(255,255,255,.9)}' +
            // карточка матча в ряду на главной
            '.khl-hcard .card__view{background:transparent!important;height:auto!important}.khl-hcard .card__view .khl-card{width:100%}' +
            '@media(max-width:600px){.khl-grid{grid-template-columns:1fr}}';
        $('<style id="khl-style"></style>').text(css).appendTo('head');
    }

    function init() {
        if (!window.Lampa || !Lampa.Component || !Lampa.Controller) return;
        addStyles();
        Lampa.Component.add('khl', KHL);
        Lampa.Component.add('khl_game', KHLGame);
        if (window.appready) { addMenu(); try { addMainRow(); } catch (e) {} }
        else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') { addMenu(); try { addMainRow(); } catch (x) {} } });
    }

    if (window.Lampa) init();
    else { var t = setInterval(function () { if (window.Lampa) { clearInterval(t); init(); } }, 300); }
})();
