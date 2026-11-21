// Настройки владельца плеера. Лежит рядом с index.html; сам index.html править не нужно.
// Без этого файла плеер тоже работает: любое видео по https через ?src=… (короткие ссылки ?v= при этом выключены).
window.UNIPLAYER_CONFIG = {
  defaultBase: "https://cdn.astakhova.com.ua",     // Custom Domain бакета R2: включает короткие ссылки ?v=курс/урок
  autoPoster: true,                                // prepare_video.sh кладёт poster.jpg рядом с master.m3u8
  // watermark: "Название канала",               // водяной знак в правом нижнем углу; wm= из ссылки добавляется второй строкой
  // allowedParents: ["astakhova.com.ua"],         // где можно встраивать плеер в iframe: домен, "*.домен" или "домен/путь/"; не задано — везде
  // allowedHosts: ["cdn.astakhova.com.ua/amm/"],  // откуда разрешено видео (тот же формат); не задано — отовсюду
  // analytics: "https://stats.example.com/hit",   // куда плеер сам отправляет события просмотра; см. doc/analytics.md
  // seek: false,                                  // запретить перемотку для всех видео
  // accent: "e3262f",                             // цвет по умолчанию; не задан — нейтральный белый
  // lang: "uk"                                    // язык по умолчанию; не задан — язык браузера зрителя
};
