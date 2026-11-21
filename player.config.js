// Настройки владельца плеера. Лежит рядом с index.html; сам index.html править не нужно.
// Без этого файла плеер тоже работает: любое видео по https через ?src=… (короткие ссылки ?v= при этом выключены).
window.UNIPLAYER_CONFIG = {
  defaultBase: "https://cdn.astakhova.com.ua",     // Custom Domain бакета R2: включает короткие ссылки ?v=курс/урок
  autoPoster: true                                 // prepare_video.sh кладёт poster.jpg рядом с master.m3u8
  // allowedHosts: ["cdn.astakhova.com.ua"],       // с каких сайтов разрешено видео в src=; не задано — с любых
  // seek: false,                                  // запретить перемотку для всех видео
  // accent: "e3262f",                             // цвет по умолчанию; не задан — нейтральный белый
  // lang: "uk"                                    // язык по умолчанию; не задан — язык браузера зрителя
};
