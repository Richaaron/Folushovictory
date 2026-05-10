import express from "express";
import cors from "cors";
import { assertConfig, config } from "./config.js";
import { getFirebaseApp } from "./firebase.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { adminRouter } from "./routes/admin.js";
import { teacherRouter } from "./routes/teacher.js";
import { parentRouter } from "./routes/parent.js";
import { resultsRouter } from "./routes/results.js";
import { errorHandler, notFound } from "./http.js";

assertConfig();
getFirebaseApp();

const app = express();

app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.send("Folusho Victory Schools API - Up and running!"));
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api", meRouter);
app.use("/api/admin", adminRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/parent", parentRouter);
app.use("/api/results", resultsRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  process.stdout.write(`Backend running on http://localhost:${config.port}\n`);
});

