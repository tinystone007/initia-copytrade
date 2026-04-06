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
        <div className="text-sm text-gray-300 bg-slate-800 px-3 py-1.5 rounded-lg text-center">
          {username || truncateAddress(address)}
        </div>
        <button
          onClick={() => disconnect()}
          className="text-xs text-gray-500 hover:text-white transition"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
    >
      Connect Wallet
    </button>
  )
}
