# 🛡️ ClawGuard

> **An AI-powered autonomous trading agent with a built-in safety guardrail layer.**

ClawGuard lets an AI agent propose and execute stock trades — but every single trade must pass through a **policy engine (ArmorClaw)** before it touches any real money. Think of it as a two-layer system: an intelligent agent that acts, and an opinionated enforcer that gatekeeps.

All trades run against **Alpaca Paper Trading**, so no real money is ever at risk.

---

## 📸 Overview

```
OpenClaw CLI
     ↓
OpenClaw Agent  (Gemini / LLM)
     ↓
ArmorClaw MCP Server  ←────  policy_engine.py
     ↓                              ↓
FastAPI Backend            PolicyEngine evaluates
     ↓                         ALLOW / BLOCK
Alpaca Paper Trading API
     ↓
SQLite Audit Log
```

---

## 🧩 Components

### 🤖 OpenClaw — Agent Runtime
The agent runtime powered by **Gemini 2.5 Flash** (swappable). It receives natural language commands like:
> *"Buy 2 shares of AAPL at $180"*

...and decides which MCP tools to call. It connects to ArmorClaw over **SSE at `localhost:8000`** using the Model Context Protocol (MCP).

---

### 🔒 ArmorClaw — FastAPI + MCP Server (`backend/main.py`)
The central backend that acts as both the MCP server and trade execution layer. It exposes:

| Endpoint | Description |
|---|---|
| `enforce_trade` | Main MCP tool — routes through PolicyEngine, signs with HMAC, executes on Alpaca if allowed |
| `research_stock` | Fetches the last 5 closes for a ticker via Alpaca |
| `GET /logs` | Returns the full audit log |
| `GET /account` | Returns Alpaca account info |
| `GET /health` | Health check |

---

### ⚖️ PolicyEngine — Trade Guardrails (`backend/policy_engine.py`)
Evaluates every `ActionProposal` against a ruleset before any trade is placed:

-  Max trade size limits
-  Position size limits
-  Ticker allowlist enforcement
-  Rate limiting
-  Environment guards (blocks live trading when in paper mode)

Returns `ALLOW` or `BLOCK` with a reason and policy ID on every evaluation.

---

### 📊 Frontend — React Dashboard (`frontend/`)
A full dashboard wired to the FastAPI backend with these pages:

| Page | Description |
|---|---|
| **Overview** | High-level account snapshot |
| **Portfolio** | Current holdings and P&L |
| **Place Trade** | Manual trade submission UI |
| **Decision Feed** | Live feed of ALLOW / BLOCK decisions |
| **Audit Log** | Full SQLite-backed event history |
| **Policies** | View active policy rules |

---

### 🗃️ SQLite Audit Log (`armorclaw.db`)
Every event is persisted — proposals, blocks, executions, and errors — including HMAC intent tokens and Alpaca execution IDs.

---

## 📁 Project Structure

```
ClawGuard/
├── agent/              # OpenClaw agent runtime
│   └── ...
├── backend/            # ArmorClaw FastAPI + MCP server
│   ├── main.py         # FastAPI app, MCP tools, Alpaca integration
│   ├── policy_engine.py# PolicyEngine — ALLOW / BLOCK logic
│   └── armorclaw.db    # SQLite audit log (auto-created)
├── frontend/           # React dashboard
│   ├── src/
│   └── ...
├── .python-version
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

- Python **3.11+** (see `.python-version`)
- Node.js **18+** and npm
- An [Alpaca](https://alpaca.markets/) account with **paper trading API keys**
- A Google Gemini API key (or swap to another LLM provider)
- `uv` (recommended Python package manager) — or `pip`

---

## 🚀 Setup & Installation

### 1. Clone the repo

```bash
git clone https://github.com/osinsomkuwar-27/ClawGuard.git
cd ClawGuard
```

---

### 2. Set up environment variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env   # if .env.example exists, otherwise create manually
```

Fill in your credentials:

```env
# Alpaca Paper Trading
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# HMAC signing secret (any strong random string)
HMAC_SECRET=your_hmac_secret_here

# LLM (Gemini)
GEMINI_API_KEY=your_gemini_api_key
```

---

### 3. Install backend dependencies

Using `uv` (recommended):

```bash
cd backend
uv sync
```

Or with `pip`:

```bash
cd backend
pip install -r requirements.txt
```

---

### 4. Start the ArmorClaw backend (MCP server + FastAPI)

```bash
cd backend
python main.py
```

The server starts at **`http://localhost:8000`**.

Verify it's running:

```bash
curl http://localhost:8000/health
```

---

### 5. Install and start the frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at **`http://localhost:5173`** (or the port Vite assigns).

---

### 6. Run the OpenClaw agent

```bash
cd agent
python openclaw.py
```

Or if OpenClaw is installed as a CLI:

```bash
openclaw run "Buy 2 shares of AAPL at market price"
```

The agent connects to the ArmorClaw MCP server over SSE at `localhost:8000` and begins processing your commands.

---

## 🔄 Typical Trade Flow

```
1. You send a natural language command to the agent
        ↓
2. OpenClaw Agent interprets the command and calls enforce_trade via MCP
        ↓
3. ArmorClaw receives the ActionProposal
        ↓
4. PolicyEngine evaluates the proposal against all active rules
        ↓
5a. ALLOW → ArmorClaw signs with HMAC, submits to Alpaca, logs the execution
5b. BLOCK → ArmorClaw returns the block reason + policy ID, logs the event
        ↓
6. Everything is recorded in armorclaw.db
```

---

## 📋 API Reference

### `POST /enforce_trade` (MCP Tool)

Submits a trade proposal through the policy engine.

**Request body:**
```json
{
  "ticker": "AAPL",
  "side": "buy",
  "qty": 2,
  "price": 180.00,
  "order_type": "limit"
}
```

**Response (ALLOW):**
```json
{
  "decision": "ALLOW",
  "execution_id": "abc123",
  "policy_id": "POL-001"
}
```

**Response (BLOCK):**
```json
{
  "decision": "BLOCK",
  "reason": "Exceeds max single-trade size of $500",
  "policy_id": "POL-003"
}
```

---

### `GET /logs`

Returns all audit log entries from `armorclaw.db`.

### `GET /account`

Returns Alpaca paper account balance and buying power.

### `GET /health`

Returns `{ "status": "ok" }` when the server is running.

---

## ⚠️ Known Issues & Current Status

| Issue | Status |
|---|---|
| **Gemini quota exhausted** | The agent cannot run until your Gemini quota resets or you swap to another provider (OpenAI, Anthropic, etc.) |
| **OpenClaw scope upgrade handshake** | The gateway daemon runs but the CLI fails the scope upgrade handshake — needs debugging |
| **ArmorClaw manual start** | Must be started manually with `python main.py` before running any agent commands |
| **Frontend wiring** | Dashboard is built but may need final wiring into your local repo |

---

## 🔁 Switching LLM Providers

If Gemini quota is exhausted, you can swap to another provider in the agent config. Example for OpenAI:

```python
# agent/openclaw.py
from openai import OpenAI

client = OpenAI(api_key="your_openai_key")
# replace Gemini call with OpenAI equivalent
```

Or for Anthropic Claude:

```python
import anthropic

client = anthropic.Anthropic(api_key="your_anthropic_key")
```

---

## 🛡️ Safety Design Principles

ClawGuard is built with **agentic finance safety** as its core design constraint:

1. **No trade bypasses the policy engine** — `enforce_trade` is the only execution path.
2. **All decisions are logged** — ALLOW and BLOCK events are permanently recorded with full context.
3. **HMAC signing** — every approved intent is signed before submission, preventing tampering.
4. **Paper trading only** — Alpaca paper API is used by default; switching to live requires explicit config change + policy approval.
5. **Rate limiting** — the policy engine enforces per-ticker and global rate limits to prevent runaway trading.

---

## 🗺️ Roadmap

- [ ] Multi-provider LLM support (OpenAI, Anthropic, local models)
- [ ] Dynamic policy editing via the dashboard UI
- [ ] Webhook alerts for BLOCK events
- [ ] Portfolio risk scoring in PolicyEngine
- [ ] Live trading mode with additional approval gates
- [ ] Docker Compose setup for one-command startup

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

<p align="center">Built with 🤖 AI agents, ⚖️ policy guardrails, and 📄 paper money.</p>