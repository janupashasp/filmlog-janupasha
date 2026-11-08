import { Router } from "express";
import { z } from "zod";
import { db } from "./db";
import { requireUser } from "./auth";
import { HttpError, movieId, parse } from "./http";
export const watchlist = Router();
export const watched = Router();

const addMovie = z.object({ movieId });
const addWatchlistMovie = addMovie.extend({
  userId: movieId.optional(),
});

async function ensureMovie(id: number) {
  const movie = await db.movie.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!movie) throw new HttpError(404, "Film tidak ditemukan");
}

watchlist.get("/", async (req, res) => {
  const userId = requireUser(req);
  res.json(
    await db.watchlist.findMany({
      where: { userId },
      include: { movie: true },
      orderBy: { createdAt: "desc" },
    }),
  );
});

watchlist.post("/", async (req, res) => {
  const userId = requireUser(req);
  const { movieId: id, userId: requestedUserId } =
    parse(addWatchlistMovie, req.body);
  if (requestedUserId !== undefined && requestedUserId !== userId) {
    throw new HttpError(403, "Tidak boleh mengubah watchlist akun lain");
  }
  await ensureMovie(id);
  const row = await db.watchlist.create({
    data: { userId, movieId: id },
    include: { movie: true },
  });
  res.status(201).json(row);
});

watchlist.delete("/:movieId", async (req, res) => {
  const userId = requireUser(req);
  const id = parse(movieId, req.params.movieId);
  const result = await db.watchlist.deleteMany({
    where: { userId, movieId: id },
  });
  if (result.count === 0) {
    throw new HttpError(404, "Film tidak ada di watchlist-mu");
  }
  res.status(204).end();
});

const reviewInput = addMovie.extend({
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().max(2000),
});
watched.get("/", async (req, res) => {
  const userId = requireUser(req);
  res.json(
    await db.review.findMany({
      where: { userId },
      include: { movie: true },
      orderBy: { updatedAt: "desc" },
    }),
  );
});

watched.post("/", async (req, res) => {
  const userId = requireUser(req);
  const { movieId: id, rating, review } = parse(reviewInput, req.body);
  await ensureMovie(id);
  const row = await db.review.upsert({
    where: { userId_movieId: { userId, movieId: id } },
    create: { userId, movieId: id, rating, review },
    update: { rating, review },
  });
  res.status(201).json(row);
});
