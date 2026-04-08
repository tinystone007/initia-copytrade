import { NavLink, Outlet } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from './ConnectButton'

const USE_IWK = import.meta.env.VITE_USE_INTERWOVENKIT === 'true'

const NAV_ITEMS = [
  { to: '/', label: 'Leaderboard', icon: '\u{1F4CA}' },
  { to: '/trade', label: 'Trade', icon: '\u{1F4B1}' },
  { to: '/dashboard', label: 'Dashboard', icon: '\u{1F4CB}' },
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
      <aside className="w-60 shrink-0 flex flex-col border-r border-indigo-500/10 bg-[rgba(8,8,30,0.8)] backdrop-blur-xl">
        {/* Brand */}
        <div className="px-5 pt-6 pb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">
                <span className="gradient-text">Copy</span>
                <span className="text-white">Trade</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-500" />
                  )}
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {isConnected && openBridge && (
            <button
              onClick={() => openBridge()}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200 mt-4"
            >
              <span className="text-base">{'\u{1F310}'}</span>
              <span>Bridge Assets</span>
            </button>
          )}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4">
          <div className="border-t border-white/[0.06] pt-4 mb-4">
            <ConnectButton />
          </div>
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-600">
            <span>CopyTrade v1.0</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Initia
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
