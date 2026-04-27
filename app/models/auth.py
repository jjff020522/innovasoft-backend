from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=100)

    model_config = {"str_strip_whitespace": True}


class LoginResponse(BaseModel):
    token: str
    expiration: datetime | str
    userid: str
    username: str


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=9, max_length=20)

    model_config = {"str_strip_whitespace": True}

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        has_lower = any(character.islower() for character in value)
        has_upper = any(character.isupper() for character in value)
        has_digit = any(character.isdigit() for character in value)

        if not (has_lower and has_upper and has_digit):
            raise ValueError(
                "La contrasena debe tener entre 9 y 20 caracteres, con numero, mayuscula y minuscula."
            )
        return value


class RegisterResponse(BaseModel):
    status: str
    message: str


class SessionUser(BaseModel):
    token: str
    userid: str
    username: str
