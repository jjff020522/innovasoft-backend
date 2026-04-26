from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class ClientSearchRequest(BaseModel):
    identificacion: str | None = Field(default=None, max_length=20)
    nombre: str | None = Field(default=None, max_length=50)
    usuarioId: str | None = None

    model_config = {"str_strip_whitespace": True}


class ClientListItem(BaseModel):
    id: str
    identificacion: str
    nombre: str
    apellidos: str


class InterestItem(BaseModel):
    id: str
    descripcion: str


class ClientDetail(BaseModel):
    id: str
    nombre: str = Field(max_length=50)
    apellidos: str = Field(max_length=100)
    identificacion: str = Field(max_length=20)
    telefonoCelular: str | None = Field(default=None, max_length=20)
    otroTelefono: str = Field(max_length=20)
    direccion: str = Field(max_length=200)
    fNacimiento: datetime | date | str
    fAfiliacion: datetime | date | str
    sexo: Literal["M", "F"]
    resenaPersonal: str = Field(max_length=200)
    imagen: str | None = None
    interesesId: str | None = None

    @classmethod
    def from_api_payload(cls, payload: dict[str, Any]) -> "ClientDetail":
        return cls(
            id=payload.get("id", ""),
            nombre=payload.get("nombre", ""),
            apellidos=payload.get("apellidos", ""),
            identificacion=payload.get("identificacion", ""),
            telefonoCelular=payload.get("telefonoCelular") or payload.get("celular"),
            otroTelefono=payload.get("otroTelefono", ""),
            direccion=payload.get("direccion", ""),
            fNacimiento=payload.get("fNacimiento", ""),
            fAfiliacion=payload.get("fAfiliacion", ""),
            sexo=payload.get("sexo", "M"),
            resenaPersonal=payload.get("resenaPersonal")
            or payload.get("resennaPersonal")
            or "",
            imagen=payload.get("imagen"),
            interesesId=payload.get("interesesId") or payload.get("interesFK"),
        )


class ClientBaseUpsert(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)
    apellidos: str = Field(min_length=1, max_length=100)
    identificacion: str = Field(min_length=1, max_length=20)
    telefonoCelular: str = Field(min_length=1, max_length=20)
    otroTelefono: str | None = Field(default=None, max_length=20)
    direccion: str = Field(min_length=1, max_length=200)
    fNacimiento: date
    fAfiliacion: date
    sexo: Literal["M", "F"]
    resenaPersonal: str = Field(min_length=1, max_length=200)
    imagen: str | None = None
    interesFK: str = Field(min_length=1)
    usuarioId: str = Field(min_length=1)

    model_config = {"str_strip_whitespace": True}

    @field_validator("imagen")
    @classmethod
    def validate_base64_if_present(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        if "," in value:
            value = value.split(",", maxsplit=1)[1]
        import base64

        try:
            base64.b64decode(value, validate=True)
        except Exception as exc:  # noqa: BLE001
            raise ValueError("La imagen debe estar en formato base64 válido.") from exc
        return value

    @field_validator("identificacion")
    @classmethod
    def validate_identification_format(cls, value: str) -> str:
        import re

        if not re.fullmatch(r"[A-Za-z0-9\- ]+", value):
            raise ValueError("La identificacion solo permite letras, numeros, espacios y guiones.")
        return value

    @field_validator("telefonoCelular", "otroTelefono")
    @classmethod
    def validate_phone_format(cls, value: str | None) -> str | None:
        import re

        if value is None or value == "":
            return value
        if not re.fullmatch(r"[0-9()+\- ]+", value):
            raise ValueError("El telefono tiene un formato invalido.")
        return value

    @model_validator(mode="after")
    def validate_dates(self) -> "ClientBaseUpsert":
        if self.fAfiliacion < self.fNacimiento:
            raise ValueError("La fecha de afiliacion no puede ser menor a la fecha de nacimiento.")
        return self


class CreateClientRequest(ClientBaseUpsert):
    pass


class UpdateClientRequest(ClientBaseUpsert):
    id: str = Field(min_length=1)


class ExternalClientUpsertResponse(BaseModel):
    status_code: int
    payload: dict[str, Any] | list[Any] | str | None = None
