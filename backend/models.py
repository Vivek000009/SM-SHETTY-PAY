from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    upi_id = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    phone = Column(
        String,
        unique=True,
        nullable=False
    )

    email = Column(
        String,
        nullable=True
    )

    balance = Column(
        Float,
        default=0.0
    )

    login_pin = Column(
        String,
        nullable=False,
        default="1234"
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    sender_upi = Column(
        String,
        nullable=False
    )

    receiver_upi = Column(
        String,
        nullable=False
    )

    receiver_name = Column(
        String,
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    transaction_id = Column(
        String,
        unique=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    status = Column(
        String,
        default="SUCCESS"
    )