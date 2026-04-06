import { NavLink, Outlet } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from './ConnectButton'

const USE_IWK = import.meta.env.VITE_USE_INTERWOVENKIT === 'true'

const NAV_ITEMS = [
  { to: '/', label: 'Leaderboard' },
  { to: '/trade', label: 'Trade' },
  { to: '/dashboard', label: 'Dashboard' },
]

function useBridge(): (() => void) | undefined {
  if (!USE_IWK) return undefined
  try {
    const { useInterwovenKit } = require('@initia/interwovenkit-react')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useInterwovenKit().openBridge
  } catch { return undefined }
}

export function Layout() {
  const { isConnected } = useAccount()
  const openBridge = useBridge()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col p-4 shrink-0">
        <div className="text-xl font-bold text-white mb-8 px-2">
          <span className="text-indigo-400">Copy</span>Trade
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isConnected && openBridge && (
            <button
              onClick={() => openBridge()}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-slate-800 transition mt-4"
            >
              Bridge Assets
            </button>
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <ConnectButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
