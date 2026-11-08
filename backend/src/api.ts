import { Router } from "express";
import { movies } from "./movies";
import { auth } from "./auth";
import { watchlist, watched } from "./activity";
export const api = Router();

api.use("/auth", auth);
api.use("/movies", movies);
api.use("/watchlist", watchlist);
api.use("/watched", watched);