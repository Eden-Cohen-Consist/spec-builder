import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import winston from "winston";
import { serverRoot } from "../config/env.js";
import { DailyFileTransport } from "./dailyFileTransport.js";

mkdirSync(resolve(serverRoot, "logs"), { recursive: true });

const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
);

const consoleFormat = winston.format.combine(
  baseFormat,
  winston.format.printf(
    ({ level: logLevel, message, timestamp, stack, module }) => {
      const text =
        typeof module === "string" ? `[${module}] ${message}` : message;
      const line = `${timestamp} [${logLevel}] ${text}`;
      return stack ? `${line}\n${stack}` : line;
    },
  ),
);

export const logger = winston.createLogger({
  level,
  format: baseFormat,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyFileTransport(),
  ],
});
