import {
  useEffect,
  useMemo,
  useState,
} from "react";
import useConexao from "../../hooks/useConexao";
import AvisoOffline from "../estados/AvisoOffline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Link from "@mui/material/Link";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";

import { ErroRequisicao } from "../../api/erros";

import type {
  Alternativa as LetraAlternativa,
  Questao,
} from "../../api/tipos";

import useGabarito from "../../hooks/useGabarito";
import useRespostaQuestao from "../../hooks/useRespostaQuestao";

import ConteudoMarkdown from "../conteudo/ConteudoMarkdown";
import AcoesQuestao from "./AcoesQuestao";
import Alternativa from "./Alternativa";
import FeedbackResposta from "./FeedbackResposta";
import MidiaQuestao from "./MidiaQuestao";

const letras: LetraAlternativa[] = [
  "A", "B", "C", "D", "E",
];

interface CartaoQuestaoProps {
  questao: Questao;
}

export default function CartaoQuestao({
  questao,
}: CartaoQuestaoProps) {

  const [alternativaSelecionada, setAlternativaSelecionada] =
    useState<LetraAlternativa | null>(null);

  const [agora, setAgora] = useState(
    () => Date.now(),
  );

  const online = useConexao();

  const resposta = useRespostaQuestao(questao.id);
  const consultaGabarito = useGabarito(questao.id);

  const gabarito =
    resposta.data?.gabarito ??
    consultaGabarito.data?.gabarito;

  const finalizada = gabarito !== undefined;

  const processando =
    resposta.isPending ||
    consultaGabarito.isPending;

  const bloqueada = processando || finalizada;

  const erro =
    resposta.error ?? consultaGabarito.error;

  const prazoNovaTentativa = useMemo(() => {
    if (
      erro instanceof ErroRequisicao &&
      erro.status === 429
    ) {
      return (
        erro.tentarNovamenteEm ??
        Date.now() + 30_000
      );
    }

    return null;
  }, [erro]);

  const segundosRestantes =
    prazoNovaTentativa === null
      ? 0
      : Math.max(
        0,
        Math.ceil(
          (prazoNovaTentativa - agora) / 1000,
        ),
      );

  const aguardando = segundosRestantes > 0;

  const podeConsultar =
    online && !bloqueada && !aguardando;

  useEffect(() => {
    if (prazoNovaTentativa === null) return;

    setAgora(Date.now());

    const intervalo = window.setInterval(() => {
      const instante = Date.now();

      setAgora(instante);

      if (instante >= prazoNovaTentativa) {
        window.clearInterval(intervalo);
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [prazoNovaTentativa]);

  function responder() {
    if (
      !podeConsultar ||
      alternativaSelecionada === null
    ) {
      return;
    }

    consultaGabarito.reset();
    resposta.mutate(alternativaSelecionada);
  }

  function verGabarito() {
    if (!podeConsultar) return;

    resposta.reset();
    consultaGabarito.mutate();
  }

  function tentarNovamente() {
    if (processando) return;

    resposta.reset();
    consultaGabarito.reset();
    setAlternativaSelecionada(null);
  }

  const idGrupo =
    `questao-${questao.id}-alternativas`;

  const midiasEnunciado = questao.midias.filter(
    (midia) => midia.posicao === "enunciado",
  );

  return (
    <Card component="article" variant="outlined">
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography
          component="h2"
          variant="h6"
          sx={{ mb: 1 }}
        >
          {questao.prova} · Questão{" "}
          {questao.numero_original}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Ano {questao.ano} ·{" "}
          {questao.aplicacao.nome}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Chip
            label={questao.area.nome}
            color="primary"
            size="small"
          />

          {questao.assuntos.map((assunto) => (
            <Chip
              key={assunto.id}
              label={assunto.nome}
              variant="outlined"
              size="small"
            />
          ))}
        </Box>

        <Box sx={{ mt: 3 }}>
          <ConteudoMarkdown
            texto={questao.enunciado}
          />

          {midiasEnunciado.map((midia, indice) => (
            <MidiaQuestao
              key={`${midia.url}-${indice}`}
              midia={midia}
            />
          ))}
        </Box>

        <FormControl
          component="fieldset"
          fullWidth
          sx={{ mt: 3, minWidth: 0 }}
        >
          <FormLabel
            component="legend"
            id={`${idGrupo}-rotulo`}
            sx={{ mb: 2 }}
          >
            Escolha uma alternativa
          </FormLabel>

          <RadioGroup
            name={idGrupo}
            aria-labelledby={`${idGrupo}-rotulo`}
            value={alternativaSelecionada ?? ""}
            onChange={(_, valor) => {
              if (bloqueada) return;

              const letra = letras.find(
                (item) => item === valor,
              );

              if (letra) {
                setAlternativaSelecionada(letra);
              }
            }}
            sx={{ gap: 1.5 }}
          >
            {letras.map((letra) => {
              const posicao =
                `alternativa_${letra.toLowerCase()}`;

              const midiasAlternativa =
                questao.midias.filter(
                  (midia) =>
                    midia.posicao === posicao,
                );

              const estado =
                gabarito === letra
                  ? "correta"
                  : resposta.data &&
                    !resposta.data.correta &&
                    resposta.variables === letra
                    ? "incorreta"
                    : "neutra";

              return (
                <Alternativa
                  key={letra}
                  idQuestao={questao.id}
                  letra={letra}
                  texto={
                    questao.alternativas[letra]
                  }
                  selecionada={
                    alternativaSelecionada === letra
                  }
                  desabilitada={bloqueada}
                  midias={midiasAlternativa}
                  estado={estado}
                />
              );
            })}
          </RadioGroup>
        </FormControl>

        <FeedbackResposta
          resposta={resposta.data}
          gabarito={gabarito}
        />

        <AvisoOffline visivel={!online} />

        {erro && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {erro instanceof ErroRequisicao
              ? erro.message
              : "Não foi possível concluir a solicitação. Tente novamente."}
          </Alert>
        )}

        {aguardando && (
          <Typography
            variant="body2"
            sx={{ mt: 1 }}
          >
            Tente novamente em{" "}
            {segundosRestantes} s.
          </Typography>
        )}

        <AcoesQuestao
          finalizada={finalizada}
          podeResponder={
            podeConsultar &&
            alternativaSelecionada !== null
          }
          podeVerGabarito={podeConsultar}
          respondendo={resposta.isPending}
          consultando={consultaGabarito.isPending}
          onResponder={responder}
          onVerGabarito={verGabarito}
          onTentarNovamente={tentarNovamente}
        />

        {questao.fonte_url && (
          <Link
            href={questao.fonte_url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              mt: 2,
            }}
          >
            Consultar fonte — abre em nova aba
          </Link>
        )}
      </CardContent>
    </Card>
  );
}