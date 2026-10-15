import { requisicao } from "./cliente";

import type {
  Alternativa,
  Gabarito,
  ListaQuestoes,
  ParametrosListaQuestoes,
  PedidoResposta,
  Questao,
  ResultadoResposta,
} from "./tipos";

export function listarQuestoes(
  parametros: ParametrosListaQuestoes = {},
  sinal?: AbortSignal,
): Promise<ListaQuestoes> {
  const busca = new URLSearchParams();

  for (const [nome, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === null) {
      continue;
    }

    if (Array.isArray(valor)) {
      for (const item of valor) {
        busca.append(nome, String(item));
      }
    } else {
      busca.set(nome, String(valor));
    }
  }

  const consulta = busca.toString();

  const caminho = consulta
    ? `/questoes?${consulta}`
    : "/questoes";

  return requisicao<ListaQuestoes>(
    caminho,
    { signal: sinal },
  );
}

export function obterQuestao(
  id: number,
  sinal?: AbortSignal,
): Promise<Questao> {
  return requisicao<Questao>(
    `/questoes/${id}`,
    { signal: sinal },
  );
}
export function responderQuestao(
  id: number,
  alternativa: Alternativa,
  sinal?: AbortSignal,
): Promise<ResultadoResposta> {
  const pedido: PedidoResposta = {
    alternativa,
  };

  return requisicao<ResultadoResposta>(
    `/questoes/${id}/responder`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pedido),
      signal: sinal,
    },
  );
}

export function obterGabarito(
  id: number,
  sinal?: AbortSignal,
): Promise<Gabarito> {
  return requisicao<Gabarito>(
    `/questoes/${id}/gabarito`,
    { signal: sinal },
  );
}