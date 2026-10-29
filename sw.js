/* =====================================================================
   Service Worker für das „Hantelbuch“
   Aufgabe: Die App auf dem Handy speichern, damit sie im Gym auch mit
   schlechtem Netz startet. Videos werden NICHT gespeichert (gehen nur mit Internet).
   ===================================================================== */
const VERSION = "hantelbuch-v3.9";             // bei Änderungen hochzählen
const DATEIEN = ["./", "index.html", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

// 1) Installieren: App-Dateien speichern
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

// 2) Aktivieren: alte Versionen löschen
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((namen) => Promise.all(namen.filter((n) => n.startsWith("hantelbuch-") && n !== VERSION).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});

// 3) Anfragen beantworten
self.addEventListener("fetch", (e) => {
  const anfrage = e.request;
  if (anfrage.method !== "GET") return;
  const url = new URL(anfrage.url);
  if (url.origin !== location.origin) return;                                     // Schriften usw. normal laden
  if (anfrage.headers.has("range") || /\.mp4($|\?)/.test(url.pathname)) return;   // Videos direkt aus dem Netz

  // Die App-Seite: erst Netz (für Updates), bei Funkloch der Speicher
  if (anfrage.mode === "navigate") {
    e.respondWith(fetch(anfrage).then((netz) => { const kopie = netz.clone(); caches.open(VERSION).then((c) => c.put("index.html", kopie)); return netz; })
      .catch(() => caches.match("index.html").then((r) => r || caches.match("./"))));
    return;
  }
  // Alles andere (Icons, Manifest): erst Speicher, sonst Netz
  e.respondWith(caches.match(anfrage).then((r) => r || fetch(anfrage)));
});
