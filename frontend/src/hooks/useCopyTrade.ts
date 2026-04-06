import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { COPY_TRADE_ROUTER_ABI, ERC20_ABI, SIMPLE_AMM_ABI } from '../config/abis'
import { CONTRACTS } from '../config/contracts'

export function useRegisterTrader() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function register(initUsername: string) {
    writeContract({
      address: CONTRACTS.router,
      abi: COPY_TRADE_ROUTER_ABI,
      functionName: 'registerTrader',
      args: [initUsername],
    })
  }

  return { register, isPending, isConfirming, isSuccess }
}

export function useFollowTrader() {
  const { writeContract: writeApprove, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash })
  const { writeContract: writeFollow, data: followHash, isPending: isFollowing } = useWriteContract()
  const { isLoading: isConfirmingFollow, isSuccess: followSuccess } = useWaitForTransactionReceipt({ hash: followHash })

  function approve(token: `0x${string}`, amount: bigint) {
    writeApprove({
      address: token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.router, amount],
    })
  }

  function follow(trader: `0x${string}`, token: `0x${string}`, amount: bigint) {
    writeFollow({
      address: CONTRACTS.router,
      abi: COPY_TRADE_ROUTER_ABI,
      functionName: 'followTrader',
      args: [trader, token, amount],
    })
  }

  return { approve, follow, isApproving, approveConfirmed, isFollowing, isConfirmingFollow, followSuccess }
}

export function useUnfollowTrader() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function unfollow(trader: `0x${string}`) {
    writeContract({
      address: CONTRACTS.router,
      abi: COPY_TRADE_ROUTER_ABI,
      functionName: 'unfollowTrader',
      args: [trader],
    })
  }

  return { unfollow, isPending, isConfirming, isSuccess }
}

export function useWithdrawBalance() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function withdraw(trader: `0x${string}`, token: `0x${string}`) {
    writeContract({
      address: CONTRACTS.router,
      abi: COPY_TRADE_ROUTER_ABI,
      functionName: 'withdrawBalance',
      args: [trader, token],
    })
  }

  return { withdraw, isPending, isConfirming, isSuccess }
}

export function useExecuteTrade() {
  const { writeContract: writeApprove, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash })
  const { writeContract: writeTrade, data: tradeHash, isPending: isTrading } = useWriteContract()
  const { isLoading: isConfirmingTrade, isSuccess: tradeSuccess } = useWaitForTransactionReceipt({ hash: tradeHash })

  function approveRouter(token: `0x${string}`, amount: bigint) {
    writeApprove({
      address: token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.router, amount],
    })
  }

  function executeTrade(pairId: bigint, tokenIn: `0x${string}`, amountIn: bigint, minAmountOut: bigint) {
    writeTrade({
      address: CONTRACTS.router,
      abi: COPY_TRADE_ROUTER_ABI,
      functionName: 'executeTrade',
      args: [pairId, tokenIn, amountIn, minAmountOut],
    })
  }

  return { approveRouter, executeTrade, isApproving, approveConfirmed, isTrading, isConfirmingTrade, tradeSuccess }
}

export function useSwapDirect() {
  const { writeContract: writeApprove, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash })
  const { writeContract: writeSwap, data: swapHash, isPending: isSwapping } = useWriteContract()
  const { isLoading: isConfirmingSwap, isSuccess: swapSuccess } = useWaitForTransactionReceipt({ hash: swapHash })

  function approveAmm(token: `0x${string}`, amount: bigint) {
    writeApprove({
      address: token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.amm, amount],
    })
  }

  function swap(pairId: bigint, tokenIn: `0x${string}`, amountIn: bigint, minAmountOut: bigint) {
    writeSwap({
      address: CONTRACTS.amm,
      abi: SIMPLE_AMM_ABI,
      functionName: 'swap',
      args: [pairId, tokenIn, amountIn, minAmountOut],
    })
  }

  return { approveAmm, swap, isApproving, approveConfirmed, isSwapping, isConfirmingSwap, swapSuccess }
}
