import { readFile } from "node:fs/promises";
import { db } from "./db";
import type { Prisma } from "./generated/prisma/client";
const source = new URL("../../data/movies.json", import.meta.url);
try {
  const films: Prisma.MovieCreateInput[] =
    JSON.parse(await readFile(source, "utf8"));
  await db.$transaction(films.map((film) =>
    db.movie.upsert({
      where: { id: film.id },
      create: film,
      update: film,
    }),
  ));
  console.log("Jumlah film:", await db.movie.count());
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}