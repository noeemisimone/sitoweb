# Overview — Design System: "Deep Field"

Un linguaggio visivo scuro, cinematografico e *vivo*, ispirato all'osservazione
dello spazio profondo. L'obiettivo: far provare un po' dell'**Overview effect** —
lo stupore degli astronauti nel guardare il cosmo — direttamente sullo schermo.

Implementazione: `static/css/style.css` (base) + `static/css/deepfield.css`
(layer identità, caricato dopo e prevalente) + `static/js/space.js` (motore di
movimento) + `static/js/app.js` (loader). Nessun build step, nessuna dipendenza.

---

## 1. Palette

| Token | Valore | Uso |
|-------|--------|-----|
| `--space-0` | `#03040a` | vuoto più profondo (sfondo canvas) |
| `--space-1` | `#070912` | base pagina |
| `--space-2` | `#0c0f1d` | superfici sollevate |
| `--ink` | `#eef0ff` | testo primario |
| `--ink-dim` | `#9aa0c4` | testo secondario |
| `--blue` (`--accent`) | `#8ea2ff` | accento primario |
| `--violet` | `#b98cff` | nebulosa / secondo accento |
| `--cyan` | `#7fe9ff` | stella fredda (dettagli) |
| `--star` | `#ffd6a6` | stella calda (badge, highlight) |
| `--danger` | `#ff6f85` | azioni distruttive |

Gradiente firma: `--grad-cosmic` (blu → viola → ciano) per bordi, underline,
bottoni primari; `--grad-text` (bianco → blu → viola) per i titoli in clip-text.

## 2. Tipografia

- **Display / UI**: *Space Grotesk* (400–700). Titoli enormi con `clamp()`,
  tracking negativo (`-0.03/-0.05em`), spesso in **gradient clip-text** con
  `drop-shadow` come alone.
- **Editoriale / emozione**: *Spectral* corsivo per tagline, didascalie, note e
  spiegazioni NASA — dà un tono "diario del cosmo".
- **Eyebrow**: maiuscoletto spaziato (`0.34em`) blu, con trattino luminoso.

## 3. Componenti

- **Glass**: superfici in vetro smerigliato (`backdrop-filter: blur`) con bordo
  chiaro a 1px, ombra profonda e bagliore d'accento. Applicato a card, navbar,
  console di auth, voci timeline.
- **Navbar**: barra flottante a pillola, sticky, con underline animata a
  gradiente sui link.
- **Bottoni**: pillole con **shine sweep** all'hover, glow, e **magnetismo** che
  segue il cursore (solo pointer fine). Primario = gradiente cosmico.
- **Card**: glass + lift + alone d'accento all'hover; le card cliccabili
  (atlante, date) hanno **tilt 3D** e zoom immagine.
- **Hero immagini NASA** (`.shot`): grandi, cinematografiche, con **Ken Burns**
  (zoom lento), velo sfumato e titolo in overlay.

## 4. Linguaggio del movimento

Easing firma: `cubic-bezier(0.16, 0.84, 0.30, 1)`.

- **Sfondo cosmico animato** (`#space-bg`): campo stellare con brillio, nebulose
  alla deriva, parallasse del mouse.
- **Hero galassia** (home): vortice a spirale logaritmica che ruota con nucleo
  luminoso e bloom.
- **Scia di stelle** che segue il cursore (`#cursor-fx`).
- **Scroll-reveal**: ingresso in fade/slide degli elementi (`[data-reveal]`),
  con **cascata** sulle griglie (`data-reveal="grid"`).
- **Contatori animati** nelle statistiche del profilo (`[data-count]`).
- **Loader cosmico** all'avvio (orbita + astro).

## 5. Regole non negoziabili

- **Performance**: `requestAnimationFrame`, particelle limitate,
  `devicePixelRatio` ≤ 2, animazioni in **pausa** quando la tab è nascosta,
  canvas sempre `pointer-events: none` (mai bloccano i click).
- **Accessibilità**: `@media (prefers-reduced-motion: reduce)` riduce tutto a
  fotogrammi statici e spegne parallasse/scia/reveal. Lo scroll-reveal è attivo
  solo con la classe `.js` su `<html>`: senza JS, nessun contenuto resta nascosto.
- **Responsive**: hero e tipografia con `clamp()`, griglie fluide, navbar
  compatta su mobile.
- **Contratto Flask intatto**: la grafica è solo presentazione. Route, `url_for`,
  `<form>` (action/method/`name`/CSRF/campi WTForms), variabili e cicli Jinja,
  e gli ID usati dal JS (modali, loader, sfondo-compleanno) non si toccano.
