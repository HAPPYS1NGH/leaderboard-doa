# Quick Setup Guide

## 1. Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
PRIVY_APP_SECRET=your_privy_app_secret_here
SESSION_SIGNER_SECRET=your_session_signer_secret_here
BASESCAN_API_KEY=your_basescan_api_key_here
```

## 2. Get Privy Credentials

1. Go to [Privy Console](https://console.privy.io)
2. Create a new app or use existing one
3. Copy the App ID and App Secret
4. Generate a Session Signer Secret

## 3. Get Basescan API Key

1. Go to [Basescan](https://basescan.org)
2. Create a free account
3. Navigate to the API section in your account dashboard
4. Generate a new API key
5. Copy the API key to your `.env.local` file

> **Note:** The Basescan API key is used to verify USDC transactions on Base blockchain to ensure users have the authority to claim subnames for specific addresses.

## 4. Test the Integration

1. Run the development server: `npm run dev`
2. Visit `http://localhost:3000/claim`
3. Click "Connect Wallet"
4. Connect your wallet
5. Click "Sign Message & Claim"

## 5. Current Status

✅ **Working Features:**

- Server-side authentication
- Real message signing
- Multi-chain support (Ethereum/Solana)
- Beautiful UI with proper error handling
- Dynamic navigation based on auth state

🔄 **Ready for Production:**

- Add your Privy credentials
- Test end-to-end flow
- Connect to your reward system
