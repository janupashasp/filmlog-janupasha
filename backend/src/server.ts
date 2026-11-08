import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { api } from "./api";
import { Prisma } from "./generated/prisma/client";
import { HttpError } from "./http";
const app = express();
app.use(cors({
  origin: process.env.FE_ORIGIN || "http://localhost:3000",
}));

app.use(express.json({ limit: "32kb" }));
app.get("/api/health", (_req, res) => {
  res.json({ message: "Backend berhasil berjalan!" });
});
app.use("/api", api);
app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});
const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  if (error.type === "entity.parse.failed") {
    res.status(400).json({ message: "JSON tidak valid" });
    return;
  }

  if (error.type === "entity.too.large") {
    res.status(413).json({ message: "Body terlalu besar" });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({ message: "Data sudah ada" });
      return;
    }

    if (error.code === "P2003") {
      res.status(409).json({ message: "Referensi data tidak tersedia" });
      return;
    }
  }

  console.error(error);
  res.status(500).json({ message: "Kesalahan pada server" });
};

app.use(handleError);

const port = Number(process.env.PORT ?? 8000);
const host = process.env.BIND_HOST ?? "0.0.0.0";
export const server = app.listen(port, host, () => {
  const address = server.address();
  if (address && typeof address === "object") {
    console.log("API berjalan pada port", address.port);
  }
});