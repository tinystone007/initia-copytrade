import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useTraderInfo, useFollowers, useIsFollowing } from '../hooks/useTraderInfo'
import { useTokenBalance, useAllowance } from '../hooks/useTokenBalance'
import { TOKENS, CONTRACTS, formatAmount, truncateAddress, parseAmount } from '../config/contracts'
import type { TokenInfo } from '../config/contracts'
import { ERC20_ABI, COPY_TRADE_ROUTER_ABI } from '../config/abis'

export function TraderProfile() {
  const { address: traderAddr } = useParams<{ address: string }>()
  const trader = traderAddr as `0x${string}`
  const { address: myAddr } = useAccount()
  const { traderInfo, isLoading } = useTraderInfo(trader)
  const { data: followers } = useFollowers(trader)
  const { data: isFollowingTrader } = useIsFollowing(myAddr, trader)

  const [selectedToken, setSelectedToken] = useState<TokenInfo>(TOKENS[0])
  const [depositAmount, setDepositAmount] = useState('')
  const { data: tokenBalance } = useTokenBalance(selectedToken.address, myAddr)
  const { data: currentAllowance } = useAllowance(selectedToken.address, myAddr, CONTRACTS.router)

  const amount = depositAmount ? parseAmount(depositAmount, selectedToken.decimals) : 0n
  const needsApproval = amount > 0n && (currentAllowance ?? 0n) < amount

  const { writeContract: doApprove, data: approveHash, isPending: approving } = useWriteContract()
  const { isSuccess: approved } = useWaitForTransactionReceipt({ hash: approveHash })
  const { writeContract: doFollow, data: followHash, isPending: following } = useWriteContract()
  const { isLoading: confirmingFollow, isSuccess: followed } = useWaitForTransactionReceipt({ hash: followHash })

  function handleFollow() {
    if (needsApproval && !approved) {
      doApprove({
        address: selectedToken.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.router, amount],
      })
      return
    }

    doFollow({
      address: CONTRACTS.router,
      abi: COPY_TRADE_ROUTER_ABI,
      functionName: 'followTrader',
      args: [trader, selectedToken.address, amount],
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="glass-card rounded-2xl p-6 shimmer h-48" />
      </div>
    )
  }

  if (!traderInfo?.isActive) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          <span className="gradient-text">Trader Not Found</span>
        </h1>
        <p className="text-slate-400">This address is not a registered trader</p>
      </div>
    )
  }

  const registeredDate = new Date(Number(traderInfo.registeredAt) * 1000).toLocaleDateString()
  const followerList = followers as `0x${string}`[] | undefined
  const followerCount = followerList?.length ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero trader card */}
      <div className="glass-card rounded-3xl overflow-hidden mb-6 glow-indigo">
        {/* Gradient header */}
        <div className="h-28 bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-cyan-600/15 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        </div>

        <div className="px-6 pb-6 -mt-12">
          {/* Avatar + name */}
          <div className="flex items-end gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 via-purple-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/25 border-4 border-[rgba(15,23,42,0.8)]">
              {traderInfo.initUsername[0]?.toUpperCase() || '?'}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-white">{traderInfo.initUsername}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="font-mono">{truncateAddress(trader)}</span>
                <span className="text-slate-600">{'\u{2022}'}</span>
                <span>Since {registeredDate}</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Trades', value: traderInfo.totalTrades.toString(), icon: '\u{1F4C8}', gradient: 'from-indigo-500 to-purple-500' },
              { label: 'Volume', value: `$${formatAmount(traderInfo.totalVolume, 6)}`, icon: '\u{1F4B0}', gradient: 'from-purple-500 to-pink-500' },
              { label: 'Followers', value: traderInfo.followerCount.toString(), icon: '\u{1F465}', gradient: 'from-cyan-500 to-indigo-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.04] rounded-2xl p-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.gradient}`} />
                <div className="text-xs text-slate-500 mb-1">{stat.icon} {stat.label}</div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Follow section */}
      {myAddr && myAddr.toLowerCase() !== trader.toLowerCase() && (
        <div className="glass-card rounded-3xl p-6 mb-6">
          {isFollowingTrader ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="text-emerald-400 font-semibold mb-1">You are following this trader</div>
              <p className="text-sm text-slate-500">Your positions are shown in your Dashboard</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-lg">{'\u{1F91D}'}</span>
                <h2 className="text-lg font-semibold text-white">Follow & Deposit</h2>
              </div>

              {/* Token selector pills */}
              <div className="flex gap-2 mb-4">
                {TOKENS.map(t => (
                  <button
                    key={t.symbol}
                    onClick={() => setSelectedToken(t)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedToken.symbol === t.symbol
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                        : 'bg-white/[0.04] text-slate-400 border border-transparent hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      t.symbol === 'USDC' ? 'bg-blue-400' : t.symbol === 'WINIT' ? 'bg-purple-400' : 'bg-cyan-400'
                    }`} />
                    {t.symbol}
                  </button>
                ))}
              </div>

              {/* Amount input */}
              <div className="mb-4">
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 focus-within:border-indigo-500/30 transition-colors duration-200">
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="Amount to deposit"
                    className="flex-1 bg-transparent text-white text-lg placeholder-slate-600 outline-none"
                  />
                  <span className="text-sm text-slate-400 font-medium">{selectedToken.symbol}</span>
                </div>
              </div>

              {tokenBalance !== undefined && (
                <div className="flex items-center justify-between text-sm text-slate-500 mb-5 px-1">
                  <span>Available Balance</span>
                  <span className="font-medium text-slate-300">{formatAmount(tokenBalance as bigint, selectedToken.decimals)} {selectedToken.symbol}</span>
                </div>
              )}

              <button
                onClick={handleFollow}
                disabled={amount <= 0n || following || confirmingFollow}
                className="w-full gradient-btn text-white py-3.5 rounded-2xl font-semibold text-sm tracking-wide"
              >
                {needsApproval && !approved
                  ? approving ? 'Approving...' : 'Approve'
                  : following || confirmingFollow
                  ? 'Following...'
                  : followed
                  ? 'Followed!'
                  : 'Follow & Deposit'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Followers list */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>{'\u{1F465}'}</span>
            Followers
          </h2>
          <span className="px-3 py-1 rounded-full bg-white/[0.04] text-sm text-slate-400 font-medium">
            {followerCount}
          </span>
        </div>

        {!followerCount ? (
          <div className="text-center py-6">
            <p className="text-slate-500 text-sm">No followers yet. Be the first!</p>
          </div>
        ) : (
          <div>
            {/* Overlapping avatar preview */}
            <div className="flex items-center mb-5">
              <div className="flex -space-x-2">
                {(followerList ?? []).slice(0, 5).map((f, idx) => {
                  const colors = [
                    'from-indigo-400 to-purple-500',
                    'from-purple-400 to-pink-500',
                    'from-cyan-400 to-indigo-500',
                    'from-emerald-400 to-cyan-500',
                    'from-amber-400 to-orange-500',
                  ]
                  return (
                    <div
                      key={f}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors[idx % 5]} flex items-center justify-center text-white text-[10px] font-bold border-2 border-[rgba(15,23,42,0.8)]`}
                    >
                      {f.slice(2, 4).toUpperCase()}
                    </div>
                  )
                })}
              </div>
              {followerCount > 5 && (
                <span className="ml-3 text-sm text-slate-400">+{followerCount - 5} more</span>
              )}
            </div>

            {/* Full list */}
            <div className="space-y-2">
              {(followerList ?? []).map((f, idx) => {
                const colors = [
                  'from-indigo-400 to-purple-500',
                  'from-purple-400 to-pink-500',
                  'from-cyan-400 to-indigo-500',
                  'from-emerald-400 to-cyan-500',
                  'from-amber-400 to-orange-500',
                ]
                return (
                  <div key={f} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 hover:bg-white/[0.05] transition-colors duration-200">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors[idx % 5]} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {f.slice(2, 4).toUpperCase()}
                    </div>
                    <span className="text-slate-300 font-mono text-sm">{truncateAddress(f)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
