from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

import models
import schemas

from database import engine, get_db


# Create database tables
models.Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SM Shetty Pay API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://vivek000009.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# BASIC TEST
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "SM Shetty Pay API is running"
    }

# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@app.post("/login")
def login(
    request: schemas.LoginRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(models.User)
        .filter(models.User.phone == request.phone)
        .first()
    )

    if not user:

        return {
            "success": False,
            "message": "Account not found"
        }

    if user.login_pin != request.login_pin:

        return {
            "success": False,
            "message": "Incorrect login PIN"
        }

    return {
        "success": True,
        "message": "Login successful",
        "name": user.name,
        "upi_id": user.upi_id,
        "phone": user.phone
    }

# --------------------------------------------------
# RESOLVE UPI ID
# --------------------------------------------------

@app.post("/upi/resolve")
def resolve_upi(
    request: schemas.UPIResolveRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(models.User)
        .filter(models.User.upi_id == request.upi_id)
        .first()
    )

    if not user:
        return {
            "success": False,
            "message": "This UPI ID does not exists"
        }

    return {
        "success": True,
        "name": user.name,
        "upi_id": user.upi_id
    }


# --------------------------------------------------
# MAKE PAYMENT
# --------------------------------------------------

@app.post("/payment")
def make_payment(
    request: schemas.PaymentRequest,
    db: Session = Depends(get_db)
):

    # Find sender
    sender = (
        db.query(models.User)
        .filter(models.User.upi_id == request.sender_upi)
        .first()
    )

    if not sender:
        return {
            "success": False,
            "message": "Sender UPI account not found"
        }

    # Prevent paying yourself
    if request.sender_upi.lower() == request.receiver_upi.lower():

        return {
            "success": False,
            "message": "CAN'T PAY TO YOURSELF"
        }

    # Find receiver
    receiver = (
        db.query(models.User)
        .filter(models.User.upi_id == request.receiver_upi)
        .first()
    )

    if not receiver:

        return {
            "success": False,
            "message": "This UPI ID does not exists"
        }

    # Check balance
    if request.amount > sender.balance:

        return {
            "success": False,
            "message": "Insufficient balance"
        }

    # Check payment PIN
    if request.payment_pin != "0987":

        return {
            "success": False,
            "message": "Incorrect payment password"
        }

    # Transfer money
    sender.balance -= request.amount
    receiver.balance += request.amount

    # Generate transaction ID
    transaction_id = (
        "TAX"
        + uuid.uuid4().hex[:12].upper()
    )

    transaction = models.Transaction(
        sender_upi=sender.upi_id,
        receiver_upi=receiver.upi_id,
        receiver_name=receiver.name,
        amount=request.amount,
        transaction_id=transaction_id,
        created_at=datetime.utcnow(),
        status="SUCCESS"
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {
        "success": True,
        "message": "Payment Successful",
        "transaction_id": transaction_id,
        "receiver_name": receiver.name,
        "receiver_upi": receiver.upi_id,
        "amount": request.amount,
        "created_at": transaction.created_at.isoformat()
    }


# --------------------------------------------------
# CHECK BALANCE
# --------------------------------------------------

@app.post("/balance")
def check_balance(
    request: schemas.BalanceRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(models.User)
        .filter(
            models.User.upi_id == request.upi_id
        )
        .first()
    )

    if not user:

        return {
            "success": False,
            "message": "UPI account not found"
        }

    # Check the user's actual login PIN
    if user.login_pin != request.pin:

        return {
            "success": False,
            "message": "Incorrect PIN"
        }

    # Treat empty/null balance as zero
    if user.balance is None:

        user.balance = 0.0

        db.commit()
        db.refresh(user)

    return {

        "success": True,

        "name": user.name,

        "upi_id": user.upi_id,

        "balance": float(user.balance)

    }

# --------------------------------------------------
# ADMIN - GET ALL ACCOUNTS
# --------------------------------------------------

@app.get("/admin/accounts")
def admin_get_accounts(
    admin_upi: str,
    admin_pin: str,
    db: Session = Depends(get_db)
):

    # Find admin
    admin = (
        db.query(models.User)
        .filter(
            models.User.upi_id == admin_upi
        )
        .first()
    )

    if not admin:

        return {
            "success": False,
            "message": "Admin account not found"
        }

    # Verify admin is Vivek Yadav
    if admin.name.strip().lower() != "vivek yadav":

        return {
            "success": False,
            "message": "Admin access denied"
        }

    # Verify admin PIN
    if admin.login_pin != admin_pin:

        return {
            "success": False,
            "message": "Incorrect admin PIN"
        }

    # Get all accounts
    users = (
        db.query(models.User)
        .order_by(models.User.name.asc())
        .all()
    )

    return {
        "success": True,
        "accounts": [
            {
                "name": user.name,
                "upi_id": user.upi_id,
                "phone": user.phone,
                "balance": float(user.balance or 0)
            }
            for user in users
        ]
    }
# --------------------------------------------------
# ADMIN ADD MONEY
# --------------------------------------------------

@app.post("/admin/add-money")
def admin_add_money(
    request: schemas.AdminAddMoneyRequest,
    db: Session = Depends(get_db)
):

    # Find admin
    admin = (
        db.query(models.User)
        .filter(
            models.User.upi_id == request.admin_upi
        )
        .first()
    )

    if not admin:

        return {
            "success": False,
            "message": "Admin account not found"
        }

    # Verify admin is Vivek Yadav
    if admin.name.strip().lower() != "vivek yadav":

        return {
            "success": False,
            "message": "Admin access denied"
        }

    # Verify admin PIN
    if admin.login_pin != request.admin_pin:

        return {
            "success": False,
            "message": "Incorrect admin PIN"
        }

    # Find account receiving the money
    user = (
        db.query(models.User)
        .filter(
            models.User.upi_id == request.receiver_upi
        )
        .first()
    )

    if not user:

        return {
            "success": False,
            "message": "Receiver UPI account not found"
        }

    # Make sure balance is not None
    if user.balance is None:
        user.balance = 0.0

    # Add money
    user.balance += request.amount

    # Save changes
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Money added successfully",
        "name": user.name,
        "upi_id": user.upi_id,
        "amount_added": float(request.amount),
        "new_balance": float(user.balance)
    }
# --------------------------------------------------
# TRANSACTION HISTORY
# --------------------------------------------------

@app.get("/history/{upi_id}")
def get_history(
    upi_id: str,
    db: Session = Depends(get_db)
):

    transactions = (
        db.query(models.Transaction)
        .filter(
            (models.Transaction.sender_upi == upi_id) |
        (models.Transaction.receiver_upi == upi_id)
        )
        .order_by(
            models.Transaction.created_at.desc()
        )
        .all()
    )

    return {
    "success": True,
    "transactions": [
        {
            "transaction_id": tx.transaction_id,
            "type": (
                "SENT"
                if tx.sender_upi == upi_id
                else "RECEIVED"
            ),
            "receiver_name": tx.receiver_name,
            "receiver_upi": tx.receiver_upi,
            "sender_upi": tx.sender_upi,
            "sender_name": (
    db.query(models.User)
    .filter(models.User.upi_id == tx.sender_upi)
    .first()
).name,
            "amount": tx.amount,
            "created_at": tx.created_at.isoformat(),
            "status": tx.status
        }
        for tx in transactions
    ]
}