import { useState } from "react"
import { api} from "@/lib/api"

const chips = [
  "buy $200 of AAPL",
  "sell 10 TSLA",
  "buy $10k of NVDA",
  "buy $300 of MSFT limit",
]

const policies = [
  { name: "Max order size", detail: "order_value > $5,000 → block", status: "on" },
  { name: "No meme stocks", detail: "ticker in [AMC, GME, ...] → block", status: "on" },
  { name: "Market-hours only", detail: "time outside 09:30-16:00 → block", status: "on" },
  { name: "Max daily loss", detail: "session pnl < -$500 → pause", status: "on" },
]

export default function PlaceTradePage() {
  const [tradeGoal, setTradeGoal] = useState("buy $200 of AAPL at market price")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExecuteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      // Step 1: Generate proposal from agent
      const proposal = await api.agent(tradeGoal)

      // Step 2: Execute through policy engine
      const execution = await api.execute({
        action: proposal.action,
        ticker: proposal.ticker,
        quantity: proposal.quantity,
        price_per_unit: proposal.price_per_unit,
        total_usd: proposal.total_usd,
        rationale: proposal.rationale,
        intent_token: proposal.intent_token,
      })

      setResult(execution)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Trade execution failed")
    } finally {
      setLoading(false)
    }
  }

  const actionProposal = result
    ? JSON.stringify(result, null, 2)
    : `{
  "action": "place_order",
  "ticker": "AAPL",
  "side": "buy",
  "notional": 200,
  "order_type": "market",
  "estimated_qty": 1.15,
  "policy_result": {
    "verdict": "allow",
    "rules_evaluated": 4,
    "rules_triggered": 0
  },
  "timestamp": "2024-05-11T12:04:31Z",
  "session_id": "sess_95fb",
  "agent_version": "ClawGuard AI v1.2"
}`

  return (
    <main className="min-h-screen bg-[#ECF4E8] px-4 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Place trade</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                Describe a goal — ClawGuard enforces it.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Use the trade goal editor to describe what you want to do. The agent proposes an action, then the policy engine evaluates it in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#93BFC7]/15 px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-[#93BFC7]/30">
                4 policies active
              </span>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${
                  result?.allowed
                    ? "bg-[#ABE7B2]/15 text-emerald-900 ring-[#ABE7B2]/40"
                    : "bg-red-100 text-red-800 ring-red-200"
                }`}
              >
                {result ? (result.allowed ? "Allowed" : "Blocked") : "Allowed"}
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <div className="grid gap-6">
              <div className="rounded-[28px] bg-[#CBF3BB]/80 p-6 ring-1 ring-[#93BFC7]/30">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Trade goal</p>
                <div className="mt-4 rounded-3xl border border-slate-300/70 bg-white p-6 text-slate-900 shadow-sm">
                  <label htmlFor="trade-goal-input" className="sr-only">
                    Trade goal
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      id="trade-goal-input"
                      value={tradeGoal}
                      onChange={(event) => setTradeGoal(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          handleSubmit()
                        }
                      }}
                      placeholder="buy $200 of AAPL at market price"
                      className="flex-1 rounded-3xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-[#93BFC7]/40"
                    />
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="inline-flex h-12 items-center justify-center rounded-3xl bg-[#93BFC7] px-5 text-sm font-semibold text-slate-950 transition hover:bg-[#7eb0b2] disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Enter"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  {chips.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTradeGoal(item)}
                      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/80 bg-[#ECF4E8] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Policy engine</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">Ready to evaluate</p>
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="inline-flex rounded-full bg-[#93BFC7] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#7eb0b2]"
                  >
                    Run through policy engine
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200/80 bg-[#fff] p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-600">
                  Final recommendation
                </p>
                <pre className="mt-5 overflow-x-auto rounded-3xl bg-slate-950/95 p-5 text-sm text-[#D7F4D5] shadow-sm">
                  {actionProposal}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}