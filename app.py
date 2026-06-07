import os
import uuid
from datetime import date, datetime
from functools import wraps

from flask import Flask, flash, redirect, render_template, request, session, url_for
from sqlalchemy import func, text

from config import config_map
from forms import ExploreForm, LoginForm, RegisterForm
from models import Collection, SavedImage, SearchHistory, User, db
from nasa_api import ARCHIVE_START, get_apod, get_apod_random

app = Flask(__name__)

# Load config (secret key, DB URI, etc.) from the environment-driven classes.
env = os.environ.get("FLASK_ENV", "development")
app.config.from_object(config_map.get(env, config_map["development"]))

# Overview-specific settings. These depend on app.static_folder, so they go
# after from_object. Personal photos attached to a saved image live here.
app.config["UPLOAD_FOLDER"] = os.path.join(app.static_folder, "uploads")
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB per upload

db.init_app(app)


# ---------------------------------------------------------------------------
# Personal-photo uploads
# ---------------------------------------------------------------------------

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_personal_photo(file_storage):
    """Save an uploaded personal photo into static/uploads and return its path
    relative to the static folder (e.g. 'uploads/ab12cd.jpg'), or None if no
    valid file was provided. Filenames are randomised to avoid collisions."""
    if not file_storage or not file_storage.filename:
        return None
    if not _allowed_file(file_storage.filename):
        return None
    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    name = f"{uuid.uuid4().hex}.{ext}"
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    file_storage.save(os.path.join(app.config["UPLOAD_FOLDER"], name))
    return f"uploads/{name}"


def _delete_photo_file(rel_path):
    """Remove a previously-uploaded personal photo from disk. Silent on any
    failure (the DB row is what matters; an orphan file is harmless)."""
    if not rel_path:
        return
    try:
        os.remove(os.path.join(app.static_folder, rel_path))
    except OSError:
        pass


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Logged out, or the session points to an account that no longer exists.
        if "user_id" not in session or User.query.get(session["user_id"]) is None:
            session.clear()
            flash("Devi effettuare l'accesso", "error")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


@app.context_processor
def inject_current_user():
    user_id = session.get("user_id")
    current_user = User.query.get(user_id) if user_id else None
    return {"current_user": current_user}


# ---------------------------------------------------------------------------
# Public routes (no authentication required)
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data

        user = User.query.filter_by(username=username).first()
        if user is None or not user.check_password(password):
            flash("Username o password errati", "error")
            return render_template("login.html", form=form)

        session["user_id"] = user.id
        flash("Bentornata!", "success")
        return redirect(url_for("atlas"))

    return render_template("login.html", form=form)


@app.route("/register", methods=["GET", "POST"])
def register():
    form = RegisterForm()
    # Used by the date input's `max` attribute: you can't be born in the future.
    today = date.today().isoformat()
    if form.validate_on_submit():
        username = form.username.data.strip()
        email = form.email.data.strip()
        password = form.password.data

        if User.query.filter_by(username=username).first():
            flash("Username già in uso.", "error")
            return render_template("register.html", form=form, today=today)

        if User.query.filter_by(email=email).first():
            flash("Email già registrata.", "error")
            return render_template("register.html", form=form, today=today)

        user = User(username=username, email=email)
        user.birthdate = form.birthdate.data.strftime("%Y-%m-%d")
        user.set_password(password)

        try:
            db.session.add(user)
            db.session.commit()
        except Exception:
            db.session.rollback()
            flash("Errore nella creazione dell'account. Riprova.", "error")
            return render_template("register.html", form=form, today=today)

        flash("Account creato! Ora puoi accedere.", "success")
        return redirect(url_for("login"))

    return render_template("register.html", form=form, today=today)


@app.route("/logout")
def logout():
    session.clear()
    flash("Sei uscita", "success")
    return redirect(url_for("login"))


# --- Quick-look pages (were the fixed city pages) -------------------------

@app.route("/today")
def today():
    image = get_apod()
    return render_template("image.html", image=image, heading="Il cielo di oggi")


@app.route("/surprise")
def surprise():
    image = get_apod_random()
    return render_template("image.html", image=image, heading="Sorprendimi")


# ---------------------------------------------------------------------------
# Private routes (require authentication)
# ---------------------------------------------------------------------------

@app.route("/atlas")
@login_required
def atlas():
    # The Atlas is purely the user's personal collection now. Saving today's
    # image happens from "Oggi" or "Esplora", so we make no NASA/translation
    # call here — which also makes this page load instantly.
    user = User.query.get(session["user_id"])
    collections = user.collections
    uncategorized = [img for img in user.saved_images if img.collection_id is None]
    return render_template(
        "atlas.html",
        saved_images=user.saved_images,
        collections=collections,
        uncategorized=uncategorized,
    )


@app.route("/explore", methods=["GET", "POST"])
@login_required
def explore():
    form = ExploreForm()
    image = None

    # The date can come from the form (POST) or from a "memorable date"
    # shortcut link (GET ?date=YYYY-MM-DD). No image is shown until a date is chosen.
    date = None
    if form.validate_on_submit():
        date = form.date.data.strftime("%Y-%m-%d") if form.date.data else None
        if not date:
            flash("Scegli una data per esplorare il cosmo.", "warning")
    else:
        date = request.args.get("date")

    if date:
        try:
            image = get_apod(date)
        except Exception:
            image = None

        if image:
            entry = SearchHistory(
                image_title=image["title"],
                user_id=session["user_id"],
            )
            try:
                db.session.add(entry)
                db.session.commit()
            except Exception:
                db.session.rollback()
        else:
            flash("Nessuna immagine per quel giorno. Prova un'altra data.", "error")

    return render_template("explore.html", form=form, image=image)


@app.route("/history")
@login_required
def history():
    searches = (
        SearchHistory.query.filter_by(user_id=session["user_id"])
        .order_by(SearchHistory.viewed_at.desc())
        .limit(10)
        .all()
    )
    total_searches = SearchHistory.query.filter_by(user_id=session["user_id"]).count()
    return render_template(
        "history.html",
        searches=searches,
        total_searches=total_searches,
    )


@app.route("/history/clear", methods=["POST"])
@login_required
def clear_history():
    try:
        SearchHistory.query.filter_by(user_id=session["user_id"]).delete()
        db.session.commit()
        flash("Cronologia cancellata", "success")
    except Exception:
        db.session.rollback()
        flash("Errore nella cancellazione della cronologia. Riprova.", "error")

    return redirect(url_for("history"))


@app.route("/profile")
@login_required
def profile():
    user = User.query.get(session["user_id"])
    images_count = len(user.saved_images)
    searches_count = SearchHistory.query.filter_by(user_id=user.id).count()

    most_viewed_row = (
        db.session.query(SearchHistory.image_title, func.count(SearchHistory.id).label("n"))
        .filter_by(user_id=user.id)
        .group_by(SearchHistory.image_title)
        .order_by(func.count(SearchHistory.id).desc())
        .first()
    )
    most_viewed = most_viewed_row[0] if most_viewed_row else None

    # Pick the APOD to use as the profile backdrop, starting from the user's
    # birthday. If the real birthday is inside the archive (NASA started
    # 1995-06-16) we use it as-is. If they were born earlier, we fall back to
    # the same day-and-month in the first year the archive can offer it: 1995
    # when that day lands on/after 16 June, otherwise 1996 (the first full year,
    # and a leap year so 29 Feb is covered too). Any miss — no birthdate or the
    # API not responding — leaves bg_url None and the cosmic background shows.
    bg_url = None
    pretty_date = None
    is_real_birthday = False
    if user.birthdate:
        try:
            if user.birthdate >= ARCHIVE_START:
                target = user.birthdate
                is_real_birthday = True
            else:
                bd = datetime.strptime(user.birthdate, "%Y-%m-%d").date()
                year = 1995 if (bd.month, bd.day) >= (6, 16) else 1996
                target = f"{year}-{bd.month:02d}-{bd.day:02d}"

            apod = get_apod(target)
            if apod and apod.get("image_url"):
                bg_url = apod["image_url"]
                pretty_date = apod.get("pretty_date")
        except Exception:
            bg_url = None

    return render_template(
        "profile.html",
        user=user,
        images_count=images_count,
        searches_count=searches_count,
        most_viewed=most_viewed,
        bg_url=bg_url,
        pretty_date=pretty_date,
        is_real_birthday=is_real_birthday,
    )


@app.route("/update_password", methods=["POST"])
@login_required
def update_password():
    user = User.query.get(session["user_id"])

    current_password = request.form.get("current_password", "")
    new_password = request.form.get("new_password", "")
    confirm_password = request.form.get("confirm_password", "")

    if not user.check_password(current_password):
        flash("La password attuale non è corretta", "error")
        return redirect(url_for("profile"))

    if new_password != confirm_password:
        flash("Le nuove password non coincidono", "error")
        return redirect(url_for("profile"))

    if len(new_password) < 6:
        flash("La nuova password deve avere almeno 6 caratteri", "error")
        return redirect(url_for("profile"))

    user.set_password(new_password)
    try:
        db.session.commit()
        flash("Password aggiornata!", "success")
    except Exception:
        db.session.rollback()
        flash("Errore nell'aggiornamento della password. Riprova.", "error")

    return redirect(url_for("profile"))


@app.route("/save_image", methods=["POST"])
@login_required
def save_image():
    title = request.form.get("title", "").strip()
    date = request.form.get("date", "").strip() or None
    image_url = request.form.get("image_url", "").strip() or None
    explanation = request.form.get("explanation", "").strip() or None
    nota = request.form.get("nota", "").strip() or None

    user = User.query.get(session["user_id"])

    # Avoid duplicates: same user, same day's image.
    existing = None
    if date:
        existing = SavedImage.query.filter_by(user_id=user.id, date=date).first()
    if existing:
        flash("Quell'immagine è già nel tuo atlante", "warning")
        return redirect(url_for("atlas"))

    personal_image_url = save_personal_photo(request.files.get("personal_image"))

    image = SavedImage(
        title=title,
        date=date,
        image_url=image_url,
        explanation=explanation,
        nota=nota,
        personal_image_url=personal_image_url,
        user_id=user.id,
    )

    try:
        db.session.add(image)
        db.session.commit()
    except Exception:
        db.session.rollback()
        flash("Errore nel salvataggio dell'immagine. Riprova.", "error")
        return redirect(url_for("atlas"))

    flash("Aggiunta al tuo atlante!", "success")
    return redirect(url_for("atlas"))


@app.route("/set_favorite/<int:image_id>", methods=["POST"])
@login_required
def set_favorite(image_id):
    image = SavedImage.query.get_or_404(image_id)

    if image.user_id != session["user_id"]:
        flash("Operazione non consentita", "error")
        return redirect(url_for("atlas"))

    try:
        if image.is_favorite:
            # Toggle off: it was the favourite, now it's no longer marked.
            image.is_favorite = False
        else:
            # Only one favourite per user: clear any other, then mark this one.
            SavedImage.query.filter_by(
                user_id=session["user_id"], is_favorite=True
            ).update({"is_favorite": False})
            image.is_favorite = True
        db.session.commit()
        flash("Immagine preferita aggiornata", "success")
    except Exception:
        db.session.rollback()
        flash("Errore nell'aggiornamento. Riprova.", "error")

    return redirect(url_for("atlas"))


@app.route("/delete_image/<int:image_id>", methods=["POST"])
@login_required
def delete_image(image_id):
    image = SavedImage.query.get_or_404(image_id)

    if image.user_id != session["user_id"]:
        flash("Operazione non consentita", "error")
        return redirect(url_for("atlas"))

    photo_to_remove = image.personal_image_url

    try:
        db.session.delete(image)
        db.session.commit()
    except Exception:
        db.session.rollback()
        flash("Errore nella rimozione dell'immagine. Riprova.", "error")
        return redirect(url_for("atlas"))

    _delete_photo_file(photo_to_remove)
    flash("Rimossa dal tuo atlante", "success")
    return redirect(url_for("atlas"))


@app.route("/edit_note/<int:image_id>", methods=["POST"])
@login_required
def edit_note(image_id):
    image = SavedImage.query.get_or_404(image_id)

    if image.user_id != session["user_id"]:
        flash("Operazione non consentita", "error")
        return redirect(url_for("atlas"))

    image.nota = request.form.get("nota", "").strip() or None

    # Personal photo: either remove the current one, or replace it with a newly
    # uploaded file. The old file is cleaned up from disk in both cases.
    old_photo = image.personal_image_url
    if request.form.get("remove_personal"):
        image.personal_image_url = None
        _delete_photo_file(old_photo)
    else:
        new_photo = save_personal_photo(request.files.get("personal_image"))
        if new_photo:
            image.personal_image_url = new_photo
            _delete_photo_file(old_photo)

    # Collection assignment (empty value = no collection). Only accept a
    # collection that belongs to this user.
    raw_cid = request.form.get("collection_id", "").strip()
    if raw_cid.isdigit():
        chosen = Collection.query.get(int(raw_cid))
        image.collection_id = chosen.id if chosen and chosen.user_id == session["user_id"] else None
    else:
        image.collection_id = None

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        flash("Errore nel salvataggio. Riprova.", "error")
        return redirect(url_for("atlas"))

    flash("Atlante aggiornato", "success")
    return redirect(url_for("atlas"))


@app.route("/create_collection", methods=["POST"])
@login_required
def create_collection():
    name = request.form.get("name", "").strip()
    description = request.form.get("description", "").strip() or None

    if not name:
        flash("Dai un nome alla collezione.", "warning")
        return redirect(url_for("atlas"))

    collection = Collection(
        name=name,
        description=description,
        user_id=session["user_id"],
    )

    try:
        db.session.add(collection)
        db.session.commit()
        flash("Collezione creata!", "success")
    except Exception:
        db.session.rollback()
        flash("Errore nella creazione della collezione. Riprova.", "error")

    return redirect(url_for("atlas"))


@app.route("/delete_collection/<int:collection_id>", methods=["POST"])
@login_required
def delete_collection(collection_id):
    collection = Collection.query.get_or_404(collection_id)

    if collection.user_id != session["user_id"]:
        flash("Operazione non consentita", "error")
        return redirect(url_for("atlas"))

    try:
        # Keep the images — just move them back to "no collection".
        for img in collection.images:
            img.collection_id = None
        db.session.delete(collection)
        db.session.commit()
        flash("Collezione eliminata (le immagini restano nel tuo atlante)", "success")
    except Exception:
        db.session.rollback()
        flash("Errore nell'eliminazione della collezione. Riprova.", "error")

    return redirect(url_for("atlas"))


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(error):
    return render_template("404.html"), 404


@app.errorhandler(500)
def server_error(error):
    # A failed request may have left a broken DB transaction open; roll it back
    # so the next request starts clean.
    db.session.rollback()
    return render_template("500.html"), 500


def _ensure_schema():
    """Lightweight migration. SQLite's create_all() creates missing tables but
    never alters existing ones, so columns added after the DB was first built
    must be patched in by hand. Adds them only if absent; keeps existing data."""
    with db.engine.connect() as conn:
        cols = [row[1] for row in conn.execute(text("PRAGMA table_info(saved_image)"))]
        if "personal_image_url" not in cols:
            conn.execute(text("ALTER TABLE saved_image ADD COLUMN personal_image_url VARCHAR(500)"))
            conn.commit()
        if "collection_id" not in cols:
            conn.execute(text("ALTER TABLE saved_image ADD COLUMN collection_id INTEGER"))
            conn.commit()
        if "is_favorite" not in cols:
            conn.execute(text("ALTER TABLE saved_image ADD COLUMN is_favorite BOOLEAN DEFAULT 0"))
            conn.commit()

        user_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(user)"))]
        if "birthdate" not in user_cols:
            conn.execute(text("ALTER TABLE user ADD COLUMN birthdate VARCHAR(20)"))
            conn.commit()


with app.app_context():
    db.create_all()
    _ensure_schema()

if __name__ == "__main__":
    app.run(debug=True)
