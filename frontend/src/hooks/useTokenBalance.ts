import { useReadContract } from 'wagmi'
import { ERC20_ABI } from '../config/abis'

export function useTokenBalance(token: `0x${string}` | undefined, account: `0x${string}` | undefined) {
  return useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: !!token && !!account, refetchInterval: 5000 },
  })
}

export function useAllowance(token: `0x${string}` | undefined, owner: `0x${string}` | undefined, spender: `0x${string}` | undefined) {
  return useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: !!token && !!owner && !!spender, refetchInterval: 5000 },
  })
}
