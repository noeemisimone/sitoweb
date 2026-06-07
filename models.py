from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # The user's date of birth, 'YYYY-MM-DD'. Optional so accounts created
    # before this feature stay valid; used to set their birthday's APOD as the
    # profile background.
    birthdate = db.Column(db.String(20))

    # Was "cities" — now the images this user has collected into their atlas.
    saved_images = db.relationship("SavedImage", backref="user", lazy=True)
    # Themed groups the user organises their saved images into.
    collections = db.relationship("Collection", backref="user", lazy=True)
    search_history = db.relationship(
        "SearchHistory",
        backref="user",
        lazy=True,
        order_by="SearchHistory.viewed_at.desc()",
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class SavedImage(db.Model):
    """An astronomy image the user added to their personal atlas.

    (Same role the old `City` model had: a favourite item tied to a user.)
    """

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.String(20))          # the APOD date, 'YYYY-MM-DD'
    image_url = db.Column(db.String(500))
    explanation = db.Column(db.Text)
    nota = db.Column(db.Text)                 # the user's own personal note
    # Marks the user's single favourite image (at most one True per user),
    # shown first in its section with a star. Optional for existing rows.
    is_favorite = db.Column(db.Boolean, default=False)
    # A photo the user uploaded as their own memory of that day. Stored as a
    # path relative to the static folder, e.g. 'uploads/ab12cd.jpg'. Optional.
    personal_image_url = db.Column(db.String(500))
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    # The themed collection this image belongs to, if any (optional).
    collection_id = db.Column(db.Integer, db.ForeignKey("collection.id"))


class Collection(db.Model):
    """A themed group of saved images, created and named by the user
    (e.g. "Nebulose", "I miei compleanni"). An image belongs to at most one."""

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    images = db.relationship("SavedImage", backref="collection", lazy=True)


class SearchHistory(db.Model):
    """A record of an image the user explored (was: a city they searched)."""

    id = db.Column(db.Integer, primary_key=True)
    image_title = db.Column(db.String(200), nullable=False)
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
