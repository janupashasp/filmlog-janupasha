import { z } from "zod";
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Input tidak valid");
  return result.data;
}
export const movieId = z.union([
  z.number(),
  z.string().regex(/^[1-9]\d*$/).transform(Number),
]).pipe(z.number().int().positive().max(2147483647));
