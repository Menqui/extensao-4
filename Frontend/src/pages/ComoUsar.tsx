import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function ComoUsar() {
  return (
    <>
      <Typography component="h1" variant="h1" sx={{ mb: 3 }}>
        Como usar
      </Typography>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography sx={{ mb: 2 }}>
          O Explorador ENEM reúne questões oficiais para ajudar
          nos seus estudos.
        </Typography>

        <Box
          component="ol"
          sx={{
            pl: 3,
            m: 0,
            "& li": { mb: 2 },
          }}
        >
          <Typography component="li">
            Escolha os filtros de ano, área, assunto e aplicação.
          </Typography>

          <Typography component="li">
            Leia o enunciado e selecione uma alternativa.
          </Typography>

          <Typography component="li">
            Clique em Responder para conferir sua resposta.
          </Typography>

          <Typography component="li">
            Use Ver gabarito para consultar a alternativa correta.
          </Typography>

          <Typography component="li">
            Confira o ano, a aplicação e o número original
            para identificar a origem da questão.
          </Typography>
        </Box>

        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Os anos, as áreas e os assuntos disponíveis dependem
          das questões publicadas na plataforma.
        </Typography>
      </Paper>
    </>
  );
}