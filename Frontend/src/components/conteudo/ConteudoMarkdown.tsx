import { lazy, Suspense } from "react";
import Box from "@mui/material/Box";
import Markdown from "react-markdown";

const ConteudoMatematico = lazy(
  () => import("./ConteudoMatematico"),
);

interface ConteudoMarkdownProps {
  texto: string;
}

export default function ConteudoMarkdown({
  texto,
}: ConteudoMarkdownProps) {
  const temDelimitadoresMatematicos =
    /\$\$[\s\S]+?\$\$|\$[^$\n]+\$/.test(texto);

  return (
    <Box
      sx={{
        lineHeight: 1.7,
        overflowWrap: "anywhere",
        minWidth: 0,

        "& > :first-child": {
          mt: 0,
        },

        "& > :last-child": {
          mb: 0,
        },

        "& img": {
          maxWidth: "100%",
          height: "auto",
        },

        "& pre": {
          overflowX: "auto",
        },

        "& .katex-display": {
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          py: 1,
        },
      }}
    >
      {temDelimitadoresMatematicos ? (
        <Suspense
          fallback={
            <Box role="status">
              Carregando conteúdo…
            </Box>
          }
        >
          <ConteudoMatematico texto={texto} />
        </Suspense>
      ) : (
        <Markdown skipHtml>
          {texto}
        </Markdown>
      )}
    </Box>
  );
}