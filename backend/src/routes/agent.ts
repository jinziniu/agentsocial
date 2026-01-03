import { Router, Request, Response } from "express";
import { SocialAgent } from "../SocialAgent";
import { runNegotiation } from "../negotiation/runNegotiation";
import { MatchResult } from "../types";

const router = Router();

// Mock 用户数据存储（内存）
const agents: Map<string, SocialAgent> = new Map();

// 初始化 mock 用户
function initializeMockUsers() {
  // User A: 技术爱好者，寻找学习伙伴
  const agentA = new SocialAgent(
    "user-a",
    "寻找学习伙伴",
    "技术导向，学习型",
    ["纯商业", "短期项目"],
    8
  );

  // User B: 创业者，寻找合作者
  const agentB = new SocialAgent(
    "user-b",
    "寻找合作者",
    "商业导向，创业型",
    ["纯技术学习", "无商业目标"],
    9
  );

  // User C: 设计师，寻找创意伙伴
  const agentC = new SocialAgent(
    "user-c",
    "寻找创意伙伴",
    "创意导向，艺术型",
    ["纯技术", "枯燥工作"],
    7
  );

  // User D: 投资人，寻找项目
  const agentD = new SocialAgent(
    "user-d",
    "寻找投资项目",
    "商业导向，投资型",
    ["无商业计划", "纯兴趣项目"],
    6
  );

  // User E: 学生，寻找导师
  const agentE = new SocialAgent(
    "user-e",
    "寻找导师",
    "学习导向，求知型",
    ["纯商业", "高强度工作"],
    5
  );

  // User F: 自由职业者，寻找项目合作
  const agentF = new SocialAgent(
    "user-f",
    "寻找项目合作",
    "灵活导向，自由型",
    ["固定坐班", "长期绑定"],
    7
  );

  agents.set("user-a", agentA);
  agents.set("user-b", agentB);
  agents.set("user-c", agentC);
  agents.set("user-d", agentD);
  agents.set("user-e", agentE);
  agents.set("user-f", agentF);
}

// 初始化
initializeMockUsers();

// 获取所有用户列表
router.get("/users", (req: Request, res: Response) => {
  const userList = Array.from(agents.entries()).map(([userId, agent]) => ({
    userId,
    intent: agent.intent,
    interactionStyle: agent.interactionStyle,
    dealbreakers: agent.dealbreakers,
    energyLevel: agent.energyLevel
  }));
  res.json(userList);
});

router.post("/match", async (req: Request, res: Response) => {
  try {
    const { userIdA, userIdB } = req.body;

    if (!userIdA || !userIdB) {
      return res.status(400).json({ error: "需要提供 userIdA 和 userIdB" });
    }

    const agentA = agents.get(userIdA);
    const agentB = agents.get(userIdB);

    if (!agentA || !agentB) {
      return res.status(404).json({ error: "用户不存在" });
    }

    // 1. Agent A 生成意图
    const intentA = agentA.generateIntent();
    agentA.recordMemory("generate_intent", intentA);

    // 2. 运行多轮协商
    const { trace, summary } = await runNegotiation(agentA, agentB, intentA);

    // 3. 返回协商轨迹和总结
    res.json({
      trace,
      summary
    });
  } catch (error) {
    console.error("Match error:", error);
    res.status(500).json({ error: "匹配过程出错", details: error instanceof Error ? error.message : String(error) });
  }
});

export default router;

