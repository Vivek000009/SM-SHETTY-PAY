from database import SessionLocal, engine, Base
from models import User


# Create database tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()


users = [
    {
        "name": "VIVEK YADAV",
        "upi_id": "9892354055@smshettypay",
        "phone": "9892354055",
        "email": "vy4767132@gmail.com",
        "balance": 5000.00,
    },
    {
        "name": "Yashodhan Poojari",
        "upi_id": "7208127962@smshettypay",
        "phone": "7208127962",
        "email": "",
        "balance": 0.00,
    },
    {
        "name": "Ketan Kaginkar",
        "upi_id": "9004557267@smshettypay",
        "phone": "9004557267",
        "email": "",
        "balance": 0.00,
    },
    {
        "name": "Yogesh Verma",
        "upi_id": "7666422128@smshettypay",
        "phone": "7666422128",
        "email": "",
        "balance": 0.00,
    },
    {
        "name": "Vivek Pokharkar",
        "upi_id": "8286011842@smshettypay",
        "phone": "8286011842",
        "email": "",
        "balance": 0.00,
    },
]


for data in users:

    existing_user = (
        db.query(User)
        .filter(User.upi_id == data["upi_id"])
        .first()
    )

    if existing_user:
        print(f"Already exists: {data['upi_id']}")
        continue

    user = User(
        name=data["name"],
        upi_id=data["upi_id"],
        phone=data["phone"],
        email=data["email"],
        balance=data["balance"],
    )

    db.add(user)

    print(f"Created: {data['name']} ({data['upi_id']})")


db.commit()
db.close()

print("\nTest accounts created successfully.")