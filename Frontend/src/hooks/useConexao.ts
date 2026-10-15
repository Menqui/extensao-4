import { useSyncExternalStore } from "react";

function assinar(atualizar: () => void) {
  window.addEventListener("online", atualizar);
  window.addEventListener("offline", atualizar);

  return () => {
    window.removeEventListener("online", atualizar);
    window.removeEventListener("offline", atualizar);
  };
}

function obterEstado() {
  return navigator.onLine;
}

export default function useConexao() {
  return useSyncExternalStore(
    assinar,
    obterEstado,
    () => true,
  );
}