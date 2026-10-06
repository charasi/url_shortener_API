import express from "express";
import type { Express, Request, Response } from "express";
import { customAlphabet, nanoid } from "nanoid";

const OK: number = 200;
const REDIRECT: number = 302;
const PORT = 3000;
const app: Express = express();

const generateCode = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  6,
);

interface urlRecord {
  url: string;
  clicks: number;
}
const registry: Map<string, urlRecord> = new Map();

app.use(express.json());

app.get("/:code/stats", (req: Request, res: Response) => {
  const code: string | string[] | undefined = req.params.code;
  if (typeof code !== "string") {
    return res.status(404).json({ error: "Code Unknown" });
  }

  const record: urlRecord | undefined = registry.get(code);

  if (record) {
    return res
      .status(OK)
      .json({ code, url: record.url, clicks: record.clicks });
  }

  return res.status(404).json({ error: "Code Unknown" });
});

app.get("/:code", (req: Request, res: Response) => {
  const code: string | string[] | undefined = req.params.code;
  if (typeof code !== "string") {
    return res.status(404).json({ error: "Code Unknown" });
  }
  const record: urlRecord | undefined = registry.get(code);

  if (record) {
    record.clicks += 1;
    registry.set(code, record);
    res.redirect(REDIRECT, record.url);
    return;
  }

  return res.status(404).json({ error: "Code Unknown" });
});

app.post("/shorten", (req: Request, res: Response) => {
  const url = req.body?.url;
  if (typeof url !== "string") {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return res.status(400).json({ error: "Invalid URL" });
    }
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  let code: string = generateCode();
  while (registry.has(code)) {
    code = generateCode();
  }

  registry.set(code, { url: url, clicks: 0 });
  return res.status(OK).json({ code: code });
});

export { app, registry };

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
