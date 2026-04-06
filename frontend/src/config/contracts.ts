import type { Address } from 'viem'

export const CONTRACTS = {
  amm: (import.meta.env.VITE_AMM_ADDRESS || '0x') as Address,
  router: (import.meta.env.VITE_ROUTER_ADDRESS || '0x') as Address,
  usdc: (import.meta.env.VITE_USDC_ADDRESS || '0x') as Address,
  winit: (import.meta.env.VITE_WINIT_ADDRESS || '0x') as Address,
  weth: (import.meta.env.VITE_WETH_ADDRESS || '0x') as Address,
}

export interface TokenInfo {
  address: Address
  symbol: string
  decimals: number
}

export const TOKENS: TokenInfo[] = [
  { address: CONTRACTS.usdc, symbol: 'USDC', decimals: 6 },
  { address: CONTRACTS.winit, symbol: 'WINIT', decimals: 18 },
  { address: CONTRACTS.weth, symbol: 'WETH', decimals: 18 },
]

export function getToken(address: Address): TokenInfo | undefined {
  return TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase())
}

export function formatAmount(amount: bigint, decimals: number): string {
  const num = Number(amount) / 10 ** decimals
  if (num >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (num >= 1) return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

export function parseAmount(amount: string, decimals: number): bigint {
  const [whole, frac = ''] = amount.split('.')
  const padded = frac.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(whole + padded)
}

export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
