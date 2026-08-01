/* ══════════════════════════════════════════════════════════════
   Guide Engine — moteur de rendu partagé (multi-destinations)
   Chargé par chaque site via <script src=".../engine.js"></script>,
   puis initialisé avec GuideEngine.init({ localStorageKey, dataUrl }).
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Illustrations ──────────────────────────────────────────── */
  const ILLUSTRATIONS = {
    boussole:    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="34" stroke-width="1.8"/><circle cx="50" cy="50" r="4" fill="currentColor" stroke="none"/><line x1="50" y1="16" x2="50" y2="28" stroke-width="2"/><line x1="50" y1="72" x2="50" y2="84" stroke-width="2"/><line x1="16" y1="50" x2="28" y2="50" stroke-width="2"/><line x1="72" y1="50" x2="84" y2="50" stroke-width="2"/><path d="M50 20 L53.5 47 L50 53 L46.5 47Z" fill="currentColor" stroke="none" opacity="0.7"/></svg>`,
    soleil:      `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="50" cy="50" r="18" stroke-width="1.8"/><line x1="50" y1="18" x2="50" y2="28" stroke-width="2"/><line x1="50" y1="72" x2="50" y2="82" stroke-width="2"/><line x1="18" y1="50" x2="28" y2="50" stroke-width="2"/><line x1="72" y1="50" x2="82" y2="50" stroke-width="2"/><line x1="29" y1="29" x2="36" y2="36" stroke-width="2"/><line x1="64" y1="64" x2="71" y2="71" stroke-width="2"/><line x1="71" y1="29" x2="64" y2="36" stroke-width="2"/><line x1="36" y1="64" x2="29" y2="71" stroke-width="2"/></svg>`,
    volant:      `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="33" stroke-width="1.8"/><circle cx="50" cy="50" r="9" stroke-width="1.8"/><line x1="50" y1="41" x2="50" y2="17" stroke-width="1.8"/><line x1="42.2" y1="45.5" x2="21" y2="62.5" stroke-width="1.8"/><line x1="57.8" y1="45.5" x2="79" y2="62.5" stroke-width="1.8"/></svg>`,
    couverts:    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="34" y1="78" x2="34" y2="50" stroke-width="1.8"/><line x1="27" y1="22" x2="27" y2="42" stroke-width="1.8"/><line x1="34" y1="22" x2="34" y2="42" stroke-width="1.8"/><line x1="41" y1="22" x2="41" y2="42" stroke-width="1.8"/><path d="M27 42 Q34 51 41 42" stroke-width="1.8"/><line x1="66" y1="22" x2="66" y2="78" stroke-width="1.8"/><path d="M66 22 Q78 34 66 55" stroke-width="1.8"/></svg>`,
    surf:        `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M15 63 Q28 34 58 37 Q77 39 82 55 Q85 66 72 68 Q59 70 49 59 Q39 48 15 63Z" stroke-width="1.8"/><path d="M15 63 Q7 51 11 40" stroke-width="1.8"/><path d="M15 63 Q5 68 9 76" stroke-width="1.8"/><path d="M54 41 Q58 24 67 33" stroke-width="1.8"/><circle cx="73" cy="57" r="3" fill="currentColor" stroke="none"/></svg>`,
    montagne:    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10 76 L42 22 L60 44 L70 32 L90 76Z" stroke-width="1.8"/><line x1="20" y1="76" x2="27" y2="47" stroke-width="1.8"/><path d="M27 47 Q15 38 9 44" stroke-width="1.6"/><path d="M27 47 Q22 36 27 26" stroke-width="1.6"/><path d="M27 47 Q37 38 43 44" stroke-width="1.6"/></svg>`,
    avion:       `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M50 12 L57 38 L84 52 L57 62 L63 80 L50 74 L37 80 L43 62 L16 52 L43 38Z" stroke-width="1.8"/></svg>`,
    carte:       `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M15 24 L38 16 L62 26 L85 18 L85 76 L62 84 L38 74 L15 82Z" stroke-width="1.8"/><line x1="38" y1="16" x2="38" y2="74" stroke-width="1.4"/><line x1="62" y1="26" x2="62" y2="84" stroke-width="1.4"/><path d="M22 46 Q30 40 38 50" stroke-width="1.3"/></svg>`,
    camera:      `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="36" width="76" height="50" rx="5" stroke-width="1.8"/><circle cx="50" cy="61" r="14" stroke-width="1.8"/><circle cx="50" cy="61" r="6" stroke-width="1.4"/><path d="M36 36 L41 26 L59 26 L64 36" stroke-width="1.8"/><circle cx="76" cy="44" r="3" fill="currentColor" stroke="none"/></svg>`,
    cocktail:    `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M22 22 L50 60 L78 22Z" stroke-width="1.8"/><line x1="50" y1="60" x2="50" y2="80" stroke-width="1.8"/><line x1="32" y1="80" x2="68" y2="80" stroke-width="1.8"/><line x1="62" y1="22" x2="74" y2="10" stroke-width="1.5"/><circle cx="75" cy="9" r="3.5" fill="currentColor" stroke="none"/></svg>`,
    bateau:      `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="50" y1="20" x2="50" y2="68" stroke-width="1.8"/><path d="M50 22 L20 62 L50 68Z" stroke-width="1.8"/><path d="M16 72 Q33 66 50 72 Q67 78 84 72" stroke-width="1.8"/><path d="M10 80 Q30 75 50 80 Q70 85 90 80" stroke-width="1.3" opacity="0.5"/></svg>`,
    poisson:     `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="45" cy="50" rx="27" ry="16" stroke-width="1.8"/><path d="M72 50 L86 36 L86 64Z" stroke-width="1.8"/><circle cx="32" cy="45" r="3.5" fill="currentColor" stroke="none"/><path d="M52 40 Q62 50 52 60" stroke-width="1.3"/></svg>`,
    palmier:     `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M48 80 Q52 56 56 30" stroke-width="2.2"/><path d="M56 30 Q42 12 26 20 Q36 30 56 30" stroke-width="1.8"/><path d="M56 30 Q72 10 88 18 Q76 30 56 30" stroke-width="1.8"/><path d="M56 30 Q34 28 20 42 Q30 44 56 30" stroke-width="1.8"/><path d="M56 30 Q76 30 86 44 Q72 46 56 30" stroke-width="1.8"/><line x1="36" y1="84" x2="62" y2="84" stroke-width="1.8"/></svg>`,
    epingle:     `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M50 84 Q26 58 26 40 Q26 16 50 16 Q74 16 74 40 Q74 58 50 84Z" stroke-width="1.8"/><circle cx="50" cy="40" r="10" stroke-width="1.8"/></svg>`,
    etoile:      `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M50 14 L58 38 L84 38 L63 54 L71 78 L50 62 L29 78 L37 54 L16 38 L42 38Z" stroke-width="1.8"/></svg>`,
    coeur:       `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M50 80 Q16 58 16 36 Q16 18 34 18 Q44 18 50 30 Q56 18 66 18 Q84 18 84 36 Q84 58 50 80Z" stroke-width="1.8"/></svg>`,
    vague:       `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M8 40 Q18 28 28 40 Q38 52 48 40 Q58 28 68 40 Q78 52 88 40" stroke-width="1.8"/><path d="M8 58 Q18 46 28 58 Q38 70 48 58 Q58 46 68 58 Q78 70 88 58" stroke-width="1.8"/></svg>`,
    maison:      `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 52 L50 18 L86 52" stroke-width="1.8"/><path d="M24 46 L24 82 L76 82 L76 46" stroke-width="1.8"/><rect x="40" y="58" width="20" height="24" stroke-width="1.5"/><rect x="28" y="53" width="14" height="12" stroke-width="1.4"/><rect x="58" y="53" width="14" height="12" stroke-width="1.4"/></svg>`,
    musique:     `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="40" y1="72" x2="40" y2="28" stroke-width="1.8"/><line x1="40" y1="28" x2="78" y2="18" stroke-width="1.8"/><line x1="78" y1="18" x2="78" y2="60" stroke-width="1.8"/><line x1="40" y1="46" x2="78" y2="36" stroke-width="1.4"/><ellipse cx="33" cy="73" rx="11" ry="7" stroke-width="1.8" transform="rotate(-15 33 73)"/><ellipse cx="71" cy="63" rx="11" ry="7" stroke-width="1.8" transform="rotate(-15 71 63)"/></svg>`,
    sac:         `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="38" width="64" height="46" rx="4" stroke-width="1.8"/><path d="M36 38 Q36 20 50 20 Q64 20 64 38" stroke-width="1.8"/><line x1="18" y1="56" x2="82" y2="56" stroke-width="1.3"/></svg>`,
    /* aliases pour compatibilité avec les data.json existants (icônes = id de section) */
    generalites: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="34" stroke-width="1.8"/><circle cx="50" cy="50" r="4" fill="currentColor" stroke="none"/><line x1="50" y1="16" x2="50" y2="28" stroke-width="2"/><line x1="50" y1="72" x2="50" y2="84" stroke-width="2"/><line x1="16" y1="50" x2="28" y2="50" stroke-width="2"/><line x1="72" y1="50" x2="84" y2="50" stroke-width="2"/><path d="M50 20 L53.5 47 L50 53 L46.5 47Z" fill="currentColor" stroke="none" opacity="0.7"/></svg>`,
    mood:        `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="50" cy="50" r="18" stroke-width="1.8"/><line x1="50" y1="18" x2="50" y2="28" stroke-width="2"/><line x1="50" y1="72" x2="50" y2="82" stroke-width="2"/><line x1="18" y1="50" x2="28" y2="50" stroke-width="2"/><line x1="72" y1="50" x2="82" y2="50" stroke-width="2"/><line x1="29" y1="29" x2="36" y2="36" stroke-width="2"/><line x1="64" y1="64" x2="71" y2="71" stroke-width="2"/><line x1="71" y1="29" x2="64" y2="36" stroke-width="2"/><line x1="36" y1="64" x2="29" y2="71" stroke-width="2"/></svg>`,
    transports:  `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="33" stroke-width="1.8"/><circle cx="50" cy="50" r="9" stroke-width="1.8"/><line x1="50" y1="41" x2="50" y2="17" stroke-width="1.8"/><line x1="42.2" y1="45.5" x2="21" y2="62.5" stroke-width="1.8"/><line x1="57.8" y1="45.5" x2="79" y2="62.5" stroke-width="1.8"/></svg>`,
    manger:      `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="34" y1="78" x2="34" y2="50" stroke-width="1.8"/><line x1="27" y1="22" x2="27" y2="42" stroke-width="1.8"/><line x1="34" y1="22" x2="34" y2="42" stroke-width="1.8"/><line x1="41" y1="22" x2="41" y2="42" stroke-width="1.8"/><path d="M27 42 Q34 51 41 42" stroke-width="1.8"/><line x1="66" y1="22" x2="66" y2="78" stroke-width="1.8"/><path d="M66 22 Q78 34 66 55" stroke-width="1.8"/></svg>`,
    activites:   `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M15 63 Q28 34 58 37 Q77 39 82 55 Q85 66 72 68 Q59 70 49 59 Q39 48 15 63Z" stroke-width="1.8"/><path d="M15 63 Q7 51 11 40" stroke-width="1.8"/><path d="M15 63 Q5 68 9 76" stroke-width="1.8"/><path d="M54 41 Q58 24 67 33" stroke-width="1.8"/><circle cx="73" cy="57" r="3" fill="currentColor" stroke="none"/></svg>`,
    nature:      `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10 76 L42 22 L60 44 L70 32 L90 76Z" stroke-width="1.8"/><line x1="20" y1="76" x2="27" y2="47" stroke-width="1.8"/><path d="M27 47 Q15 38 9 44" stroke-width="1.6"/><path d="M27 47 Q22 36 27 26" stroke-width="1.6"/><path d="M27 47 Q37 38 43 44" stroke-width="1.6"/></svg>`,
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function illus(id) { return ILLUSTRATIONS[id] || ILLUSTRATIONS.boussole; }

  /* ── Header ─────────────────────────────────────────────────── */
  let _scrolled = false;
  function applyHeader(on) {
    _scrolled = on;
    const h = document.getElementById('site-header');
    const b = document.getElementById('header-brand');
    if (!h || !b) return; // pas de header sur les pages qui embarquent le moteur sans le markup du site (ex: admin)
    h.style.cssText = on
      ? 'background:rgba(232,228,223,.97);backdrop-filter:blur(16px);border-bottom:1px solid rgba(175,165,152,.3)'
      : '';
    b.style.color = on ? '#1c1917' : '#fff';
    document.querySelectorAll('#nav-links a').forEach(a => {
      a.style.color = on ? '#78716c' : 'rgba(255,255,255,.45)';
      a.onmouseover = () => { a.style.color = on ? '#1c1917' : '#fff'; };
      a.onmouseout  = () => { a.style.color = on ? '#78716c' : 'rgba(255,255,255,.45)'; };
    });
    ['mb1','mb2','mb3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.background = on ? '#1c1917' : '#fff';
    });
  }
  window.addEventListener('scroll', () => {
    applyHeader(window.scrollY > (document.getElementById('hero')?.offsetHeight || 600) * 0.5);
  }, { passive: true });

  document.getElementById('menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.toggle('hidden');
  });
  document.getElementById('mobile-close')?.addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.add('hidden');
  });

  /* ── Lien ───────────────────────────────────────────────────── */
  function mkLink(item, light) {
    if (!item.url?.trim()) return '';
    const phone = item.url.startsWith('tel:');
    const cls = light
      ? 'inline-flex items-center gap-1 text-[9px] tracking-[0.15em] uppercase text-white/60 hover:text-white border-b border-white/25 hover:border-white pb-px transition-colors'
      : 'inline-flex items-center gap-1 text-[9px] tracking-[0.15em] uppercase text-stone-400 hover:text-stone-900 border-b border-stone-200 hover:border-stone-700 pb-px transition-colors';
    return `<a href="${esc(item.url)}"${phone?'':' target="_blank" rel="noopener"'} class="${cls}">
      ${phone ? 'Appeler' : '↗ Voir'}
    </a>`;
  }

  /* ── Cartes ─────────────────────────────────────────────────── */
  function renderItem(item) {
    const hasPhoto = item.photo?.trim();
    const pos      = item.objectPosition || 'center';
    const title    = item.title?.trim();
    const rawLayout = item.layout || '1x1';

    /* ── Bannière pleine largeur (legacy highlight + photo) ── */
    if (rawLayout === 'highlight' && hasPhoto) {
      return `
    <article class="block-col-full block-row-2 relative img-zoom rounded-xl overflow-hidden card cursor-default" style="min-height:320px">
      <img src="${esc(item.photo)}" alt="" class="img-zoom-el absolute inset-0 w-full h-full object-cover" style="object-position:${esc(pos)}" loading="lazy" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5"></div>
      <div class="absolute inset-x-0 bottom-0 p-6 md:p-10">
        ${title ? `<h3 class="text-white font-semibold leading-tight mb-3" style="font-size:clamp(20px,2.8vw,34px)">${esc(title)}</h3>` : ''}
        <p class="text-white/65 text-[13px] md:text-[14px] leading-relaxed max-w-xl mb-4 font-light">${esc(item.text)}</p>
        ${mkLink(item, true)}
      </div>
    </article>`;
    }

    /* ── Citation pleine largeur (legacy highlight + texte) ── */
    if (rawLayout === 'highlight') {
      return `
    <article class="block-col-full py-10 md:py-14">
      ${title ? `<h3 class="font-bold text-stone-900 leading-tight mb-3" style="font-size:clamp(22px,3vw,38px);letter-spacing:-0.02em">${esc(title)}</h3>` : ''}
      <p class="text-[15px] md:text-[16px] text-stone-500 leading-relaxed font-light max-w-2xl">${esc(item.text)}</p>
      ${mkLink(item, false) ? `<div class="mt-4">${mkLink(item, false)}</div>` : ''}
    </article>`;
    }

    /* ── Normaliser les anciens formats (NxM = N rangées × M colonnes) ── */
    const layoutKey = rawLayout === 'default' ? '1x1' : rawLayout === 'wide' ? '1x2' : rawLayout;
    const m    = layoutKey.match(/^(\d)x(\d)$/);
    const rows = m ? +m[1] : 1;   // premier chiffre = rangées
    const cols = m ? +m[2] : 1;   // second chiffre  = colonnes
    const colCls  = cols === 3 ? 'block-col-full' : cols === 2 ? 'block-col-2' : '';
    const rowCls  = rows === 2 ? 'block-row-2' : '';
    const sizeCls = [colCls, rowCls].filter(Boolean).join(' ');

    /* ── Carte avec photo ── */
    if (hasPhoto) {
      return `
    <article class="${sizeCls} relative img-zoom rounded-xl overflow-hidden card cursor-default">
      <img src="${esc(item.photo)}" alt="" class="img-zoom-el absolute inset-0 w-full h-full object-cover" style="object-position:${esc(pos)}" loading="lazy" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      <div class="absolute inset-x-0 bottom-0 p-5 md:p-7">
        ${title ? `<h3 class="text-white font-semibold leading-tight mb-1.5" style="font-size:${cols>=2?'20':'17'}px">${esc(title)}</h3>` : ''}
        <p class="text-white/70 text-[12.5px] leading-relaxed mb-2.5 font-light">${esc(item.text)}</p>
        ${mkLink(item, true)}
      </div>
    </article>`;
    }

    /* ── Texte — 8 styles (4 plats + 4 à fond) ── */
    const rawStyle  = item.textStyle || 'editorial';
    // compat : ancien 'citation' (carte crème) → pullquote plat
    const textStyle = rawStyle === 'citation' ? 'pullquote' : rawStyle;
    const wide = cols >= 2;

    /* ── PLAT ─────────────────────────────────────────────────── */

    /* ÉDITO — titre bold + corps, pure typographie */
    if (textStyle === 'editorial') { return `
  <article class="${sizeCls} flex flex-col justify-center gap-3 p-5 md:p-6">
    ${title ? `<h3 class="text-stone-900 font-bold leading-tight" style="font-size:${wide?'clamp(20px,2vw,28px)':'clamp(16px,4vw,20px)'};letter-spacing:-0.025em">${esc(title)}</h3>` : ''}
    <p class="text-stone-500 leading-relaxed font-light" style="font-size:${wide?'15':'13'}px;max-width:52ch">${esc(item.text)}</p>
    ${mkLink(item, false) ? `<div class="mt-1">${mkLink(item, false)}</div>` : ''}
  </article>`; }

    /* PULLQUOTE — guillemet décoratif géant, texte italique, auteur en dessous */
    if (textStyle === 'pullquote') { return `
  <article class="${sizeCls} flex flex-col justify-center p-5 md:p-6">
    <div aria-hidden="true" style="font-size:84px;line-height:.55;color:#d6d3d1;font-family:Georgia,serif;margin-bottom:14px;user-select:none">"</div>
    <p class="text-stone-700 leading-relaxed" style="font-size:${wide?'clamp(15px,1.5vw,19px)':'14px'};font-style:italic;font-weight:300;max-width:56ch">${esc(item.text)}</p>
    ${title ? `<p class="text-stone-400 font-semibold uppercase tracking-[.14em] mt-5" style="font-size:10px">— ${esc(title)}</p>` : ''}
    ${mkLink(item, false) ? `<div class="mt-3">${mkLink(item, false)}</div>` : ''}
  </article>`; }

    /* STAT — titre = chiffre/fait en XXL, corps = légende */
    if (textStyle === 'stat') { return `
  <article class="${sizeCls} flex flex-col justify-center gap-2 p-5 md:p-6">
    ${title ? `<div class="text-stone-900 font-black leading-none" style="font-size:${wide?'clamp(48px,6vw,80px)':'clamp(36px,9vw,56px)'};letter-spacing:-0.04em">${esc(title)}</div>` : ''}
    <p class="text-stone-500 font-light leading-relaxed" style="font-size:${wide?'14':'13'}px;max-width:44ch">${esc(item.text)}</p>
    ${mkLink(item, false) ? `<div class="mt-2">${mkLink(item, false)}</div>` : ''}
  </article>`; }

    /* RUBRIQUE — label petites capitales + corps proéminent */
    if (textStyle === 'rubrique') { return `
  <article class="${sizeCls} flex flex-col justify-center gap-3 p-5 md:p-6">
    ${title ? `<p class="text-stone-400 font-semibold uppercase" style="font-size:9px;letter-spacing:.22em">${esc(title)}</p>` : ''}
    <p class="text-stone-800 leading-relaxed font-light" style="font-size:${wide?'clamp(14px,1.3vw,17px)':'14px'};max-width:54ch">${esc(item.text)}</p>
    ${mkLink(item, false) ? `<div class="mt-1">${mkLink(item, false)}</div>` : ''}
  </article>`; }

    /* ── FOND ─────────────────────────────────────────────────── */

    /* CARTE — fond blanc, ombre légère */
    if (textStyle === 'card') { return `
  <article class="${sizeCls} bg-white rounded-xl p-5 md:p-6 flex flex-col gap-3 card">
    ${title ? `<h3 class="text-stone-900 font-semibold leading-snug" style="font-size:${wide?'18':'16'}px">${esc(title)}</h3>` : ''}
    <p class="text-[13px] text-stone-500 leading-relaxed flex-1 font-light">${esc(item.text)}</p>
    ${mkLink(item, false)}
  </article>`; }

    /* SOMBRE — fond stone-900 */
    if (textStyle === 'sombre') { return `
  <article class="${sizeCls} bg-stone-900 rounded-xl p-5 md:p-6 flex flex-col gap-3 card">
    ${title ? `<h3 class="text-white font-semibold leading-snug" style="font-size:${wide?'18':'16'}px">${esc(title)}</h3>` : ''}
    <p class="text-stone-400 text-[13px] leading-relaxed flex-1 font-light">${esc(item.text)}</p>
    ${mkLink(item, true)}
  </article>`; }

    /* NOTE — fond amber, bordure gauche */
    if (textStyle === 'note') { return `
  <article class="${sizeCls} rounded-xl p-5 md:p-6 flex flex-col gap-3 card" style="background:#fffbeb;border-left:3px solid #f59e0b">
    ${title ? `<h3 class="text-stone-900 font-semibold leading-snug" style="font-size:${wide?'18':'16'}px">${esc(title)}</h3>` : ''}
    <p class="text-stone-600 text-[13px] leading-relaxed flex-1 font-light">${esc(item.text)}</p>
    ${mkLink(item, false)}
  </article>`; }

    /* ENCADRÉ — fond stone-50, bordure stone-200 */
    if (textStyle === 'encadre') { return `
  <article class="${sizeCls} rounded-xl p-5 md:p-6 flex flex-col gap-3 card" style="background:#fafaf9;border:1.5px solid #e7e5e4">
    ${title ? `<h3 class="text-stone-900 font-semibold leading-snug" style="font-size:${wide?'18':'16'}px">${esc(title)}</h3>` : ''}
    <p class="text-stone-500 text-[13px] leading-relaxed flex-1 font-light">${esc(item.text)}</p>
    ${mkLink(item, false)}
  </article>`; }

    /* fallback → édito */
    return `
  <article class="${sizeCls} flex flex-col justify-center gap-3 py-2">
    ${title ? `<h3 class="text-stone-900 font-bold leading-tight" style="font-size:${wide?'clamp(20px,2vw,28px)':'clamp(16px,4vw,20px)'};letter-spacing:-0.025em">${esc(title)}</h3>` : ''}
    <p class="text-stone-500 leading-relaxed font-light" style="font-size:${wide?'15':'13'}px">${esc(item.text)}</p>
    ${mkLink(item, false) ? `<div class="mt-1">${mkLink(item, false)}</div>` : ''}
  </article>`;
  }

  /* ── Album — groupes alternants (style Cheerz / Lalalab) ─────── */

  // Patterns : { n=nb photos, grid=colonnes CSS, h=var hauteur, rows=nb rangées }
  const _ALB_PAT = [
    { n:2, grid:'1fr 1fr',    h:'var(--alb-h2)', rows:1 },               //  1. duo égal
    { n:3, grid:'1fr 1fr 1fr',h:'var(--alb-h3)', rows:1 },               //  2. triptyque
    { n:3, grid:'3fr 2fr',    h:'var(--alb-h4)', rows:2, bigFirst:true }, //  3. portrait gauche + 2 droite
    { n:2, grid:'5fr 3fr',    h:'var(--alb-h2)', rows:1 },               //  4. grand gauche
    { n:3, grid:'2fr 1fr 1fr',h:'var(--alb-h3)', rows:1 },               //  5. trio gauche large
    { n:4, grid:'1fr 1fr',    h:'var(--alb-h4)', rows:2 },               //  6. quad 2×2
    { n:2, grid:'3fr 5fr',    h:'var(--alb-h2)', rows:1 },               //  7. grand droite
    { n:3, grid:'2fr 3fr',    h:'var(--alb-h4)', rows:2, bigLast:true },  //  8. 2 gauche + portrait droite
    { n:3, grid:'1fr 1fr 2fr',h:'var(--alb-h3)', rows:1 },               //  9. trio droite large
    { n:2, grid:'3fr 2fr',    h:'var(--alb-h2)', rows:1 },               // 10. duo inégal
    { n:3, grid:'1fr 2fr 1fr',h:'var(--alb-h3)', rows:1 },               // 11. trio centre large
    { n:4, grid:'1fr 1fr',    h:'var(--alb-h4)', rows:2 },               // 12. quad 2×2 bis
  ];

  // Fallbacks indépendants du tableau (résistants aux modifications de _ALB_PAT)
  const _PAT_SOLO = { n:1, grid:null,           h:'var(--alb-h1)', rows:1 };
  const _PAT_DUO  = { n:2, grid:'1fr 1fr',      h:'var(--alb-h2)', rows:1 };
  const _PAT_TRIO = { n:3, grid:'1fr 1fr 1fr',  h:'var(--alb-h3)', rows:1 };

  // Convertit photo.layout en catégorie pour l'algorithme de groupement
  function _albSz(p) {
    const l = p.layout;
    if (!l || l === '1x1' || l === 'default') return null; // auto
    if (l === '1x3' || l === '2x3') return 'solo';
    if (l === '2x1') return 'tall';
    return 'large'; // 1x2, 2x2
  }

  // Patterns sans tall pour sections classiques (bigFirst/bigLast = 2 colonnes avec 3 items → cassé)
  const _CLS_PAT = _ALB_PAT.filter(p => !p.bigFirst && !p.bigLast);

  // pats : tableau de patterns à utiliser (défaut = _ALB_PAT)
  function _albumGroups(photos, pats) {
    pats = pats || _ALB_PAT;
    const groups = []; let i = 0, pi = 0;
    while (i < photos.length) {
      const photo = photos[i];
      const s = _albSz(photo);
      // Solo forcé
      if (s === 'solo') {
        groups.push({ p: _PAT_SOLO, slice: [photo] }); i++; continue;
      }
      // Tall forcé → portrait-gauche + 2 stacked droite
      if (s === 'tall') {
        const auto = []; let j = i + 1;
        while (j < photos.length && !_albSz(photos[j]) && auto.length < 2) auto.push(photos[j++]);
        if (auto.length === 2) {
          groups.push({ p:{ n:3, grid:'3fr 2fr', h:'var(--alb-h4)', rows:2, bigFirst:true }, slice:[photo,...auto] });
          i = j; pi++; continue;
        }
        if (auto.length === 1) {
          groups.push({ p:{ n:2, grid:'5fr 3fr', h:'var(--alb-h2)', rows:1 }, slice:[photo,auto[0]] });
          i = j; pi++; continue;
        }
        groups.push({ p: _PAT_SOLO, slice: [photo] }); i++; continue;
      }
      // Large forcé → big-left duo avec la photo suivante (si auto)
      if (s === 'large') {
        const next = photos[i + 1];
        if (next && !_albSz(next)) {
          groups.push({ p:{ n:2, grid:'5fr 3fr', h:'var(--alb-h2)', rows:1 }, slice:[photo,next] });
          i += 2; pi++; continue;
        }
        groups.push({ p: _PAT_SOLO, slice: [photo] }); i++; continue;
      }
      // Auto : fin du run avant le prochain forcé
      let autoEnd = i;
      while (autoEnd < photos.length && !_albSz(photos[autoEnd])) autoEnd++;
      const remAuto = autoEnd - i;
      let p = pats[pi % pats.length];
      // Adapter si pas assez de photos pour le pattern courant
      if (remAuto < p.n) {
        if (remAuto === 1) {
          // Éviter de forcer un unique auto isolé en plein format (bien plus grand que les
          // autres) : le regrouper avec la photo forcée "large" qui suit immédiatement, s'il
          // y en a une — plutôt qu'un rendu solo disproportionné.
          const after = photos[autoEnd];
          if (after && _albSz(after) === 'large') {
            groups.push({ p:{ n:2, grid:'3fr 5fr', h:'var(--alb-h2)', rows:1 }, slice:[photo, after] });
            i = autoEnd + 1; pi++; continue;
          }
          p = _PAT_SOLO;
        }
        else if (remAuto === 2) p = _PAT_DUO;
        else if (remAuto === 3) p = _PAT_TRIO;
      }
      let n = Math.min(p.n, remAuto);
      // Look-ahead : si prendre n laisserait exactement 1 orphelin → ajuster
      if (remAuto - n === 1) {
        if (n + 1 <= 3) { // Élargir : prendre 1 de plus
          n++; p = n === 2 ? _PAT_DUO : _PAT_TRIO;
        } else {           // Rétrécir : prendre 1 de moins → laisse 2 (duo)
          n--; p = n === 3 ? _PAT_TRIO : n === 2 ? _PAT_DUO : _PAT_SOLO;
        }
      }
      groups.push({ p, slice: photos.slice(i, i + n) });
      i += n; pi++;
    }
    return groups;
  }

  /* ── Favoris utilisateur (localStorage) ──────────────────────── */
  const _FAV_KEY = 'mq_alb_favs';
  function _photoHash(src) {
    let h = 0;
    for (let i = 0; i < Math.min(src.length, 400); i++) h = (h * 31 + src.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function _favSet() { try { return new Set(JSON.parse(localStorage.getItem(_FAV_KEY)||'[]')); } catch { return new Set(); } }
  function _favSave(s) { localStorage.setItem(_FAV_KEY, JSON.stringify([...s])); }
  function toggleFav(el, e) {
    e.stopPropagation();
    const favs = _favSet();
    if (favs.has(el.dataset.fk)) { favs.delete(el.dataset.fk); el.classList.remove('is-fav'); }
    else { favs.add(el.dataset.fk); el.classList.add('is-fav'); }
    _favSave(favs);
  }

  function renderAlbumSection(section) {
    const photos = section.photos || [];
    if (!photos.length) {
      return `<div style="padding:52px 0;text-align:center;color:#a8a29e;font-size:13px;font-style:italic">Album vide</div>`;
    }
    const pData = JSON.stringify(photos.map((p, i) => ({ i, src:p.src, caption:p.caption||'' })));
    const groups = _albumGroups(photos);
    const favs = _favSet();
    let idx = 0;

    const groupsHtml = groups.map(({ p, slice }) => {
      const cells = slice.map((photo, ci) => {
        const i = idx++;
        const fk = _photoHash(photo.src);
        const span = (p.bigFirst && ci === 0) || (p.bigLast && ci === slice.length - 1)
          ? ' style="grid-row:span 2"' : '';
        return `<div class="album-cell" data-idx="${i}" onclick="openLightbox(this)"${span}>
          <img src="${esc(photo.src)}" alt="${esc(photo.caption||'')}" loading="lazy" />
          <span class="album-star${favs.has(fk)?' is-fav':''}" data-fk="${fk}" onclick="toggleFav(this,event)">★</span>
        </div>`;
      }).join('');

      const g = 'var(--alb-gap)';
      const style = p.rows === 2
        ? `display:grid;grid-template-columns:${p.grid};grid-template-rows:1fr 1fr;gap:${g};height:${p.h}`
        : p.grid
          ? `display:grid;grid-template-columns:${p.grid};gap:${g};height:${p.h}`
          : `display:grid;grid-template-columns:1fr;height:${p.h}`; /* solo : grid 1col = album-cell hérite bien de la hauteur */

      return `<div style="${style}">${cells}</div>`;
    }).join('');

    return `<div class="album-section" data-album-photos="${esc(pData)}"
      style="display:flex;flex-direction:column;gap:var(--alb-gap)">${groupsHtml}</div>`;
  }

  /* ── Lightbox ────────────────────────────────────────────────── */
  const _lb = { photos: [], idx: 0 };

  function openLightbox(el) {
    const idx = +el.dataset.idx;
    const container = el.closest('[data-album-photos]');
    try { _lb.photos = JSON.parse(container.dataset.albumPhotos); } catch { return; }
    _lb.idx = idx;
    _lbShow();
    const lb = document.getElementById('lightbox');
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.body.style.overflow = '';
  }

  function lbNav(dir) {
    if (_lb.photos.length < 2) return;
    _lb.idx = (_lb.idx + dir + _lb.photos.length) % _lb.photos.length;
    _lbShow();
  }

  function _lbShow() {
    const p = _lb.photos[_lb.idx];
    const img = document.getElementById('lb-img');
    img.style.opacity = '0';
    img.src = p.src;
    img.onload = () => { img.style.opacity = '1'; };
    img.alt = p.caption || '';
    document.getElementById('lb-caption').textContent = p.caption || '';
    document.getElementById('lb-counter').textContent = (_lb.idx + 1) + ' / ' + _lb.photos.length;
    const multi = _lb.photos.length > 1;
    document.getElementById('lb-prev').style.display = multi ? 'flex' : 'none';
    document.getElementById('lb-next').style.display = multi ? 'flex' : 'none';
    // Étoile favori
    const lbs = document.getElementById('lb-star');
    const fk = _photoHash(p.src);
    lbs.dataset.fk = fk;
    lbs.classList.toggle('is-fav', _favSet().has(fk));
  }

  function toggleFavLb() {
    const lbs = document.getElementById('lb-star');
    const fk = lbs.dataset.fk;
    const favs = _favSet();
    if (favs.has(fk)) { favs.delete(fk); lbs.classList.remove('is-fav'); }
    else              { favs.add(fk);    lbs.classList.add('is-fav'); }
    _favSave(favs);
    // Sync l'étoile dans la grille si elle est visible
    const gridStar = document.querySelector(`.album-star[data-fk="${fk}"]`);
    if (gridStar) gridStar.classList.toggle('is-fav', favs.has(fk));
  }

  document.addEventListener('keydown', function(e) {
    if (document.getElementById('lightbox').style.display === 'none') return;
    if (e.key === 'Escape')       closeLightbox();
    if (e.key === 'ArrowLeft')    lbNav(-1);
    if (e.key === 'ArrowRight')   lbNav(1);
  });

  // Swipe touch
  let _lbTouch = null;
  document.getElementById('lightbox')?.addEventListener('touchstart', function(e) {
    _lbTouch = { x: e.touches[0].clientX };
  }, { passive: true });
  document.getElementById('lightbox')?.addEventListener('touchend', function(e) {
    if (!_lbTouch) return;
    const dx = e.changedTouches[0].clientX - _lbTouch.x;
    _lbTouch = null;
    if (Math.abs(dx) > 50) lbNav(dx > 0 ? -1 : 1);
  });
  // Clic sur fond = fermer
  document.getElementById('lightbox')?.addEventListener('click', function(e) {
    if (e.target === this) closeLightbox();
  });

  /* ── Section classique — layout album-style ─────────────────── */
  function renderClassicSection(section) {
    const items = (section.items || []).filter(i => i.text?.trim() || i.photo?.trim());
    if (!items.length) return '';
    const g = 'var(--sec-gap)';

    function lyAuto(it) { const l = it.layout || '1x1'; return !l || l === '1x1' || l === 'default'; }

    // Sections 100% auto → cycling album (duos/trios/quads variés)
    // Sections avec items forcés → grille 3-col CSS native (block-col-2, block-row-2 fonctionnent)
    const allAuto = items.every(lyAuto);

    if (allAuto) {
      const rows = [];
      _albumGroups(items, _CLS_PAT).forEach(({ p, slice }) => {
        const cols = p.grid || '1fr';
        rows.push(`<div style="display:grid;grid-template-columns:${cols};grid-auto-rows:minmax(220px,auto);gap:${g}">${
          slice.map(it => renderItem({...it, layout:'1x1'})).join('')
        }</div>`);
      });
      return `<div style="display:flex;flex-direction:column;gap:${g}">${rows.join('')}</div>`;
    }

    // Grille 3-col : block-col-2 = 2/3 larg, block-col-full = pleine larg, block-row-2 = tall
    return `<div style="display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:minmax(220px,auto);gap:${g}">${
      items.map(it => renderItem(it)).join('')
    }</div>`;
  }

  /* ── Section ─────────────────────────────────────────────────── */
  function render(d) {
    document.title = 'Guide ' + d.meta.title;

    /* Hero */
    document.getElementById('hero-title').textContent    = d.meta.title;
    document.getElementById('hero-subtitle').textContent = d.meta.subtitle;
    const ci = document.getElementById('cover-img');
    ci.style.objectPosition = d.meta.coverObjectPosition || 'center';
    if (d.meta.coverImage) {
      if (ci.getAttribute('src') !== d.meta.coverImage) {
        ci.style.opacity = '0';
        ci.onload = () => { ci.style.opacity = '1'; };
        ci.src = d.meta.coverImage;
      }
    } else {
      ci.style.opacity = '0'; ci.src = '';
    }

    /* Header brand + footer (générique, plus de "Martinique" en dur) */
    const brand = document.getElementById('header-brand');
    if (brand) brand.textContent = d.meta.title;
    const footerLabel = document.getElementById('footer-label');
    if (footerLabel) footerLabel.textContent = 'Guide personnel · ' + d.meta.title;

    /* Nav */
    document.getElementById('nav-links').innerHTML = d.sections.map(s =>
      `<a href="#${s.id}" style="color:${_scrolled?'#78716c':'rgba(255,255,255,.45)'};font-weight:500"
        class="text-[10px] tracking-[0.2em] uppercase transition-colors whitespace-nowrap"
        onmouseover="this.style.color='${_scrolled?'#1c1917':'#fff'}'"
        onmouseout="this.style.color='${_scrolled?'#78716c':'rgba(255,255,255,.45)'}'">
        ${esc(s.title)}
      </a>`
    ).join('');

    /* Nav mobile */
    document.getElementById('mobile-nav').innerHTML = d.sections.map(s =>
      `<a href="#${s.id}" onclick="document.getElementById('mobile-menu').classList.add('hidden')"
        class="text-white/70 hover:text-white text-sm tracking-[0.2em] uppercase font-medium transition-colors">
        ${esc(s.title)}
      </a>`
    ).join('');

    /* Sections */
    document.getElementById('content').innerHTML = d.sections.map((s, i) => `
      <section id="${s.id}" class="scroll-mt-24 mb-14 md:mb-20">
        <div class="flex items-center justify-between gap-4 mb-5 pb-4"
          style="border-bottom:1px solid rgba(160,150,140,.35)">
          <div class="flex items-center gap-3.5">
            <span class="text-[10px] tabular-nums tracking-[0.28em] text-stone-400 font-light select-none">
              ${String(i+1).padStart(2,'0')}
            </span>
            <div class="w-px h-3.5 bg-stone-400/40"></div>
            <h2 class="text-[14px] font-semibold text-stone-800 tracking-[0.06em] uppercase">${esc(s.title)}</h2>
          </div>
          <div class="w-8 h-8 shrink-0 text-stone-700">${illus(s.icon || s.id)}</div>
        </div>
        ${s.type === 'album' ? renderAlbumSection(s) : renderClassicSection(s)}
      </section>
    `).join('');

    applyHeader(_scrolled);
  }

  /* ── Initialisation par site ──────────────────────────────────── */
  const EMPTY = { meta: { title: '', subtitle: '', coverImage: '' }, sections: [] };

  function init(config) {
    config = config || {};
    const KEY = config.localStorageKey;
    const dataUrl = config.dataUrl || './data.json';
    if (!KEY) throw new Error('GuideEngine.init: localStorageKey requis');

    const cached = (() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch {} return null; })();
    render(cached || EMPTY);

    fetch(dataUrl + '?' + Date.now())
      .then(r => r.ok ? r.json() : null)
      .then(fetched => {
        if (!fetched) return;
        // localStorage admin toujours prioritaire sur data.json local (potentiellement périmé)
        const stored = (() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch {} return null; })();
        if (stored && (stored._ts || 0) >= (fetched._ts || 0)) return;
        try { localStorage.setItem(KEY, JSON.stringify(fetched)); } catch {}
        render(fetched);
      })
      .catch(() => {});

    window.addEventListener('storage', () => {
      const d = (() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch {} return null; })();
      if (d) render(d);
    });
    window.addEventListener('pageshow', e => {
      if (e.persisted) { const d = (() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch {} return null; })(); render(d || EMPTY); }
    });
  }

  // Fonctions référencées par les onclick="" générés dans le HTML
  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;
  window.lbNav = lbNav;
  window.toggleFav = toggleFav;
  window.toggleFavLb = toggleFavLb;

  window.GuideEngine = {
    init,
    // Primitives de rendu exposées pour réutilisation par l'admin (miroir visuel).
    // Additif uniquement — ne change rien au comportement du site public.
    renderItem, renderClassicSection, renderAlbumSection,
    _albumGroups, _ALB_PAT, _CLS_PAT, _PAT_SOLO, _PAT_DUO, _PAT_TRIO, _albSz,
    illus, esc,
  };
})();
