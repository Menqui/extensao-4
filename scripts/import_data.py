import argparse
import json
import logging
import re
import sys
import xml.etree.ElementTree as ET
from contextlib import AbstractContextManager
from importlib import import_module
from pathlib import Path
from typing import Any, Protocol, cast

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import Settings, get_settings  # noqa: E402
from app.db import Base, make_session_factory  # noqa: E402
from app.models import (  # noqa: E402
    Aplicacao,
    Area,
    Assunto,
    DatasetVersao,
    Midia,
    Prova,
    Questao,
    QuestaoAssunto,
)

logger = logging.getLogger("import_data")


class RasterImage(Protocol):
    @property
    def size(self) -> tuple[int, int]: ...


class RasterImageModule(Protocol):
    def open(self, path: Path) -> AbstractContextManager[RasterImage]: ...


class MidiaEntrada(BaseModel):
    arquivo: str = Field(min_length=1)
    alt: str = Field(min_length=1, max_length=500)
    posicao: str = "enunciado"

    @field_validator("posicao")
    @classmethod
    def valid_position(cls, value: str) -> str:
        allowed = {
            "enunciado",
            "alternativa_a",
            "alternativa_b",
            "alternativa_c",
            "alternativa_d",
            "alternativa_e",
        }
        if value not in allowed:
            raise ValueError("Posição de mídia inválida.")
        return value


class QuestaoEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ano: int = Field(ge=1900, le=2100)
    aplicacao: str = Field(min_length=1, max_length=80)
    area: str = Field(min_length=1, max_length=80)
    numero_original: int = Field(ge=1)
    enunciado: str = Field(min_length=1)
    alternativas: dict[str, str]
    gabarito: str
    assunto_principal: str
    assuntos_secundarios: list[str] = Field(default_factory=list)
    anulada: bool = False
    status: str = "rascunho"
    exemplo: bool = False
    fonte_url: str | None = None
    prova: str | None = None
    imagens_enunciado: list[MidiaEntrada] = Field(default_factory=list)
    midias: list[MidiaEntrada] = Field(default_factory=list)

    @field_validator("gabarito")
    @classmethod
    def valid_answer_key(cls, value: str) -> str:
        if value not in {"A", "B", "C", "D", "E"}:
            raise ValueError("Gabarito deve ser uma alternativa de A a E.")
        return value

    @field_validator("status")
    @classmethod
    def valid_status(cls, value: str) -> str:
        if value not in {"rascunho", "em_revisao", "publicada"}:
            raise ValueError("Status deve ser rascunho, em_revisao ou publicada.")
        return value

    @field_validator("alternativas")
    @classmethod
    def valid_alternatives(cls, value: dict[str, str]) -> dict[str, str]:
        if set(value) != {"A", "B", "C", "D", "E"}:
            raise ValueError("Alternativas devem conter exatamente as chaves A, B, C, D e E.")
        return value


def read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as source:
        return json.load(source)


def image_dimensions(image_path: Path) -> tuple[int, int]:
    if image_path.suffix.lower() == ".svg":
        try:
            root = ET.parse(image_path).getroot()
        except ET.ParseError as error:
            raise ValueError(f"SVG inválido: {image_path.name}") from error
        width = re.match(r"\d+", root.attrib.get("width", ""))
        height = re.match(r"\d+", root.attrib.get("height", ""))
        if width is None or height is None:
            raise ValueError(f"SVG precisa declarar largura e altura: {image_path.name}")
        return int(width.group()), int(height.group())
    image_module = cast(RasterImageModule, import_module("PIL.Image"))

    with image_module.open(image_path) as image:
        return image.size


def import_taxonomy(
    session: Any, taxonomy: dict[str, Any], applications: list[dict[str, str]]
) -> None:
    for area_data in taxonomy["areas"]:
        area = session.get(Area, area_data["id"])
        if area is None:
            session.add(Area(id=area_data["id"], nome=area_data["nome"]))
        else:
            area.nome = area_data["nome"]
        for subject_data in area_data["assuntos"]:
            subject = session.get(Assunto, subject_data["id"])
            if subject is None:
                session.add(
                    Assunto(
                        id=subject_data["id"], nome=subject_data["nome"], area_id=area_data["id"]
                    )
                )
            else:
                subject.nome = subject_data["nome"]
                subject.area_id = area_data["id"]
    for application_data in applications:
        application = session.get(Aplicacao, application_data["id"])
        if application is None:
            session.add(Aplicacao(id=application_data["id"], nome=application_data["nome"]))
        else:
            application.nome = application_data["nome"]


def media_for_item(item: QuestaoEntrada) -> list[MidiaEntrada]:
    return [*item.imagens_enunciado, *item.midias]


def validate_references(
    item: QuestaoEntrada,
    area_subjects: dict[str, set[str]],
    taxonomy_ids: set[str],
    app_ids: set[str],
) -> None:
    if item.area not in area_subjects:
        raise ValueError(f"Área desconhecida: {item.area}")
    if item.aplicacao not in app_ids:
        raise ValueError(f"Aplicação desconhecida: {item.aplicacao}")
    valid_subjects = area_subjects[item.area]
    if item.assunto_principal not in taxonomy_ids or item.assunto_principal not in valid_subjects:
        raise ValueError(
            f"Assunto principal inexistente ou incompatível com a área: {item.assunto_principal}"
        )
    if len(item.assuntos_secundarios) != len(set(item.assuntos_secundarios)):
        raise ValueError("Há assuntos secundários repetidos.")
    if item.assunto_principal in item.assuntos_secundarios:
        raise ValueError("O assunto principal não pode também ser secundário.")
    for subject in item.assuntos_secundarios:
        if subject not in taxonomy_ids or subject not in valid_subjects:
            raise ValueError(
                f"Assunto secundário inexistente ou incompatível com a área: {subject}"
            )
    media_root = (ROOT / "data" / "imagens").resolve()
    for media in media_for_item(item):
        resolved_path = (media_root / media.arquivo).resolve()
        if not resolved_path.is_relative_to(media_root):
            raise ValueError("Caminho de mídia inválido.")
        if not resolved_path.is_file():
            raise ValueError(f"Arquivo de mídia não encontrado: {media.arquivo}")
        image_dimensions(resolved_path)


def upsert_question(session: Any, item: QuestaoEntrada) -> bool:
    description = item.prova or (
        f"Questões fictícias de demonstração (não oficiais do INEP) — {item.ano} — {item.aplicacao}"
        if item.exemplo
        else f"ENEM {item.ano} — {item.aplicacao}"
    )
    proof = session.scalar(
        select(Prova).where(
            Prova.ano == item.ano,
            Prova.aplicacao_id == item.aplicacao,
            Prova.descricao == description,
        )
    )
    if proof is None:
        proof = Prova(ano=item.ano, aplicacao_id=item.aplicacao, descricao=description)
        session.add(proof)
        session.flush()
    question = session.scalar(
        select(Questao).where(
            Questao.prova_id == proof.id,
            Questao.numero_original == item.numero_original,
        )
    )
    inserted = question is None
    if question is None:
        question = Questao(prova_id=proof.id, numero_original=item.numero_original)
        session.add(question)
    question.area_id = item.area
    question.enunciado = item.enunciado
    question.alternativa_a = item.alternativas["A"]
    question.alternativa_b = item.alternativas["B"]
    question.alternativa_c = item.alternativas["C"]
    question.alternativa_d = item.alternativas["D"]
    question.alternativa_e = item.alternativas["E"]
    question.gabarito = item.gabarito
    question.anulada = item.anulada
    question.status = item.status
    question.exemplo = item.exemplo
    question.fonte_url = item.fonte_url
    question.assuntos = [
        QuestaoAssunto(assunto_id=item.assunto_principal, principal=True),
        *[
            QuestaoAssunto(assunto_id=subject_id, principal=False)
            for subject_id in item.assuntos_secundarios
        ],
    ]
    question.midias = []
    media_root = ROOT / "data" / "imagens"
    for media in media_for_item(item):
        width, height = image_dimensions((media_root / media.arquivo).resolve())
        question.midias.append(
            Midia(
                posicao=media.posicao,
                caminho_arquivo=media.arquivo.replace("\\", "/"),
                alt=media.alt,
                largura=width,
                altura=height,
            )
        )
    session.flush()
    return inserted


def import_file(
    path: Path, dry_run: bool = False, settings: Settings | None = None
) -> dict[str, int]:
    settings = settings or get_settings()
    factory = make_session_factory(settings.database_url)
    engine = factory.kw["bind"]
    if not dry_run:
        Base.metadata.create_all(bind=engine)
    raw_records = read_json(path)
    if not isinstance(raw_records, list):
        raise ValueError(f"{path}: o arquivo de questões deve conter uma lista JSON.")
    taxonomy = read_json(ROOT / "data" / "taxonomia.json")
    applications = read_json(ROOT / "data" / "aplicacoes.json")
    area_subjects = {
        area["id"]: {subject["id"] for subject in area["assuntos"]} for area in taxonomy["areas"]
    }
    taxonomy_ids = {subject for subjects in area_subjects.values() for subject in subjects}
    app_ids = {entry["id"] for entry in applications}
    counts = {"inseridas": 0, "atualizadas": 0, "ignoradas": 0, "erros": 0}
    with factory() as session:
        if not dry_run:
            import_taxonomy(session, taxonomy, applications)
            session.commit()
        for index, raw_record in enumerate(raw_records, start=1):
            try:
                item = QuestaoEntrada.model_validate(raw_record)
                validate_references(item, area_subjects, taxonomy_ids, app_ids)
                if dry_run:
                    counts["ignoradas"] += 1
                    continue
                inserted = upsert_question(session, item)
                session.commit()
                counts["inseridas" if inserted else "atualizadas"] += 1
            except (ValidationError, ValueError, OSError, SQLAlchemyError) as error:
                session.rollback()
                counts["erros"] += 1
                logger.error("%s, registro %d: %s", path.name, index, error)
        if not dry_run and counts["erros"] == 0:
            version = session.scalar(
                select(DatasetVersao).where(DatasetVersao.versao == settings.dataset_version)
            )
            if version is None:
                session.add(
                    DatasetVersao(
                        versao=settings.dataset_version,
                        descricao=f"Importação de {path.name}",
                    )
                )
                session.commit()
    return counts


def import_path(
    path: Path, dry_run: bool = False, settings: Settings | None = None
) -> dict[str, int]:
    files = sorted(path.glob("*.json")) if path.is_dir() else [path]
    if not files:
        raise ValueError(f"Nenhum arquivo JSON encontrado em {path}.")
    totals = {"inseridas": 0, "atualizadas": 0, "ignoradas": 0, "erros": 0}
    for source in files:
        try:
            counts = import_file(source, dry_run=dry_run, settings=settings)
        except (OSError, json.JSONDecodeError, ValueError) as error:
            logger.error("%s: %s", source.name, error)
            totals["erros"] += 1
            continue
        for key, value in counts.items():
            totals[key] += value
    return totals


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa questões em JSON de forma idempotente.")
    parser.add_argument(
        "--file",
        type=Path,
        default=ROOT / "data" / "questoes" / "exemplo.json",
        help="Arquivo JSON a importar (padrão: dataset fictício de exemplo).",
    )
    parser.add_argument("--dry-run", action="store_true", help="Valida sem gravar no banco.")
    args = parser.parse_args()
    source = args.file if args.file.is_absolute() else ROOT / args.file
    try:
        counts = import_path(source, dry_run=args.dry_run)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        logger.error("Falha ao importar %s: %s", source, error)
        return 1
    print(json.dumps(counts, ensure_ascii=False))
    return 1 if counts["erros"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
