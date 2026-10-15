import { useEffect } from "react";
import {
  keepPreviousData,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { listarQuestoes } from "../api/questoes";
import type { ParametrosListaQuestoes } from "../api/tipos";

function opcoesQuestoes(parametros: ParametrosListaQuestoes) {
  return queryOptions({
    queryKey: ["questoes", parametros] as const,
    queryFn: ({ signal }) =>
      listarQuestoes(parametros, signal),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export default function useQuestoes(
  parametros: ParametrosListaQuestoes = {},
) {
  const cliente = useQueryClient();

  const consulta = useQuery({
    ...opcoesQuestoes(parametros),
    placeholderData: keepPreviousData,
  });

  const dados = consulta.data;
  const dadosProvisorios = consulta.isPlaceholderData;

  useEffect(() => {
    // Aguarda os resultados da página solicitada.
    if (!dados || dadosProvisorios) {
      return;
    }

    if (dados.page >= dados.total_paginas) {
      return;
    }

    const proximosParametros: ParametrosListaQuestoes = {
      ...parametros,
      page: dados.page + 1,
    };

    void cliente.prefetchQuery(
      opcoesQuestoes(proximosParametros),
    );
  }, [cliente, dados, dadosProvisorios, parametros]);

  return consulta;
}