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
    return <div className="text-gray-400 py-12 text-center">Loading...</div>
  }

  if (!traderInfo?.isActive) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-white mb-4">Trader Not Found</h1>
        <p className="text-gray-400">This address is not a registered trader</p>
      </div>
    )
  }

  const registeredDate = new Date(Number(traderInfo.registeredAt) * 1000).toLocaleDateString()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Trader card */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {traderInfo.initUsername[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{traderInfo.initUsername}</h1>
            <div className="text-sm text-gray-400">{truncateAddress(trader)} · Since {registeredDate}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-sm text-gray-400">Total Trades</div>
            <div className="text-2xl font-bold text-white mt-1">{traderInfo.totalTrades.toString()}</div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-sm text-gray-400">Volume</div>
            <div className="text-2xl font-bold text-white mt-1">${formatAmount(traderInfo.totalVolume, 6)}</div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-sm text-gray-400">Followers</div>
            <div className="text-2xl font-bold text-white mt-1">{traderInfo.followerCount.toString()}</div>
          </div>
        </div>
      </div>

      {/* Follow section */}
      {myAddr && myAddr.toLowerCase() !== trader.toLowerCase() && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          {isFollowingTrader ? (
            <div className="text-center">
              <div className="text-emerald-400 font-medium mb-2">You are following this trader</div>
              <p className="text-sm text-gray-400">Your positions are shown in your Dashboard</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-4">Follow & Deposit</h2>
              <div className="flex gap-3 mb-4">
                <select
                  value={selectedToken.symbol}
                  onChange={e => {
                    const t = TOKENS.find(tk => tk.symbol === e.target.value)
                    if (t) setSelectedToken(t)
                  }}
                  className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2"
                >
                  {TOKENS.map(t => (
                    <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="Amount to deposit"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              </div>
              {tokenBalance !== undefined && (
                <div className="text-sm text-gray-400 mb-4">
                  Balance: {formatAmount(tokenBalance as bigint, selectedToken.decimals)} {selectedToken.symbol}
                </div>
              )}
              <button
                onClick={handleFollow}
                disabled={amount <= 0n || following || confirmingFollow}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-gray-500 text-white py-3 rounded-xl font-medium transition"
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
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          Followers ({(followers as `0x${string}`[] | undefined)?.length ?? 0})
        </h2>
        {!(followers as `0x${string}`[] | undefined)?.length ? (
          <p className="text-gray-500 text-sm">No followers yet</p>
        ) : (
          <div className="space-y-2">
            {(followers as `0x${string}`[]).map(f => (
              <div key={f} className="flex items-center gap-3 bg-slate-900 rounded-lg p-3">
                <div className="w-6 h-6 rounded-full bg-slate-700" />
                <span className="text-gray-300 font-mono text-sm">{truncateAddress(f)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
