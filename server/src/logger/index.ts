import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import winston from "winston";
import { serverRoot } from "../config/env.js";
import { DailyFileTransport } from "./dailyFileTransport.js";

mkdirSync(resolve(serverRoot, "logs"), { recursive: true });

const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level: logLevel, message, timestamp, stack }) => {
    const line = `${timestamp} [${logLevel}] ${message}`;
    return stack ? `${line}\n${stack}` : line;
  }),
);

export const logger = winston.createLogger({
  level,
  format: logFormat,
  transports: [new winston.transports.Console(), new DailyFileTransport()],
});
