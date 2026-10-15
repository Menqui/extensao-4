from typing import Literal

from pydantic import BaseModel, ConfigDict


class ErroDetalhe(BaseModel):
    codigo: str
    mensagem: str
    detalhes: object | None = None


class ErroResposta(BaseModel):
    erro: ErroDetalhe


class OpcaoFiltro(BaseModel):
    id: str
    nome: str
    area_id: str | None = None


class FiltrosResposta(BaseModel):
    dataset_version: str
    anos: list[int]
    areas: list[OpcaoFiltro]
    assuntos: list[OpcaoFiltro]
    aplicacoes: list[OpcaoFiltro]


class AplicacaoResposta(BaseModel):
    id: str
    nome: str


class AreaResposta(BaseModel):
    id: str
    nome: str


class AssuntoResposta(BaseModel):
    id: str
    nome: str
    principal: bool


class MidiaResposta(BaseModel):
    posicao: str
    url: str
    alt: str
    largura: int
    altura: int


class QuestaoResposta(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    ano: int
    aplicacao: AplicacaoResposta
    prova: str
    numero_original: int
    area: AreaResposta
    assuntos: list[AssuntoResposta]
    enunciado: str
    midias: list[MidiaResposta]
    alternativas: dict[Literal["A", "B", "C", "D", "E"], str]
    fonte_url: str | None


class ListaQuestoesResposta(BaseModel):
    total: int
    page: int
    page_size: int
    total_paginas: int
    itens: list[QuestaoResposta]


class ResponderEntrada(BaseModel):
    alternativa: Literal["A", "B", "C", "D", "E"]


class ResponderResposta(BaseModel):
    correta: bool
    gabarito: Literal["A", "B", "C", "D", "E"]
    resolucao_disponivel: bool = False


class GabaritoResposta(BaseModel):
    gabarito: Literal["A", "B", "C", "D", "E"]


class SaudeResposta(BaseModel):
    status: Literal["ok"]


class ProntoResposta(BaseModel):
    status: Literal["ok"]
    dataset_version: str
