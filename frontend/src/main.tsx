import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { wagmiConfig, ROLLUP_CHAIN_ID } from './config/wagmi'
import { App } from './App'
import './index.css'

const queryClient = new QueryClient()
const USE_IWK = import.meta.env.VITE_USE_INTERWOVENKIT === 'true'

function InterwovenKitWrapper({ children }: { children: React.ReactNode }) {
  if (!USE_IWK) return <>{children}</>

  // Dynamic import to avoid crash on non-Initia chains
  const { InterwovenKitProvider, injectStyles, TESTNET } = require('@initia/interwovenkit-react')
  const InterwovenKitStyles = require('@initia/interwovenkit-react/styles.js').default

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { injectStyles(InterwovenKitStyles) }, [injectStyles, InterwovenKitStyles])

  return (
    <InterwovenKitProvider
      {...TESTNET}
      defaultChainId={ROLLUP_CHAIN_ID}
      enableAutoSign={{ [ROLLUP_CHAIN_ID]: ['/minievm.evm.v1.MsgCall'] }}
    >
      {children}
    </InterwovenKitProvider>
  )
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitWrapper>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </InterwovenKitWrapper>
      </WagmiProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
