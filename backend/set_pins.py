import sqlite3
import os


DB_FILE = os.path.join(
    os.path.dirname(__file__),
    "sm_shetty_pay.db"
)


connection = sqlite3.connect(DB_FILE)

cursor = connection.cursor()


accounts = [
    ("9892354055", "1234"),
    ("7208127962", "1234"),
    ("9004557267", "1234"),
    ("8286011842", "1234"),
    ("7666422128", "1234"),
]


for phone, pin in accounts:

    cursor.execute(
        """
        UPDATE users
        SET login_pin = ?
        WHERE phone = ?
        """,
        (pin, phone)
    )


connection.commit()


cursor.execute(
    """
    SELECT name, phone, upi_id, login_pin
    FROM users
    """
)

users = cursor.fetchall()


print()
print("LOGIN ACCOUNTS")
print("------------------------------")


for user in users:

    print("Name:", user[0])
    print("Phone:", user[1])
    print("UPI:", user[2])
    print("PIN:", user[3])
    print("------------------------------")


connection.close()