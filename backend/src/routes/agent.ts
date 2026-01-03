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

  // 极端案例 1: 完全不能沟通 - 技术极客 vs 纯商业投资人
  const agentG = new SocialAgent(
    "user-g",
    "寻找技术极客",
    "技术狂热，代码导向",
    ["商业", "盈利", "市场", "投资"],
    10
  );

  const agentH = new SocialAgent(
    "user-h",
    "寻找投资项目",
    "纯商业，投资导向",
    ["技术", "代码", "开源", "学习"],
    9
  );

  // 极端案例 2: 天作之合 - 技术创业者 vs 技术投资人
  const agentI = new SocialAgent(
    "user-i",
    "寻找技术合伙人",
    "技术导向，创业型",
    ["纯商业", "无技术背景"],
    9
  );

  const agentJ = new SocialAgent(
    "user-j",
    "寻找技术项目",
    "技术投资，创业导向",
    ["无技术", "纯商业炒作"],
    8
  );

  // 极端案例 3: 完全不能沟通 - 慢节奏学习者 vs 快节奏创业者
  const agentK = new SocialAgent(
    "user-k",
    "寻找学习伙伴",
    "慢节奏，深度思考型",
    ["快节奏", "高强度", "每天", "创业"],
    3
  );

  const agentL = new SocialAgent(
    "user-l",
    "寻找创业伙伴",
    "快节奏，高效执行型",
    ["慢节奏", "学习", "思考", "偶尔"],
    10
  );

  // 极端案例 4: 天作之合 - 设计师 vs 产品经理
  const agentM = new SocialAgent(
    "user-m",
    "寻找产品合作",
    "创意导向，设计型",
    ["纯技术", "无创意"],
    7
  );

  const agentN = new SocialAgent(
    "user-n",
    "寻找设计伙伴",
    "产品导向，创意型",
    ["纯技术", "无设计感"],
    8
  );

  agents.set("user-a", agentA);
  agents.set("user-b", agentB);
  agents.set("user-c", agentC);
  agents.set("user-d", agentD);
  agents.set("user-e", agentE);
  agents.set("user-f", agentF);
  agents.set("user-g", agentG);
  agents.set("user-h", agentH);
  agents.set("user-i", agentI);
  agents.set("user-j", agentJ);
  agents.set("user-k", agentK);
  agents.set("user-l", agentL);
  agents.set("user-m", agentM);
  agents.set("user-n", agentN);
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

