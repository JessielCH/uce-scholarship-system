import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Aumenta el staleTime para que no intente cargar
      // CADA VEZ que cambias de pestaña si han pasado menos de 30 segundos
      staleTime: 1000 * 30,
      refetchOnWindowFocus: true,
      // Evita que la pantalla se ponga en blanco mientras recarga en segundo plano
      refetchOnMount: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
