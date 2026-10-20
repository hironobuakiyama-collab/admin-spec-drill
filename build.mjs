import { build } from "esbuild";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";

rmSync("docs", { recursive: true, force: true });
mkdirSync("docs");

const js = await build({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: ["es2019", "safari14"],
  jsx: "automatic",
  tsconfig: "tsconfig.json",
  define: { "process.env.NODE_ENV": '"production"' }
});
const jsCode = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

execSync("npx tailwindcss -i src/base.css -o .tmp.css --minify", { stdio: "inherit" });
const css = readFileSync(".tmp.css", "utf8");
rmSync(".tmp.css");

const html = readFileSync("src/index.html", "utf8")
  .replace("__CSS__", () => css)
  .replace("__JS__", () => jsCode);
writeFileSync("docs/index.html", html);

const version = createHash("sha256").update(html).digest("hex").slice(0, 10);
writeFileSync("docs/sw.js", readFileSync("public/sw.js", "utf8").replace("__VERSION__", version));

for (const f of ["manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"]) {
  copyFileSync("public/" + f, "docs/" + f);
}
console.log("built docs/ (" + Math.round(html.length / 1024) + " KB, cache " + version + ")");
