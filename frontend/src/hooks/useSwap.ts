import { useReadContract } from 'wagmi'
import { SIMPLE_AMM_ABI } from '../config/abis'
import { CONTRACTS } from '../config/contracts'

export function useReserves(pairId: bigint) {
  const { data } = useReadContract({
    address: CONTRACTS.amm,
    abi: SIMPLE_AMM_ABI,
    functionName: 'getReserves',
    args: [pairId],
    query: { refetchInterval: 5000 },
  })
  return { reserveA: (data as [bigint, bigint] | undefined)?.[0] ?? 0n, reserveB: (data as [bigint, bigint] | undefined)?.[1] ?? 0n }
}

export function usePairTokens(pairId: bigint) {
  const { data } = useReadContract({
    address: CONTRACTS.amm,
    abi: SIMPLE_AMM_ABI,
    functionName: 'getPairTokens',
    args: [pairId],
  })
  return { tokenA: (data as [string, string] | undefined)?.[0] as `0x${string}` | undefined, tokenB: (data as [string, string] | undefined)?.[1] as `0x${string}` | undefined }
}

export function usePairId(tokenA: `0x${string}`, tokenB: `0x${string}`) {
  const { data } = useReadContract({
    address: CONTRACTS.amm,
    abi: SIMPLE_AMM_ABI,
    functionName: 'getPairId',
    args: [tokenA, tokenB],
  })
  return data as bigint | undefined
}

export function useAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint) {
  const { data } = useReadContract({
    address: CONTRACTS.amm,
    abi: SIMPLE_AMM_ABI,
    functionName: 'getAmountOut',
    args: [amountIn, reserveIn, reserveOut],
    query: { enabled: amountIn > 0n && reserveIn > 0n && reserveOut > 0n },
  })
  return data as bigint | undefined
}
