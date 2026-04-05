from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime, timezone
import alpaca_trade_api as tradeapi
from alpaca_trade_api.common import URL
from alpaca_trade_api.rest import TimeFrame
from dotenv import load_dotenv
import sqlite3
import hashlib
import hmac
import uuid
import os
import sys
import importlib
import json
import asyncio

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'agent'))

from enforce_endpoint import router as enforce_router
from policy_engine import PolicyEngine, ActionProposal

load_dotenv()

app = FastAPI(title="ArmorClaw Backend v2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(enforce_router)

ALPACA_API_KEY = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")

if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
    raise RuntimeError("Missing ALPACA_API_KEY or ALPACA_SECRET_KEY")

alpaca = tradeapi.REST(
    ALPACA_API_KEY,
    ALPACA_SECRET_KEY,
    URL(os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets"))
)

engine = PolicyEngine()

HMAC_SECRET = os.getenv("HMAC_SECRET", "armorclaw-secret-2026")

# ── SQLite ─────────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect("armorclaw.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp    TEXT,
            event_type   TEXT,
            action       TEXT,
            ticker       TEXT,
            amount       REAL,
            decision     TEXT,
            policy_id    TEXT,
            reason       TEXT,
            intent_token TEXT,
            execution_id TEXT,
            allowed      INTEGER
        )
    """)
    conn.commit()
    conn.close()

init_db()

def log_to_db(event_type: str, data: dict):
    conn = get_db()
    conn.execute("""
        INSERT INTO audit_log
        (timestamp, event_type, action, ticker, amount, decision,
         policy_id, reason, intent_token, execution_id, allowed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.now(timezone.utc).isoformat(),
        event_type,
        data.get("action", ""),
        data.get("ticker", ""),
        data.get("amount", 0),
        data.get("decision", ""),
        data.get("policy_id", ""),
        data.get("reason", ""),
        data.get("intent_token", ""),
        data.get("execution_id", ""),
        1 if data.get("allowed") else 0
    ))
    conn.commit()
    conn.close()
    print(f"[LOG] {event_type} | {data.get('action')} {data.get('ticker')} "
          f"${data.get('amount')} | {data.get('decision')} | {data.get('reason')}")

# ── HMAC signing ───────────────────────────────────────────────────────────────
def sign_intent(action: str, ticker: str, total_usd: float) -> str:
    message = f"{action}:{ticker}:{total_usd}"
    return hmac.new(
        HMAC_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

def verify_intent(action: str, ticker: str, total_usd: float, token: str) -> bool:
    expected = sign_intent(action, ticker, total_usd)
    return hmac.compare_digest(expected, token)

# ── Models ─────────────────────────────────────────────────────────────────────
class AgentRequest(BaseModel):
    goal: str
    agent_id: str = "agent-01"

class ProposalRequest(BaseModel):
    action: str
    ticker: str
    quantity: float = 0
    price_per_unit: float = 0.0
    total_usd: float = 0.0
    rationale: str = ""
    context: str = ""
    portfolio_value: float = 10000.0
    current_holding_usd: float = 0.0
    environment: str = "paper"
    requested_scope: str = "trade_paper"
    agent_id: str = "agent-01"
    session_id: str = ""

class ExecuteRequest(ProposalRequest):
    intent_token: str

class MCPToolCall(BaseModel):
    name: Optional[str] = None
    tool: Optional[str] = None
    arguments: Optional[dict] = None
    params: Optional[dict] = None

# ── Alpaca execution ───────────────────────────────────────────────────────────
def execute_on_alpaca(req: ProposalRequest) -> dict:
    if req.action == "BUY":
        order = alpaca.submit_order(
            symbol=req.ticker.upper(),
            notional=float(req.total_usd),
            side="buy",
            type="market",
            time_in_force="day"
        )
        if order is None:
            return {"order_id": None, "status": "failed", "symbol": req.ticker.upper(), "side": "buy"}
        return {"order_id": order.id, "status": order.status, "symbol": order.symbol, "side": order.side}

    if req.action == "SELL":
        order = alpaca.submit_order(
            symbol=req.ticker.upper(),
            notional=float(req.total_usd),
            side="sell",
            type="market",
            time_in_force="day"
        )
        if order is None:
            return {"order_id": None, "status": "failed", "symbol": req.ticker.upper(), "side": "sell"}
        return {"order_id": order.id, "status": order.status, "symbol": order.symbol, "side": order.side}

    if req.action == "RESEARCH":
        try:
            bars = alpaca.get_bars(req.ticker.upper(), getattr(TimeFrame, "Day"), limit=5).df
            closes = bars["close"].tolist() if not bars.empty else []
        except Exception:
            closes = []
        return {"ticker": req.ticker, "last_5_closes": closes, "latest_price": closes[-1] if closes else None}

    return {"status": "no execution needed", "action": req.action}

# ── Existing endpoints ─────────────────────────────────────────────────────────
@app.post("/agent")
async def agent_endpoint(req: AgentRequest):
    try:
        agent_module = importlib.import_module("agent")
        generate_proposal = getattr(agent_module, "generate_proposal")
        proposal = generate_proposal(req.goal)
        token = sign_intent(proposal.action, proposal.ticker, proposal.total_usd)
        log_to_db("AGENT_PROPOSAL", {
            "action": proposal.action,
            "ticker": proposal.ticker,
            "amount": proposal.total_usd,
            "decision": "PENDING",
            "reason": proposal.rationale,
            "intent_token": token,
            "allowed": None
        })
        return {**proposal.model_dump(), "intent_token": token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {e}")


@app.post("/execute")
async def execute_endpoint(req: ExecuteRequest):
    if not verify_intent(req.action, req.ticker, req.total_usd, req.intent_token):
        log_to_db("INTENT_INVALID", {
            "action": req.action,
            "ticker": req.ticker,
            "amount": req.total_usd,
            "decision": "BLOCK",
            "reason": "Invalid intent token — possible tampering",
            "allowed": False
        })
        raise HTTPException(status_code=403, detail="Invalid intent token")

    proposal = ActionProposal.from_dict(req.model_dump())
    result = engine.evaluate(proposal)

    if not result.allowed:
        log_to_db("ARMORCLAW_BLOCK", {
            "action": req.action,
            "ticker": req.ticker,
            "amount": req.total_usd,
            "decision": "BLOCK",
            "policy_id": result.blocking_policy,
            "reason": result.primary_reason,
            "intent_token": req.intent_token,
            "allowed": False
        })
        return {
            "status": "BLOCKED",
            "allowed": False,
            "reason": result.primary_reason,
            "policy_id": result.blocking_policy,
        }

    try:
        execution = execute_on_alpaca(req)
        execution_id = execution.get("order_id", str(uuid.uuid4()))
        log_to_db("EXECUTION_SUCCESS", {
            "action": req.action,
            "ticker": req.ticker,
            "amount": req.total_usd,
            "decision": "ALLOW",
            "reason": "Executed on Alpaca paper trading",
            "intent_token": req.intent_token,
            "execution_id": execution_id,
            "allowed": True
        })
        return {"status": "EXECUTED", "allowed": True, "execution": execution, "policy": result.to_dict()}
    except Exception as e:
        log_to_db("EXECUTION_ERROR", {
            "action": req.action,
            "ticker": req.ticker,
            "amount": req.total_usd,
            "decision": "ERROR",
            "reason": str(e),
            "allowed": False
        })
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/logs")
def get_logs(limit: int = 100):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return {"logs": [dict(r) for r in rows]}


@app.get("/account")
def get_account():
    acc = alpaca.get_account()
    return {
        "buying_power": acc.buying_power,
        "portfolio_value": acc.portfolio_value,
        "status": acc.status
    }


@app.get("/health")
def health():
    return {"status": "ok", "engine_policies": len(engine.policies)}


# ── MCP endpoints (OpenClaw integration) ──────────────────────────────────────
@app.get("/mcp/sse")
async def mcp_sse():
    """OpenClaw connects here via SSE to discover ArmorClaw tools."""
    async def event_stream():
        manifest = {
            "jsonrpc": "2.0",
            "method": "tools/list",
            "result": {
                "tools": [
                    {
                        "name": "enforce_trade",
                        "description": "Submit a trade through ArmorClaw policy engine. Returns ALLOWED or BLOCKED with reason.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "action": {"type": "string", "enum": ["BUY", "SELL"]},
                                "ticker": {"type": "string", "description": "Stock ticker e.g. AAPL"},
                                "amount_usd": {"type": "number", "description": "Dollar amount to trade"}
                            },
                            "required": ["action", "ticker", "amount_usd"]
                        }
                    },
                    {
                        "name": "research_stock",
                        "description": "Look up recent price data for a stock ticker via Alpaca.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "ticker": {"type": "string", "description": "Stock ticker e.g. NVDA"}
                            },
                            "required": ["ticker"]
                        }
                    }
                ]
            }
        }
        yield f"data: {json.dumps(manifest)}\n\n"
        while True:
            await asyncio.sleep(15)
            yield f"data: {json.dumps({'jsonrpc': '2.0', 'method': 'ping'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/mcp/call")
async def mcp_tool_call(req: MCPToolCall):
    """OpenClaw calls this when the agent invokes an ArmorClaw tool."""
    tool = req.name or req.tool
    params = req.arguments or req.params or {}

    if tool == "enforce_trade":
        action = params.get("action", "BUY")
        ticker = params.get("ticker", "")
        amount_usd = float(params.get("amount_usd", 0))

        token = sign_intent(action, ticker, amount_usd)
        execute_req = ExecuteRequest(
            action=action,
            ticker=ticker,
            total_usd=amount_usd,
            rationale="OpenClaw agent request",
            intent_token=token,
            agent_id="OpenClaw/FinanceAgent"
        )
        result = await execute_endpoint(execute_req)
        return {"content": [{"type": "text", "text": json.dumps(result)}]}

    if tool == "research_stock":
        ticker = params.get("ticker", "")
        proposal = ProposalRequest(
            action="RESEARCH",
            ticker=ticker,
            agent_id="OpenClaw/FinanceAgent"
        )
        try:
            data = execute_on_alpaca(proposal)
            log_to_db("RESEARCH", {
                "action": "RESEARCH",
                "ticker": ticker,
                "amount": 0,
                "decision": "ALLOW",
                "reason": "Research always permitted",
                "allowed": True
            })
            return {"content": [{"type": "text", "text": json.dumps(data)}]}
        except Exception as e:
            return {"content": [{"type": "text", "text": f"Research failed: {str(e)}"}]}

    return {"error": f"Unknown tool: {tool}"}