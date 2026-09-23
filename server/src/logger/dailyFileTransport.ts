import { appendFile } from "node:fs";
import { resolve } from "node:path";
import Transport from "winston-transport";
import type { Logform } from "winston";
import { serverRoot } from "../config/env.js";

const logsDir = resolve(serverRoot, "logs");

const SKIP_KEYS = new Set(["level", "message", "timestamp", "module", "splat"]);

function toJsonLine(info: Logform.TransformableInfo): string {
  const moduleName = typeof info.module === "string" ? info.module : undefined;
  const message = moduleName ? `[${moduleName}] ${info.message}` : String(info.message);

  const meta: Record<string, unknown> = {};
  for (const key of Object.keys(info)) {
    if (SKIP_KEYS.has(key)) {
      continue;
    }
    meta[key] = info[key];
  }

  return JSON.stringify({
    level: info.level,
    message,
    ...meta,
    timestamp: info.timestamp ?? new Date().toISOString(),
  });
}

export class DailyFileTransport extends Transport {
  log(info: Logform.TransformableInfo, callback: () => void): void {
    setImmediate(() => this.emit("logged", info));

    const date = new Date().toISOString().slice(0, 10);
    const file = resolve(logsDir, `${date}.log`);
    const line = toJsonLine(info);

    appendFile(file, `${line}\n`, (err) => {
      if (err) {
        this.emit("error", err);
      }
      callback();
    });
  }
}
