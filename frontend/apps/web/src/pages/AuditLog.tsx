import { useMemo, useState, useEffect } from "react"
import { api, type AuditLog } from "@/lib/api"

type FilterOption = "All" | "Allowed" | "Blocked"

const filters: FilterOption[] = ["All", "Allowed", "Blocked"]

const statusStyles = {
  Allowed: "bg-[#CBF3BB] text-slate-900",
  Blocked: "bg-[#FECACA] text-slate-900",
}

function formatTimestamp(ts: string) {
  try {
    const d = new Date(ts)
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const hh = String(d.getHours()).padStart(2, "0")
    const min = String(d.getMinutes()).padStart(2, "0")
    const ss = String(d.getSeconds()).padStart(2, "0")
    return `${mm}-${dd} ${hh}:${min}:${ss}`
  } catch {
    return ts
  }
}

export default function AuditLogPage() {
  const [filter, setFilter] = useState<FilterOption>("All")
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.logs(100)
      .then((res) => setLogs(res.logs))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load logs"))
      .finally(() => setLoading(false))
  }, [])

  const filteredEntries = useMemo(() => {
    return logs.filter((entry) => {
      if (filter === "All") return true
      const status = entry.allowed ? "Allowed" : "Blocked"
      return status === filter
    })
  }, [filter, logs])

  const allowedCount = logs.filter((l) => l.allowed).length
  const blockedCount = logs.filter((l) => !l.allowed).length

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filteredEntries, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "audit-log.json"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-[#ECF4E8] px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.2)] backdrop-blur-md">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Audit log</p>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                All enforcement decisions
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Review the latest policy decision history with status, rule triggers, and verification state.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      filter === item
                        ? "border-slate-300 bg-slate-950 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={exportJson}
                className="inline-flex items-center justify-center rounded-full bg-[#93BFC7] px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-[#7ba2b4]"
              >
                Export JSON
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] bg-[#CBF3BB] p-6 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">Total decisions</p>
              <p className="mt-4 text-4xl font-semibold text-slate-950">{logs.length}</p>
              <p className="mt-2 text-sm text-slate-700">Full session history with status metadata.</p>
            </div>
            <div className="rounded-[1.75rem] bg-[#ABE7B2] p-6 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">Allowed</p>
              <p className="mt-4 text-4xl font-semibold text-slate-950">{allowedCount}</p>
              <p className="mt-2 text-sm text-slate-700">Approved actions that passed policy checks.</p>
            </div>
            <div className="rounded-[1.75rem] bg-[#93BFC7] p-6 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-950">Blocked</p>
              <p className="mt-4 text-4xl font-semibold text-slate-950">{blockedCount}</p>
              <p className="mt-2 text-sm text-slate-950">Actions blocked by active enforcement rules.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Audit entries</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Recent decisions</h2>
            </div>
            <p className="text-sm text-slate-500">
              Showing {filteredEntries.length} of {logs.length} entries
            </p>
          </div>

          <div className="mt-6 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <svg className="mr-3 h-5 w-5 animate-spin text-[#93BFC7]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading logs…
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">No entries match the selected filter.</div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-[#ECF4E8] text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Timestamp</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Status</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Event</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Ticker</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Action</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Policy</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredEntries.map((entry) => {
                    const status = entry.allowed ? "Allowed" : "Blocked"
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-slate-700 whitespace-nowrap">{formatTimestamp(entry.timestamp)}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-900">{entry.event_type}</td>
                        <td className="px-4 py-4 text-slate-700 font-mono">{entry.ticker || "—"}</td>
                        <td className="px-4 py-4 text-slate-600">{entry.action}</td>
                        <td className="px-4 py-4 text-slate-600">{entry.policy_id || "—"}</td>
                        <td className="px-4 py-4 text-slate-500 max-w-xs truncate">{entry.reason || "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}