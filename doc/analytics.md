# Uniplayer: аналитика просмотров

Плеер сообщает, как зрители смотрят видео: кто начал, кто дошёл до середины, кто досмотрел. Собирать эти данные можно двумя способами, и они работают одновременно.

Другие документы: [README](../README.md) · [Параметры и настройки](parameters.md)

---

## Какие события есть

| Событие | Когда | Дополнительные поля |
|---|---|---|
| `start` | первый запуск видео за этот показ | — |
| `progress` | зритель дошёл до 25, 50, 75 или 90% | `percent` |
| `complete` | видео досмотрено до конца | — |
| `error` | видео не загрузилось | `message` |

Каждое событие отправляется один раз за показ (до перезагрузки страницы). В каждом есть `currentTime` и `duration` в секундах.

Чего события не учитывают: `progress` считается по позиции, а не по реально просмотренному времени. Если зритель перемотал в конец, придут все отметки сразу.

## Какой способ выбрать

| | Способ 1: считает ваша страница | Способ 2: считает сам плеер |
|---|---|---|
| Где работает | только там, где плеер встроен в iframe на вашей странице | везде, включая прямые ссылки на плеер |
| Что нужно | скрипт на странице с iframe | адрес приёмника в `player.config.js` и сам приёмник (сервер) |
| Кто зритель | знает ваша страница: логин, email, ID из вашей системы | только то, что передано в `wm=` |
| Куда пишет | в ваш счётчик (GA4, Plausible) или на ваш сервер | на ваш сервер |

Если уроки открываются и на страницах сайта, и прямыми ссылками, включайте оба способа. Чтобы не считать один просмотр дважды, пишите их в разные места или различайте по полю источника, как это сделано в демо (`source`: `page` и `player`).

---

## Способ 1: считает страница с iframe

Плеер отправляет события странице через `postMessage`. Настраивать в плеере ничего не нужно.

**Google Analytics 4:**

```html
<iframe id="lesson" src="https://ваш-сайт/player/index.html?v=amm/urok-02"
        style="width:100%;aspect-ratio:16/9;border:0" allow="autoplay; fullscreen"></iframe>

<script>
  var iframe = document.getElementById("lesson");
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (e.source !== iframe.contentWindow || !d || d.source !== "uniplayer") return;
    if (d.event === "start")    gtag("event", "video_start",    { video: "urok-02" });
    if (d.event === "progress") gtag("event", "video_progress", { video: "urok-02", percent: d.percent });
    if (d.event === "complete") gtag("event", "video_complete", { video: "urok-02" });
  });
</script>
```

**Plausible:** те же строки, вместо `gtag(...)` — `plausible("video_progress", { props: { video: "urok-02", percent: d.percent } })`.

**Свой сервер:** вместо `gtag(...)` — `fetch("/api/video-events", { method: "POST", body: JSON.stringify({...}) })`. Здесь же можно добавить ID зрителя из вашей системы.

Проверка `e.source !== iframe.contentWindow` обязательна: без неё событие может подделать любой другой iframe на странице.

---

## Способ 2: считает сам плеер

В `player.config.js`:

```js
window.UNIPLAYER_CONFIG = {
  analytics: "https://stats.ваш-сайт/hit"
};
```

После этого плеер сам отправляет каждое событие на этот адрес запросом `POST`. Тело запроса — JSON, отправленный как обычный текст (`text/plain`), поэтому настраивать CORS на приёмнике не нужно:

```json
{
  "event": "progress",
  "percent": 50,
  "session": "k3j9x0a1b2",
  "video": "https://cdn.astakhova.com.ua/amm/urok-02/master.m3u8",
  "title": "Урок 2. Воронка",
  "viewer": "ivan@mail.com",
  "page": "https://astakhova.com.ua",
  "currentTime": 1320,
  "duration": 2640
}
```

| Поле | Что это |
|---|---|
| `session` | случайный код одного показа. По нему события одного просмотра собираются вместе. Между показами не сохраняется |
| `video` | ссылка на видео без параметров после `?` (токены в базу не попадают) |
| `viewer` | значение `wm=` из ссылки, если оно было. Другого способа узнать зрителя у плеера нет |
| `page` | сайт, на котором встроен плеер, или адрес самого плеера при прямой ссылке |

### Каким должен быть приёмник

Любой сервер, который принимает `POST` и сохраняет JSON. Рабочий пример — `demo/vite.config.js` в этом проекте: приём событий на Node.js и база SQLite, около 100 строк.

Для рабочего сайта подойдёт Cloudflare Worker с базой D1:

```js
export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("", { status: 405 });
    const e = JSON.parse(await request.text());
    await env.DB.prepare(
      "INSERT INTO events (ts, event, percent, session, video, viewer, page) VALUES (datetime('now'), ?, ?, ?, ?, ?, ?)"
    ).bind(e.event, e.percent ?? null, e.session, e.video, e.viewer ?? "", e.page).run();
    return new Response("ok");
  }
};
```

Этот пример не проверялся на настоящем аккаунте Cloudflare; перед запуском добавьте ограничение размера запроса и частоты обращений.

### Что учесть

- **Адрес приёмника открыт.** Он виден в `player.config.js`, и отправить на него выдуманное событие может кто угодно. Для статистики «сколько досмотрели» это приемлемо, для начисления чего-либо зрителю — нет.
- **`viewer` — личные данные,** если в `wm=` передаётся email. Сообщите об этом в политике конфиденциальности или передавайте в `wm=` внутренний ID вместо email.
- **Блокировщики рекламы** могут резать запросы на домены со словами вроде `stats` или `analytics`. Надёжнее приёмник на том же домене, что и плеер.

---

## Полезные запросы к базе

Воронка по каждому видео — сколько показов дошло до каждого шага:

```sql
SELECT video,
       COUNT(DISTINCT CASE WHEN event = 'start' THEN session END)                    AS started,
       COUNT(DISTINCT CASE WHEN event = 'progress' AND percent = 50 THEN session END) AS half,
       COUNT(DISTINCT CASE WHEN event = 'complete' THEN session END)                 AS completed
FROM events
GROUP BY video;
```

Кто из зрителей досмотрел урок:

```sql
SELECT DISTINCT viewer FROM events
WHERE event = 'complete' AND video LIKE '%/urok-02/%' AND viewer <> '';
```

---

## Проверить локально

```bash
cd demo
npm install
npm run dev
```

Браузер откроет демо сам. Нужен Node.js 22.13 или новее (в нём есть встроенный SQLite, отдельная база не устанавливается).

- Способ 2 уже включён: в `demo/player.config.js` задано `analytics: "/api/events"`.
- Способ 1 включается галочкой «страница тоже пишет события в базу».
- Блок «База событий» показывает записи из `demo/events.sqlite` и воронку по каждому видео. Для быстрой проверки выберите пятисекундный WebM: он проходит все шаги за несколько секунд.
- Тот же файл базы можно открыть любой программой для SQLite и выполнить запросы из раздела выше.

Страница и плеер в демо открываются с разных адресов (`127.0.0.1` и `localhost`), поэтому плеер отправляет события так же, как делал бы это со стороннего сайта.

Демо-сервер предназначен только для локальной проверки: в нём нет авторизации, в интернет его выставлять нельзя.
