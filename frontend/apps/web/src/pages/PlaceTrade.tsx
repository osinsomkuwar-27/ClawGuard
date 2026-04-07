import { useState } from "react"
import { api, type ExecuteResult } from "@/lib/api"

const chips = [
  "buy $200 of AAPL",
  "sell 10 TSLA",
  "buy $10k of NVDA",
  "buy $300 of MSFT limit",
]

export default function PlaceTradePage() {
  const [tradeGoal, setTradeGoal] = useState("buy $200 of AAPL at market price")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExecuteResult | null>(null)
  const [proposal, setProposal] = useState<{
    action: string; ticker: string; quantity: number; price_per_unit: number; total_usd: number; rationale: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      setProposal(null)

      const agentProposal = await api.agent(tradeGoal)
      setProposal({
        action: agentProposal.action,
        ticker: agentProposal.ticker,
        quantity: agentProposal.quantity,
        price_per_unit: agentProposal.price_per_unit,
        total_usd: agentProposal.total_usd,
        rationale: agentProposal.rationale,
      })

      const execution = await api.execute({
        action: agentProposal.action,
        ticker: agentProposal.ticker,
        quantity: agentProposal.quantity,
        price_per_unit: agentProposal.price_per_unit,
        total_usd: agentProposal.total_usd,
        rationale: agentProposal.rationale,
        intent_token: agentProposal.intent_token,
      })

      setResult(execution)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Trade execution failed")
    } finally {
      setLoading(false)
    }
  }

  const allowed = result?.allowed ?? true
  const statusColor = result
    ? allowed
      ? "bg-[#ABE7B2]/15 text-emerald-900 ring-[#ABE7B2]/40"
      : "bg-red-100 text-red-800 ring-red-200"
    : "bg-[#ABE7B2]/15 text-emerald-900 ring-[#ABE7B2]/40"
  const statusLabel = result ? (allowed ? "Allowed" : "Blocked") : "Allowed"

  return (
    <main className="min-h-screen bg-[#ECF4E8] px-4 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Header */}
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
              <span className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Left: input */}
          <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <div className="grid gap-6">
              <div className="rounded-[28px] bg-[#CBF3BB]/80 p-6 ring-1 ring-[#93BFC7]/30">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Trade goal</p>
                <div className="mt-4 rounded-3xl border border-slate-300/70 bg-white p-6 text-slate-900 shadow-sm">
                  <label htmlFor="trade-goal-input" className="sr-only">Trade goal</label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      id="trade-goal-input"
                      value={tradeGoal}
                      onChange={(e) => setTradeGoal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit() } }}
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
                  <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
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
                    disabled={loading}
                    className="inline-flex rounded-full bg-[#93BFC7] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#7eb0b2] disabled:opacity-50"
                  >
                    {loading ? "Evaluating..." : "Run through policy engine"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Right: result */}
          <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200/80 bg-white p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Final recommendation</p>

                {/* Loading state */}
                {loading && (
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
                    <svg className="h-7 w-7 animate-spin text-[#93BFC7]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <p className="text-sm">Evaluating with policy engine…</p>
                  </div>
                )}

                {/* Empty state */}
                {!loading && !result && !error && (
                  <div className="mt-6 flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                    <span className="text-4xl">⟳</span>
                    <p className="text-sm">Submit a trade goal to see the result here.</p>
                  </div>
                )}

                {/* Result card */}
                {!loading && result && (
                  <div className="mt-5 space-y-4">
                    {/* Verdict banner */}
                    <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 ${result.allowed ? "bg-[#CBF3BB]" : "bg-red-100"}`}>
                      <span className="text-2xl">{result.allowed ? "✅" : "🚫"}</span>
                      <div>
                        <p className="text-base font-semibold text-slate-950">
                          {result.allowed ? "Trade Allowed" : "Trade Blocked"}
                        </p>
                        {result.reason && (
                          <p className="mt-0.5 text-sm text-slate-700">{result.reason}</p>
                        )}
                      </div>
                    </div>

                    {/* Proposal details */}
                    {proposal && (
                      <div className="rounded-2xl bg-slate-50 p-5 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Proposed trade</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-xs text-slate-500">Action</p>
                            <p className="mt-1 font-semibold text-slate-900">{proposal.action}</p>
                          </div>
                          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-xs text-slate-500">Ticker</p>
                            <p className="mt-1 font-semibold text-slate-900">{proposal.ticker}</p>
                          </div>
                          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-xs text-slate-500">Quantity</p>
                            <p className="mt-1 font-semibold text-slate-900">{proposal.quantity}</p>
                          </div>
                          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-xs text-slate-500">Total USD</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              ${proposal.total_usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        {proposal.rationale && (
                          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-xs text-slate-500">Rationale</p>
                            <p className="mt-1 text-sm text-slate-700">{proposal.rationale}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Execution details if allowed */}
                    {result.allowed && result.execution && (
                      <div className="rounded-2xl bg-[#ECF4E8] p-5 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Execution</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-xs text-slate-500">Order ID</p>
                            <p className="mt-1 font-mono text-xs text-slate-800 break-all">{result.execution.order_id}</p>
                          </div>
                          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-xs text-slate-500">Status</p>
                            <p className="mt-1 font-semibold text-slate-900 capitalize">{result.execution.status}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Policy that blocked */}
                    {!result.allowed && result.policy_id && (
                      <div className="rounded-2xl bg-red-50 px-5 py-4 ring-1 ring-red-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-700">Policy triggered</p>
                        <p className="mt-1 font-mono text-sm text-red-900">{result.policy_id}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}     