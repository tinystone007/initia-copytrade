import { useState } from 'react'
import { useAccount, useReadContracts } from 'wagmi'
import { Link } from 'react-router-dom'
import { useTraderInfo } from '../hooks/useTraderInfo'
import { useTraders } from '../hooks/useTraders'
import { useRegisterTrader, useUnfollowTrader, useWithdrawBalance } from '../hooks/useCopyTrade'
import { COPY_TRADE_ROUTER_ABI } from '../config/abis'
import { CONTRACTS, TOKENS, formatAmount, truncateAddress } from '../config/contracts'

function FollowerPosition({ trader, followerAddr }: { trader: `0x${string}`; followerAddr: `0x${string}` }) {
  const { traderInfo } = useTraderInfo(trader)
  const { unfollow, isPending: unfollowing } = useUnfollowTrader()
  const { withdraw, isPending: withdrawing } = useWithdrawBalance()

  // Batch read balances for all tokens
  const balanceCalls = TOKENS.map(token => ({
    address: CONTRACTS.router as `0x${string}`,
    abi: COPY_TRADE_ROUTER_ABI,
    functionName: 'getFollowerBalance' as const,
    args: [followerAddr, trader, token.address] as const,
  }))

  const { data: balanceResults } = useReadContracts({
    contracts: balanceCalls,
    query: { refetchInterval: 5000 },
  })

  const balances = TOKENS.map((token, i) => ({
    token,
    balance: (balanceResults?.[i]?.result as bigint) ?? 0n,
  }))

  const hasBalance = balances.some(b => b.balance > 0n)

  const TOKEN_COLORS: Record<string, string> = {
    USDC: 'from-blue-400 to-blue-600',
    WINIT: 'from-purple-400 to-purple-600',
    WETH: 'from-cyan-400 to-cyan-600',
  }

  return (
    <div className="glass-card rounded-2xl p-5 hover:glow-indigo transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <Link to={`/trader/${trader}`} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/15">
            {(traderInfo?.initUsername || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-white font-medium group-hover:text-indigo-400 transition-colors duration-200">{traderInfo?.initUsername || truncateAddress(trader)}</div>
            <div className="text-xs text-slate-500 font-mono">{truncateAddress(trader)}</div>
          </div>
        </Link>
        <button
          onClick={() => unfollow(trader)}
          disabled={unfollowing}
          className="text-sm text-slate-500 hover:text-red-400 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
        >
          {unfollowing ? 'Unfollowing...' : 'Unfollow'}
        </button>
      </div>

      {hasBalance ? (
        <div className="space-y-2">
          {balances.filter(b => b.balance > 0n).map(({ token, balance }) => (
            <div key={token.symbol} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.04] rounded-xl p-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${TOKEN_COLORS[token.symbol] || 'from-slate-400 to-slate-600'} flex items-center justify-center text-[10px] font-bold text-white`}>
                  {token.symbol[0]}
                </div>
                <div>
                  <span className="text-white font-medium">{formatAmount(balance, token.decimals)}</span>
                  <span className="text-slate-400 ml-2 text-sm">{token.symbol}</span>
                </div>
              </div>
              <button
                onClick={() => withdraw(trader, token.address)}
                disabled={withdrawing}
                className="text-xs font-medium bg-white/[0.06] hover:bg-indigo-500/15 hover:text-indigo-400 text-slate-300 px-3.5 py-2 rounded-lg transition-all duration-200 border border-white/[0.06] hover:border-indigo-500/20"
              >
                Withdraw
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <span className="text-slate-500 text-sm">No balances -- waiting for leader to trade</span>
        </div>
      )}
    </div>
  )
}

export function Dashboard() {
  const { address } = useAccount()
  const { traderInfo } = useTraderInfo(address)
  const { traders } = useTraders()
  const { register, isPending: registering, isSuccess: registered } = useRegisterTrader()
  const [username, setUsername] = useState('')

  // Batch check which traders we're following
  const followCalls = traders.map(t => ({
    address: CONTRACTS.router as `0x${string}`,
    abi: COPY_TRADE_ROUTER_ABI,
    functionName: 'isFollowing' as const,
    args: [address!, t.address] as const,
  }))

  const { data: followResults } = useReadContracts({
    contracts: followCalls,
    query: { enabled: !!address && traders.length > 0 },
  })

  const followedTraders = traders.filter((_, i) => followResults?.[i]?.result === true)

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M2 10h20" />
            <path d="M6 14h2" />
            <path d="M12 14h6" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-slate-400 mb-6">Connect your wallet to view your positions</p>
        <div className="w-16 h-[2px] rounded bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-10">
        <span className="gradient-text">Dashboard</span>
      </h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* My Trader Profile */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">{'\u{1F464}'}</span>
            <h2 className="text-lg font-semibold text-white">My Trader Profile</h2>
          </div>

          {traderInfo?.isActive ? (
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Gradient banner */}
              <div className="h-20 bg-gradient-to-r from-indigo-600/40 via-purple-600/30 to-cyan-600/20 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
              </div>

              <div className="px-5 pb-5 -mt-8">
                <div className="flex items-end gap-3 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 via-purple-500 to-cyan-400 flex items-center justify-center text-white text-lg font-bold shadow-xl shadow-indigo-500/20 border-2 border-[#0f172a]">
                    {traderInfo.initUsername[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="pb-0.5">
                    <div className="text-white font-semibold">{traderInfo.initUsername}</div>
                    <div className="text-xs text-slate-500">Registered Trader</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Trades', value: traderInfo.totalTrades.toString(), icon: '\u{1F4C8}' },
                    { label: 'Volume', value: `$${formatAmount(traderInfo.totalVolume, 6)}`, icon: '\u{1F4B0}' },
                    { label: 'Followers', value: traderInfo.followerCount.toString(), icon: '\u{1F465}' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/[0.04] rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-500 mb-1">{stat.icon} {stat.label}</div>
                      <div className="text-lg font-bold text-white">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium">Become a Trader</div>
                  <div className="text-xs text-slate-500">Register to let others copy your trades</div>
                </div>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your-name.init"
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-600 outline-none focus:border-indigo-500/40 transition-colors duration-200"
                />
                <button
                  onClick={() => register(username)}
                  disabled={!username || registering}
                  className="gradient-btn text-white px-6 py-2.5 rounded-xl font-medium text-sm"
                >
                  {registering ? 'Registering...' : registered ? 'Registered!' : 'Register'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Placeholder for two-col balance on right side */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">{'\u{1F4CA}'}</span>
            <h2 className="text-lg font-semibold text-white">Quick Stats</h2>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{'\u{1F4C8}'}</div>
                <div className="text-2xl font-bold gradient-text">{followedTraders.length}</div>
                <div className="text-xs text-slate-500 mt-1">Following</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{'\u{2B50}'}</div>
                <div className="text-2xl font-bold gradient-text">{traderInfo?.isActive ? 'Active' : 'Inactive'}</div>
                <div className="text-xs text-slate-500 mt-1">Trader Status</div>
              </div>
            </div>
            {!traderInfo?.isActive && followedTraders.length === 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.04] text-center">
                <p className="text-sm text-slate-500">Start by following traders or registering as one</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copy positions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">{'\u{1F4BC}'}</span>
          <h2 className="text-lg font-semibold text-white">My Copy Positions</h2>
        </div>

        {followedTraders.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-slate-400 mb-2 text-lg">No active positions</p>
            <p className="text-slate-500 text-sm mb-5">Follow a trader to automatically copy their strategies</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 gradient-btn text-white px-6 py-2.5 rounded-xl font-medium text-sm"
            >
              Browse Traders
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {followedTraders.map(t => (
              <FollowerPosition key={t.address} trader={t.address} followerAddr={address} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
