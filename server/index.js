import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import router from "./routes/index.js";
import { startRestockConsumer, stopRestockConsumer } from "./services/inventoryRestockConsumer.js";

const app = express();

// Adds secure HTTP headers
app.use(helmet());

// HTTP request logger
app.use(morgan('combined'));

// Enable CORS for all routes (customize if needed)
app.use(cors());

// Parse incoming JSON payloads
app.use(express.json());

// Health check routes for Render cold starts and uptime monitoring
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api', router);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: "Route not found",
  });
});

// -------------------------
// GLOBAL ERROR HANDLER
// -------------------------
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// -------------------------
// START SERVER
// -------------------------
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, (err) => {
  if (err) {
    console.error(`❌ Failed to start server on port ${PORT}:`, err);
    process.exit(1);
  }
  console.log(`🚀 Server running on ${process.env.SERVER_ADDRESS}`);
  startRestockConsumer().catch((consErr) => {
    console.warn("[RestockConsumer] Failed to start Kafka restock consumer on boot:", consErr.message);
  });
});

server.on('error', (err) => {
  console.error(`❌ Server error:`, err);
  process.exit(1);
});

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down server...`);
  await stopRestockConsumer();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
