import { useMutation } from "@tanstack/react-query";

import { obterGabarito } from "../api/questoes";

export default function useGabarito(
  idQuestao: number,
) {
  return useMutation({
    mutationFn: () => obterGabarito(idQuestao),

    retry: false,
    networkMode: "always",
    gcTime: 0,
  });
}