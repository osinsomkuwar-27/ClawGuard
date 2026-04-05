const rows = [
  { time: "12:05:14", tool: "place_order", detail: "BUY 200 GME @ market", rule: "no-meme-stocks", status: "Blocked" },
  { time: "12:04:58", tool: "get_quote", detail: "Fetch AAPL, MSFT, GOOG", rule: "-", status: "Allowed" },
  { time: "12:04:31", tool: "place_order", detail: "BUY 50 NVDA @ market", rule: "max-order-size", status: "Blocked" },
  { time: "12:04:28", tool: "get_portfolio", detail: "Read positions snapshot", rule: "-", status: "Allowed" },
  { time: "12:04:17", tool: "place_order", detail: "BUY 10 AAPL @ limit 189.50", rule: "-", status: "Allowed" },
  { time: "12:04:09", tool: "cancel_order", detail: "Cancel order #882-B", rule: "-", status: "Allowed" },
  { time: "12:04:02", tool: "get_quote", detail: "Fetch MSFT, GOOG, META", rule: "-", status: "Allowed" },
  { time: "12:03:55", tool: "place_order", detail: "BUY 100 AMC @ market", rule: "no-meme-stocks", status: "Blocked" },
  { time: "12:03:41", tool: "get_portfolio", detail: "Read positions snapshot", rule: "-", status: "Allowed" },
  { time: "12:03:29", tool: "place_order", detail: "BUY 500 NVDA @ market", rule: "max-order-size", status: "Blocked" },
]

const chips = [
  { label: "All", count: 12, active: true },
  { label: "Allowed", count: 7, active: false },
  { label: "Blocked", count: 5, active: false },
]

export default function DecisionFeedPage() {
  return (
    <main className="min-h-screen bg-[#ECF4E8] px-4 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.16)] backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Decision feed</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Live activity from the policy engine</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Monitor executed actions, rule decisions, and tool calls in one clean stream. Use the filter chips to surface allowed or blocked activity instantly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#93BFC7]/15 px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-[#93BFC7]/30">Updated 12:05:14</span>
              <span className="rounded-full bg-[#ABE7B2]/15 px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-[#ABE7B2]/30">Market open</span>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200/80 bg-[#F7FCF6]/80 p-6 shadow-[0_26px_60px_-36px_rgba(15,23,42,0.12)] backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Activity stream</h2>
              <p className="mt-2 text-sm text-slate-600">A chronological view of the latest policy decisions and tool actions.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${chip.active ? "bg-[#93BFC7] text-slate-950 shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
                >
                  {chip.label} {chip.count}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-slate-950/95 text-slate-100 shadow-sm">
            <div className="grid grid-cols-[1.3fr_1.2fr_3.2fr_2fr_1.1fr] gap-0 border-b border-slate-800 bg-slate-900/95 px-6 py-4 text-xs uppercase tracking-[0.3em] text-slate-500">
              <span>Time</span>
              <span>Tool</span>
              <span>Detail</span>
              <span>Rule</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-slate-800">
              {rows.map((row) => (
                <div key={`${row.time}-${row.detail}`} className="grid grid-cols-[1.3fr_1.2fr_3.2fr_2fr_1.1fr] gap-0 px-6 py-5 hover:bg-slate-900/80">
                  <span className="text-sm text-slate-300">{row.time}</span>
                  <span className="text-sm font-semibold text-[#CBF3BB]">{row.tool}</span>
                  <span className="text-sm text-slate-100">{row.detail}</span>
                  <span className="text-sm text-slate-400">{row.rule}</span>
                  <span className="text-sm font-semibold text-white">
                    <span className={`inline-flex rounded-full px-3 py-1 ${row.status === "Allowed" ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"}`}>
                      {row.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
