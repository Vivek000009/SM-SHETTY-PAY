from database import SessionLocal
import models


db = SessionLocal()


try:

    users = db.query(models.User).all()


    print("\nCURRENT ACCOUNTS")
    print("------------------------------")


    for user in users:

        print(
            user.name,
            "|",
            user.phone,
            "|",
            user.upi_id,
            "| Balance:",
            user.balance,
            "| PIN:",
            user.login_pin
        )


    # Make sure every account has a balance
    for user in users:

        if user.balance is None:

            user.balance = 0.0


    # Yashodan's login PIN
    yashodan = (
        db.query(models.User)
        .filter(
            models.User.phone == "7208127962"
        )
        .first()
    )


    if yashodan:

        yashodan.login_pin = "5678"

        print(
            "\nYashodan PIN set to 5678."
        )

    else:

        print(
            "\nWARNING: Yashodan account not found."
        )


    db.commit()


    print(
        "\nAccounts fixed successfully."
    )


finally:

    db.close()