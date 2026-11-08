import movies from "../../data/movies.json" with { type: "json" };
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";
const url = process.env.DATABASE_URL;
if (!url) throw new Error("Isi DATABASE_URL di .env");
export const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});