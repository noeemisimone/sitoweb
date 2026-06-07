# Base class for Flask-WTF forms
from flask_wtf import FlaskForm

# Form fields
from wtforms import DateField, EmailField, PasswordField, StringField, SubmitField

# Validators
from wtforms.validators import DataRequired, Email, EqualTo, Length, Optional


class ExploreForm(FlaskForm):
    """Explore-by-date form, used on the /explore page.

    Was SearchForm (search a city). Now you pick a day and see the cosmos
    NASA published then. Leave it empty to get today's image.
    """

    date = DateField(
        "Scegli un giorno",
        validators=[Optional()],
    )

    submit = SubmitField("Esplora")


class LoginForm(FlaskForm):
    """Login form, used on the /login page."""

    username = StringField(
        "Username",
        validators=[DataRequired()],
    )

    password = PasswordField(
        "Password",
        validators=[DataRequired(), Length(min=6)],
    )

    submit = SubmitField("Accedi")


class RegisterForm(FlaskForm):
    """Registration form, used on the /register page."""

    username = StringField(
        "Username",
        validators=[DataRequired(), Length(min=3, max=20)],
    )

    email = EmailField(
        "Email",
        validators=[DataRequired(), Email()],
    )

    birthdate = DateField(
        "Data di nascita",
        validators=[DataRequired()],
    )

    password = PasswordField(
        "Password",
        validators=[DataRequired(), Length(min=6)],
    )

    confirm_password = PasswordField(
        "Conferma password",
        validators=[
            DataRequired(),
            EqualTo("password", message="Le password non corrispondono"),
        ],
    )

    submit = SubmitField("Crea account")
