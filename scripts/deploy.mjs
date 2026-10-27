// Deploy: build + upload to reg.ru hosting via SSH (PuTTY plink/pscp).
// Usage: npm run deploy
// Credentials: env DEPLOY_SSH_PASSWORD or file deploy.local.json { "password": "…" } (gitignored)

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const HOST = "31.31.196.254";
const USER = "u3698395";
const HOSTKEY = "SHA256:+vcmY5rf+vQH9RqaCwL3Pec2sF3eKRZVPRn6mjmWpgk";
const DOCROOT = "www/hawaii22.ru";
const STAGE = "deploy-new";

const local = existsSync("deploy.local.json")
  ? JSON.parse(readFileSync("deploy.local.json", "utf8"))
  : {};
const password = process.env.DEPLOY_SSH_PASSWORD || local.password;
if (!password) {
  console.error("Set DEPLOY_SSH_PASSWORD env or create deploy.local.json with { \"password\": \"…\" }");
  process.exit(1);
}

const sshArgs = ["-ssh", "-batch", "-hostkey", HOSTKEY, "-pw", password];
const remote = `${USER}@${HOST}`;

// Build runs before this script (npm run deploy = build && node scripts/deploy.mjs)
if (!existsSync("out/index.html")) {
  console.error("out/index.html not found — run `npm run build` first");
  process.exit(1);
}

const plinkRun = (cmd) =>
  // plink 0.83 crashes on remote commands with zero output — append `; echo PLINK_OK`
  execFileSync("plink", [...sshArgs, remote, `${cmd}; echo PLINK_OK`], { stdio: "inherit" });

console.log("==> Uploading out/ -> ~/" + STAGE);
plinkRun(`rm -rf ~/${STAGE}; mkdir -p ~/${STAGE}`);
execFileSync("pscp", ["-batch", "-hostkey", HOSTKEY, "-pw", password, "-r", "out/*", `${remote}:${STAGE}/`], {
  stdio: "inherit",
  shell: true,
});

console.log("==> Swapping docroot");
plinkRun(
  `rm -rf ~/${DOCROOT}.old; mv ~/${DOCROOT} ~/${DOCROOT}.old 2>/dev/null; mv ~/${STAGE} ~/${DOCROOT}; chmod -R a+r ~/${DOCROOT}`
);

console.log("==> Done: http://hawaii22.ru");
