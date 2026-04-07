import { useEffect, useState } from "react"
import { api, type AuditLog, type AccountInfo } from "@/lib/api"

const staticPolicies = [
  { label: "Max order size", description: "Block trades > $5,000", active: true },
  { label: "No meme stocks", description: "Block AMC, GME, BBY...", active: true },
  { label: "Market hours only", description: "9:30 AM – 4:00 PM ET", active: true },
  { label: "Max daily loss", description: "Pause if P&L < -$500", active: true },
  { label: "Short selling", description: "Allow short positions", active: false },
  { label: "Options trading", description: "Allow options contracts", active: false },
]

export default function OverviewPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([api.logs(20), api.account()]).then(([logsRes, accountRes]) => {
      if (logsRes.status === "fulfilled") setLogs(logsRes.value.logs)
      if (accountRes.status === "fulfilled") setAccount(accountRes.value)
      setLoading(false)
    })
  }, [])

  const recentActions = logs.slice(0, 5)
  const allowedCount = logs.filter((l) => l.allowed).length
  const blockedCount = logs.filter((l) => !l.allowed).length
  const approvalRate = logs.length ? Math.round((allowedCount / logs.length) * 100) : 0
  const lastBlocked = logs.find((l) => !l.allowed)

  const portfolioValue = account
    ? `$${parseFloat(account.portfolio_value).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : loading ? "…" : "$—"

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <div className="flex w-full flex-col gap-8">
        <section className="w-full">
          <div className="text-center">
            <div className="mx-auto max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Enforcement overview
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Stay ahead with minimal, signal-forward insights.
              </h1>
              <p className="mt-4 mx-auto max-w-2xl text-base leading-7 text-slate-600">
                A calm dashboard that highlights risk, approval throughput, and the latest policy decisions in a clean, refreshingly simple layout.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
              <div className="rounded-3xl bg-white p-4 text-slate-900 shadow-sm ring-1 ring-slate-200/70">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Total actions</p>
                <p className="mt-3 text-3xl font-semibold">{loading ? "…" : logs.length}</p>
              </div>
              <div className="rounded-3xl bg-[#CBF3BB] p-4 text-slate-900 shadow-sm ring-1 ring-slate-200/70">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Allowed</p>
                <p className="mt-3 text-3xl font-semibold">{loading ? "…" : allowedCount}</p>
              </div>
              <div className="rounded-3xl bg-[#ABE7B2] p-4 text-slate-900 shadow-sm ring-1 ring-slate-200/70">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Blocked</p>
                <p className="mt-3 text-3xl font-semibold">{loading ? "…" : blockedCount}</p>
              </div>
              <div className="rounded-3xl bg-[#93BFC7] p-4 text-slate-950 shadow-sm ring-1 ring-slate-200/70">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-700">Portfolio value</p>
                <p className="mt-3 text-3xl font-semibold">{portfolioValue}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/50 bg-white/80 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Live enforcement feed</h2>
                  <p className="mt-1 text-sm text-slate-500">Auto-refreshing insights from recent policy decisions.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                  live
                </span>
              </div>
              <div className="mt-6 grid gap-3 w-full">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-slate-400 text-sm">Loading feed…</div>
                ) : recentActions.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">No recent actions.</div>
                ) : (
                  recentActions.map((entry) => {
                    const status = entry.allowed ? "Allowed" : "Blocked"
                    return (
                      <div key={entry.id} className="rounded-3xl border border-slate-200/90 bg-slate-50 p-4 text-slate-900 shadow-sm w-full">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-700">{entry.event_type}</p>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "Allowed" ? "bg-[#CBF3BB] text-emerald-900" : "bg-[#FECACA] text-rose-900"}`}>
                            {status}
                          </span>
                        </div>
                        <p className="mt-2 text-base text-slate-800">
                          {entry.action} {entry.ticker ? `· ${entry.ticker}` : ""}
                          {entry.amount ? ` · $${entry.amount}` : ""}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">{new Date(entry.timestamp).toLocaleTimeString()}</p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/50 bg-[#93BFC7]/20 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Snapshot</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                  <p className="text-sm text-slate-500">Policy violations</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">{loading ? "…" : blockedCount}</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                  <p className="text-sm text-slate-500">Approval rate</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">{loading ? "…" : `${approvalRate}%`}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/50 bg-white/85 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Last decision</h2>
                  <p className="mt-1 text-sm text-slate-500">Most recent blocked action and trigger detail.</p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-rose-800">
                  Blocked
                </span>
              </div>
              <div className="mt-6 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200/80">
                {loading ? (
                  <p className="text-sm text-slate-400">Loading…</p>
                ) : lastBlocked ? (
                  <>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">{lastBlocked.event_type}</p>
                    <h3 className="mt-3 text-lg font-semibold text-slate-950">
                      {lastBlocked.action} {lastBlocked.ticker ? `${lastBlocked.ticker}` : ""}
                      {lastBlocked.reason ? ` — ${lastBlocked.reason}` : ""}
                    </h3>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      {lastBlocked.policy_id && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">{lastBlocked.policy_id}</span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        {new Date(lastBlocked.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">No blocked actions found.</p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/50 bg-[#93BFC7]/20 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Active policies</h2>
              <div className="mt-5 space-y-3">
                {staticPolicies.map((policy) => (
                  <div key={policy.label} className={`rounded-3xl border p-4 ${policy.active ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{policy.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{policy.description}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${policy.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                        {policy.active ? "On" : "Off"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}