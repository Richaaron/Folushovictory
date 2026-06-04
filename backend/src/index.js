import express from "express";
import cors from "cors";
import { assertConfig, config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { adminRouter } from "./routes/admin.js";
import { teacherRouter } from "./routes/teacher.js";
import { parentRouter } from "./routes/parent.js";
import { resultsRouter } from "./routes/results.js";
import { configRouter } from "./routes/config.js";
import { errorHandler, notFound } from "./http.js";

assertConfig();

const app = express();

// CORS configuration: allow both production, development, and native Capacitor origins.
// Capacitor Android apps send requests from capacitor://localhost, so it must be whitelisted
// or the native app will see a generic network error on API calls.
const allowedOrigins = [
  config.frontendOrigin,
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost',
  'https://localhost',
  'http://127.0.0.1',
  'https://127.0.0.1',
  'capacitor://localhost',
  'https://folushovictory.netlify.app',
  'https://www.folushovictory.netlify.app',
  'https://folushovictory.online',
  'https://www.folushovictory.online'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.send("Folusho Victory Schools API - Up and running!"));
app.get("/health", (req, res) => res.json({ ok: true }));

// Support both the API prefix and legacy/non-prefixed login endpoint.
app.use(["/api/auth", "/auth"], authRouter);
app.use("/api", meRouter);
app.use("/api", configRouter);
app.use("/api/admin", adminRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/parent", parentRouter);
app.use("/api/results", resultsRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  process.stdout.write(`Backend running on http://localhost:${config.port}\n`);
});

// Trigger redeployment to clear cached Firebase SDK quota states after plan upgrade

