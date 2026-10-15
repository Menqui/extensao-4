import Box from "@mui/material/Box";
import Radio from "@mui/material/Radio";
import Typography from "@mui/material/Typography";

import type {
  Alternativa as LetraAlternativa,
  MidiaQuestao as TipoMidiaQuestao,
} from "../../api/tipos";

import ConteudoMarkdown from "../conteudo/ConteudoMarkdown";
import MidiaQuestao from "./MidiaQuestao";

interface AlternativaProps {
  idQuestao: number;
  letra: LetraAlternativa;
  texto: string;
  selecionada: boolean;
  desabilitada?: boolean;
  midias: TipoMidiaQuestao[];
  estado?: "neutra" | "correta" | "incorreta";
}

export default function Alternativa({
  idQuestao,
  letra,
  texto,
  selecionada,
  desabilitada = false,
  midias,
  estado = "neutra",
}: AlternativaProps) {
  const idRadio =
    `questao-${idQuestao}-alternativa-${letra}`;

  const idRotulo = `${idRadio}-rotulo`;

  const corBorda =
    estado === "correta"
      ? "success.main"
      : estado === "incorreta"
        ? "error.main"
        : selecionada
          ? "primary.main"
          : "divider";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        p: 1.5,
        border: 2,
        borderColor: corBorda,
        borderRadius: 2,
        bgcolor: selecionada
          ? "action.selected"
          : "background.paper",

        "&:focus-within": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      <Radio
        value={letra}
        checked={selecionada}
        disabled={desabilitada}
        slotProps={{
          input: {
            id: idRadio,
            "aria-labelledby": idRotulo,
          },
        }}
        sx={{
          minWidth: 44,
          minHeight: 44,
          flexShrink: 0,
        }}
      />

      <Box
        id={idRotulo}
        sx={{ flexGrow: 1, minWidth: 0 }}
      >
        <Typography
          component="label"
          htmlFor={idRadio}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            fontWeight: 700,
            cursor: desabilitada
              ? "default"
              : "pointer",
          }}
        >
          Alternativa {letra}
        </Typography>

        {texto.trim() && (
          <ConteudoMarkdown texto={texto} />
        )}

        {midias.map((midia, indice) => (
          <MidiaQuestao
            key={`${midia.url}-${indice}`}
            midia={midia}
          />
        ))}

        {estado !== "neutra" && (
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              fontWeight: 700,
              color:
                estado === "correta"
                  ? "success.dark"
                  : "error.dark",
            }}
          >
            {estado === "correta"
              ? "Resposta correta"
              : "Sua resposta incorreta"}
          </Typography>
        )}
      </Box>
    </Box>
  );
}