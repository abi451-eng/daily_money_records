/* ============================================================
   Service Worker — Catatan Uang Harian
   Tugasnya: menyimpan ("cache") aplikasi supaya tetap bisa
   dibuka walau sedang offline / sinyal jelek.
   Naikkan nomor versi di bawah setiap kali kamu mengubah
   index.html, agar pengguna mendapat versi terbaru.
   ============================================================ */
const VERSI = 'catatan-uang-v1';

// Berkas inti yang disimpan sejak awal (kerangka aplikasi)
const INTI = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

// Saat dipasang: simpan berkas inti
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSI).then((c) => c.addAll(INTI)).then(() => self.skipWaiting())
  );
});

// Saat aktif: hapus cache versi lama
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSI).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Saat aplikasi meminta sesuatu (halaman, gambar, font, dll)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Untuk membuka halaman: utamakan jaringan (agar selalu versi terbaru),
  // kalau offline ambil dari simpanan.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Untuk aset lain (gambar, font Google, dll): pakai simpanan dulu,
  // kalau belum ada ambil dari jaringan lalu disimpan untuk nanti.
  e.respondWith(
    caches.match(req).then((tersimpan) => {
      if (tersimpan) return tersimpan;
      return fetch(req).then((resp) => {
        if (resp && (resp.ok || resp.type === 'opaque')) {
          const salinan = resp.clone();
          caches.open(VERSI).then((c) => c.put(req, salinan)).catch(() => {});
        }
        return resp;
      }).catch(() => tersimpan);
    })
  );
});
