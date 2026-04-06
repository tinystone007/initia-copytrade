import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTraders } from '../hooks/useTraders'
import { formatAmount, truncateAddress } from '../config/contracts'

type SortKey = 'volume' | 'trades' | 'followers'

export function Leaderboard() {
  const { traders, isLoading, traderCount } = useTraders()
  const [sortBy, setSortBy] = useState<SortKey>('volume')

  const sorted = [...traders].sort((a, b) => {
    if (sortBy === 'volume') return Number(b.totalVolume - a.totalVolume)
    if (sortBy === 'trades') return Number(b.totalTrades - a.totalTrades)
    return Number(b.followerCount - a.followerCount)
  })

  const totalVolume = traders.reduce((sum, t) => sum + t.totalVolume, 0n)

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Top Traders</h1>
      <p className="text-gray-400 mb-8">Follow the best traders and auto-mirror their strategies</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="text-sm text-gray-400">Total Traders</div>
          <div className="text-2xl font-bold text-white mt-1">{traderCount}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="text-sm text-gray-400">Total Volume</div>
          <div className="text-2xl font-bold text-white mt-1">${formatAmount(totalVolume, 6)}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="text-sm text-gray-400">Total Followers</div>
          <div className="text-2xl font-bold text-white mt-1">
            {traders.reduce((sum, t) => sum + Number(t.followerCount), 0)}
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-4">
        {(['volume', 'trades', 'followers'] as SortKey[]).map(key => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              sortBy === key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            {key === 'volume' ? 'Volume' : key === 'trades' ? 'Trades' : 'Followers'}
          </button>
        ))}
      </div>

      {/* Trader list */}
      {isLoading ? (
        <div className="text-gray-400 py-12 text-center">Loading traders...</div>
      ) : sorted.length === 0 ? (
        <div className="text-gray-400 py-12 text-center">No traders registered yet</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((trader, i) => (
            <Link
              key={trader.address}
              to={`/trader/${trader.address}`}
              className="flex items-center bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-indigo-500/50 transition group"
            >
              <div className="w-8 text-gray-500 font-mono text-sm">#{i + 1}</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-4">
                {(trader.initUsername || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium group-hover:text-indigo-400 transition">
                  {trader.initUsername || truncateAddress(trader.address)}
                </div>
                <div className="text-sm text-gray-500">{truncateAddress(trader.address)}</div>
              </div>
              <div className="text-right mr-8">
                <div className="text-sm text-gray-400">Volume</div>
                <div className="text-white font-medium">${formatAmount(trader.totalVolume, 6)}</div>
              </div>
              <div className="text-right mr-8">
                <div className="text-sm text-gray-400">Trades</div>
                <div className="text-white font-medium">{trader.totalTrades.toString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Followers</div>
                <div className="text-white font-medium">{trader.followerCount.toString()}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
