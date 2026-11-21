// Настройки плеера ТОЛЬКО для демо-страницы (сервер демо подставляет этот файл вместо корневого player.config.js).
// Меняйте значения и обновляйте страницу — блок «Из файла настроек» покажет, что плеер прочитал.
window.UNIPLAYER_CONFIG = {
  analytics: "/api/events",                        // способ 2: плеер сам пишет события в локальную базу SQLite
  watermark: "Demo channel",
  // allowedParents: ["localhost", "127.0.0.1"],   // попробуйте заменить на "example.com" — плеер покажет отказ
  // allowedHosts: ["test-streams.mux.dev"],       // попробуйте выбрать другое видео — плеер покажет ошибку
  // seek: false,
  // accent: "e3262f",
  // lang: "uk",
};
