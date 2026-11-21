// Демо Uniplayer на Vite. Кроме самой страницы, dev-сервер делает две вещи, как на настоящем сайте:
//   /player/*     — отдаёт плеер из корня проекта без изменений (со своим player.config.js из этой папки);
//   /api/events   — принимает события просмотра и хранит их в SQLite (demo/events.sqlite).
// Только для локальной проверки: нет авторизации и защиты, в интернет не выставлять.
import { createReadStream } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Белый список: наружу отдаются только эти файлы плеера
const PLAYER_FILES = {
  "/player/index.html": [here("../index.html"), "text/html; charset=utf-8"],
  "/player/hls.min.js": [here("../hls.min.js"), "text/javascript; charset=utf-8"],
  "/player/player.config.js": [here("./player.config.js"), "text/javascript; charset=utf-8"],
};

function uniplayerDemo() {
  const db = new DatabaseSync(here("./events.sqlite"));
  db.exec(
    "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, ts TEXT, source TEXT, event TEXT," +
      " video TEXT, percent INTEGER, session TEXT, viewer TEXT, page TEXT, position INTEGER)"
  );
  const insert = db.prepare(
    "INSERT INTO events (ts, source, event, video, percent, session, viewer, page, position)" +
      " VALUES (time('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const latest = db.prepare("SELECT * FROM events ORDER BY id DESC LIMIT 200");

  function json(res, data, status = 200) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify(data));
  }

  function readBody(req, limit = 10_000) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.setEncoding("utf8");
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > limit) reject(new Error("too large"));
      });
      req.on("end", () => resolve(body));
      req.on("error", reject);
    });
  }

  async function api(req, res) {
    if (req.method === "GET") return json(res, latest.all());
    if (req.method === "DELETE") {
      db.exec("DELETE FROM events");
      return json(res, { ok: true });
    }
    if (req.method !== "POST") return json(res, { error: "method" }, 405);

    let e;
    try {
      e = JSON.parse(await readBody(req)); // плеер шлёт JSON как text/plain (sendBeacon)
    } catch {
      return json(res, { error: "bad request" }, 400);
    }
    if (!e || typeof e !== "object" || Array.isArray(e)) return json(res, { error: "bad request" }, 400);

    const text = (key) => String(e[key] ?? "").slice(0, 300);
    const number = (key) => (Number.isFinite(e[key]) ? Math.round(e[key]) : null);
    insert.run(text("source") || "player", text("event"), text("video"), number("percent"),
      text("session"), text("viewer"), text("page"), number("currentTime"));
    json(res, { ok: true });
  }

  return {
    name: "uniplayer-demo",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url.split("?")[0];
        if (path === "/api/events") return api(req, res);
        const file = PLAYER_FILES[path];
        if (!file) return next();
        res.writeHead(200, { "Content-Type": file[1], "Cache-Control": "no-store" }); // правки в плеере видны сразу
        createReadStream(file[0]).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [uniplayerDemo()],
  // Слушаем 127.0.0.1: страница и плеер в iframe открываются под разными именами (127.0.0.1 и localhost).
  // Для браузера это разные сайты, поэтому встраивание проверяется в тех же условиях, что и на чужом домене.
  server: { host: "127.0.0.1", port: 5173, open: true },
});
