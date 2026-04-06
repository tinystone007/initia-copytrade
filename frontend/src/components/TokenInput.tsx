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

export function TokenInput({ label, token, amount, balance, onAmountChange, onTokenChange, readOnly }: TokenInputProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>{label}</span>
        {balance !== undefined && (
          <span>
            Balance: {formatAmount(balance, token.decimals)}
            {!readOnly && (
              <button
                onClick={() => onAmountChange(formatAmount(balance, token.decimals))}
                className="ml-1 text-indigo-400 hover:text-indigo-300"
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
          className="flex-1 bg-transparent text-2xl text-white outline-none placeholder-gray-600"
        />
        {onTokenChange ? (
          <select
            value={token.symbol}
            onChange={e => {
              const t = TOKENS.find(tk => tk.symbol === e.target.value)
              if (t) onTokenChange(t)
            }}
            className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600"
          >
            {TOKENS.map(t => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
        ) : (
          <span className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm">
            {token.symbol}
          </span>
        )}
      </div>
    </div>
  )
}
