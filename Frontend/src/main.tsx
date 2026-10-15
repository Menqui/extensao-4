import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App";
import Provedores from "./app/provedores";

async function iniciarAplicacao() {
  const elementoRaiz = document.getElementById("root");

  if (!elementoRaiz) {
    throw new Error("O elemento root não foi encontrado no HTML.");
  }

  const usarMock =
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_MOCK === "true";

  if (usarMock) {
    const { worker } = await import("./mocks/navegador");

    await worker.start({
      onUnhandledFrame: "bypass",
    });
  }

  createRoot(elementoRaiz).render(
    <StrictMode>
      <Provedores>
        <App />
      </Provedores>
    </StrictMode>,
  );
}

iniciarAplicacao().catch((erro: unknown) => {
  console.error("Não foi possível iniciar a aplicação.", erro);

  const elementoRaiz = document.getElementById("root");

  if (elementoRaiz) {
    elementoRaiz.textContent =
      "Não foi possível iniciar a aplicação. Recarregue a página.";
  }
});