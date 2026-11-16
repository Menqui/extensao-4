from typing import TypedDict

from sqlalchemy import BigInteger, cast, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import (
    Aplicacao,
    Area,
    Assunto,
    DatasetVersao,
    Prova,
    Questao,
    QuestaoAssunto,
)


class FilterValues(TypedDict):
    anos: list[int]
    areas: list[tuple[str, str]]
    assuntos: list[tuple[str, str, str]]
    aplicacoes: list[tuple[str, str]]


class QuestaoRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

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
    ) -> tuple[int, list[Questao]]:
        query = select(Questao).join(Questao.prova).where(Questao.status == "publicada")
        if anos:
            query = query.where(Prova.ano.in_(anos))
        if areas:
            query = query.where(Questao.area_id.in_(areas))
        if aplicacoes:
            query = query.where(Prova.aplicacao_id.in_(aplicacoes))
        if assuntos:
            matching = (
                select(QuestaoAssunto.questao_id)
                .where(
                    QuestaoAssunto.questao_id == Questao.id,
                    QuestaoAssunto.assunto_id.in_(assuntos),
                )
                .exists()
            )
            query = query.where(matching)
        if not incluir_anuladas:
            query = query.where(Questao.anulada.is_(False))

        total = self.session.scalar(select(func.count()).select_from(query.subquery())) or 0
        query = query.options(
            joinedload(Questao.prova).joinedload(Prova.aplicacao),
            joinedload(Questao.area),
            selectinload(Questao.assuntos).joinedload(QuestaoAssunto.assunto),
            selectinload(Questao.midias),
        )
        if ordem == "ano_asc":
            query = query.order_by(Prova.ano.asc(), Questao.numero_original.asc(), Questao.id.asc())
        elif ordem == "aleatoria":
            stable_order = (
                cast(Questao.id, BigInteger) * 1103515245 + ((semente or 0) % 2147483647)
            ) % 2147483647
            query = query.order_by(stable_order, Questao.id)
        else:
            query = query.order_by(
                Prova.ano.desc(), Questao.numero_original.asc(), Questao.id.asc()
            )
        items = (
            self.session.scalars(query.offset((page - 1) * page_size).limit(page_size))
            .unique()
            .all()
        )
        return total, list(items)

    def get_published(self, question_id: int) -> Questao | None:
        query = (
            select(Questao)
            .where(Questao.id == question_id, Questao.status == "publicada")
            .options(
                joinedload(Questao.prova).joinedload(Prova.aplicacao),
                joinedload(Questao.area),
                selectinload(Questao.assuntos).joinedload(QuestaoAssunto.assunto),
                selectinload(Questao.midias),
            )
        )
        return self.session.scalars(query).unique().one_or_none()

    def filter_values(self) -> FilterValues:
        years = list(
            self.session.scalars(
                select(Prova.ano)
                .join(Questao, Questao.prova_id == Prova.id)
                .where(Questao.status == "publicada")
                .distinct()
                .order_by(Prova.ano)
            ).all()
        )
        areas = (
            self.session.execute(
                select(Area.id, Area.nome)
                .join(Questao, Questao.area_id == Area.id)
                .where(Questao.status == "publicada")
                .distinct()
                .order_by(Area.id)
            )
            .tuples()
            .all()
        )
        subjects = (
            self.session.execute(
                select(Assunto.id, Assunto.nome, Assunto.area_id)
                .join(QuestaoAssunto, QuestaoAssunto.assunto_id == Assunto.id)
                .join(Questao, Questao.id == QuestaoAssunto.questao_id)
                .where(Questao.status == "publicada")
                .distinct()
                .order_by(Assunto.id)
            )
            .tuples()
            .all()
        )
        applications = (
            self.session.execute(
                select(Aplicacao.id, Aplicacao.nome)
                .join(Prova, Prova.aplicacao_id == Aplicacao.id)
                .join(Questao, Questao.prova_id == Prova.id)
                .where(Questao.status == "publicada")
                .distinct()
                .order_by(Aplicacao.id)
            )
            .tuples()
            .all()
        )
        return {
            "anos": years,
            "areas": list(areas),
            "assuntos": list(subjects),
            "aplicacoes": list(applications),
        }

    def valid_filter_ids(
        self, table: type[Area] | type[Assunto] | type[Aplicacao], ids: list[str]
    ) -> bool:
        if not ids:
            return True
        found = self.session.scalars(select(table.id).where(table.id.in_(ids))).all()
        return set(ids).issubset(set(found))

    def dataset_version(self, fallback: str) -> str:
        version = self.session.scalar(
            select(DatasetVersao.versao).order_by(DatasetVersao.id.desc()).limit(1)
        )
        return version or fallback
