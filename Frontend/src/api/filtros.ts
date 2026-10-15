import { requisicao } from "./cliente";
import type { FiltrosDisponiveis } from "./tipos";

export function obterFiltros(
  sinal?: AbortSignal,
): Promise<FiltrosDisponiveis> {
  return requisicao<FiltrosDisponiveis>(
    "/meta/filtros",
    { signal: sinal },
  );
}