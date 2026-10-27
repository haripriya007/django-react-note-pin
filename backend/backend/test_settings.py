from .settings import *

SECRET_KEY = "test-only-secret-key-for-django"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}