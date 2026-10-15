import pytest
from pydantic import ValidationError

from app.config import Settings
from app.infra.cache import MemoryCache
from app.infra.logging import JsonFormatter
from app.infra.media import LocalMediaStorage


def test_settings_parse_origins_and_reject_unavailable_backends() -> None:
    settings = Settings(_env_file=None, cors_origins="http://web.test,http://other.test")
    assert settings.cors_origins == ["http://web.test", "http://other.test"]
    assert settings.database_url.startswith("postgresql+psycopg://")
    assert not settings.auto_create_tables
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cache_backend="redis")
    with pytest.raises(ValidationError):
        Settings(_env_file=None, media_backend="s3")
    with pytest.raises(ValidationError):
        Settings(_env_file=None, rate_limit_responder="not-a-limit")


def test_memory_cache_expires_and_clears() -> None:
    cache = MemoryCache()
    cache.set("expired", {"ok": True}, ttl_seconds=0)
    assert cache.get("expired") is None
    cache.set("active", {"ok": True})
    assert cache.get("active") == {"ok": True}
    cache.clear()
    assert cache.get("active") is None


def test_local_media_storage_encodes_relative_paths() -> None:
    storage = LocalMediaStorage("https://assets.example.test/")
    assert storage.public_url("ano de prova/imagem 1.svg") == (
        "https://assets.example.test/static/ano%20de%20prova/imagem%201.svg"
    )
    storage.set_dataset_version("dataset 2")
    assert storage.public_url("imagem.svg").endswith("?v=dataset%202")


def test_json_log_formatter_emits_request_context() -> None:
    import json
    import logging

    record = logging.LogRecord("api", logging.INFO, "api.py", 1, "request", (), None)
    record.request_id = "req-1"
    record.path = "/api/v1/saude"
    payload = json.loads(JsonFormatter().format(record))
    assert payload["level"] == "INFO"
    assert payload["request_id"] == "req-1"
    assert payload["path"] == "/api/v1/saude"
