export const SIMPLE_AMM_ABI = [
  { type: 'function', name: 'pairCount', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'getPairId', stateMutability: 'view', inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'getReserves', stateMutability: 'view', inputs: [{ name: 'pairId', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }, { name: '', type: 'uint256' }] },
  { type: 'function', name: 'getPairTokens', stateMutability: 'view', inputs: [{ name: 'pairId', type: 'uint256' }], outputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }] },
  { type: 'function', name: 'getAmountOut', stateMutability: 'pure', inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'reserveIn', type: 'uint256' }, { name: 'reserveOut', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'getLiquidity', stateMutability: 'view', inputs: [{ name: 'pairId', type: 'uint256' }, { name: 'provider', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'swap', stateMutability: 'nonpayable', inputs: [{ name: 'pairId', type: 'uint256' }, { name: 'tokenIn', type: 'address' }, { name: 'amountIn', type: 'uint256' }, { name: 'minAmountOut', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'createPair', stateMutability: 'nonpayable', inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'addLiquidity', stateMutability: 'nonpayable', inputs: [{ name: 'pairId', type: 'uint256' }, { name: 'amountA', type: 'uint256' }, { name: 'amountB', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
] as const

export const COPY_TRADE_ROUTER_ABI = [
  { type: 'function', name: 'getTraderCount', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'getTraderByIndex', stateMutability: 'view', inputs: [{ name: 'index', type: 'uint256' }], outputs: [{ name: '', type: 'address' }] },
  {
    type: 'function', name: 'getTraderInfo', stateMutability: 'view',
    inputs: [{ name: 'trader', type: 'address' }],
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'initUsername', type: 'string' },
        { name: 'isActive', type: 'bool' },
        { name: 'totalTrades', type: 'uint256' },
        { name: 'totalVolume', type: 'uint256' },
        { name: 'followerCount', type: 'uint256' },
        { name: 'registeredAt', type: 'uint256' },
      ]
    }]
  },
  { type: 'function', name: 'getFollowers', stateMutability: 'view', inputs: [{ name: 'trader', type: 'address' }], outputs: [{ name: '', type: 'address[]' }] },
  { type: 'function', name: 'getFollowerBalance', stateMutability: 'view', inputs: [{ name: 'follower', type: 'address' }, { name: 'trader', type: 'address' }, { name: 'token', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'isFollowing', stateMutability: 'view', inputs: [{ name: 'follower', type: 'address' }, { name: 'trader', type: 'address' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'registerTrader', stateMutability: 'nonpayable', inputs: [{ name: 'initUsername', type: 'string' }], outputs: [] },
  { type: 'function', name: 'unregisterTrader', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'followTrader', stateMutability: 'nonpayable', inputs: [{ name: 'trader', type: 'address' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'unfollowTrader', stateMutability: 'nonpayable', inputs: [{ name: 'trader', type: 'address' }], outputs: [] },
  { type: 'function', name: 'withdrawBalance', stateMutability: 'nonpayable', inputs: [{ name: 'trader', type: 'address' }, { name: 'token', type: 'address' }], outputs: [] },
  { type: 'function', name: 'executeTrade', stateMutability: 'nonpayable', inputs: [{ name: 'pairId', type: 'uint256' }, { name: 'tokenIn', type: 'address' }, { name: 'amountIn', type: 'uint256' }, { name: 'minAmountOut', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
] as const

export const ERC20_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'string' }] },
] as const
