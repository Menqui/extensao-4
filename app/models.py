from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Area(Base):
    __tablename__ = "areas"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    nome: Mapped[str] = mapped_column(String(180), nullable=False)


class Assunto(Base):
    __tablename__ = "assuntos"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    nome: Mapped[str] = mapped_column(String(180), nullable=False)
    area_id: Mapped[str] = mapped_column(ForeignKey("areas.id"), nullable=False, index=True)


class Aplicacao(Base):
    __tablename__ = "aplicacoes"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    nome: Mapped[str] = mapped_column(String(180), nullable=False)


class Prova(Base):
    __tablename__ = "provas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ano: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    aplicacao_id: Mapped[str] = mapped_column(
        ForeignKey("aplicacoes.id"), nullable=False, index=True
    )
    descricao: Mapped[str] = mapped_column(String(250), nullable=False)
    aplicacao: Mapped[Aplicacao] = relationship()
    __table_args__ = (UniqueConstraint("ano", "aplicacao_id", "descricao"),)


class QuestaoAssunto(Base):
    __tablename__ = "questao_assuntos"

    questao_id: Mapped[int] = mapped_column(
        ForeignKey("questoes.id", ondelete="CASCADE"), primary_key=True
    )
    assunto_id: Mapped[str] = mapped_column(ForeignKey("assuntos.id"), primary_key=True)
    principal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    assunto: Mapped[Assunto] = relationship()


class Questao(Base):
    __tablename__ = "questoes"
    __table_args__ = (
        UniqueConstraint("prova_id", "numero_original"),
        CheckConstraint("gabarito IN ('A', 'B', 'C', 'D', 'E')", name="ck_gabarito_valido"),
        CheckConstraint(
            "status IN ('rascunho', 'em_revisao', 'publicada')", name="ck_status_questao_valido"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    prova_id: Mapped[int] = mapped_column(ForeignKey("provas.id"), nullable=False, index=True)
    area_id: Mapped[str] = mapped_column(ForeignKey("areas.id"), nullable=False, index=True)
    numero_original: Mapped[int] = mapped_column(Integer, nullable=False)
    enunciado: Mapped[str] = mapped_column(Text, nullable=False)
    alternativa_a: Mapped[str] = mapped_column(Text, nullable=False, default="")
    alternativa_b: Mapped[str] = mapped_column(Text, nullable=False, default="")
    alternativa_c: Mapped[str] = mapped_column(Text, nullable=False, default="")
    alternativa_d: Mapped[str] = mapped_column(Text, nullable=False, default="")
    alternativa_e: Mapped[str] = mapped_column(Text, nullable=False, default="")
    gabarito: Mapped[str] = mapped_column(String(1), nullable=False)
    anulada: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fonte_url: Mapped[str | None] = mapped_column(String(1000))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="rascunho", index=True)
    exemplo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    prova: Mapped[Prova] = relationship()
    area: Mapped[Area] = relationship()
    assuntos: Mapped[list[QuestaoAssunto]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )
    midias: Mapped[list["Midia"]] = relationship(cascade="all, delete-orphan", lazy="selectin")


class Midia(Base):
    __tablename__ = "midias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    questao_id: Mapped[int] = mapped_column(
        ForeignKey("questoes.id", ondelete="CASCADE"), index=True
    )
    posicao: Mapped[str] = mapped_column(String(30), nullable=False)
    caminho_arquivo: Mapped[str] = mapped_column(String(500), nullable=False)
    alt: Mapped[str] = mapped_column(String(500), nullable=False)
    largura: Mapped[int] = mapped_column(Integer, nullable=False)
    altura: Mapped[int] = mapped_column(Integer, nullable=False)


class DatasetVersao(Base):
    __tablename__ = "dataset_versoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    versao: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    descricao: Mapped[str] = mapped_column(String(500), nullable=False)
