import { useReadContract, useReadContracts } from 'wagmi'
import { COPY_TRADE_ROUTER_ABI } from '../config/abis'
import { CONTRACTS } from '../config/contracts'

export interface TraderData {
  address: `0x${string}`
  initUsername: string
  isActive: boolean
  totalTrades: bigint
  totalVolume: bigint
  followerCount: bigint
  registeredAt: bigint
}

export function useTraderCount() {
  return useReadContract({
    address: CONTRACTS.router,
    abi: COPY_TRADE_ROUTER_ABI,
    functionName: 'getTraderCount',
  })
}

export function useTraders() {
  const { data: count } = useTraderCount()
  const traderCount = Number(count ?? 0)

  // Batch read all trader addresses
  const addressCalls = Array.from({ length: traderCount }, (_, i) => ({
    address: CONTRACTS.router as `0x${string}`,
    abi: COPY_TRADE_ROUTER_ABI,
    functionName: 'getTraderByIndex' as const,
    args: [BigInt(i)] as const,
  }))

  const { data: addressResults } = useReadContracts({
    contracts: addressCalls,
    query: { enabled: traderCount > 0 },
  })

  const addresses = (addressResults ?? [])
    .map(r => r.result as `0x${string}` | undefined)
    .filter((a): a is `0x${string}` => !!a)

  // Batch read all trader info
  const infoCalls = addresses.map(addr => ({
    address: CONTRACTS.router as `0x${string}`,
    abi: COPY_TRADE_ROUTER_ABI,
    functionName: 'getTraderInfo' as const,
    args: [addr] as const,
  }))

  const { data: infoResults, isLoading } = useReadContracts({
    contracts: infoCalls,
    query: { enabled: addresses.length > 0 },
  })

  const traders: TraderData[] = addresses.map((addr, i) => {
    const info = infoResults?.[i]?.result as [string, boolean, bigint, bigint, bigint, bigint] | undefined
    return {
      address: addr,
      initUsername: info?.[0] ?? '',
      isActive: info?.[1] ?? false,
      totalTrades: info?.[2] ?? 0n,
      totalVolume: info?.[3] ?? 0n,
      followerCount: info?.[4] ?? 0n,
      registeredAt: info?.[5] ?? 0n,
    }
  }).filter(t => t.isActive)

  return { traders, isLoading, traderCount }
}
