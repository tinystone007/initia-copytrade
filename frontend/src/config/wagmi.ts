import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'
import { injected } from 'wagmi/connectors'
import { initiaPrivyWalletConnector } from '@initia/interwovenkit-react'

export const copytradeChain = defineChain({
  id: Number(import.meta.env.VITE_CHAIN_ID) || 1,
  name: 'CopyTrade Rollup',
  nativeCurrency: { name: 'INIT', symbol: 'INIT', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_CHAIN_RPC_URL || 'http://localhost:8545'] },
  },
})

export const ROLLUP_CHAIN_ID = import.meta.env.VITE_INITIA_CHAIN_ID || 'copytrade-1'

export const wagmiConfig = createConfig({
  chains: [copytradeChain],
  connectors: [injected(), initiaPrivyWalletConnector],
  transports: {
    [copytradeChain.id]: http(),
  },
})
