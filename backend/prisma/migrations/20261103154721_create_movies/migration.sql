-- CreateTable
CREATE TABLE "movies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "director" TEXT NOT NULL,
    "genres" JSONB NOT NULL,
    "rating" REAL NOT NULL,
    "duration" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "poster_url" TEXT NOT NULL,
    "cast" JSONB NOT NULL
);
