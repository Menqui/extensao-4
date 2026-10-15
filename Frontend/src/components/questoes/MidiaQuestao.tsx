import Box from "@mui/material/Box";

import type {
  MidiaQuestao as TipoMidiaQuestao,
} from "../../api/tipos";

interface MidiaQuestaoProps {
  midia: TipoMidiaQuestao;
}

export default function MidiaQuestao({
  midia,
}: MidiaQuestaoProps) {
  return (
    <Box
      component="img"
      src={midia.url}
      alt={midia.alt}
      width={midia.largura}
      height={midia.altura}
      loading="lazy"
      decoding="async"
      sx={{
        display: "block",
        maxWidth: "100%",
        height: "auto",
        my: 2,
      }}
    />
  );
}