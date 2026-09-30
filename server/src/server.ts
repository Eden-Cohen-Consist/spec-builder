import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import apiRouter from "./routes/index.js";
import { logger } from "./logger/index.js";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});
app.use("/api", apiRouter);
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Spec Builder server listening on http://localhost:${env.PORT}`);
});
