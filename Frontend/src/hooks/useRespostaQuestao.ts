import { useMutation } from "@tanstack/react-query";

import { responderQuestao } from "../api/questoes";
import type { Alternativa } from "../api/tipos";

export default function useRespostaQuestao(
  idQuestao: number,
) {
  return useMutation({
    mutationFn: (alternativa: Alternativa) =>
      responderQuestao(idQuestao, alternativa),

    retry: false,
    networkMode: "always",
    gcTime: 0,
  });
}