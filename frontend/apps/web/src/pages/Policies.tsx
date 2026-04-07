interface Policy {
  title: string
  icon: string
  severity: string
  name: string
  description: string
  rule: string
  enforcement: string
  allowed?: string
}

const policies: Policy[] = [
  {
    title: "No Data Exfiltration",
    icon: "",
    severity: "Critical",
    name: "no_data_exfiltration",
    description:
      "Agents must never transmit portfolio, account, or sensitive financial data to any external system or third-party service.",
    rule: "Any action involving data export, transmission, or webhooks is strictly blocked.",
    enforcement: "BLOCK",
  },
  {
    title: "Prompt Injection Guard",
    icon: "",
    severity: "Critical",
    name: "prompt_injection_guard",
    description: "Prevents malicious or manipulated prompts from influencing trading decisions.",
    rule: "Trades containing suspicious phrases like “SYSTEM OVERRIDE”, “BYPASS”, or similar injection patterns are blocked.",
    enforcement: "BLOCK",
  },
  {
    title: "Trade Scope Restriction",
    icon: "",
    severity: "High",
    name: "trade_scope",
    description: "Ensures the agent operates only within permitted trading actions.",
    rule: "Only BUY, SELL, and RESEARCH actions are allowed.",
    enforcement: "Any other action is blocked.",
  },
  {
    title: "Ticker Allowlist",
    icon: "",
    severity: "High",
    name: "ticker_allowlist",
    description: "Restricts trading to a predefined set of approved stocks.",
    rule: "Any ticker outside AAPL, MSFT, GOOGL is blocked.",
    enforcement: "BLOCK",
    allowed: "AAPL, MSFT, GOOGL",
  },
  {
    title: "Meme Stock Block",
    icon: "",
    severity: "High",
    name: "meme_stock_block",
    description: "Prevents trading in volatile or hype-driven “meme stocks.”",
    rule: "Any trade involving GME, AMC, DOGE, BBBY, WISH, SPCE is blocked regardless of other conditions.",
    enforcement: "BLOCK",
    allowed: "GME, AMC, DOGE, BBBY, WISH, SPCE",
  },
  {
    title: "Maximum Trade Size",
    icon: "",
    severity: "High",
    name: "max_trade_size",
    description: "Limits the monetary value of individual trades to reduce risk exposure.",
    rule: "No single trade may exceed $500 total value.",
    enforcement: "Trades above this limit are blocked.",
  },
  {
    title: "Portfolio Exposure Limit",
    icon: "",
    severity: "High",
    name: "portfolio_exposure",
    description: "Ensures diversification by limiting concentration in a single stock.",
    rule: "No stock may exceed 20% of total portfolio value.",
    enforcement: "Trades exceeding this threshold are blocked.",
  },
  {
    title: "Rationale Requirement",
    icon: "",
    severity: "Medium",
    name: "rationale_required",
    description: "Every trade must include a meaningful justification.",
    rule: "Rationale must contain at least 4 words.",
    enforcement: "Trades without sufficient explanation are blocked.",
  },
  {
    title: "Trading Hours Enforcement",
    icon: "",
    severity: "High",
    name: "trading_hours",
    description: "Ensures trades are executed only during official market hours.",
    rule: "Trades are allowed only between 9:30 AM – 4:00 PM (ET).",
    enforcement: "Trades outside this window are blocked.",
  },
  {
    title: "No Scope Escalation",
    icon: "",
    severity: "Critical",
    name: "no_scope_escalation",
    description: "Prevents agents from requesting or executing actions beyond their assigned permissions.",
    rule: "Any attempt to exceed research, trade_paper, or read_portfolio permissions is blocked.",
    enforcement: "BLOCK",
    allowed: "research, trade_paper, read_portfolio",
  },
  {
    title: "Paper Trading Only",
    icon: "",
    severity: "Critical",
    name: "paper_trading_only",
    description: "Ensures all trades are executed in a safe, simulated environment.",
    rule: "Live trading environments are strictly prohibited.",
    enforcement: "BLOCK",
    allowed: "paper, simulation, test",
  },
]

const summary = [
  { label: "Total policies", value: 11 },
  { label: "Critical", value: 4 },
  { label: "High", value: 5 },
  { label: "Medium", value: 1 },
]

export default function PoliciesPage() {
  return (
    <main className="min-h-screen bg-[#eef8f0] text-slate-900">
      <div className="grid min-h-screen grid-cols-1">
        <div className="flex flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10">
          <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">ClawGuard Policy Framework</p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                  Policy dashboard v2.0
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Centralized enforcement for safe trading: clear controls, explicit rules, and risk-aware execution policy definitions.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Add policy
                </button>
                <button className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  Export rules
                </button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <div key={item.label} className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">{item.label}</p>
                <p className="mt-4 text-3xl font-semibold text-slate-950">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">Policy rules</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Enforcement matrix</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  All 11 policies are active and configured to keep trading within safe boundaries, from data protection to scope and environment restrictions.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Active • 11 rules
              </span>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-4 text-left">
                <thead>
                  <tr>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Policy</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Severity</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Rule</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Enforcement</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Allowed</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => (
                    <tr key={policy.name} className="rounded-[1.75rem] bg-slate-50 shadow-sm">
                      <td className="py-5 pr-6">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{policy.icon}</span>
                          <div>
                            <div className="text-base font-semibold text-slate-950">{policy.title}</div>
                            <div className="text-sm text-slate-500">{policy.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 pr-6 text-sm font-semibold text-slate-800">{policy.severity}</td>
                      <td className="py-5 pr-6 text-sm text-slate-600">{policy.rule}</td>
                      <td className="py-5 pr-6 text-sm font-semibold text-emerald-700">{policy.enforcement}</td>
                      <td className="py-5 text-sm text-slate-600">{policy.allowed ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
