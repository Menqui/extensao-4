import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";

import { ErroRequisicao } from "../../api/erros";

interface EstadoErroProps {
  erro: unknown;
  onTentarNovamente: () => void;
  carregando?: boolean;
}

export function EstadoErro({
  erro,
  onTentarNovamente,
  carregando = false,
}: EstadoErroProps) {
  const [agora, setAgora] = useState(() => Date.now());

  const prazo = useMemo(() => {
    if (
      !(erro instanceof ErroRequisicao) ||
      erro.status !== 429
    ) {
      return null;
    }

    // Usa o prazo obtido do cabeçalho Retry-After.
    // Sem um prazo válido, aplica uma espera local de 30 segundos.
    return erro.tentarNovamenteEm ?? Date.now() + 30_000;
  }, [erro]);

  useEffect(() => {
    if (prazo === null) {
      return;
    }

    setAgora(Date.now());

    if (prazo <= Date.now()) {
      return;
    }

    const intervalo = window.setInterval(() => {
      const instante = Date.now();

      setAgora(instante);

      if (instante >= prazo) {
        window.clearInterval(intervalo);
      }
    }, 1_000);

    return () => window.clearInterval(intervalo);
  }, [prazo]);

  const segundosRestantes =
    prazo === null
      ? 0
      : Math.max(0, Math.ceil((prazo - agora) / 1_000));

  const aguardando = segundosRestantes > 0;

  const mensagem =
    erro instanceof Error && erro.message.trim()
      ? erro.message
      : "Não foi possível carregar os dados. Tente novamente.";

  function tentarNovamente() {
    if (carregando) {
      return;
    }

    if (prazo !== null && Date.now() < prazo) {
      return;
    }

    onTentarNovamente();
  }

  return (
    <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
      <Alert severity="error" sx={{ width: "100%" }}>
        {mensagem}
      </Alert>

      {aguardando && (
        <Typography variant="body2" color="text.secondary">
          Aguarde {segundosRestantes} segundo(s) para tentar
          novamente.
        </Typography>
      )}

      <Button
        variant="outlined"
        onClick={tentarNovamente}
        disabled={carregando || aguardando}
        aria-busy={carregando}
        sx={{ minHeight: 44 }}
      >
        {carregando ? "Tentando novamente…" : "Tentar novamente"}
      </Button>
    </Stack>
  );
}