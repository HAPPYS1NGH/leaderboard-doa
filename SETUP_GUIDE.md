# Quick Setup Guide

## 1. Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
PRIVY_APP_SECRET=your_privy_app_secret_here
SESSION_SIGNER_SECRET=your_session_signer_secret_here
```

## 2. Get Privy Credentials

1. Go to [Privy Console](https://console.privy.io)
2. Create a new app or use existing one
3. Copy the App ID and App Secret
4. Generate a Session Signer Secret

## 3. Test the Integration

1. Run the development server: `npm run dev`
2. Visit `http://localhost:3000/claim`
3. Click "Connect Wallet"
4. Connect your wallet
5. Click "Sign Message & Claim"

## 4. Current Status

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
