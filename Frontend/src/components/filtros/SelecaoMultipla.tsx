import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export interface OpcaoSelecao {
  id: string;
  nome: string;
}

interface SelecaoMultiplaProps {
  rotulo: string;
  opcoes: OpcaoSelecao[];
  valores: string[];
  onChange: (valores: string[]) => void;
  desabilitada?: boolean;
  carregando?: boolean;
}

export default function SelecaoMultipla({
  rotulo,
  opcoes,
  valores,
  onChange,
  desabilitada = false,
  carregando = false,
}: SelecaoMultiplaProps) {
  const selecionadas = opcoes.filter(
    (opcao) => valores.includes(opcao.id),
  );

  return (
    <Autocomplete<OpcaoSelecao, true, false, false>
      multiple
      fullWidth
      disablePortal
      disableCloseOnSelect
      filterSelectedOptions
      options={opcoes}
      value={selecionadas}
      disabled={desabilitada}
      loading={carregando}
      getOptionLabel={(opcao) => opcao.nome}
      getOptionKey={(opcao) => opcao.id}
      isOptionEqualToValue={(opcao, valor) =>
        opcao.id === valor.id
      }
      onChange={(_, novasOpcoes) => {
        onChange(
          novasOpcoes.map((opcao) => opcao.id),
        );
      }}
      loadingText="Carregando opções…"
      noOptionsText="Nenhuma opção encontrada"
      clearText="Limpar seleção"
      openText="Abrir opções"
      closeText="Fechar opções"
      renderInput={(parametros) => (
        <TextField
          {...parametros}
          label={rotulo}
          placeholder={
            selecionadas.length === 0
              ? "Selecione ou digite para buscar"
              : undefined
          }
        />
      )}
      sx={{
        "& .MuiAutocomplete-tag": {
          minHeight: 44,
        },

        "& .MuiChip-deleteIcon": {
          width: 44,
          height: 44,
          p: 1,
          m: 0,
        },

        "& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator": {
          width: 44,
          height: 44,
        },
      }}
    />
  );
}