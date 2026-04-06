import { useReadContract } from 'wagmi'
import { COPY_TRADE_ROUTER_ABI } from '../config/abis'
import { CONTRACTS } from '../config/contracts'

export function useTraderInfo(address: `0x${string}` | undefined) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.router,
    abi: COPY_TRADE_ROUTER_ABI,
    functionName: 'getTraderInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const info = data as [string, boolean, bigint, bigint, bigint, bigint] | undefined

  return {
    traderInfo: info ? {
      initUsername: info[0],
      isActive: info[1],
      totalTrades: info[2],
      totalVolume: info[3],
      followerCount: info[4],
      registeredAt: info[5],
    } : undefined,
    isLoading,
  }
}

export function useFollowers(trader: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.router,
    abi: COPY_TRADE_ROUTER_ABI,
    functionName: 'getFollowers',
    args: trader ? [trader] : undefined,
    query: { enabled: !!trader },
  })
}

export function useIsFollowing(follower: `0x${string}` | undefined, trader: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.router,
    abi: COPY_TRADE_ROUTER_ABI,
    functionName: 'isFollowing',
    args: follower && trader ? [follower, trader] : undefined,
    query: { enabled: !!follower && !!trader },
  })
}
