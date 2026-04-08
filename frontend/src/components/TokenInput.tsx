import type { TokenInfo } from '../config/contracts'
import { TOKENS, formatAmount } from '../config/contracts'

interface TokenInputProps {
  label: string
  token: TokenInfo
  amount: string
  balance?: bigint
  onAmountChange: (val: string) => void
  onTokenChange?: (token: TokenInfo) => void
  readOnly?: boolean
}

const TOKEN_COLORS: Record<string, string> = {
  USDC: 'bg-blue-400',
  WINIT: 'bg-purple-400',
  WETH: 'bg-cyan-400',
}

export function TokenInput({ label, token, amount, balance, onAmountChange, onTokenChange, readOnly }: TokenInputProps) {
  return (
    <div className="group rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/20 transition-all duration-300 focus-within:border-indigo-500/30 focus-within:bg-white/[0.05]">
      <div className="flex justify-between items-center text-sm mb-3">
        <span className="text-slate-400 font-medium">{label}</span>
        {balance !== undefined && (
          <span className="text-slate-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {formatAmount(balance, token.decimals)}
            {!readOnly && (
              <button
                onClick={() => onAmountChange(formatAmount(balance, token.decimals))}
                className="ml-1 px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 hover:text-indigo-300 transition-colors duration-200"
              >
                MAX
              </button>
            )}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={amount}
          onChange={e => onAmountChange(e.target.value)}
          placeholder="0.0"
          readOnly={readOnly}
          className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder-slate-600 min-w-0"
        />
        {onTokenChange ? (
          <select
            value={token.symbol}
            onChange={e => {
              const t = TOKENS.find(tk => tk.symbol === e.target.value)
              if (t) onTokenChange(t)
            }}
            className="appearance-none bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl px-4 py-2.5 text-sm font-medium border border-white/[0.08] transition-colors duration-200 cursor-pointer pr-8"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            {TOKENS.map(t => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 bg-white/[0.06] rounded-xl px-4 py-2.5">
            <span className={`w-2 h-2 rounded-full ${TOKEN_COLORS[token.symbol] || 'bg-slate-400'}`} />
            <span className="text-sm font-medium text-white">{token.symbol}</span>
          </div>
        )}
      </div>
    </div>
  )
}
