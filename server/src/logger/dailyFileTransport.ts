import { appendFile } from "node:fs";
import { resolve } from "node:path";
import Transport from "winston-transport";
import type { Logform } from "winston";
import { serverRoot } from "../config/env.js";

const logsDir = resolve(serverRoot, "logs");

export class DailyFileTransport extends Transport {
  constructor() {
    super();
  }

  log(info: Logform.TransformableInfo, callback: () => void): void {
    setImmediate(() => this.emit("logged", info));

    const date = new Date().toISOString().slice(0, 10);
    const file = resolve(logsDir, `${date}.log`);
    const line = info[Symbol.for("message")];

    appendFile(file, `${line}\n`, (err) => {
      if (err) {
        this.emit("error", err);
      }
      callback();
    });
  }
}
