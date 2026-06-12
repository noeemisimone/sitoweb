import os

from dotenv import load_dotenv

# Load variables from .env into the environment before reading them below.
load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-fallback")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URI", "sqlite:///overview.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # pool_pre_ping tests connections before use, recovering from DB-side disconnects.
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    NASA_API_KEY = os.environ.get("NASA_API_KEY", "")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False

    # Heroku/Render expose DATABASE_URL with the legacy postgres:// scheme,
    # which SQLAlchemy no longer accepts — normalize it to postgresql://.
    _database_url = os.environ.get("DATABASE_URL")
    if _database_url and _database_url.startswith("postgres://"):
        _database_url = _database_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = _database_url


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
