"""NASA APOD (Astronomy Picture of the Day) client.

Replaces the old weather API. Same shape as before: a function that fetches
raw JSON from an external service, plus a `format_*` helper that cleans it up
into a tidy dict ready for the templates.

APOD has published one image (or video) every single day since 1995-06-16.
"""

import json
import os
from datetime import datetime

import requests
from dotenv import load_dotenv

# Load .env so NASA_API_KEY is available even if this module is used on its own.
load_dotenv()

# Optional dependency: if deep-translator isn't installed (e.g. the app is
# launched with a different venv), we simply skip translation instead of crashing.
try:
    from deep_translator import GoogleTranslator
except ImportError:
    GoogleTranslator = None

# ---------------------------------------------------------------------------
# On-disk cache. Two files: one for finished translations, one for whole APOD
# entries by date. Both survive restarts, so a page is fetched/translated once
# and is instant on every later visit. A given day's picture never changes, so
# caching it is always safe.
# ---------------------------------------------------------------------------

_CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache")
_TRANSLATIONS_FILE = os.path.join(_CACHE_DIR, "translations.json")
_APOD_FILE = os.path.join(_CACHE_DIR, "apod.json")


def _load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def _save_json(path, data):
    os.makedirs(_CACHE_DIR, exist_ok=True)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
    except OSError:
        pass


_translation_cache = _load_json(_TRANSLATIONS_FILE)
_apod_cache = _load_json(_APOD_FILE)


def _translate(text, target="it"):
    """Translate English text to Italian. Falls back to the original on any
    failure, so the site never breaks if the translation service hiccups.
    Finished translations are cached on disk so we never re-translate."""
    if not text or GoogleTranslator is None:
        return text
    if text in _translation_cache:
        return _translation_cache[text]
    try:
        translated = GoogleTranslator(source="auto", target=target).translate(text)
    except Exception:
        translated = text
    _translation_cache[text] = translated
    _save_json(_TRANSLATIONS_FILE, _translation_cache)
    return translated

# DEMO_KEY works out of the box but is rate-limited (~30/hour, 50/day).
# For more, grab a free key in 10 seconds at https://api.nasa.gov/ and paste it here.
API_KEY = os.environ.get("NASA_API_KEY", "")
APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod"

ARCHIVE_START = "1995-06-16"  # the very first APOD

# Italian month names, so dates read "04 luglio 2005" instead of the system
# locale's English "04 July 2005". Used only for display formatting.
_MONTHS_IT = [
    "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
    "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
]


def _format_date_it(raw_date):
    """Format 'YYYY-MM-DD' as '04 luglio 2005'. Returns the input unchanged
    if it can't be parsed, so a missing/odd date never breaks the page."""
    try:
        d = datetime.strptime(raw_date, "%Y-%m-%d")
        return f"{d.day:02d} {_MONTHS_IT[d.month - 1]} {d.year}"
    except (TypeError, ValueError):
        return raw_date


def _request(params):
    """Low-level call. Retries a few times on transient network hiccups
    (the NASA API occasionally times out). Returns parsed JSON, or None."""
    params = {"api_key": API_KEY, "thumbs": True, **params}
    for attempt in range(3):
        try:
            response = requests.get(APOD_ENDPOINT, params=params, timeout=5)
            response.raise_for_status()
            return response.json()
        # Network/HTTP failures: connection down, request timed out, or a non-2xx
        # status (raised by raise_for_status). RequestException is their common
        # base and also covers any other transient request error.
        except (requests.exceptions.ConnectionError,
                requests.exceptions.Timeout,
                requests.exceptions.HTTPError,
                requests.exceptions.RequestException):
            continue
    return None


def get_apod(date=None):
    """The picture for a given day. `date` as 'YYYY-MM-DD', or None for today.

    Cached on disk by date: the first visit fetches + translates, every later
    visit is instant. For 'today' we key by today's date, so the cache naturally
    rolls over to the new picture each day."""
    key = date or datetime.utcnow().strftime("%Y-%m-%d")
    if key in _apod_cache:
        return _apod_cache[key]

    params = {}
    if date:
        params["date"] = date
    data = _request(params)
    if not data:
        return None

    result = format_apod(data)
    _apod_cache[key] = result
    _save_json(_APOD_FILE, _apod_cache)
    return result


def get_apod_random():
    """A random image from the whole archive (the 'Surprise me' button)."""
    data = _request({"count": 1})
    if not data:
        return None
    return format_apod(data[0])


def get_apod_recent(count=6):
    """A handful of random images, for a grid to browse."""
    data = _request({"count": count})
    if not data:
        return []
    return [format_apod(item) for item in data]


def format_apod(data):
    """Turn the raw NASA payload into a clean dict for the templates."""
    media_type = data.get("media_type", "image")

    # For images NASA gives `url` (web size) and `hdurl` (full size).
    # For videos it gives a `thumbnail_url` (because we ask thumbs=True).
    if media_type == "image":
        display_url = data.get("url")
    else:
        display_url = data.get("thumbnail_url") or data.get("url")

    raw_date = data.get("date")
    pretty_date = _format_date_it(raw_date)

    return {
        "title": _translate(data.get("title", "Untitled")),
        "date": raw_date,
        "pretty_date": pretty_date,
        "image_url": display_url,
        "hd_url": data.get("hdurl"),
        "explanation": _translate(data.get("explanation", "")),
        "copyright": (data.get("copyright") or "").strip() or None,
        "media_type": media_type,
        "source_url": data.get("url"),
    }


if __name__ == "__main__":
    print(get_apod())
    print(get_apod_random())
