import {
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
  Divider,
MenuItem,
TextField,
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
  carregandoExibicao?: boolean;
}

export function PainelFiltros({
  dados,
  filtros,
  onAlterar,
  onLimpar,
  desabilitado = false,
  carregandoExibicao = false,
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
  
    const tamanhos = [
  ...new Set([1, 5, 10, 20, 50, filtros.page_size]),
].sort((a, b) => a - b);
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
<Divider />

<Typography component="h3" variant="subtitle1">
  Exibição
</Typography>

<TextField
  select
  fullWidth
  label="Ordenar por"
  value={filtros.ordem}
  disabled={desabilitado || carregandoExibicao}
  onChange={(evento) => {
    const ordem = evento.target.value;

    if (
      ordem === "ano_desc" ||
      ordem === "ano_asc" ||
      ordem === "aleatoria"
    ) {
      onAlterar({ ordem });
    }
  }}
>
  <MenuItem value="ano_desc">
    Ano mais recente
  </MenuItem>

  <MenuItem value="ano_asc">
    Ano mais antigo
  </MenuItem>

  <MenuItem value="aleatoria">
    Ordem aleatória
  </MenuItem>
</TextField>

<TextField
  select
  fullWidth
  label="Questões por página"
  value={filtros.page_size}
  disabled={desabilitado || carregandoExibicao}
  onChange={(evento) => {
    const tamanho = Number(evento.target.value);

    if (
      Number.isInteger(tamanho) &&
      tamanho >= 1 &&
      tamanho <= 50
    ) {
      onAlterar({ page_size: tamanho });
    }
  }}
>
  {tamanhos.map((tamanho) => (
    <MenuItem key={tamanho} value={tamanho}>
      {tamanho}
    </MenuItem>
  ))}
</TextField>
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