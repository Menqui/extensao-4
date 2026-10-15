import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

interface AcoesQuestaoProps {
  finalizada: boolean;
  podeResponder: boolean;
  podeVerGabarito: boolean;
  respondendo: boolean;
  consultando: boolean;
  onResponder: () => void;
  onVerGabarito: () => void;
  onTentarNovamente: () => void;
}

export default function AcoesQuestao({
  finalizada,
  podeResponder,
  podeVerGabarito,
  respondendo,
  consultando,
  onResponder,
  onVerGabarito,
  onTentarNovamente,
}: AcoesQuestaoProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        mt: 3,
      }}
    >
      {finalizada ? (
        <Button
          type="button"
          variant="outlined"
          autoFocus
          onClick={onTentarNovamente}
        >
          Tentar novamente
        </Button>
      ) : (
        <>
          <Button
            type="button"
            variant="contained"
            disabled={!podeResponder}
            aria-busy={respondendo}
            onClick={onResponder}
          >
            {respondendo ? "Conferindo…" : "Responder"}
          </Button>

          <Button
            type="button"
            variant="outlined"
            disabled={!podeVerGabarito}
            aria-busy={consultando}
            onClick={onVerGabarito}
          >
            {consultando ? "Consultando…" : "Ver gabarito"}
          </Button>
        </>
      )}
    </Box>
  );
}