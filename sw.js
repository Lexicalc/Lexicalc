// Lexicalc — service worker
// © 2026 Lexicalc – Tous droits réservés
//
// Ce fichier se dépose à côté de index.html. Il sert à rendre le jeu installable
// (écran d'accueil, application Android) et à afficher les notifications (lot 4).
// Le jeu n'est PAS gardé pour le hors connexion :
// tout passe par internet, comme si le service worker n'existait pas.
// Sans réseau, la page affiche simplement un message.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);   // aucun ancien cache
  await self.clients.claim();
})()));

const OFF = `<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lexicalc</title><body style="margin:0;background:#fbf6ee;color:#1d2433;font:18px system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px;box-sizing:border-box">
<div><div style="font-size:64px">📴</div><h2 style="color:#0f8b8d">Lexicalc</h2>
<p>Lexicalc needs an internet connection to work.</p>
<button onclick="location.reload()" style="font:inherit;font-weight:700;padding:12px 22px;border:0;border-radius:12px;background:#0f8b8d;color:#fff;margin-top:12px">🔄 Try again</button></div>`;

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.mode !== "navigate") return;            // tout le reste : réseau normal
  e.respondWith(fetch(r).catch(() => new Response(OFF, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});

// ----- notifications (lot 4) -----
// Le message arrive chiffré depuis la fonction Supabase « push » : {t: titre, b: texte, u: lien, g: groupe}.
// Si le jeu est ouvert à l'écran, il reçoit l'info directement (pas de notification en double),
// sauf pour la notification de test.
const SCOPE = self.registration.scope;
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {}; }
  e.waitUntil((async () => {
    const cl = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const vis = cl.filter(c => c.visibilityState === "visible" && c.url.startsWith(SCOPE));
    vis.forEach(c => c.postMessage({ t: "nfin", d }));
    if (vis.length && d.g !== "test") return;
    await self.registration.showNotification(d.t || "Lexicalc", {
      body: d.b || "",
      tag: d.g || "lexicalc",
      renotify: true,
      icon: SCOPE + "assets/icone-192.png",
      data: { u: d.u || "./" }
    });
  })());
});

// notification touchée : on ouvre le jeu au bon écran (ou on le ramène devant s'il est déjà ouvert)
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.u) || "./", SCOPE).href;
  e.waitUntil((async () => {
    const cl = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const c = cl.find(x => x.url.startsWith(SCOPE));
    if (c) {
      try { await c.focus(); } catch (err) {}
      c.postMessage({ t: "nfopen", u: url });
      return;
    }
    await self.clients.openWindow(url);
  })());
});
