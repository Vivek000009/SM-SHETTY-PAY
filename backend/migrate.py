import sqlite3
import os

DB_FILE = os.path.join(
    os.path.dirname(__file__),
    "sm_shetty_pay.db"
)

connection = sqlite3.connect(DB_FILE)

cursor = connection.cursor()

try:

    cursor.execute(
        """
        ALTER TABLE users
        ADD COLUMN login_pin TEXT NOT NULL DEFAULT '1234'
        """
    )

    connection.commit()

    print("SUCCESS: login_pin column added.")

except sqlite3.OperationalError as error:

    if "duplicate column name" in str(error).lower():

        print("login_pin column already exists.")

    else:

        print("Database error:", error)

finally:

    connection.close()