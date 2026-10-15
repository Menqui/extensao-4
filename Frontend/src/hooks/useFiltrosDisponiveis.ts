import { useQuery } from "@tanstack/react-query";

import { obterFiltros } from "../api/filtros";

export default function useFiltrosDisponiveis() {
  return useQuery({
    queryKey: ["filtros-disponiveis"],

    queryFn: ({ signal }) =>
      obterFiltros(signal),

    staleTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}