import type {
  ListaQuestoes,
  Questao,
} from "../api/tipos";

import { filtrosMock } from "./fixtures/filtros";
import { questoesMock } from "./fixtures/questoes";

type ResultadoProcessamento =
  | { ok: true; dados: ListaQuestoes }
  | { ok: false; mensagem: string };

function lerInteiro(
  valor: string,
): number | undefined {
  if (!/^[+-]?\d+$/.test(valor)) {
    return undefined;
  }

  const numero = Number(valor);

  return Number.isSafeInteger(numero)
    ? numero
    : undefined;
}

function embaralhar(
  questoes: Questao[],
  semente: number,
): Questao[] {
  const resultado = [...questoes];
  let estado = semente >>> 0;

  function proximoNumero() {
    estado =
      (Math.imul(1664525, estado) + 1013904223) >>> 0;

    return estado / 4294967296;
  }

  for (
    let indice = resultado.length - 1;
    indice > 0;
    indice--
  ) {
    const outroIndice = Math.floor(
      proximoNumero() * (indice + 1),
    );

    [resultado[indice], resultado[outroIndice]] = [
      resultado[outroIndice],
      resultado[indice],
    ];
  }

  return resultado;
}

export function processarQuestoesMock(
  busca: URLSearchParams,
): ResultadoProcessamento {
  const anos = busca
    .getAll("ano")
    .map((valor) => lerInteiro(valor));

  const areas = busca.getAll("area");
  const assuntos = busca.getAll("assunto");
  const aplicacoes = busca.getAll("aplicacao");

  const pagina = lerInteiro(
    busca.get("page") ?? "1",
  );

  const tamanho = lerInteiro(
    busca.get("page_size") ?? "10",
  );

  const ordem =
    busca.get("ordem") ?? "ano_desc";

  const semente = lerInteiro(
    busca.get("semente") ?? "0",
  );

  const incluirAnuladas =
    busca.get("incluir_anuladas") ?? "false";

  const filtrosValidos =
    anos.every(
      (ano) =>
        ano !== undefined &&
        filtrosMock.anos.includes(ano),
    ) &&
    areas.every((id) =>
      filtrosMock.areas.some(
        (area) => area.id === id,
      ),
    ) &&
    assuntos.every((id) =>
      filtrosMock.assuntos.some(
        (assunto) => assunto.id === id,
      ),
    ) &&
    aplicacoes.every((id) =>
      filtrosMock.aplicacoes.some(
        (aplicacao) => aplicacao.id === id,
      ),
    );

  if (!filtrosValidos) {
    return {
      ok: false,
      mensagem: "Um dos filtros informados é inválido.",
    };
  }

  if (
    pagina === undefined ||
    pagina < 1 ||
    tamanho === undefined ||
    tamanho < 1 ||
    tamanho > 50 ||
    semente === undefined ||
    !["ano_desc", "ano_asc", "aleatoria"].includes(ordem) ||
    !["true", "false"].includes(incluirAnuladas)
  ) {
    return {
      ok: false,
      mensagem:
        "Confira a página, o tamanho da página e a ordenação.",
    };
  }

  let resultado: Questao[] = questoesMock.filter(
    (questao) =>
      (anos.length === 0 ||
        anos.includes(questao.ano)) &&
      (areas.length === 0 ||
        areas.includes(questao.area.id)) &&
      (assuntos.length === 0 ||
        questao.assuntos.some((assunto) =>
          assuntos.includes(assunto.id),
        )) &&
      (aplicacoes.length === 0 ||
        aplicacoes.includes(questao.aplicacao.id)),
  );

  if (ordem === "aleatoria") {
    resultado.sort(
      (primeira, segunda) =>
        primeira.id - segunda.id,
    );

    resultado = embaralhar(resultado, semente);
  } else {
    resultado.sort((primeira, segunda) => {
      const diferencaAno =
        ordem === "ano_asc"
          ? primeira.ano - segunda.ano
          : segunda.ano - primeira.ano;

      return (
        diferencaAno ||
        primeira.id - segunda.id
      );
    });
  }

  const total = resultado.length;
  const inicio = (pagina - 1) * tamanho;

  return {
    ok: true,

    dados: {
      total,
      page: pagina,
      page_size: tamanho,
      total_paginas: Math.ceil(total / tamanho),

      itens: resultado.slice(
        inicio,
        inicio + tamanho,
      ),
    },
  };
}