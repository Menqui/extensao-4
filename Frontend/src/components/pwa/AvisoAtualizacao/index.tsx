import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";

import { useRegisterSW } from "virtual:pwa-register/react";

export default function AvisoAtualizacao() {
  const {
    needRefresh: [
      precisaAtualizar,
      setPrecisaAtualizar,
    ],
    updateServiceWorker: atualizarAplicacao,
  } = useRegisterSW();

  function fecharAviso() {
    setPrecisaAtualizar(false);
  }

  return (
    <Snackbar
      open={precisaAtualizar}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      onClose={(_, motivo) => {
        if (motivo !== "clickaway") {
          fecharAviso();
        }
      }}
      message={
        "Nova versão disponível. " +
        "Termine sua questão antes de atualizar."
      }
      action={
        <>
          <Button
            color="inherit"
            onClick={fecharAviso}
          >
            Depois
          </Button>

          <Button
            color="inherit"
            onClick={() => {
              void atualizarAplicacao(true);
            }}
          >
            Atualizar
          </Button>
        </>
      }
      sx={{
        bottom:
          "calc(80px + env(safe-area-inset-bottom, 0px)) !important",
      }}
    />
  );
}