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

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <Link to={`/trader/${trader}`} className="flex items-center gap-3 hover:text-indigo-400 transition">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {(traderInfo?.initUsername || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-white font-medium">{traderInfo?.initUsername || truncateAddress(trader)}</div>
            <div className="text-xs text-gray-500">{truncateAddress(trader)}</div>
          </div>
        </Link>
        <button
          onClick={() => unfollow(trader)}
          disabled={unfollowing}
          className="text-sm text-red-400 hover:text-red-300 transition"
        >
          {unfollowing ? 'Unfollowing...' : 'Unfollow'}
        </button>
      </div>

      {hasBalance ? (
        <div className="space-y-2">
          {balances.filter(b => b.balance > 0n).map(({ token, balance }) => (
            <div key={token.symbol} className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
              <div>
                <span className="text-white">{formatAmount(balance, token.decimals)}</span>
                <span className="text-gray-400 ml-2">{token.symbol}</span>
              </div>
              <button
                onClick={() => withdraw(trader, token.address)}
                disabled={withdrawing}
                className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg transition"
              >
                Withdraw
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No balances — waiting for leader to trade</div>
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
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
        <p className="text-gray-400">Connect your wallet to view your positions</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {/* Trader profile */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">My Trader Profile</h2>
        {traderInfo?.isActive ? (
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {traderInfo.initUsername[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-white font-medium">{traderInfo.initUsername}</div>
                <div className="text-sm text-gray-400">Registered Trader</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-400">Trades</div>
                <div className="text-xl font-bold text-white">{traderInfo.totalTrades.toString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Volume</div>
                <div className="text-xl font-bold text-white">${formatAmount(traderInfo.totalVolume, 6)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Followers</div>
                <div className="text-xl font-bold text-white">{traderInfo.followerCount.toString()}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-gray-400 mb-4">Register as a trader to let others copy your trades</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your-name.init"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => register(username)}
                disabled={!username || registering}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                {registering ? 'Registering...' : registered ? 'Registered!' : 'Register'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Copy positions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">My Copy Positions</h2>
        {followedTraders.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <p className="text-gray-400 mb-4">You're not following any traders yet</p>
            <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition">
              Browse traders →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {followedTraders.map(t => (
              <FollowerPosition key={t.address} trader={t.address} followerAddr={address} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
