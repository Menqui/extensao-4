import type { Questao } from "../../api/tipos";

export const questoesMock: Questao[] = [
  {
    id: 1,
    ano: 2022,

    aplicacao: {
      id: "regular",
      nome: "Aplicação regular",
    },

    prova: "Dados simulados — aplicação regular",
    numero_original: 1,

    area: {
      id: "matematica",
      nome: "Matemática e suas Tecnologias",
    },

    assuntos: [
      {
        id: "probabilidade",
        nome: "Probabilidade",
        principal: true,
      },
    ],

    enunciado: [
      "**Questão simulada para desenvolvimento.**",
      "Uma urna contém 8 bolas vermelhas e 12 bolas azuis.",
      "Ao retirar uma bola ao acaso, qual é a probabilidade " +
        "de ela ser vermelha?",
    ].join("\n\n"),

    midias: [],

    alternativas: {
      A: "1/5",
      B: "2/5",
      C: "1/2",
      D: "3/5",
      E: "4/5",
    },
  },

  {
    id: 2,
    ano: 2023,

    aplicacao: {
      id: "regular",
      nome: "Aplicação regular",
    },

    prova: "Dados simulados — aplicação regular",
    numero_original: 2,

    area: {
      id: "matematica",
      nome: "Matemática e suas Tecnologias",
    },

    assuntos: [
      {
        id: "geometria",
        nome: "Geometria",
        principal: true,
      },
    ],

    enunciado: [
      "**Questão simulada para desenvolvimento.**",
      "Um retângulo possui comprimento de $8\\,\\text{cm}$ " +
        "e largura de $5\\,\\text{cm}$.",
      "Qual é sua área?",
    ].join("\n\n"),

    midias: [],

    alternativas: {
      A: "$13\\,\\text{cm}^2$",
      B: "$26\\,\\text{cm}^2$",
      C: "$40\\,\\text{cm}^2$",
      D: "$80\\,\\text{cm}^2$",
      E: "$160\\,\\text{cm}^2$",
    },
  },
  {
  id: 3,
  ano: 2023,
  prova: "Dados simulados — aplicação regular",
  numero_original: 3,

  area: {
    id: "matematica",
    nome: "Matemática e suas Tecnologias",
  },

  aplicacao: {
    id: "regular",
    nome: "Aplicação regular",
  },

  assuntos: [
    {
      id: "geometria",
      nome: "Geometria",
      principal: true,
    },
  ],

  enunciado: [
    "**Questão simulada para desenvolvimento.**",
    "O triângulo retângulo da figura tem base de " +
      "$6\\,\\text{cm}$ e altura de $4\\,\\text{cm}$.",
    "Qual é a área desse triângulo?",
    "Utilize a relação:",
    "$$\nA = \\frac{b \\cdot h}{2}\n$$",
  ].join("\n\n"),

  midias: [
    {
      posicao: "enunciado",
      url: `${import.meta.env.BASE_URL}mocks/triangulo.svg`,
      alt: "Triângulo retângulo com base de 6 centímetros e altura de 4 centímetros.",
      largura: 360,
      altura: 240,
    },
      {
    posicao: "alternativa_c",
    url: `${import.meta.env.BASE_URL}mocks/area-12.svg`,
    alt: "12 centímetros quadrados.",
    largura: 200,
    altura: 80,
  },
  ],

  alternativas: {
    A: "$10\\,\\text{cm}^2$",
    B: "$11\\,\\text{cm}^2$",
    C: "",
    D: "$20\\,\\text{cm}^2$",
    E: "$24\\,\\text{cm}^2$",
  },
},
];