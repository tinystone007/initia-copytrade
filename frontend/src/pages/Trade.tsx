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

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Trade</h1>
      <p className="text-gray-400 mb-8">Swap tokens on the CopyTrade AMM</p>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700">
        <TokenInput
          label="You Pay"
          token={tokenIn}
          amount={amountStr}
          balance={balanceIn as bigint | undefined}
          onAmountChange={setAmountStr}
          onTokenChange={t => { setTokenIn(t); if (t.symbol === tokenOut.symbol) setTokenOut(tokenIn) }}
        />

        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleFlip}
            className="bg-slate-700 border border-slate-600 rounded-lg p-2 hover:bg-slate-600 transition"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        <TokenInput
          label="You Receive"
          token={tokenOut}
          amount={amountOut > 0n ? formatAmount(amountOut, tokenOut.decimals) : ''}
          balance={balanceOut as bigint | undefined}
          onAmountChange={() => {}}
          readOnly
        />

        {/* Leader toggle */}
        {isTrader && (
          <label className="flex items-center gap-3 mt-4 p-3 bg-indigo-600/10 border border-indigo-500/30 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={asLeader}
              onChange={e => setAsLeader(e.target.checked)}
              className="w-4 h-4 accent-indigo-500"
            />
            <div>
              <div className="text-sm text-indigo-400 font-medium">Execute as Leader Trade</div>
              <div className="text-xs text-gray-400">Automatically copies this trade for all your followers</div>
            </div>
          </label>
        )}

        <button
          onClick={handleSwap}
          disabled={!address || amountIn <= 0n || !pairId || swapping || confirming}
          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-gray-500 text-white py-3 rounded-xl font-medium transition"
        >
          {buttonText}
        </button>
      </div>

      {/* Pool info */}
      {pairId && reserveA > 0n && (
        <div className="mt-4 bg-slate-800 rounded-xl p-4 border border-slate-700 text-sm">
          <div className="text-gray-400 mb-2">Pool Reserves</div>
          <div className="flex justify-between text-gray-300">
            <span>{tokenIn.symbol}: {formatAmount(reserveA, tokenIn.decimals)}</span>
            <span>{tokenOut.symbol}: {formatAmount(reserveB, tokenOut.decimals)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
