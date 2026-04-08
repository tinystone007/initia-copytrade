import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { truncateAddress } from '../config/contracts'

const USE_IWK = import.meta.env.VITE_USE_INTERWOVENKIT === 'true'

function useUsername(address: string | undefined): string | null {
  if (!USE_IWK || !address) return null
  try {
    const { useUsernameQuery } = require('@initia/interwovenkit-react')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data } = useUsernameQuery(address)
    return data ?? null
  } catch { return null }
}

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const username = useUsername(address)

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-cyan-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {(username || address.slice(2, 4)).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {username || truncateAddress(address)}
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        </div>
        <button
          onClick={() => disconnect()}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200 text-center py-1"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="w-full gradient-border-btn text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-500/10 transition-all duration-200"
    >
      Connect Wallet
    </button>
  )
}
