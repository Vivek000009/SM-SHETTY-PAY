import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# --------------------------------------------------
# DATABASE
# --------------------------------------------------

# Render will provide DATABASE_URL.
# On your own PC, the app will continue using SQLite.

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///C:/SM-SHETTY-PAY/backend/sm_shetty_pay.db"
)


# Render/PostgreSQL sometimes provides:
# postgres://...
#
# SQLAlchemy expects:
# postgresql://...

if DATABASE_URL.startswith("postgres://"):

    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1
    )


# --------------------------------------------------
# ENGINE
# --------------------------------------------------

if DATABASE_URL.startswith("sqlite"):

    engine = create_engine(
        DATABASE_URL,
        connect_args={
            "check_same_thread": False
        }
    )

else:

    engine = create_engine(
        DATABASE_URL
    )


# --------------------------------------------------
# SESSION
# --------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()


# --------------------------------------------------
# DATABASE SESSION
# --------------------------------------------------

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()