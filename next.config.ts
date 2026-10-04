import type { NextConfig } from "next";

// En GitHub Codespaces la app se abre desde *.app.github.dev, que reenvía al
// puerto local; hay que permitir ese origen para que funcionen las acciones.
const codespaceOrigins =
  process.env.CODESPACES === "true" ? ["*.app.github.dev"] : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: codespaceOrigins,
  experimental: {
    serverActions: { allowedOrigins: codespaceOrigins },
  },
};

export default nextConfig;
