# 🌌 Overview

[![Live on Render](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://overview.onrender.com)

**Overview** è un atlante cosmico personale costruito attorno alla *Astronomy Picture of the Day* (APOD) della NASA. 🚀
Ogni giorno la NASA pubblica un'immagine dell'universo con una spiegazione scritta da un astronomo: Overview ti permette di esplorarle, cercarle per data, salvarle e organizzarle in collezioni personali con note tue.

> ⚠️ Sostituisci l'URL del badge qui sopra con il link reale della tua app su Render una volta completato il deploy.

---

## ✨ Feature principali

- 🪐 **Immagine del giorno** — l'APOD odierna con titolo, descrizione tradotta e immagine in alta risoluzione.
- 🎲 **Surprise me** — scopri un'immagine astronomica casuale dall'archivio NASA.
- 🔭 **Esplora per data** — cerca l'immagine pubblicata in un giorno specifico.
- 🗺️ **Atlas** — la tua galleria personale con tutte le immagini salvate.
- ⭐ **Preferiti & note** — segna le immagini preferite e aggiungi annotazioni personali.
- 📚 **Collezioni** — raggruppa le immagini in raccolte tematiche.
- 🕐 **Cronologia** — tieni traccia delle immagini che hai visitato.
- 🔐 **Autenticazione** — registrazione, login e gestione della password con account personali.

---

## 🛠️ Tech Stack

| Categoria | Tecnologia |
|-----------|-----------|
| Linguaggio | 🐍 **Python 3.11** |
| Framework web | 🌶️ **Flask** |
| ORM / Database | 🗃️ **SQLAlchemy** (SQLite in locale, PostgreSQL in produzione) |
| Form & validazione | 📝 **Flask-WTF** / WTForms |
| Dati astronomici | 🛰️ **NASA APOD API** |
| Traduzione | 🌐 **deep-translator** |
| Web server (produzione) | 🦄 **gunicorn** |
| Hosting | ☁️ **Render** |

---

## 💻 Installazione locale

```bash
# 1. Clona il repository
git clone https://github.com/noeemisimone/sitoweb.git

# 2. Entra nella cartella del progetto
cd sitoweb

# 3. Crea un ambiente virtuale
python -m venv venv

# 4. Attiva l'ambiente virtuale
#    macOS / Linux:
source venv/bin/activate
#    Windows (PowerShell):
venv\Scripts\Activate.ps1

# 5. Installa le dipendenze
pip install -r requirements.txt

# 6. Copia il file di esempio e compila le variabili d'ambiente
cp .env.example .env
#    poi apri .env e inserisci i valori reali (vedi sezione sotto)

# 7. Avvia l'app in modalità sviluppo
flask run --debug
```

L'app sarà disponibile su 👉 `http://127.0.0.1:5000`

---

## 🔑 Variabili d'ambiente

Le seguenti variabili vanno definite nel file `.env` (in locale) o nelle impostazioni dell'host (in produzione):

| Variabile | Descrizione |
|-----------|-------------|
| `SECRET_KEY` | Chiave segreta Flask per sessioni e CSRF |
| `DATABASE_URI` | URI del database (locale, default SQLite) |
| `DATABASE_URL` | Connection string PostgreSQL (fornita automaticamente da Render in produzione) |
| `NASA_API_KEY` | Chiave API NASA APOD — ottienine una gratis su [api.nasa.gov](https://api.nasa.gov/) |
| `FLASK_ENV` | Ambiente: `development` \| `production` \| `testing` |

> 🔒 Il file `.env` **non** va mai committato: è già incluso in `.gitignore`. Usa `.env.example` come template.

---

## 🚀 Deploy

L'app è pensata per il deploy su **Render** tramite gunicorn (`Procfile`: `web: gunicorn app:app`).

In produzione Render fornisce automaticamente la variabile `DATABASE_URL` con uno schema `postgres://` legacy: `config.py` la normalizza in `postgresql://`, il formato richiesto da SQLAlchemy.

🌍 **App live:** [https://overview.onrender.com](https://overview.onrender.com)

> ⚠️ Aggiorna questo link con l'URL reale della tua istanza Render.
