from database import SessionLocal, engine, Base
from models import User


# --------------------------------------------------
# CREATE TABLES
# --------------------------------------------------

Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# DATABASE SESSION
# --------------------------------------------------

db = SessionLocal()


# --------------------------------------------------
# INITIAL ACCOUNTS
# --------------------------------------------------

users = [

    {
        "name": "VIVEK YADAV",
        "upi_id": "9892354055@smshettypay",
        "phone": "9892354055",
        "email": "vy4767132@gmail.com",
        "balance": 3920.00,
        "login_pin": "1234",
    },

    {
        "name": "Yashodhan Poojari",
        "upi_id": "7208127962@smshettypay",
        "phone": "7208127962",
        "email": "",
        "balance": 1080.00,
        "login_pin": "5678",
    },

    {
        "name": "Ketan Kaginkar",
        "upi_id": "9004557267@smshettypay",
        "phone": "9004557267",
        "email": "",
        "balance": 0.00,
        "login_pin": "1234",
    },

    {
        "name": "Yogesh Verma",
        "upi_id": "7666422128@smshettypay",
        "phone": "7666422128",
        "email": "",
        "balance": 0.00,
        "login_pin": "1234",
    },

    {
        "name": "Vivek Pokharkar",
        "upi_id": "8286011842@smshettypay",
        "phone": "8286011842",
        "email": "",
        "balance": 0.00,
        "login_pin": "1234",
    },

]


# --------------------------------------------------
# CREATE USERS
# --------------------------------------------------

try:

    for data in users:

        existing_user = (
            db.query(User)
            .filter(
                User.upi_id == data["upi_id"]
            )
            .first()
        )


        # IMPORTANT:
        # Never reset an existing user's balance.
        if existing_user:

            print(
                f"Already exists: "
                f"{existing_user.name} "
                f"({existing_user.upi_id})"
            )

            continue


        user = User(

            name=data["name"],

            upi_id=data["upi_id"],

            phone=data["phone"],

            email=data["email"],

            balance=data["balance"],

            login_pin=data["login_pin"],

        )


        db.add(user)


        print(
            f"Created: "
            f"{data['name']} "
            f"({data['upi_id']})"
        )


    db.commit()


    print()
    print(
        "SM Shetty Pay accounts created successfully."
    )


except Exception as error:

    db.rollback()

    print()
    print(
        "Seed error:",
        error
    )


finally:

    db.close()