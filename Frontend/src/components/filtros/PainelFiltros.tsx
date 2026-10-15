import {
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import type { FiltrosDisponiveis } from "../../api/tipos";
import type {
  AtualizacaoFiltros,
  EstadoFiltros,
} from "../../lib/parametrosUrl";

import  SelecaoMultipla  from "./SelecaoMultipla";

interface PainelFiltrosProps {
  dados: FiltrosDisponiveis;
  filtros: EstadoFiltros;
  onAlterar: (alteracoes: AtualizacaoFiltros) => void;
  onLimpar: () => void;
  desabilitado?: boolean;
}

export function PainelFiltros({
  dados,
  filtros,
  onAlterar,
  onLimpar,
  desabilitado = false,
}: PainelFiltrosProps) {
  const assuntosDisponiveis = dados.assuntos.filter(
    (assunto) =>
      filtros.area.length === 0 ||
      filtros.area.includes(assunto.area_id),
  );

  const opcoesAnos = [...dados.anos]
    .sort((a, b) => b - a)
    .map((ano) => ({
      id: String(ano),
      nome: String(ano),
    }));

  const temFiltros =
    filtros.ano.length > 0 ||
    filtros.area.length > 0 ||
    filtros.assunto.length > 0 ||
    filtros.aplicacao.length > 0 ||
    filtros.incluir_anuladas;

  return (
    <Paper
      component="section"
      aria-label="Filtros de questões"
      variant="outlined"
      sx={{ p: 2, minWidth: 0 }}
    >
      <Stack spacing={2.5}>
        <Typography component="h2" variant="h6">
          Filtrar questões
        </Typography>

        <SelecaoMultipla
          rotulo="Anos"
          opcoes={opcoesAnos}
          valores={filtros.ano.map(String)}
          onChange={(valores) =>
            onAlterar({ ano: valores.map(Number) })
          }
          desabilitada={desabilitado}
        />

        <SelecaoMultipla
          rotulo="Áreas"
          opcoes={dados.areas}
          valores={filtros.area}
          onChange={(valores) =>
            onAlterar({
              area: valores,
              assunto: [],
            })
          }
          desabilitada={desabilitado}
        />

        <SelecaoMultipla
          rotulo="Assuntos"
          opcoes={assuntosDisponiveis}
          valores={filtros.assunto}
          onChange={(valores) =>
            onAlterar({ assunto: valores })
          }
          desabilitada={
            desabilitado || assuntosDisponiveis.length === 0
          }
        />

        <SelecaoMultipla
          rotulo="Aplicações"
          opcoes={dados.aplicacoes}
          valores={filtros.aplicacao}
          onChange={(valores) =>
            onAlterar({ aplicacao: valores })
          }
          desabilitada={desabilitado}
        />

        <FormControlLabel
          sx={{ m: 0, minHeight: 44 }}
          control={
            <Switch
              checked={filtros.incluir_anuladas}
              onChange={(_, marcado) =>
                onAlterar({ incluir_anuladas: marcado })
              }
              disabled={desabilitado}
              sx={{ minHeight: 44 }}
            />
          }
          label="Incluir questões anuladas"
        />

        <Button
          variant="outlined"
          onClick={onLimpar}
          disabled={desabilitado || !temFiltros}
          fullWidth
        >
          Limpar filtros
        </Button>
      </Stack>
    </Paper>
  );
}