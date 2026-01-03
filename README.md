# Agent-first 社交平台 Demo

这是一个验证"Agent-first 社交平台"核心概念的 Demo 项目。每个用户绑定一个长期存在的 SocialAgent，Agent 先于真人进行意图交换与匹配判断，系统输出是否建议真人聊天。

## 技术栈

- **前端**: React + Vite + TypeScript
- **后端**: Node.js + Express + TypeScript
- **AI API**: DeepSeek API (兼容 OpenAI SDK)

## 项目结构

```
agentsocial/
├── frontend/          # React 前端应用
├── backend/           # Express 后端服务
├── .env.example       # 环境变量示例
└── README.md         # 项目说明
```

## 快速开始

### 1. 安装依赖

**后端:**
```bash
cd backend
npm install
```

**前端:**
```bash
cd frontend
npm install
```

### 2. 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 DeepSeek API Key：

```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 3. 启动服务

**启动后端 (终端 1):**
```bash
cd backend
npm run dev
```

后端将在 `http://localhost:3001` 运行。

**启动前端 (终端 2):**
```bash
cd frontend
npm run dev
```

前端将在 `http://localhost:3000` 运行。

### 4. 使用

1. 打开浏览器访问 `http://localhost:3000`
2. 点击「让 Agent 先聊」按钮
3. 查看匹配结果和 Agent 协商过程

## 核心功能

1. **SocialAgent 类**: 每个用户绑定一个 Agent，包含意图、交互风格、dealbreakers、能量等级等属性
2. **Agent 协商**: Agent A 生成结构化意图，Agent B 评估并返回可接受范围
3. **匹配算法**: 基于意图匹配、风格兼容性、dealbreakers 检查、能量等级计算匹配分数 (0-100)
4. **AI 总结**: 使用 DeepSeek API 生成给两个用户的自然语言总结
5. **推荐系统**: 根据匹配分数输出 "proceed" 或 "stop" 建议

## Mock 用户

- **User A**: 技术爱好者，寻找学习伙伴
- **User B**: 创业者，寻找合作者

## API 端点

- `POST /api/agent/match` - 执行 Agent 匹配
  - 请求体: `{ userIdA: "user-a", userIdB: "user-b" }`
  - 返回: 匹配结果（分数、推荐、总结等）

## 开发说明

- 数据存储在内存中（重启后重置）
- 使用 TypeScript 严格模式
- 前端通过 Vite proxy 访问后端 API

