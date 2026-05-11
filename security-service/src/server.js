import cors from "cors";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import pino from "pino";
import pinoHttp from "pino-http";
import { z } from "zod";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();
const port = Number(process.env.PORT || 4000);
const issuer = process.env.JWT_ISSUER || "security-service";
const secret = process.env.JWT_SECRET || "development-only-change-me";

const loginSchema = z.object({
  subject: z.string().min(1).default("admin"),
  roles: z.array(z.string()).default(["admin"])
});

app.disable("x-powered-by");
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "1mb" }));
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "security-service" }));

app.post("/auth/token", (req, res) => {
  const parsed = loginSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_request" });
  const token = jwt.sign(
    { sub: parsed.data.subject, roles: parsed.data.roles, iss: issuer },
    secret,
    { expiresIn: "1h", issuer }
  );
  res.json({ token, tokenType: "Bearer", expiresIn: 3600 });
});

app.post("/auth/validate", (req, res) => {
  const token = String(req.body?.token || "").replace(/^Bearer\s+/i, "");
  try {
    const claims = jwt.verify(token, secret, { issuer });
    res.json({ active: true, claims });
  } catch {
    res.status(401).json({ active: false });
  }
});

export function requireRole(role) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.replace(/^Bearer\s+/i, "");
    try {
      const claims = jwt.verify(token, secret, { issuer });
      if (!claims.roles?.includes(role)) return res.status(403).json({ error: "forbidden" });
      req.user = claims;
      next();
    } catch {
      res.status(401).json({ error: "unauthorized" });
    }
  };
}

const server = app.listen(port, "0.0.0.0", () => logger.info({ port }, "security-service listening"));

const shutdown = (signal) => {
  logger.info({ signal }, "shutting down");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
