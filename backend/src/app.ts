import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);

app.use(errorMiddleware);

