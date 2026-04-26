from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(
        default="Innovasoft Client Management Local API",
        validation_alias="LOCAL_API_APP_NAME",
    )
    app_env: str = Field(default="development", validation_alias="LOCAL_API_ENV")
    debug: bool = Field(default=False, validation_alias="LOCAL_API_DEBUG")

    host: str = Field(default="0.0.0.0", validation_alias="LOCAL_API_HOST")
    port: int = Field(default=8000, validation_alias="LOCAL_API_PORT")

    innovasoft_api_base_url: str = Field(
        default="https://pruebareactjs.test-class.com/Api/",
        validation_alias="LOCAL_API_INNOVASOFT_API_BASE_URL",
    )
    innovasoft_timeout_seconds: float = Field(
        default=30.0,
        validation_alias="LOCAL_API_INNOVASOFT_TIMEOUT_SECONDS",
    )

    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        validation_alias="LOCAL_API_MONGODB_URI",
    )
    mongodb_db_name: str = Field(
        default="innovasoft_local",
        validation_alias="LOCAL_API_MONGODB_DB_NAME",
    )

    cors_origins: str = Field(
        default="http://localhost:5173",
        validation_alias="LOCAL_API_CORS_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("innovasoft_api_base_url")
    @classmethod
    def normalize_base_url(cls, value: str) -> str:
        return value.rstrip("/") + "/"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value: str | list[str]) -> str:
        if isinstance(value, list):
            return ",".join(item.strip() for item in value if item.strip())
        return value

    def get_cors_origins_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
