const policyTabs = [
  { label: "All", count: 6 },
  { label: "Value limits", count: 2 },
  { label: "Symbol rules", count: 2 },
  { label: "Time-based", count: 1 },
  { label: "Position size", count: 1 },
]

const policies = [
  {
    title: "Max order size",
    type: "Value limit",
    typeColor: "bg-slate-900 text-white",
    description: "Blocks any single trade whose notional value exceeds the threshold. Applies to both buy and sell market orders.",
    rule: "order_value > $5,000 → block",
    appliesTo: "place_order",
    active: true,
    fired: "5× fired today",
  },
  {
    title: "Max daily loss",
    type: "Value limit",
    typeColor: "bg-slate-900 text-white",
    description: "Pauses all trading if the session P&L falls below the loss threshold. Resets at market open.",
    rule: "session pnl < -$500 → pause",
    appliesTo: "place_order, cancel_order",
    active: true,
    fired: "0× fired today",
  },
  {
    title: "No meme stocks",
    type: "Symbol rule",
    typeColor: "bg-slate-900 text-white",
    description: "Blocks orders for tickers on the restricted symbol list. List is manually maintained and version-controlled.",
    rule: "ticker in [AMC, GME, BBBY...] → block",
    appliesTo: "place_order",
    active: true,
    fired: "3× fired today",
  },
  {
    title: "Market-hours only",
    type: "Time-based",
    typeColor: "bg-slate-900 text-white",
    description: "Prevents orders outside NYSE regular trading hours. Extended-hours trading is not permitted.",
    rule: "time outside 09:30-16:00 ET → block",
    appliesTo: "place_order",
    active: true,
    fired: "0× fired today",
  },
  {
    title: "Short selling",
    type: "Conflict",
    typeColor: "bg-amber-600 text-white",
    description: "Allows the agent to open short positions. Currently conflicts with the “No sell at market” policy.",
    rule: "order.side = short → allow",
    appliesTo: "place_order",
    active: true,
    conflict: true,
    fired: "0× fired today",
  },
  {
    title: "Max position size",
    type: "Position size",
    typeColor: "bg-slate-900 text-white",
    description: "Caps exposure in any single ticker to a percentage of total portfolio value.",
    rule: "position_pct > 20% → block",
    appliesTo: "place_order",
    active: false,
    fired: "0× fired today",
  },
]

export default function PoliciesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Policies</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Manage enforcement rules with clarity and confidence.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Review active policies, conflict signals, and rule behaviors in a clean dashboard designed for rapid policy management.
              </p>
            </div>
            <button className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              + New policy
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="rounded-3xl bg-[#CBF3BB] px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm ring-1 ring-slate-200/80">
              6 rules
            </div>
            <div className="rounded-3xl bg-[#ABE7B2] px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm ring-1 ring-slate-200/80">
              4 active
            </div>
            <div className="rounded-3xl bg-[#93BFC7] px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm ring-1 ring-slate-200/80">
              1 conflict detected
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {policyTabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {tab.label} <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/95 p-5 text-sm text-amber-900 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Conflict detected</p>
                <p className="mt-1 text-slate-800">
                  “Allow short selling” conflicts with “No sell at market” orders. One may override the other depending on evaluation order.
                </p>
              </div>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-900">
                review policy order
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {policies.map((policy) => (
              <div
                key={policy.title}
                className={`rounded-[1.75rem] border p-5 shadow-sm transition ${policy.conflict ? "border-amber-300 bg-amber-50/80" : "border-slate-200 bg-slate-50"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${policy.typeColor}`}>
                        {policy.type}
                      </span>
                      {policy.fired ? (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
                          {policy.fired}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-xl font-semibold text-slate-950">{policy.title}</h2>
                    <p className="text-sm leading-6 text-slate-600">{policy.description}</p>
                  </div>

                  <button
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${policy.active ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-700"}`}
                  >
                    {policy.active ? "Active" : "Inactive"}
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200/80">{policy.rule}</span>
                  <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200/80">Applies to: {policy.appliesTo}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
