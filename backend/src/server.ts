import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import agentRoutes from "./routes/agent";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use("/api/agent", agentRoutes);

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

