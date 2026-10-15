import json
from pathlib import Path

from sqlalchemy import func, select

from app.config import Settings
from app.db import make_session_factory
from app.models import DatasetVersao, Questao
from scripts.import_data import import_file, import_path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / "data" / "questoes" / "exemplo.json"


def test_example_import_is_idempotent(tmp_path: Path) -> None:
    settings = Settings(
        _env_file=None,
        database_url=f"sqlite:///{tmp_path / 'seed.db'}",
        media_dir=ROOT / "data" / "imagens",
        dataset_version="seed-test",
    )
    first = import_file(EXAMPLE, settings=settings)
    second = import_file(EXAMPLE, settings=settings)
    factory = make_session_factory(settings.database_url)
    with factory() as session:
        total = session.scalar(select(func.count()).select_from(Questao))
        versions = session.scalar(select(func.count()).select_from(DatasetVersao))
    assert first == {"inseridas": 16, "atualizadas": 0, "ignoradas": 0, "erros": 0}
    assert second == {"inseridas": 0, "atualizadas": 16, "ignoradas": 0, "erros": 0}
    assert total == 16
    assert versions == 1


def test_invalid_answer_and_unknown_subject_are_reported(tmp_path: Path) -> None:
    settings = Settings(
        _env_file=None,
        database_url=f"sqlite:///{tmp_path / 'invalid.db'}",
        media_dir=ROOT / "data" / "imagens",
    )
    record = json.loads(EXAMPLE.read_text(encoding="utf-8"))[0]
    bad_key = dict(record, gabarito="Z")
    bad_subject = dict(record, numero_original=99, assunto_principal="assunto-inexistente")
    source = tmp_path / "invalid.json"
    source.write_text(json.dumps([bad_key, bad_subject]), encoding="utf-8")
    result = import_file(source, settings=settings)
    factory = make_session_factory(settings.database_url)
    with factory() as session:
        total = session.scalar(select(func.count()).select_from(Questao))
    assert result["erros"] == 2
    assert result["inseridas"] == 0
    assert total == 0


def test_dry_run_validates_without_creating_database(tmp_path: Path) -> None:
    database_path = tmp_path / "dry-run.db"
    settings = Settings(
        _env_file=None,
        database_url=f"sqlite:///{database_path}",
        media_dir=ROOT / "data" / "imagens",
    )
    result = import_file(EXAMPLE, dry_run=True, settings=settings)
    assert result == {"inseridas": 0, "atualizadas": 0, "ignoradas": 16, "erros": 0}
    assert not database_path.exists()


def test_directory_import_reads_json_files(tmp_path: Path) -> None:
    settings = Settings(
        _env_file=None,
        database_url=f"sqlite:///{tmp_path / 'directory.db'}",
        media_dir=ROOT / "data" / "imagens",
    )
    result = import_path(EXAMPLE.parent, settings=settings)
    assert result["inseridas"] == 16
