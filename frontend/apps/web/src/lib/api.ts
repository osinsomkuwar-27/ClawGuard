const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AccountInfo {
  buying_power: string;
  portfolio_value: string;
  status: string;
}

export interface HealthInfo {
  status: string;
  engine_policies: number;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  event_type: string;
  action: string;
  ticker: string;
  amount: number;
  decision: string;
  policy_id: string;
  reason: string;
  intent_token: string;
  execution_id: string;
  allowed: number;
}

export interface AgentProposal {
  action: string;
  ticker: string;
  quantity: number;
  price_per_unit: number;
  total_usd: number;
  rationale: string;
  intent_token: string;
}

export interface ProposalRequest {
  action: string;
  ticker: string;
  quantity?: number;
  price_per_unit?: number;
  total_usd: number;
  rationale?: string;
  context?: string;
  portfolio_value?: number;
  current_holding_usd?: number;
  environment?: string;
  requested_scope?: string;
  agent_id?: string;
  session_id?: string;
}

export interface ExecuteRequest extends ProposalRequest {
  intent_token: string;
}

export interface ExecuteResult {
  status: "EXECUTED" | "BLOCKED" | "ERROR";
  allowed: boolean;
  reason?: string;
  policy_id?: string;
  execution?: {
    order_id: string;
    status: string;
    symbol: string;
    side: string;
  };
  policy?: Record<string, unknown>;
}

export interface MCPResearchResult {
  ticker: string;
  last_5_closes: number[];
  latest_price: number | null;
}

// ── API Calls ──────────────────────────────────────────────────────────────────
export const api = {
  health: () => request<HealthInfo>("/health"),

  account: () => request<AccountInfo>("/account"),

  logs: (limit = 100) => request<{ logs: AuditLog[] }>(`/logs?limit=${limit}`),

  agent: (goal: string, agent_id = "agent-01") =>
    request<AgentProposal>("/agent", {
      method: "POST",
      body: JSON.stringify({ goal, agent_id }),
    }),

  execute: (req: ExecuteRequest) =>
    request<ExecuteResult>("/execute", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  placeTrade: async (
    action: "BUY" | "SELL",
    ticker: string,
    total_usd: number,
    rationale = "",
    portfolio_value = 10000
  ): Promise<ExecuteResult> => {
    // Step 1: get intent token from agent endpoint (sign_intent mirrors backend)
    // We call /mcp/call enforce_trade which internally signs + executes
    const res = await request<{ content: { type: string; text: string }[] }>(
      "/mcp/call",
      {
        method: "POST",
        body: JSON.stringify({
          name: "enforce_trade",
          arguments: { action, ticker, amount_usd: total_usd },
        }),
      }
    );
    const text = res.content?.[0]?.text || "{}";
    return JSON.parse(text) as ExecuteResult;
  },

  research: async (ticker: string): Promise<MCPResearchResult> => {
    const res = await request<{ content: { type: string; text: string }[] }>(
      "/mcp/call",
      {
        method: "POST",
        body: JSON.stringify({
          name: "research_stock",
          arguments: { ticker },
        }),
      }
    );
    const text = res.content?.[0]?.text || "{}";
    return JSON.parse(text) as MCPResearchResult;
  },
};