from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    env: str = "dev"
    database_url: str = "postgresql+psycopg://explorador:explorador_dev@db:5432/explorador"
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    static_base_url: str = "http://localhost:8000"
    media_backend: str = "local"
    media_dir: Path = Path("./data/imagens")
    cache_backend: str = "memory"
    redis_url: str | None = None
    dataset_version: str = "2026-10-12.1"
    rate_limit_responder: str = "60/minute"
    log_level: str = "INFO"
    auto_create_tables: bool = False
    metrics_token: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("cache_backend")
    @classmethod
    def supported_cache_backend(cls, value: str) -> str:
        if value != "memory":
            raise ValueError("CACHE_BACKEND suporta apenas 'memory' nesta versão.")
        return value

    @field_validator("media_backend")
    @classmethod
    def supported_media_backend(cls, value: str) -> str:
        if value != "local":
            raise ValueError("MEDIA_BACKEND suporta apenas 'local' nesta versão.")
        return value

    @field_validator("rate_limit_responder")
    @classmethod
    def valid_rate_limit(cls, value: str) -> str:
        try:
            count, period = value.split("/", maxsplit=1)
            if int(count) < 1 or period not in {"second", "minute", "hour"}:
                raise ValueError
        except ValueError as error:
            raise ValueError(
                "Use RATE_LIMIT_RESPONDER no formato N/second, N/minute ou N/hour."
            ) from error
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
