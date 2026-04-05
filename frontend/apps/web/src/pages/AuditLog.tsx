import { useMemo, useState } from "react"

type DecisionStatus = "Allowed" | "Blocked"
type FilterOption = "All" | "Allowed" | "Blocked" | "Verified only"

type AuditEntry = {
  timestamp: string
  status: DecisionStatus
  tool: string
  detail: string
  rule: string
  hmac: string
  verified: boolean
}

const filters: FilterOption[] = ["All", "Allowed", "Blocked", "Verified only"]

const entries: AuditEntry[] = [
  {
    timestamp: "06-11 12:04:31",
    status: "Blocked",
    tool: "place_order",
    detail: "BUY 50 NVDA @market",
    rule: "max-order-size",
    hmac: "sha256:4a8d3f_c291",
    verified: true,
  },
  {
    timestamp: "06-11 12:04:28",
    status: "Allowed",
    tool: "get_portfolio",
    detail: "Read positions snapshot",
    rule: "-",
    hmac: "sha256:7f3a1b_e804",
    verified: true,
  },
  {
    timestamp: "06-11 12:04:22",
    status: "Allowed",
    tool: "place_order",
    detail: "BUY 10 AAPL @limit 189.5",
    rule: "no-meme-stocks",
    hmac: "sha256:9cfa0d_4b2e",
    verified: true,
  },
  {
    timestamp: "06-11 12:04:17",
    status: "Allowed",
    tool: "cancel_order",
    detail: "Cancel order #8812-B",
    rule: "-",
    hmac: "sha256:12d8f1_3a9c",
    verified: false,
  },
  {
    timestamp: "06-11 12:04:09",
    status: "Blocked",
    tool: "place_order",
    detail: "SELL 200 TSLA @market",
    rule: "max-order-size",
    hmac: "sha256:71f8c4_0a5b",
    verified: true,
  },
  {
    timestamp: "06-11 12:04:02",
    status: "Allowed",
    tool: "get_quote",
    detail: "Fetch MSFT price",
    rule: "-",
    hmac: "sha256:2d7a9b_6c1f",
    verified: true,
  },
  {
    timestamp: "06-11 12:03:55",
    status: "Blocked",
    tool: "place_order",
    detail: "BUY 100 GME @market",
    rule: "no-meme-stocks",
    hmac: "sha256:8c3d5e_2f7a",
    verified: false,
  },
  {
    timestamp: "06-11 12:03:41",
    status: "Allowed",
    tool: "get_portfolio",
    detail: "Read positions snapshot",
    rule: "-",
    hmac: "sha256:1b2c3d_4e5f",
    verified: true,
  },
  {
    timestamp: "06-11 12:03:29",
    status: "Blocked",
    tool: "place_order",
    detail: "BUY 500 AMD @market",
    rule: "max-order-size",
    hmac: "sha256:3f4d5a_7b8c",
    verified: false,
  },
]

const statusStyles = {
  Allowed: "bg-[#CBF3BB] text-slate-900",
  Blocked: "bg-[#FECACA] text-slate-900",
}

export default function AuditLogPage() {
  const [filter, setFilter] = useState("All")

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filter === "All") return true
      if (filter === "Verified only") return entry.verified
      return entry.status === filter
    })
  }, [filter])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filteredEntries, null, 2)], {
      type: "application/json",
    })
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
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
                Audit log
              </p>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                All enforcement decisions — session 2024-06-11
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Review the latest policy decision history with status, rule triggers, and verification state in a calm, pastel dashboard.
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
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
                Total decisions
              </p>
              <p className="mt-4 text-4xl font-semibold text-slate-950">9</p>
              <p className="mt-2 text-sm text-slate-700">Full session history with status and verified metadata.</p>
            </div>
            <div className="rounded-[1.75rem] bg-[#ABE7B2] p-6 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
                Allowed
              </p>
              <p className="mt-4 text-4xl font-semibold text-slate-950">5</p>
              <p className="mt-2 text-sm text-slate-700">Approved actions that passed policy checks.</p>
            </div>
            <div className="rounded-[1.75rem] bg-[#93BFC7] p-6 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-950">
                Blocked
              </p>
              <p className="mt-4 text-4xl font-semibold text-slate-950">4</p>
              <p className="mt-2 text-sm text-slate-950">Actions blocked by active enforcement rules.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                Audit entries
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Recent decisions</h2>
            </div>
            <p className="text-sm text-slate-500">Showing {filteredEntries.length} of {entries.length} entries</p>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-[#ECF4E8] text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Timestamp</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Status</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Tool</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Detail</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">Rule</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-[0.18em]">HMAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredEntries.map((entry, index) => (
                  <tr key={`${entry.tool}-${entry.timestamp}-${index}`} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{entry.timestamp}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[entry.status]}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">{entry.tool}</td>
                    <td className="px-4 py-4 text-slate-600">{entry.detail}</td>
                    <td className="px-4 py-4 text-slate-600">{entry.rule}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-mono text-xs text-slate-500">{entry.hmac}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${entry.verified ? "bg-[#CBF3BB] text-slate-900" : "bg-slate-100 text-slate-600"}`}>
                          {entry.verified ? "Verified" : "Check"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
