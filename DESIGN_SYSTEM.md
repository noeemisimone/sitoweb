# myWeather — Design System

> **Tema:** scrapbook / collage — rosa, menta, crema, gingham, polka dot, nastro washi, sticker e timbri.
> **Fonte unica di verità:** [static/css/style.css](static/css/style.css) (2029 righe).
> **Stile visivo:** neobrutalismo "kawaii" — bordi spessi neri, ombre dure (no blur), rotazioni leggere, pseudo-elementi decorativi (nastri + sticker), animazioni "pop" entranti.

---

## 1. Filosofia visiva

Il sito imita una **pagina di diario / album di ritagli**:

- Ogni blocco è un **ritaglio** appoggiato sul foglio: bordo nero, ombra dura sotto, leggera rotazione.
- I blocchi sono **fissati al foglio** con due decorazioni ricorrenti:
  - **Washi tape** (nastro adesivo giallo semitrasparente) — pseudo-elemento `::before`.
  - **Sticker rotondo con etichetta** (`FRESH!`, `CIAO!`, `OOPS!`, `ALERT!`, `ME!`, `SEARCH!`, `YES!`, `HEY!`) — pseudo-elemento `::after`.
- Lo sfondo del `body` è una **griglia a quaderno** in lavanda.
- I pulsanti sono **pill** (`border-radius: 999px`) con bordo nero spesso e ombra dura, sempre con leggera rotazione.
- Le animazioni d'ingresso sono giocose (`cubic-bezier(0.34, 1.56, 0.64, 1)` — overshoot tipo "molla").

---

## 2. Design tokens

Tutti i token sono dichiarati come **CSS custom properties** sul `:root` ([style.css:12-29](static/css/style.css#L12-L29)).

### 2.1 Colori

| Token             | Hex                          | Uso principale                                              |
| ----------------- | ---------------------------- | ----------------------------------------------------------- |
| `--bg`            | `#ebe1f3`                    | Sfondo body (lavanda chiarissima, "quaderno")               |
| `--pink-soft`     | `#ffd9e6`                    | Fondi card auth, hero, accenti soft                         |
| `--pink-medium`   | `#ff9dc8`                    | Pattern gingham, polka dot del footer                       |
| `--pink-bright`   | `#ff5fa2`                    | **Brand primario** — navbar, CTA, marquee                   |
| `--pink-deep`     | `#e9367d`                    | Headings (h1/h2), accenti decisi                            |
| `--mint`          | `#c4dbb8`                    | Fondi search, badge umidità, alert success                  |
| `--green`         | `#97b88a`                    | Badge "NEXT HOURS"                                          |
| `--green-deep`    | `#6b8d5e`                    | Temperatura grande, hover CTA primarie                      |
| `--cream`         | `#fff8e0`                    | Footer, label form, link navbar                             |
| `--yellow`        | `#fde9a3`                    | Brand chip, sticker `CIAO!`/`FRESH!`, post-it alert         |
| `--yellow-deep`   | `#f4d35e`                    | Alert warning, accenti                                      |
| `--lavender`      | `#d9c8eb`                    | Fondi "saved cities", card forecast #4                      |
| `--white`         | `#ffffff`                    | Riquadri interni leggibilità, polaroid                      |
| `--ink`           | `#2d2d3a`                    | **Testo principale, bordi, ombre dure**                     |
| `--ink-soft`      | `#5a5a6a`                    | Placeholder, testi secondari                                |
| `--tape`          | `rgba(255, 230, 130, 0.55)`  | Washi tape (nastro adesivo decorativo)                      |

**Selection:** `background: var(--pink-bright); color: white`.

### 2.2 Tipografia

Le font sono caricate da Google Fonts in [templates/base.html:9](templates/base.html#L9):

```
Bowlby One · Caveat (400-700) · Fredoka (400-700) · Permanent Marker · Quicksand (400-700)
```

| Family                          | Ruolo                                   | Caratteristiche                                                                  |
| ------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| **`"Bowlby One"`**              | **Display** — titoli h1/h2, brand, CTA  | Grottesco grasso, sempre `font-weight: 400`, `text-transform: uppercase`, `letter-spacing` 0–3px |
| **`"Fredoka"`**                 | **UI / body** — paragrafi, label, nav   | Sans rotonda; pesi 500 (body) / 700 (label, microcopy)                          |
| **`"Caveat"`**                  | **Handwritten** — descrizioni, alert, link auth, errori | Manoscritta, pesi 700, spesso con `text-transform: lowercase`                  |
| `"Quicksand"`                   | Fallback per Fredoka                    | —                                                                                |
| `"Permanent Marker"`            | Caricata ma non usata (lasciata in reserve) | —                                                                              |

**Root size:** `html { font-size: 17px }` — quindi `1rem = 17px`.
**Body:** `font-family: "Fredoka", "Quicksand", sans-serif`, `line-height: 1.55`, `font-weight: 500`.

#### Scala fluida ricorrente

I titoli usano `clamp()` per essere responsive senza media query:

| Elemento            | `clamp(min, vw, max)`        |
| ------------------- | ---------------------------- |
| `.hero h1`          | `clamp(2.8rem, 10vw, 6rem)`  |
| `.hero-temp`        | `clamp(5rem, 18vw, 10rem)`   |
| `.forecast h2`      | `clamp(2.5rem, 6vw, 4rem)`   |
| `.auth h1`          | `clamp(1.8rem, 6vw, 2.6rem)` |
| `.search-temp`      | `clamp(3rem, 10vw, 4.5rem)`  |
| `.saved-cities h2`  | `clamp(2rem, 5vw, 3rem)`     |

#### Pattern testo "stampato"

Ogni titolo display usa un **doppio text-shadow** che simula la stampa offset:

```css
text-shadow:
    2px 2px 0 white,      /* highlight bianco */
    4px 4px 0 var(--ink); /* ombra nera */
```

### 2.3 Spaziature

Non ci sono token espliciti — si usa `rem` con valori ricorrenti:

| Scala | Valore   | Uso tipico                  |
| ----- | -------- | --------------------------- |
| xs    | `0.4rem` | gap interni a card piccole  |
| sm    | `0.8rem` | gap nav                     |
| md    | `1.2rem` | gap form                    |
| lg    | `2rem`   | padding interno blocchi     |
| xl    | `3rem`   | margine tra sezioni         |
| xxl   | `4rem`   | padding hero verticale      |

**Container:** `main { max-width: 1100px; margin: 0 auto; padding: 3rem 1.5rem 4rem }`.

### 2.4 Bordi & raggi

| Token implicito        | Valore             | Uso                                                |
| ---------------------- | ------------------ | -------------------------------------------------- |
| Bordo "carta"          | `3-5px solid var(--ink)` | Tutti i blocchi e i pulsanti                  |
| `border-radius: 0`     | —                  | Blocchi "ritaglio" (hero, forecast, auth, modal…) |
| `border-radius: 12-16px` | —                | Input, card piccole (city tile, profile-row)       |
| `border-radius: 999px` | pill               | **Tutti** i pulsanti, badge, sticker, label form   |

### 2.5 Ombre dure (signature neobrutalist)

Le ombre **non hanno mai blur**: sono offset solidi neri (o colorati per gerarchia).

| Pattern                  | CSS                                | Uso                                         |
| ------------------------ | ---------------------------------- | ------------------------------------------- |
| Ombra micro              | `2-3px 2-3px 0 var(--ink)`         | Label, badge, input                          |
| Ombra media              | `4-5px 4-5px 0 var(--ink)`         | Pulsanti, card piccole                       |
| Ombra grande             | `8-10px 8-10px 0 var(--ink)`       | Blocchi-ritaglio principali (hero, auth…)    |
| Ombra colorata           | `10px 10px 0 var(--mint)` / `var(--pink-bright)` | Variazione per gerarchia visiva |
| Ombra hover              | offset aumentato + `translate(-2px, -2px)` | Tutti gli elementi interattivi      |
| Ombra active             | offset ridotto + `translate(2px, 2px)`     | Feedback click                              |

### 2.6 Rotazioni

Quasi ogni elemento ha una **rotazione leggera** per simulare oggetti incollati a mano:

- Blocchi grandi: `-1.5deg` … `+1.5deg`
- Card piccole: `-3deg` … `+3deg`
- Sticker `::after`: `+8deg` … `+12deg` (animati con `wiggle`)
- Washi tape `::before`: `-12deg` … `-5deg`
- Hover: spesso **annullano** la rotazione (`rotate(0)`) per dare sensazione di "rialzo".

---

## 3. Cursore custom

Il sito ha un cursore SVG inline (a forma di freccia/stella scarabocchiata) ([style.css:34-42](static/css/style.css#L34-L42)):

- **Default** — colore `--pink-deep` con stroke bianco.
- **Pointer** (su `a, button, .forecast-card, .navbar-links a`) — colore `--green-deep`.
- **Text** (`input, textarea`) — `cursor: text` standard.

---

## 4. Pattern decorativi riusabili

### 4.1 Washi tape (`::before`)

Nastro adesivo giallo semitrasparente. Usato su: `.hero`, `.rain-warning`, `.auth`, `.search`, `.profile`, `.modal-card`, `.alert`, `.forecast`, `.forecast-card`, `.search-result`, `.search-empty`.

```css
.element::before {
    content: "";
    position: absolute;
    top: -14px;            /* sporge sopra il bordo */
    left: 30px;            /* o left: 50% + translateX(-50%) per centrato */
    width: 110px;
    height: 26px;
    background: var(--tape);
    border-left: 1.5px dashed rgba(0,0,0,0.12);   /* bordi "strappati" */
    border-right: 1.5px dashed rgba(0,0,0,0.12);
    transform: rotate(-10deg);
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);        /* unica ombra con blur del sistema */
    z-index: 5;
}
```

### 4.2 Sticker rotondo (`::after`)

Etichetta circolare con testo in maiuscolo. Le varianti viste:

| Etichetta  | Sfondo              | Posizione                |
| ---------- | ------------------- | ------------------------ |
| `FRESH!`   | `--yellow`          | Hero, top-right          |
| `ALERT!`   | `--pink-bright`     | Rain warning, top-right  |
| `CIAO!`    | `--yellow`          | Auth, top-right          |
| `SEARCH!`  | `--pink-bright`     | Search, top-right        |
| `ME!`      | `--mint`            | Profile, top-right       |
| `OOPS!`    | `--pink-bright`     | Modal + alert-error      |
| `YES!`     | `--green-deep`      | Alert success            |
| `HEY!`     | `--yellow`          | Alert warning            |
| `#0N`      | colori vari         | Forecast card (numerate via `counter()`) |

```css
.element::after {
    content: "FRESH!";
    position: absolute;
    top: -22px;
    right: -10px;
    background: var(--yellow);
    color: var(--ink);
    font-family: "Bowlby One", sans-serif;
    font-size: 1.05rem;
    padding: 0.5rem 0.9rem;
    border: 3px solid var(--ink);
    border-radius: 999px;
    transform: rotate(12deg);
    box-shadow: 3px 3px 0 var(--ink);
    letter-spacing: 1.5px;
    animation: wiggle 2s ease-in-out infinite;
}
```

### 4.3 Bordo strappato (top-strip SVG)

Navbar e footer hanno un bordo "strappato" lungo SVG con `path` zigzag ([style.css:78-88](static/css/style.css#L78-L88), [style.css:1797-1806](static/css/style.css#L1797-L1806)).

### 4.4 Pattern di sfondo (background-image)

Riusati come **firma visiva** di ogni sezione:

| Pattern         | CSS                                                                                 | Sezioni                          |
| --------------- | ----------------------------------------------------------------------------------- | -------------------------------- |
| **Quadernetto** | doppio `linear-gradient` 1px in `rgba(45,45,58,0.05)` su 28px                       | `body`                           |
| **Quaderno righe** | `repeating-linear-gradient` orizzontale + 1 verticale rosa (margine)             | `.forecast`                      |
| **Gingham**     | doppio `linear-gradient(45deg)` con offset 32-14px                                   | `.hero`, `.forecast-card:nth-child(2)`, `.profile` |
| **Polka pieno** | `radial-gradient(circle, var(--…) 3px, transparent 4px)` su 22-28px                  | `.auth`, `.search`, `.forecast-card:nth-child(1/3/4)`, `.saved-cities`, `footer`, `.modal-card` |

---

## 5. Componenti

### 5.1 Navbar (`.navbar`)

- Fascia `--pink-bright` con bordo zigzag SVG in basso.
- `.navbar-brand`: chip giallo ruotato `-3deg`, font Bowlby One, doppio text-shadow.
- `.navbar-links a`: pill bianche/cream/menta/rosa (colori alternati via `nth-child`), font Fredoka 700 uppercase.
- `.navbar-user`: variante con font Caveat e prefisso `✦`.
- **Hover**: `translate(-2px, -2px) rotate(-3deg)` + ombra aumentata.

### 5.2 Hero (`.hero`)

Polaroid grande in rosa gingham, ruotata `-1.2deg`, con washi tape + sticker `FRESH!`.

- `.hero h1`: titolo display gigante, ogni lettera è uno `<span class="hero-letter">` animata in cascata (`letter-bounce`). `nth-child(2n)` verde, `nth-child(3n)` rosa.
- `.hero-temp`: temperatura in card bianca con bordo nero, ruotata `+2deg`.
- `.hero-description`: Caveat 1.9rem con `✿` decorativi.
- `.hero-humidity`: pill menta con bordo nero.

### 5.3 Save city button (`.save-city-btn`)

Cuore rotondo `54x54px` posizionato `top: -16px; right: -16px` sulla `.search-result`. Cambia colore da `--pink-soft` a `--pink-bright` su hover.

### 5.4 Marquee (`.marquee`, `.marquee-track`)

Nastro rosa scorrevole (animazione `marquee-scroll` 22s linear infinite). Font Bowlby One 1.9rem, ogni `span:nth-child(2n)` è giallo.

### 5.5 Rain warning (`.rain-warning`)

Post-it giallo ruotato `+1.5deg`, washi tape centrato, sticker `ALERT!` in alto a destra.

### 5.6 Forecast (`.forecast`, `.forecast-card`, `.forecast-row`)

- Container `.forecast`: foglio bianco con pattern quaderno (righe orizzontali + margine rosso verticale), badge centrale `★ NEXT HOURS ★`.
- `.forecast-row`: `grid-template-columns: repeat(auto-fit, minmax(190px, 1fr))`.
- 4 card con **pattern di sfondo e rotazioni alternate** (polka rosa, gingham menta, polka mint, polka lavanda).
- Ogni card è numerata via `counter-increment` → badge `#01..#04` come sticker `::after`.
- Sotto-elementi (`.forecast-time`, `.forecast-temp`, `.forecast-description`) sono **riquadri bianchi** con bordo + ombra per leggibilità sul pattern.

### 5.7 Form auth (`.auth`, `.auth-form`, `.form-field`)

- Container rosa con polka dot, ruotato `-1deg`.
- `.form-field label`: chip pill cream con bordo nero (non un label "piatto").
- `.form-field input`: bordo 3px, ombra 4px, **al focus diventa giallo** + traslazione.
- `.auth-submit`: pill rosa-bright, font Bowlby One uppercase, hover diventa `--green-deep`.

### 5.8 Alert (`.alert`, `.alert-error`, `.alert-success`, `.alert-warning`)

- Base: rettangolo con washi tape centrato in alto.
- 3 varianti per categoria, ognuna con sticker `::after` diverso:
  - **error** → fondo `--pink-soft`, sticker `OOPS!` rosa.
  - **success** → fondo `--mint`, sticker `YES!` verde.
  - **warning** → fondo `--yellow-deep`, sticker `HEY!` giallo.

### 5.9 Search (`.search`, `.search-form`, `.search-result`, `.search-empty`)

- `.search`: container menta con polka verde.
- `.search-result`: polaroid bianca con ombra rosa, washi tape centrato.
- `.search-empty`: post-it giallo con washi tape rosa (`--tape-pink` con fallback inline).
- `.form-errors li`: chip Caveat 1.1rem giallo, ruotato `-1deg`.

### 5.10 Profile (`.profile`, `.profile-info`, `.profile-row`)

- Container cream con gingham rosa soft, sticker `ME!` menta.
- Ogni `.profile-row` è una card bianca con label rosa + valore Bowlby.
- `.logout-btn`: identico stile a `.auth-submit` / `.btn-primary` (pill rosa bright).

### 5.11 Modal (`.modal-overlay`, `.modal-card`)

- Overlay `rgba(45,45,58,0.55)` + `backdrop-filter: blur(2px)`.
- `.modal-card`: scrapbook bianca a pois rosa, ombra `--pink-bright`, sticker `OOPS!`.
- **Animazione di apertura**: `scale(0.4) → 1` con cubic-bezier overshoot (0.4s).
- `body.modal-open { overflow: hidden }` per lock scroll.
- 2 azioni: `.btn-cancel` (menta) e `.btn-confirm` (rosa-deep).

### 5.12 Saved cities (`.saved-cities`, `.saved-cities-list`, `.saved-city`)

- Container lavanda con polka nera.
- Lista **orizzontale scrollabile** con `scroll-snap-type: x proximity`.
- Scrollbar **custom** in stile scrapbook (rosa-bright su pink-soft, bordi neri).
- Card alternate di colore tramite `nth-child(2n/3n/4n)` (giallo/menta/rosa).
- `.btn-danger`: pill rosa-deep piccola per delete.

### 5.13 Footer (`footer`, `.footer-inner`, `.footer-brand`)

Cream a pois rosa, bordo zigzag SVG in alto, brand chip giallo identico alla navbar.

### 5.14 Effetti meteo (`.weather-fx`, `.fx-particle`)

- 10 particelle (`✦`) posizionate a `left: 5%..94%` con `animation-delay` scalati.
- Variante `.weather-fx--cold` → animazione `fx-fall` (10s linear): cadono dall'alto fino oltre la viewport, con rotazione 360°.

### 5.15 Party mode (`.party-mode`, `.party-sticker`)

- `body.party-mode` → `hue-rotate` 0-360deg loop infinito.
- Elementi chiave (`.hero`, `.forecast-card`, `.rain-warning`, `.forecast`, `.navbar-brand`) → wiggle `-4deg ↔ +4deg`.
- `.party-sticker` fisso al centro: scritta gigante rosa-bright con doppio box-shadow nero+giallo.

---

## 6. Animazioni

| Keyframe                | Durata           | Easing                                  | Uso                                  |
| ----------------------- | ---------------- | --------------------------------------- | ------------------------------------ |
| `hero-pop`              | 0.6s             | `cubic-bezier(0.34, 1.56, 0.64, 1)`     | `.hero`, `.auth`, `.search`, `.profile` |
| `letter-bounce`         | 0.5s             | overshoot                               | `.hero-letter` (cascata)             |
| `wiggle`                | 2s infinite      | `ease-in-out`                           | Sticker `::after`                    |
| `card-pop`              | 0.6s (delay scalato 0.2-0.5s) | overshoot                | `.forecast-card`, `.search-result`   |
| `marquee-scroll`        | 22s infinite     | `linear`                                | `.marquee-track`                     |
| `fx-fall`               | 10s infinite     | `linear`                                | `.fx-particle` (cold weather)        |
| `party-hue`             | 1s infinite      | `linear`                                | `body.party-mode`                    |
| `party-wiggle`          | 0.4s alternate   | `ease-in-out`                           | Componenti in party mode             |
| `party-sticker-pop` / `-wiggle` | 0.4s + 0.5s alternate | overshoot                       | `.party-sticker`                     |

### Easing signature

```css
cubic-bezier(0.34, 1.56, 0.64, 1)   /* overshoot "molla" — TUTTI gli ingressi pop */
```

### Microinterazioni (hover/active)

Pattern universale di interazione:

```css
.thing { box-shadow: 4px 4px 0 var(--ink); transition: transform 0.15s ease, box-shadow 0.15s ease; }
.thing:hover  { transform: translate(-2px, -2px) rotate(-1deg); box-shadow: 6px 6px 0 var(--ink); }
.thing:active { transform: translate(2px, 2px);                 box-shadow: 2px 2px 0 var(--ink); }
```

---

## 7. Accessibilità

### 7.1 Reduced motion

Tutte le animazioni vengono **azzerate** quando l'utente ha preferenze di moto ridotto ([style.css:1946-1954](static/css/style.css#L1946-L1954)):

```css
@media (prefers-reduced-motion: reduce) {
    body, .hero, .forecast-card, .fx-particle, .hero-letter,
    .hero-temp, .marquee-track, .hero::after, .rain-warning,
    .party-mode, .party-sticker { animation: none !important; }
    .fx-particle { opacity: 0; }
    .hero-letter { opacity: 1; transform: none; }
}
```

### 7.2 Contrasti

- Testo principale `--ink (#2d2d3a)` su `--bg (#ebe1f3)`, su `--cream`, su `--mint`, su `--yellow*` → contrasti adeguati.
- Testo bianco su `--pink-bright (#ff5fa2)` → contrasto borderline (≈3.1:1) — ok per testo grande/grassetto (Bowlby ≥ 0.85rem 700), **non sufficiente per testo body**.
- I `text-shadow` doppi (`white` + `ink`) sui titoli migliorano la leggibilità anche su pattern.

---

## 8. Responsive

Unico breakpoint a **`max-width: 700px`** ([style.css:1957-2009](static/css/style.css#L1957-L2009)):

- Navbar diventa verticale (`flex-direction: column`), brand ingrandita a 2.4rem.
- Hero: rotazione ridotta a `-0.5deg`, ombre ridotte a `6px 6px`, gingham scalato a 48px.
- Forecast: ombre ridotte, font scalati.

> **Nota:** lo scaling tipografico è gestito principalmente da `clamp()`, quindi questa media query interviene solo per layout strutturali.

---

## 9. Come ricreare/riutilizzare il sistema

### 9.1 Setup minimo (copia-incolla)

In `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Caveat:wght@400;500;600;700&family=Fredoka:wght@400;500;600;700&display=swap" rel="stylesheet">
```

CSS base:

```css
:root { /* incollare i 16 token da §2.1 */ }

* { margin: 0; padding: 0; box-sizing: border-box; }

html { font-size: 17px; }

body {
    font-family: "Fredoka", "Quicksand", sans-serif;
    color: var(--ink);
    background-color: var(--bg);
    background-image:
        linear-gradient(rgba(45, 45, 58, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(45, 45, 58, 0.05) 1px, transparent 1px);
    background-size: 28px 28px;
    background-attachment: fixed;
    min-height: 100vh;
    line-height: 1.55;
}
```

### 9.2 Ricetta "blocco scrapbook"

Per creare una nuova sezione coerente col sistema:

1. **Container**: `border: 5px solid var(--ink); border-radius: 0; box-shadow: 10px 10px 0 var(--ink); transform: rotate(-1deg);`.
2. **Background pattern**: scegliere tra gingham, polka, righe (§4.4).
3. **Washi tape**: copiare lo snippet `::before` da §4.1.
4. **Sticker**: copiare lo snippet `::after` da §4.2, sostituendo `content`.
5. **Animazione ingresso**: `animation: hero-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;`.

### 9.3 Ricetta "pulsante primario"

```css
font-family: "Bowlby One", sans-serif;
font-size: 1.2rem;
color: white;
background: var(--pink-bright);
border: 4px solid var(--ink);
border-radius: 999px;
padding: 0.85rem 2rem;
text-transform: uppercase;
letter-spacing: 3px;
text-shadow: 2px 2px 0 var(--pink-deep);
box-shadow: 5px 5px 0 var(--ink);
transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
/* hover */ background: var(--green-deep); transform: translate(-3px, -3px) rotate(-1deg); box-shadow: 8px 8px 0 var(--ink);
/* active */ transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--ink);
```

### 9.4 Ricetta "titolo display"

```css
font-family: "Bowlby One", sans-serif;
font-weight: 400;
text-transform: uppercase;
color: var(--pink-deep);
font-size: clamp(2.5rem, 6vw, 4rem);
text-shadow:
    2px 2px 0 white,
    4px 4px 0 var(--ink);
```

---

## 10. Convenzioni & vincoli

- **Mai usare blur** nelle `box-shadow` (eccezione: il micro-`0 2px 4px rgba(0,0,0,0.08)` solo sui washi tape).
- **Mai usare `border-radius` medio** (5-10px). Solo: `0`, `12-16px` (card piccole), `999px` (pill).
- **Bowlby One** è sempre `font-weight: 400` (è già grassissimo di suo) e sempre uppercase.
- **Caveat** è sempre `font-weight: 700` e quasi sempre lowercase.
- **Ogni blocco principale** ha almeno UN pseudo-elemento decorativo (tape o sticker).
- **Ogni componente interattivo** ha hover (`translate -2/-2`) e active (`translate +2/+2`).
- **Le rotazioni sono dispari** (mai `-0deg`, `-0.5deg`, ecc. — vanno bene `-0.4`, `-0.8`, `-1.2`, `-2`, `-3`…) per restare "imperfette".
- Le **icone** sono unicode (`✦ ✿ ★`) o sticker testuali, non SVG di sistema.

---

## 11. File rilevanti

| File                                                          | Ruolo                                          |
| ------------------------------------------------------------- | ---------------------------------------------- |
| [static/css/style.css](static/css/style.css)                  | Foglio di stile unico — tutto il design system |
| [static/js/app.js](static/js/app.js)                          | JS per modal, party-mode, weather-fx particles |
| [templates/base.html](templates/base.html)                    | Layout root con navbar + footer + import font |
| [templates/index.html](templates/index.html)                  | Hero + marquee + rain warning + forecast      |
| [templates/dashboard.html](templates/dashboard.html)          | Saved cities                                   |
| [templates/search.html](templates/search.html)                | Form ricerca + search-result                  |
| [templates/login.html](templates/login.html) · [register.html](templates/register.html) | Auth forms                |
| [templates/profile.html](templates/profile.html)              | Profile                                        |
| [templates/history.html](templates/history.html)              | Storico ricerche                              |
| [templates/meteo.html](templates/meteo.html)                  | Dettaglio meteo                               |

---

## 12. Debiti tecnici noti

Osservati durante l'analisi del CSS:

- Le righe 2011-2028 (`.cities-grid`, `.city-card`) usano `var(--primary)` **non definito** nei token (legacy?) e ombre con blur — sono **estranee al sistema** e andrebbero rimosse o ricondotte allo stile scrapbook.
- `"Permanent Marker"` è caricata ma non usata.
- `--tape-pink` è referenziato in `.search-empty::before` ma **non dichiarato** sul `:root` — usa fallback inline `rgba(255, 95, 162, 0.45)`; conviene promuoverlo a token.
- Diverse `transform: rotate(...)` su `.forecast-card:nth-child(N)` usano `!important` in hover per superare la rotazione individuale — segno che servirebbe un sistema basato su CSS custom properties per la rotazione delle card.
