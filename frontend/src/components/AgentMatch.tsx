import { useState, useEffect } from "react";
import { MatchResult, User, TraceEntry, TraceEntryType } from "../types";

const API_BASE = "/api";

export default function AgentMatch() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserA, setSelectedUserA] = useState<string>("user-a");
  const [selectedUserB, setSelectedUserB] = useState<string>("user-b");
  const [visibleTrace, setVisibleTrace] = useState<TraceEntry[]>([]);
  const [isShowingTrace, setIsShowingTrace] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    // 加载用户列表
    fetch(`${API_BASE}/agent/users`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        if (data.length >= 2) {
          setSelectedUserA(data[0].userId);
          setSelectedUserB(data[1].userId);
        }
      })
      .catch(err => console.error("Failed to load users:", err));
  }, []);

  const handleMatch = async () => {
    if (!selectedUserA || !selectedUserB || selectedUserA === selectedUserB) {
      setError("请选择两个不同的人");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/agent/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userIdA: selectedUserA,
          userIdB: selectedUserB
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "请求失败");
      }

      const data: MatchResult = await response.json();
      setResult(data);
      
      // 开始逐条展示 trace
      setIsShowingTrace(true);
      setShowSummary(false);
      setVisibleTrace([]);
      
      // 逐条追加 trace，每条间隔 600ms
      if (data.trace && data.trace.length > 0) {
        data.trace.forEach((entry, index) => {
          setTimeout(() => {
            setVisibleTrace(prev => [...prev, entry]);
            
            // 最后一条展示完后，显示总结
            if (index === data.trace.length - 1) {
              setTimeout(() => {
                setShowSummary(true);
              }, 800);
            }
          }, index * 600); // 每条间隔 600ms
        });
      } else {
        // 如果没有 trace，直接显示总结
        setTimeout(() => {
          setShowSummary(true);
        }, 300);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: TraceEntryType): string => {
    const colors: Record<TraceEntryType, string> = {
      signal: "#4a90e2",
      question: "#50c878",
      boundary: "#ff6b6b",
      offer: "#ffa500",
      reflection: "#9b59b6"
    };
    return colors[type] || "#999";
  };

  const getTypeLabel = (type: TraceEntryType): string => {
    const labels: Record<TraceEntryType, string> = {
      signal: "信号",
      question: "提问",
      boundary: "边界",
      offer: "提议",
      reflection: "反思"
    };
    return labels[type] || type;
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem", textAlign: "center", fontSize: "28px", fontWeight: "300" }}>
        关系探索
      </h1>
      <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem", fontSize: "14px" }}>
        让 Agent 先感受一下，看看这段关系是否值得展开
      </p>

      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          marginBottom: "2rem"
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "18px", fontWeight: "400" }}>
          选择要探索的关系
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1rem"
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "14px" }}>
              我想了解：
            </label>
            <select
              value={selectedUserA}
              onChange={(e) => setSelectedUserA(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "14px"
              }}
            >
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.userId} - {user.intent} ({user.interactionStyle})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "14px" }}>
              与谁的关系：
            </label>
            <select
              value={selectedUserB}
              onChange={(e) => setSelectedUserB(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "14px"
              }}
            >
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.userId} - {user.intent} ({user.interactionStyle})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleMatch}
            disabled={loading || selectedUserA === selectedUserB}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: loading || selectedUserA === selectedUserB ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading || selectedUserA === selectedUserB ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {loading ? "Agent 正在感受中..." : "让我的 Agent 感受一下现在的关系状态"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "6px",
            marginBottom: "1rem",
            color: "#c33"
          }}
        >
          错误: {error}
        </div>
      )}

      {result && isShowingTrace && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "400", marginBottom: "0.5rem", textAlign: "center" }}>
            Agent 交流过程
          </h2>
          <p style={{ textAlign: "center", fontSize: "12px", color: "#999", marginBottom: "1.5rem" }}>
            开发者视图：查看 Agent 之间的真实交流轨迹
          </p>
          
          <div style={{ 
            maxHeight: "600px", 
            overflowY: "auto",
            padding: "1.5rem",
            backgroundColor: "#fafafa",
            borderRadius: "8px",
            border: "1px solid #e8e8e8"
          }}>
            {visibleTrace.length === 0 && (
              <div style={{ textAlign: "center", color: "#999", padding: "2rem" }}>
                Agent 正在交流中...
              </div>
            )}
            {visibleTrace.map((entry, idx) => (
              <div key={idx} style={{ 
                marginBottom: "1.5rem",
                animation: "fadeIn 0.3s ease-in"
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "flex-start",
                  gap: "1rem",
                  padding: "1rem",
                  backgroundColor: entry.speaker === "AgentA" ? "#f0f7ff" : "#fff8f0",
                  borderRadius: "6px",
                  border: `1px solid ${entry.speaker === "AgentA" ? "#cce5ff" : "#ffe5cc"}`,
                  marginBottom: "1rem"
                }}>
                  <div style={{
                    minWidth: "100px",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: entry.speaker === "AgentA" ? "#0066cc" : "#cc6600",
                    textAlign: "right",
                    paddingTop: "4px"
                  }}>
                    {entry.speaker === "AgentA" ? selectedUserA.toUpperCase() : selectedUserB.toUpperCase()}
                    <div style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>
                      Agent {entry.speaker === "AgentA" ? "A" : "B"}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      fontSize: "11px",
                      backgroundColor: getTypeColor(entry.type),
                      color: "#fff",
                      borderRadius: "4px",
                      marginBottom: "0.75rem",
                      fontWeight: "500"
                    }}>
                      {getTypeLabel(entry.type)}
                    </div>
                    <div style={{
                      padding: "1rem",
                      backgroundColor: "#fff",
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      color: "#333",
                      lineHeight: "1.8",
                      marginBottom: "0.5rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                    }}>
                      {entry.content}
                    </div>
                    {entry.microReflection && (
                      <div style={{
                        marginTop: "0.5rem",
                        padding: "0.5rem 0.75rem",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#666",
                        fontStyle: "italic"
                      }}>
                        💭 {entry.microReflection}
                      </div>
                    )}
                    {entry.payload && (
                      <details open style={{ marginTop: "0.5rem" }}>
                        <summary style={{ 
                          cursor: "pointer", 
                          fontSize: "11px", 
                          color: "#666",
                          fontWeight: "500"
                        }}>
                          📊 查看结构化数据
                        </summary>
                        <pre style={{
                          marginTop: "0.5rem",
                          padding: "0.75rem",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "4px",
                          fontSize: "11px",
                          overflow: "auto",
                          maxHeight: "200px",
                          border: "1px solid #e0e0e0",
                          fontFamily: "monospace"
                        }}>
                          {JSON.stringify(entry.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                    <div style={{
                      marginTop: "0.5rem",
                      fontSize: "10px",
                      color: "#999"
                    }}>
                      轮次: {entry.round} | 类型: {entry.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && result.summary && showSummary && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "400", marginBottom: "1.5rem", textAlign: "center" }}>
            关系记录
          </h2>
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              border: "1px solid #e8e8e8"
            }}
          >
            <div style={{ marginBottom: "1rem", fontSize: "13px", color: "#666" }}>
              <span style={{ color: "#999" }}>从 </span>
              <span style={{ fontWeight: "500" }}>
                {result.summary.previousState === "glance" ? "初步感知" :
                 result.summary.previousState === "exploring" ? "正在试探" :
                 result.summary.previousState === "warming" ? "感觉变得自然" : "逐渐降温"}
              </span>
              <span style={{ color: "#999", margin: "0 8px" }}>→</span>
              <span style={{ fontWeight: "500" }}>
                {result.summary.currentState === "glance" ? "初步感知" :
                 result.summary.currentState === "exploring" ? "正在试探" :
                 result.summary.currentState === "warming" ? "感觉变得自然" : "逐渐降温"}
              </span>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "12px", color: "#999", marginBottom: "0.5rem" }}>关系事件</div>
              <div style={{ 
                padding: "0.75rem",
                backgroundColor: "#fff",
                borderRadius: "6px",
                border: "1px solid #f0f0f0"
              }}>
                {result.summary.events && result.summary.events.length > 0 ? (
                  result.summary.events.map((event, idx) => (
                    <div key={idx} style={{ 
                      fontSize: "13px", 
                      color: "#333",
                      marginBottom: idx < result.summary.events.length - 1 ? "0.75rem" : 0,
                      paddingBottom: idx < result.summary.events.length - 1 ? "0.75rem" : 0,
                      borderBottom: idx < result.summary.events.length - 1 ? "1px solid #f5f5f5" : "none"
                    }}>
                      {event.description}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "13px", color: "#999" }}>暂无事件</div>
                )}
              </div>
            </div>
            <div style={{ marginBottom: "1rem", fontSize: "13px", color: "#666" }}>
              <span style={{ color: "#999" }}>关系动量：</span>
              <span style={{ fontWeight: "500" }}>
                {result.summary.momentum === "warming" ? "更靠近" :
                 result.summary.momentum === "stable" ? "保持不变" : "稍微拉远"}
              </span>
            </div>
            <div style={{ 
              fontSize: "13px", 
              color: "#333",
              paddingTop: "1rem",
              borderTop: "1px solid #f0f0f0",
              fontStyle: "italic"
            }}>
              {result.summary.feeling || "暂无感受描述"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







