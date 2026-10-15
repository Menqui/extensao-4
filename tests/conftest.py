from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from scripts.import_data import import_file

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE_DATA = ROOT / "data" / "questoes" / "exemplo.json"


@pytest.fixture
def api_client(tmp_path: Path) -> TestClient:
    settings = Settings(
        _env_file=None,
        database_url=f"sqlite:///{tmp_path / 'tests.db'}",
        static_base_url="http://testserver",
        media_dir=ROOT / "data" / "imagens",
        dataset_version="test-1",
        rate_limit_responder="100/minute",
        auto_create_tables=True,
    )
    application = create_app(settings)
    with TestClient(application) as client:
        counts = import_file(EXAMPLE_DATA, settings=settings)
        assert counts == {"inseridas": 16, "atualizadas": 0, "ignoradas": 0, "erros": 0}
        yield client
