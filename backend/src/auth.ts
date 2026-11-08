import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "./db";
import { HttpError, parse } from "./http";
export const auth = Router();
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("Isi JWT_SECRET acak, minimal 32 karakter");
}
const jwtSecret: string = secret;
const loginInput = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(8).refine((value) =>
    Buffer.byteLength(value, "utf8") <= 72),
});
const registerInput = loginInput.extend({
  username: z.string().trim().min(2).max(40),
});
const publicFields = { id: true, username: true, email: true } as const;
auth.post("/register", async (req, res) => {
  const { username, email, password } = parse(registerInput, req.body);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { username, email, passwordHash },
    select: publicFields,
  });
  res.status(201).json({ user });
});
auth.post("/login", async (req, res) => {
  const { email, password } = parse(loginInput, req.body);
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Email atau password salah");
  }
  const token = jwt.sign({}, jwtSecret, {
    algorithm: "HS256", subject: String(user.id), expiresIn: "1h",
  });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

export function requireUser(req: Request): number {
  const [scheme, token, extra] = (req.get("Authorization") ?? "")
    .trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
    throw new HttpError(401, "Bearer token diperlukan");
  }
  let payload: string | jwt.JwtPayload;

  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
  } catch {
    throw new HttpError(401, "Token tidak valid atau kedaluwarsa");
  }

  const subject = typeof payload === "object" ? payload.sub : undefined;
  const userId = Number(subject);
  if (!subject || !/^[1-9]\d*$/.test(subject) ||
    !Number.isSafeInteger(userId)) {
    throw new HttpError(401, "Identitas token tidak valid");
  }
  return userId;
}