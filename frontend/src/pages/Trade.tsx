import { useState, useMemo } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { TOKENS, CONTRACTS, parseAmount, formatAmount } from '../config/contracts'
import type { TokenInfo } from '../config/contracts'
import { SIMPLE_AMM_ABI, ERC20_ABI, COPY_TRADE_ROUTER_ABI } from '../config/abis'
import { useTokenBalance, useAllowance } from '../hooks/useTokenBalance'
import { useReserves, usePairId } from '../hooks/useSwap'
import { useTraderInfo } from '../hooks/useTraderInfo'
import { TokenInput } from '../components/TokenInput'

export function Trade() {
  const { address } = useAccount()
  const [tokenIn, setTokenIn] = useState<TokenInfo>(TOKENS[0])
  const [tokenOut, setTokenOut] = useState<TokenInfo>(TOKENS[1])
  const [amountStr, setAmountStr] = useState('')
  const [asLeader, setAsLeader] = useState(false)

  const pairId = usePairId(tokenIn.address, tokenOut.address)
  const { reserveA, reserveB } = useReserves(pairId ?? 0n)
  const { data: balanceIn } = useTokenBalance(tokenIn.address, address)
  const { data: balanceOut } = useTokenBalance(tokenOut.address, address)
  const { traderInfo } = useTraderInfo(address)
  const isTrader = traderInfo?.isActive ?? false

  const spender = asLeader ? CONTRACTS.router : CONTRACTS.amm
  const { data: currentAllowance } = useAllowance(tokenIn.address, address, spender)

  const amountIn = useMemo(() => {
    if (!amountStr || isNaN(Number(amountStr))) return 0n
    return parseAmount(amountStr, tokenIn.decimals)
  }, [amountStr, tokenIn.decimals])

  // Calculate output using constant product formula
  const amountOut = useMemo(() => {
    if (amountIn <= 0n || reserveA <= 0n || reserveB <= 0n || !pairId) return 0n
    // Determine direction
    const isTokenAIn = tokenIn.address.toLowerCase() === TOKENS.find((_, idx) => {
      // getPairTokens returns (tokenA, tokenB) in creation order
      // For simplicity, calculate with reserves directly
      return idx >= 0
    })?.address.toLowerCase()
    const rIn = isTokenAIn ? reserveA : reserveB
    const rOut = isTokenAIn ? reserveB : reserveA
    if (rIn <= 0n || rOut <= 0n) return 0n
    const inWithFee = amountIn * 997n
    return (inWithFee * rOut) / (rIn * 1000n + inWithFee)
  }, [amountIn, reserveA, reserveB, pairId, tokenIn.address])

  // Approve
  const { writeContract: doApprove, data: approveHash, isPending: approving } = useWriteContract()
  const { isSuccess: approved } = useWaitForTransactionReceipt({ hash: approveHash })

  // Swap
  const { writeContract: doSwap, data: swapHash, isPending: swapping } = useWriteContract()
  const { isLoading: confirming, isSuccess: swapped } = useWaitForTransactionReceipt({ hash: swapHash })

  const needsApproval = amountIn > 0n && (currentAllowance ?? 0n) < amountIn

  function handleSwap() {
    if (!pairId || amountIn <= 0n) return

    if (needsApproval && !approved) {
      doApprove({
        address: tokenIn.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amountIn],
      })
      return
    }

    if (asLeader) {
      doSwap({
        address: CONTRACTS.router,
        abi: COPY_TRADE_ROUTER_ABI,
        functionName: 'executeTrade',
        args: [pairId, tokenIn.address, amountIn, 0n],
      })
    } else {
      doSwap({
        address: CONTRACTS.amm,
        abi: SIMPLE_AMM_ABI,
        functionName: 'swap',
        args: [pairId, tokenIn.address, amountIn, 0n],
      })
    }
  }

  function handleFlip() {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountStr('')
  }

  const buttonText = !address
    ? 'Connect Wallet'
    : !pairId
    ? 'Invalid Pair'
    : amountIn <= 0n
    ? 'Enter Amount'
    : needsApproval && !approved
    ? approving ? 'Approving...' : 'Approve'
    : swapping || confirming
    ? 'Swapping...'
    : swapped
    ? 'Swapped!'
    : asLeader
    ? 'Execute as Leader (Copies Followers)'
    : 'Swap'

  const totalReserve = reserveA + reserveB
  const ratioA = totalReserve > 0n ? Number(reserveA * 100n / totalReserve) : 50

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          <span className="gradient-text">Trade</span>
        </h1>
        <p className="text-slate-400">Swap tokens on the CopyTrade AMM</p>
      </div>

      {/* Swap card */}
      <div className="glass-card rounded-3xl p-6 glow-indigo">
        {/* You Pay */}
        <div className="mb-1">
          <TokenInput
            label="You Pay"
            token={tokenIn}
            amount={amountStr}
            balance={balanceIn as bigint | undefined}
            onAmountChange={setAmountStr}
            onTokenChange={t => { setTokenIn(t); if (t.symbol === tokenOut.symbol) setTokenOut(tokenIn) }}
          />
        </div>

        {/* Flip button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleFlip}
            className="w-10 h-10 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] hover:border-indigo-500/40 flex items-center justify-center transition-all duration-300 hover-rotate hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* You Receive */}
        <div className="mt-1">
          <TokenInput
            label="You Receive"
            token={tokenOut}
            amount={amountOut > 0n ? formatAmount(amountOut, tokenOut.decimals) : ''}
            balance={balanceOut as bigint | undefined}
            onAmountChange={() => {}}
            readOnly
          />
        </div>

        {/* Output estimate pulse */}
        {amountIn > 0n && amountOut === 0n && pairId && (
          <div className="text-center py-2 animate-subtle-pulse">
            <span className="text-sm text-slate-500">Calculating estimate...</span>
          </div>
        )}

        {/* Leader toggle */}
        {isTrader && (
          <label className="flex items-center gap-3 mt-5 p-4 rounded-2xl cursor-pointer transition-all duration-300 border border-transparent bg-purple-500/[0.06] hover:bg-purple-500/[0.1] hover:border-purple-500/20"
            style={asLeader ? { background: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.3)' } : {}}
          >
            <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${asLeader ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/[0.1]'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-300 ${asLeader ? 'translate-x-5' : ''}`} />
            </div>
            <input
              type="checkbox"
              checked={asLeader}
              onChange={e => setAsLeader(e.target.checked)}
              className="sr-only"
            />
            <div>
              <div className="text-sm font-medium text-purple-300">Execute as Leader Trade</div>
              <div className="text-xs text-slate-500">Automatically copies this trade for all your followers</div>
            </div>
          </label>
        )}

        {/* Swap button */}
        <button
          onClick={handleSwap}
          disabled={!address || amountIn <= 0n || !pairId || swapping || confirming}
          className="w-full mt-5 gradient-btn text-white py-3.5 rounded-2xl font-semibold text-sm tracking-wide"
        >
          {buttonText}
        </button>
      </div>

      {/* Pool info */}
      {pairId && reserveA > 0n && (
        <div className="mt-5 glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">Pool Reserves</span>
            <span className="text-xs text-slate-500">0.3% fee</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${ratioA}%` }}
            />
          </div>

          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-slate-300">{tokenIn.symbol}</span>
              <span className="text-slate-500">{formatAmount(reserveA, tokenIn.decimals)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">{formatAmount(reserveB, tokenOut.decimals)}</span>
              <span className="text-slate-300">{tokenOut.symbol}</span>
              <span className="w-2 h-2 rounded-full bg-purple-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
