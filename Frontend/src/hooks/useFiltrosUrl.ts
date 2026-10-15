import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "react-router-dom";

import {
  escreverFiltrosUrl,
  gerarSemente,
  lerFiltrosUrl,
} from "../lib/parametrosUrl";

import type {
  AtualizacaoFiltros,
  EstadoFiltros,
} from "../lib/parametrosUrl";

export default function useFiltrosUrl() {
  const [busca, setBusca] = useSearchParams();

  const [sementeInicial] = useState(
    gerarSemente,
  );

  const filtros = useMemo(() => {
    const valores = lerFiltrosUrl(busca);

    if (
      valores.ordem === "aleatoria" &&
      valores.semente === undefined
    ) {
      valores.semente = sementeInicial;
    }

    return valores;
  }, [busca, sementeInicial]);

  // Completa links aleatórios que chegaram sem semente.
  useEffect(() => {
    const valoresOriginais = lerFiltrosUrl(busca);

    if (
      valoresOriginais.ordem === "aleatoria" &&
      valoresOriginais.semente === undefined
    ) {
      setBusca(
        escreverFiltrosUrl(filtros),
        { replace: true },
      );
    }
  }, [busca, filtros, setBusca]);

  function atualizarFiltros(
    alteracoes: AtualizacaoFiltros,
  ) {
    const novos: EstadoFiltros = {
      ...filtros,
      ...alteracoes,
      page: 1,
    };

    // A área controla quais assuntos estarão disponíveis.
    if (
      alteracoes.area !== undefined &&
      alteracoes.assunto === undefined
    ) {
      novos.assunto = [];
    }

    if (novos.ordem === "aleatoria") {
      if (filtros.ordem !== "aleatoria") {
        novos.semente = gerarSemente();
      } else {
        novos.semente ??= sementeInicial;
      }
    } else {
      delete novos.semente;
    }

    setBusca(escreverFiltrosUrl(novos));
  }

  function mudarPagina(pagina: number) {
    if (
      !Number.isSafeInteger(pagina) ||
      pagina < 1 ||
      pagina === filtros.page
    ) {
      return;
    }

    setBusca(
      escreverFiltrosUrl({
        ...filtros,
        page: pagina,
      }),
    );
  }

  function limparFiltros() {
    atualizarFiltros({
      ano: [],
      area: [],
      assunto: [],
      aplicacao: [],
      incluir_anuladas: false,
    });
  }

  return {
    filtros,
    atualizarFiltros,
    mudarPagina,
    limparFiltros,
  };
}