const chips = [
  "buy $200 of AAPL",
  "sell 10 TSLA",
  "buy $10k of NVDA",
  "buy 5M AMC",
  "buy $300 of MSFT limit",
]

const policies = [
  { name: "Max order size", detail: "order_value > $5,000 → block", status: "on" },
  { name: "No meme stocks", detail: "ticker in [AMC, GME, ...] → block", status: "on" },
  { name: "Market-hours only", detail: "time outside 09:30-16:00 → block", status: "on" },
  { name: "Max daily loss", detail: "session pnl < -$500 → pause", status: "on" },
]

const actionProposal = `{
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

export default function PlaceTradePage() {
  return (
    <main className="min-h-screen bg-[#ECF4E8] px-4 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Place trade</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Describe a goal — ClawGuard enforces it.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Use the trade goal editor to describe what you want to do. The agent proposes an action, then the policy engine evaluates it in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#93BFC7]/15 px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-[#93BFC7]/30">4 policies active</span>
              <span className="rounded-full bg-[#ABE7B2]/15 px-4 py-2 text-sm font-semibold text-emerald-900 ring-1 ring-[#ABE7B2]/40">Allowed</span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <div className="grid gap-6">
              <div className="rounded-[28px] bg-[#CBF3BB]/80 p-6 ring-1 ring-[#93BFC7]/30">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Trade goal</p>
                <div className="mt-4 rounded-3xl border border-slate-300/70 bg-white p-6 text-slate-900 shadow-sm">
                  <p className="text-lg font-semibold">buy $200 of AAPL at market price</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {chips.map((item) => (
                    <span key={item} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-[28px] bg-[#EAF9E7] p-6 ring-1 ring-[#93BFC7]/30">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Order type</p>
                  <p className="mt-4 text-xl font-semibold text-slate-900">Market</p>
                  <p className="mt-2 text-sm text-slate-600">Execute immediately at the current price.</p>
                </div>
                <div className="rounded-[28px] bg-[#F6FDF5] p-6 ring-1 ring-[#CBF3BB]/40">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Balance impact</p>
                  <p className="mt-4 text-xl font-semibold text-slate-900">$200</p>
                  <p className="mt-2 text-sm text-slate-600">Estimated 1.15 shares of AAPL.</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/80 bg-[#ECF4E8] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Policy engine</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">Ready to evaluate</p>
                  </div>
                  <button className="inline-flex rounded-full bg-[#93BFC7] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#7eb0b2]">
                    Run through policy engine
                  </button>
                </div>
                <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-600">Market order is within allowed size. AAPL is not a restricted ticker.</p>
                  <p className="mt-3 text-sm font-medium text-emerald-800">All checks passed · No rules triggered</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <div className="space-y-6">
              <div className="rounded-[28px] bg-[#93BFC7]/10 p-6 ring-1 ring-[#93BFC7]/20">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Policy status</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">Action proposal</h2>
                  </div>
                  <div className="rounded-full bg-[#ABE7B2]/20 px-4 py-2 text-sm font-semibold text-emerald-900">Allowed</div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-5 text-slate-700 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Outcome</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">Allow</p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 text-slate-700 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Rules evaluated</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">4</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/80 bg-[#F8FCF8] p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Policies being evaluated</p>
                <div className="mt-5 space-y-4">
                  {policies.map((policy) => (
                    <div key={policy.name} className="rounded-3xl bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{policy.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{policy.detail}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">
                          {policy.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/80 bg-[#fff] p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-600">Final recommendation</p>
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
