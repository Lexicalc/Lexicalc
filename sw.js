// Lexicalc — service worker
// © 2026 Lexicalc – Tous droits réservés
//
// Ce fichier se dépose à côté de index.html. Il sert uniquement à rendre le jeu installable
// (écran d'accueil, application Android). Le jeu n'est PAS gardé pour le hors connexion :
// tout passe par internet, comme si le service worker n'existait pas.
// Sans réseau, la page affiche simplement un message.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);   // aucun ancien cache
  await self.clients.claim();
})()));

const OFF = `<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lexicalc</title><body style="margin:0;background:#14233f;color:#fff;font:18px system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px;box-sizing:border-box">
<div><div style="font-size:64px">📴</div><h2 style="color:#ffd24a">Lexicalc</h2>
<p>Lexicalc a besoin d'une connexion internet pour fonctionner.</p><p style="color:#9fb3d9">Lexicalc needs an internet connection to work.</p>
<button onclick="location.reload()" style="font:inherit;font-weight:700;padding:12px 22px;border:0;border-radius:12px;background:#ffd24a;color:#14233f;margin-top:12px">🔄 Réessayer · Try again</button></div>`;

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.mode !== "navigate") return;            // tout le reste : réseau normal
  e.respondWith(fetch(r).catch(() => new Response(OFF, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
