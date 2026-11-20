import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve(process.argv[2] ?? "dist");
const index = resolve(output, "index.html");
const routes = ["briefing", "capital", "underwrite", "holdings", "decisions", "decisions/draft/memo", "auth/login", "auth/callback"];
if (process.argv.includes("--connected-review")) routes.push("preview/live-portfolio");

await Promise.all([
  copyFile(index, resolve(output, "404.html")),
  ...routes.map(async route => {
    const folder = resolve(output, route);
    await mkdir(folder, { recursive: true });
    await copyFile(index, resolve(folder, "index.html"));
  }),
]);
