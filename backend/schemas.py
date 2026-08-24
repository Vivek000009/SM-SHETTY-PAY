from pydantic import BaseModel, Field


# --------------------------------------------------
# UPI RESOLVE
# --------------------------------------------------

class UPIResolveRequest(BaseModel):

    upi_id: str


# --------------------------------------------------
# LOGIN
# --------------------------------------------------

class LoginRequest(BaseModel):

    phone: str

    login_pin: str


class LoginResponse(BaseModel):

    success: bool

    message: str

    name: str | None = None

    upi_id: str | None = None

    phone: str | None = None


# --------------------------------------------------
# PAYMENT
# --------------------------------------------------

class PaymentRequest(BaseModel):

    sender_upi: str

    receiver_upi: str

    amount: float = Field(gt=0)

    payment_pin: str


class PaymentResponse(BaseModel):

    success: bool

    message: str

    transaction_id: str | None = None

    receiver_name: str | None = None

    receiver_upi: str | None = None

    amount: float | None = None

    created_at: str | None = None


# --------------------------------------------------
# CHECK BALANCE
# --------------------------------------------------

class BalanceRequest(BaseModel):

    upi_id: str

    pin: str


# --------------------------------------------------
# ADMIN ADD MONEY
# --------------------------------------------------

class AdminAddMoneyRequest(BaseModel):

    admin_upi: str

    admin_pin: str

    receiver_upi: str

    amount: float = Field(gt=0)