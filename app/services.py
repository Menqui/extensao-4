import math

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import Settings
from app.infra.cache import Cache
from app.infra.media import LocalMediaStorage, MediaStorage
from app.models import Aplicacao, Area, Assunto, Questao
from app.repositories import QuestaoRepository


def as_question(question: Questao, media_storage: MediaStorage) -> dict[str, object]:
    return {
        "id": question.id,
        "ano": question.prova.ano,
        "aplicacao": {"id": question.prova.aplicacao.id, "nome": question.prova.aplicacao.nome},
        "prova": question.prova.descricao,
        "numero_original": question.numero_original,
        "area": {"id": question.area.id, "nome": question.area.nome},
        "assuntos": [
            {
                "id": item.assunto.id,
                "nome": item.assunto.nome,
                "principal": item.principal,
            }
            for item in sorted(
                question.assuntos,
                key=lambda relation: (not relation.principal, relation.assunto.id),
            )
        ],
        "enunciado": question.enunciado,
        "midias": [
            {
                "posicao": item.posicao,
                "url": media_storage.public_url(item.caminho_arquivo),
                "alt": item.alt,
                "largura": item.largura,
                "altura": item.altura,
            }
            for item in question.midias
        ],
        "alternativas": {
            "A": question.alternativa_a,
            "B": question.alternativa_b,
            "C": question.alternativa_c,
            "D": question.alternativa_d,
            "E": question.alternativa_e,
        },
        "fonte_url": question.fonte_url,
    }


class QuestaoService:
    def __init__(
        self,
        session: Session,
        settings: Settings,
        cache: Cache,
        media_storage: MediaStorage | None = None,
    ) -> None:
        self.session = session
        self.settings = settings
        self.cache = cache
        self.media_storage = media_storage or LocalMediaStorage(settings.static_base_url)
        self.repository = QuestaoRepository(session)

    def list_questions(
        self,
        anos: list[int],
        areas: list[str],
        assuntos: list[str],
        aplicacoes: list[str],
        incluir_anuladas: bool,
        ordem: str,
        semente: int | None,
        page: int,
        page_size: int,
    ) -> dict[str, object]:
        if any(year < 1900 or year > 2100 for year in anos):
            raise HTTPException(
                status_code=422,
                detail={
                    "codigo": "PARAMETRO_INVALIDO",
                    "mensagem": "Ano deve estar entre 1900 e 2100.",
                },
            )
        for model, ids, name in (
            (Area, areas, "área"),
            (Assunto, assuntos, "assunto"),
            (Aplicacao, aplicacoes, "aplicação"),
        ):
            if not self.repository.valid_filter_ids(model, ids):
                raise HTTPException(
                    status_code=422,
                    detail={
                        "codigo": "PARAMETRO_INVALIDO",
                        "mensagem": f"Filtro de {name} inválido.",
                    },
                )
        total, questions = self.repository.list_questions(
            anos,
            areas,
            assuntos,
            aplicacoes,
            incluir_anuladas,
            ordem,
            semente,
            page,
            page_size,
        )
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_paginas": math.ceil(total / page_size) if total else 0,
            "itens": [as_question(question, self.media_storage) for question in questions],
        }

    def get_question(self, question_id: int) -> dict[str, object]:
        question = self.repository.get_published(question_id)
        if question is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "codigo": "QUESTAO_NAO_ENCONTRADA",
                    "mensagem": "Questão não encontrada.",
                },
            )
        return as_question(question, self.media_storage)

    def answer(self, question_id: int, alternative: str) -> dict[str, object]:
        question = self.repository.get_published(question_id)
        if question is None:
            self.get_question(question_id)
            raise AssertionError("Questão publicada deveria ter sido encontrada.")
        return {
            "correta": alternative == question.gabarito,
            "gabarito": question.gabarito,
            "resolucao_disponivel": False,
        }

    def answer_key(self, question_id: int) -> dict[str, str]:
        question = self.repository.get_published(question_id)
        if question is None:
            self.get_question(question_id)
            raise AssertionError("Questão publicada deveria ter sido encontrada.")
        return {"gabarito": question.gabarito}

    def available_filters(self) -> dict[str, object]:
        version = self.repository.dataset_version(self.settings.dataset_version)
        key = f"filtros:{version}"
        cached = self.cache.get(key)
        if cached is not None:
            if isinstance(cached, dict) and all(isinstance(key, str) for key in cached):
                return {key: value for key, value in cached.items()}
        values = self.repository.filter_values()
        result: dict[str, object] = {
            "dataset_version": version,
            "anos": values["anos"],
            "areas": [{"id": row[0], "nome": row[1]} for row in values["areas"]],
            "assuntos": [
                {"id": row[0], "nome": row[1], "area_id": row[2]} for row in values["assuntos"]
            ],
            "aplicacoes": [{"id": row[0], "nome": row[1]} for row in values["aplicacoes"]],
        }
        self.cache.set(key, result, ttl_seconds=60)
        return result
