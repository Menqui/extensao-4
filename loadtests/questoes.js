import http from "k6/http";
import { check, sleep } from "k6";

const base = __ENV.API_BASE_URL || "http://localhost:8000/api/v1";

export const options = {
  scenarios: {
    consulta: {
      executor: "constant-vus",
      vus: 10,
      duration: "30s",
    },
  },
  thresholds: {
    "http_req_duration{endpoint:listagem}": ["p(95)<150"],
    "http_req_failed": ["rate<0.01"],
  },
};

export default function () {
  const response = http.get(
    `${base}/questoes?area=matematica&page=1&page_size=10`,
    { tags: { endpoint: "listagem" } },
  );
  check(response, {
    "listagem retorna 200": (res) => res.status === 200,
    "resposta sem gabarito": (res) =>
      !JSON.stringify(res.json("itens")).includes('"gabarito"'),
  });
  sleep(1);
}
