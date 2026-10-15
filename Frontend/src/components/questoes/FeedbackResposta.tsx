import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

import type {
  Alternativa,
  ResultadoResposta,
} from "../../api/tipos";

interface FeedbackRespostaProps {
  resposta?: ResultadoResposta;
  gabarito?: Alternativa;
}

export default function FeedbackResposta({
  resposta,
  gabarito,
}: FeedbackRespostaProps) {
  return (
    <Box aria-live="polite" aria-atomic="true">
      {resposta ? (
        <Alert
          role="none"
          severity={resposta.correta ? "success" : "error"}
          sx={{ mt: 3 }}
        >
          {resposta.correta
            ? `Você acertou! A resposta correta é ${resposta.gabarito}.`
            : `Você errou. A resposta correta é ${resposta.gabarito}.`}
        </Alert>
      ) : gabarito ? (
        <Alert
          role="none"
          severity="info"
          sx={{ mt: 3 }}
        >
          Gabarito: alternativa {gabarito}.
        </Alert>
      ) : null}
    </Box>
  );
}