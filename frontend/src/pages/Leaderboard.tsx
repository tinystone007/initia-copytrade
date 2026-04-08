import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTraders } from '../hooks/useTraders'
import { formatAmount, truncateAddress } from '../config/contracts'

type SortKey = 'volume' | 'trades' | 'followers'

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-7 h-7 rounded-lg rank-gold flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-amber-500/20">1</div>
  if (rank === 2) return <div className="w-7 h-7 rounded-lg rank-silver flex items-center justify-center text-xs font-bold text-slate-900 shadow-lg shadow-slate-400/20">2</div>
  if (rank === 3) return <div className="w-7 h-7 rounded-lg rank-bronze flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-amber-600/20">3</div>
  return <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs font-medium text-slate-500">{rank}</div>
}

export function Leaderboard() {
  const { traders, isLoading, traderCount } = useTraders()
  const [sortBy, setSortBy] = useState<SortKey>('volume')

  const sorted = [...traders].sort((a, b) => {
    if (sortBy === 'volume') return Number(b.totalVolume - a.totalVolume)
    if (sortBy === 'trades') return Number(b.totalTrades - a.totalTrades)
    return Number(b.followerCount - a.followerCount)
  })

  const totalVolume = traders.reduce((sum, t) => sum + t.totalVolume, 0n)

  const stats = [
    {
      icon: '\u{1F4CA}',
      label: 'Active Traders',
      value: traderCount,
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: '\u{1F4B0}',
      label: 'Total Volume',
      value: `$${formatAmount(totalVolume, 6)}`,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: '\u{1F465}',
      label: 'Total Followers',
      value: traders.reduce((sum, t) => sum + Number(t.followerCount), 0),
      gradient: 'from-cyan-500 to-indigo-500',
    },
  ]

  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          <span className="gradient-text">Top Traders</span>
        </h1>
        <p className="text-slate-400 text-lg">Follow the best traders and auto-mirror their strategies</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        {stats.map(stat => (
          <div key={stat.label} className="glass-card rounded-2xl p-5 relative overflow-hidden group">
            {/* Gradient top border */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.gradient}`} />
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-sm text-slate-400">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold gradient-text">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Sort pills */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mr-2">Sort by</span>
        {(['volume', 'trades', 'followers'] as SortKey[]).map(key => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              sortBy === key
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : 'bg-white/[0.03] text-slate-400 border border-transparent hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {key === 'volume' ? 'Volume' : key === 'trades' ? 'Trades' : 'Followers'}
          </button>
        ))}
      </div>

      {/* Trader list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card rounded-2xl p-5 shimmer h-20" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">{'\u{1F4AD}'}</div>
          <p className="text-slate-400 text-lg mb-2">No traders registered yet</p>
          <p className="text-slate-500 text-sm">Be the first to register and start trading!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((trader, i) => (
            <Link
              key={trader.address}
              to={`/trader/${trader.address}`}
              className="flex items-center glass-card rounded-2xl p-4 px-5 group hover:glow-indigo transition-all duration-300"
            >
              <div className="mr-4">
                <RankBadge rank={i + 1} />
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm mr-4 shadow-lg shadow-indigo-500/15 shrink-0">
                {(trader.initUsername || '?')[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0 mr-6">
                <div className="text-white font-semibold group-hover:text-indigo-400 transition-colors duration-200 truncate">
                  {trader.initUsername || truncateAddress(trader.address)}
                </div>
                <div className="text-xs text-slate-500 font-mono">{truncateAddress(trader.address)}</div>
              </div>

              <div className="grid grid-cols-3 gap-8 text-right shrink-0">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Volume</div>
                  <div className="text-white font-semibold text-sm">${formatAmount(trader.totalVolume, 6)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Trades</div>
                  <div className="text-white font-semibold text-sm">{trader.totalTrades.toString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Followers</div>
                  <div className="text-white font-semibold text-sm">{trader.followerCount.toString()}</div>
                </div>
              </div>

              <div className="ml-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
