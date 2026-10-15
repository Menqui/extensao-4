import Stack from "@mui/material/Stack";

import type { Questao } from "../../api/tipos";
import CartaoQuestao from "./CartaoQuestao";

interface ListaQuestoesProps {
  questoes: Questao[];
}

export default function ListaQuestoes({
  questoes,
}: ListaQuestoesProps) {
  return (
    <Stack spacing={3}>
      {questoes.map((questao) => (
        <CartaoQuestao
          key={questao.id}
          questao={questao}
        />
      ))}
    </Stack>
  );
}