import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

const URL_PROVAS_OFICIAIS =
  "https://www.gov.br/inep/pt-br/areas-de-atuacao/" +
  "avaliacao-e-exames-educacionais/enem/provas-e-gabaritos";

export default function Rodape() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" sx={{ mb: 1 }}>
          Projeto acadêmico — Extensão IV · CC157 · UECE
        </Typography>

        <Typography variant="body2" color="text.secondary">
          As questões do ENEM são de autoria do INEP/MEC.
        </Typography>

        <Link
          href={URL_PROVAS_OFICIAIS}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            mt: 1,
          }}
        >
          Provas e gabaritos oficiais — abre em nova aba
        </Link>
      </Container>
    </Box>
  );
}