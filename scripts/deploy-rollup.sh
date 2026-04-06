#!/bin/bash
# Deploy CopyTrade contracts to MiniEVM rollup
# Usage: ./scripts/deploy-rollup.sh <RPC_URL> <PRIVATE_KEY>
#
# Prerequisites:
#   1. Run `weave init` (interactive — sets up gas station)
#   2. Run `weave rollup launch --vm evm` (interactive — creates MiniEVM rollup)
#   3. Fund your deployer account on the rollup
#   4. Run this script with the rollup's JSON-RPC URL and deployer private key

set -e

RPC_URL="${1:?Usage: $0 <RPC_URL> <PRIVATE_KEY>}"
PRIVATE_KEY="${2:?Usage: $0 <RPC_URL> <PRIVATE_KEY>}"

echo "=== Deploying CopyTrade to $RPC_URL ==="

cd "$(dirname "$0")/../contracts"

# Install forge-std if missing
if [ ! -d "lib/forge-std" ]; then
  forge install foundry-rs/forge-std --no-git --no-commit
fi

# Deploy
echo "Running deploy script..."
forge script script/Deploy.s.sol \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --legacy \
  --private-key "$PRIVATE_KEY" \
  -v

echo ""
echo "=== Deployment complete ==="
echo "Copy the addresses above into frontend/.env"
echo "Then run: cd frontend && npm run build && npx vercel --prod"
