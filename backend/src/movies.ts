import { Router } from "express";
import { z } from "zod";
import { db } from "./db";
import { HttpError, movieId, parse } from "./http";
import { recommend } from "./recommend";


export const movies = Router();
const filters = z.object({
  search: z.string().trim().max(100).optional(),
  genre: z.string().trim().max(100).optional(),
  shuffle: z.enum(["true", "false"]).optional(),
});
movies.get("/", async (req, res) => {
  const query = parse(filters, req.query);
  const films = await db.movie.findMany({ orderBy: { id: "asc" } });
  const search = query.search?.toLowerCase();
  const genre = query.genre?.toLowerCase();
  const result = films.filter((film) => {
    const titleMatches = !search ||
      film.title.toLowerCase().includes(search);
    const genres = Array.isArray(film.genres) ? film.genres : [];
    const genreMatches = !genre || genres.some((item) =>
      typeof item === "string" && item.toLowerCase() === genre);
    return titleMatches && genreMatches;
  });
  if (query.shuffle === "true") {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }
  res.json(result);
});
movies.get("/:id", async (req, res) => {
  const id = parse(movieId, req.params.id);
  const film = await db.movie.findUnique({ where: { id } });
  if (!film) throw new HttpError(404, "Film tidak ditemukan");
  res.json(film);
});

movies.post("/recommend", async (req, res) => {
  res.json(await recommend(req.body));
});