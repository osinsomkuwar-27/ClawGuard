import { useEffect, useState } from "react"
import { api, type AccountInfo } from "@/lib/api"

const holdings = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Tech", qty: 10, avgCost: 178.2, price: 189.5, value: 1895, pnl: 113 },
  { ticker: "MSFT", name: "Microsoft", sector: "Tech", qty: 5, avgCost: 408.0, price: 421.3, value: 2107, pnl: 67 },
  { ticker: "NVDA", name: "Nvidia Corp.", sector: "Tech", qty: 4, avgCost: 880.0, price: 924.5, value: 3698, pnl: 178 },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "Health", qty: 8, avgCost: 158.4, price: 162.1, value: 1297, pnl: 30 },
  { ticker: "JPM", name: "JPMorgan Chase", sector: "Finance", qty: 6, avgCost: 196.0, price: 201.8, value: 1211, pnl: 35 },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Tech", qty: 3, avgCost: 192.0, price: 176.4, value: 529, pnl: -47 },
  { ticker: "SBUX", name: "Starbucks Corp.", sector: "Consumer", qty: 12, avgCost: 84.5, price: 81.1, value: 973, pnl: -41 },
]

const sectors = [
  { name: "Tech", color: "#93BFC7", value: 62 },
  { name: "Health", color: "#ABE7B2", value: 13 },
  { name: "Finance", color: "#CBF3BB", value: 12 },
  { name: "Consumer", color: "#ECF4E8", value: 9 },
  { name: "Cash", color: "#DDEAD4", value: 4 },
]

const totalPnl = holdings.reduce((sum, item) => sum + item.pnl, 0)
const openPositions = holdings.length

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

export default function PortfolioPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.account()
      .then(setAccount)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const portfolioValue = account
    ? parseFloat(account.portfolio_value)
    : holdings.reduce((sum, item) => sum + item.value, 0)

  const buyingPower = account
    ? parseFloat(account.buying_power)
    : 1240

  const accountStatus = account?.status ?? "paper"

  return (
    <main className="min-h-screen bg-[#ECF4E8] px-4 py-8 text-slate-900 sm:px-8 lg:px-12">
      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Portfolio</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Paper account · Alpaca</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">A minimal overview of your holdings, performance, and sector allocation.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#93BFC7]/15 px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-[#93BFC7]/35">
                {loading ? "…" : accountStatus}
              </span>
              <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-500/20">
                Market open
              </span>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-gradient-to-br from-[#CBF3BB] via-[#ECF4E8] to-white p-6 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-600">Portfolio value</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {loading ? "…" : formatCurrency(portfolioValue)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Live from Alpaca</p>
            </div>
            <div className="rounded-3xl bg-[#fffefc] p-6 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-600">Total P&amp;L</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">+{formatCurrency(totalPnl)}</p>
              <p className="mt-2 text-sm text-emerald-700">+9.05% since open</p>
            </div>
            <div className="rounded-3xl bg-[#fffefc] p-6 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-600">Open positions</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{openPositions}</p>
              <p className="mt-2 text-sm text-slate-500">5 profit · 2 loss</p>
            </div>
            <div className="rounded-3xl bg-[#fffefc] p-6 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-600">Buying power</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {loading ? "…" : formatCurrency(buyingPower)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Ready to deploy</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_30px_70px_-42px_rgba(15,23,42,0.14)] backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Holdings</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Your current positions</h2>
              </div>
              <button className="rounded-full border border-slate-300/80 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                Sort: P&amp;L
              </button>
            </div>
            <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-[#F7FCF6] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Ticker</th>
                    <th className="px-6 py-4">Sector</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Avg cost</th>
                    <th className="px-6 py-4">Mkt price</th>
                    <th className="px-6 py-4">Value</th>
                    <th className="px-6 py-4">P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {holdings.map((item) => (
                    <tr key={item.ticker} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.ticker}</td>
                      <td className="px-6 py-4 text-slate-600">{item.sector}</td>
                      <td className="px-6 py-4 text-slate-600">{item.qty}</td>
                      <td className="px-6 py-4 text-slate-600">{formatCurrency(item.avgCost)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatCurrency(item.price)}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(item.value)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.pnl >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {item.pnl >= 0 ? "+" : ""}{formatCurrency(item.pnl)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_30px_70px_-42px_rgba(15,23,42,0.14)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Sector allocation</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">By market value</h2>
              </div>
              <div className="rounded-full bg-[#CBF3BB]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-800">Active</div>
            </div>
            <div className="mt-8 space-y-6">
              <div className="flex h-5 overflow-hidden rounded-full border border-slate-200 bg-[#F8FCF7]">
                {sectors.map((sector) => (
                  <div key={sector.name} className="h-full" style={{ width: `${sector.value}%`, backgroundColor: sector.color }} />
                ))}
              </div>
              <div className="space-y-3">
                {sectors.map((sector) => (
                  <div key={sector.name} className="flex items-center justify-between gap-4 rounded-3xl bg-slate-50/70 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: sector.color }} />
                      <p className="text-sm font-medium text-slate-800">{sector.name}</p>
                    </div>
                    <span className="text-sm text-slate-600">{sector.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
} 