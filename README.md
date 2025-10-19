# MetaNode Stake DApp

A modern, responsive DApp for staking ETH and earning MetaNode tokens. Built with Next.js, wagmi, and RainbowKit.

## Features

- **Stake ETH**: Deposit ETH to earn MetaNode rewards
- **Claim Rewards**: Claim accumulated MetaNode tokens
- **Withdraw**: Unstake and withdraw your ETH
- **Real-time Data**: Live updates of staked amounts and pending rewards
- **Responsive Design**: Works on desktop and mobile
- **Wallet Integration**: Connect with MetaMask and other wallets

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Web3**: wagmi v2, viem, RainbowKit
- **Animations**: Framer Motion
- **Notifications**: React Toastify
- **Icons**: React Icons

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_STAKE_ADDRESS=0x_your_contract_address_here
   ```

   **Important**: You must get a WalletConnect Project ID for RainbowKit to work properly.

3. **Get WalletConnect Project ID**:
   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy the Project ID

4. **Deploy Contract**:
   - Deploy the MetaNodeStake contract
   - Update `NEXT_PUBLIC_STAKE_ADDRESS` with the deployed address

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Contract Integration

The app uses wagmi's native hooks for contract interactions:

- `useReadContract` for reading contract state
- `useWriteContract` for executing transactions
- `useBalance` for wallet balance
- `useAccount` for wallet connection

### Key Contract Functions

- `depositETH()` - Stake ETH
- `claim(uint256 pid)` - Claim rewards
- `unstake(uint256 pid, uint256 amount)` - Unstake ETH
- `withdraw(uint256 pid)` - Withdraw unstaked ETH
- `stakingBalance(uint256 pid, address user)` - Get staked amount
- `pendingMetaNode(uint256 pid, address user)` - Get pending rewards
- `withdrawAmount(uint256 pid, address user)` - Get withdraw info

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home/Stake page
│   ├── claim/page.tsx      # Claim rewards page
│   ├── withdraw/page.tsx   # Withdraw page
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── layout.tsx          # App layout with providers
│   ├── header.tsx          # Navigation header
│   └── ui/                 # Reusable UI components
└── lib/                    # Utilities and config
    ├── wagmi.ts            # Wagmi configuration
    ├── contract.ts         # Contract ABI and addresses
    └── utils.ts            # Utility functions
```

## Usage

1. **Connect Wallet**: Click the connect button to link your wallet
2. **Stake ETH**: Enter amount and click "Stake ETH"
3. **Claim Rewards**: View and claim your MetaNode rewards
4. **Withdraw**: Unstake ETH and withdraw after cooldown period

## Development

- Uses minimal code with wagmi native operations
- No complex state management - relies on wagmi hooks
- Responsive design with Tailwind CSS
- Toast notifications for user feedback
- Real-time data updates
- RainbowKit with custom dark theme styling

## RainbowKit Styling

The project includes custom CSS to ensure RainbowKit components match the dark theme:

- Custom color variables for dark mode
- Gradient connect button styling
- Modal and dialog theming
- Consistent typography with the app

All RainbowKit styles are automatically applied and don't require additional configuration.

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to your preferred platform (Vercel, Netlify, etc.)

3. Update environment variables in your deployment platform

## License

MIT