# Privy Integration Setup

This project includes proper Privy authentication with server-side authentication checks and real message signing functionality.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
PRIVY_APP_SECRET=your_privy_app_secret_here
SESSION_SIGNER_SECRET=your_session_signer_secret_here
```

## Features

### 1. Server-Side Authentication

- **Proper Authentication Flow**: Uses `getServerSideProps` to verify authentication tokens on the server
- **Cookie-Based Auth**: Leverages Privy's cookie-based authentication system
- **Single Page Flow**: All authentication and signing happens on `/claim` page
- **Secure Token Verification**: Server-side token validation using PrivyClient

### 2. Real Message Signing

- **Server-Side Signing**: Uses Privy's server-side wallet API for secure message signing
- **Multi-Chain Support**: Supports Ethereum and Solana message signing
- **Token-Based Security**: Uses access tokens for API authentication
- **Real Signatures**: Generates actual cryptographic signatures, not mock data

### 3. Page Structure

- **`/claim`**: Single page handling both authentication and message signing
- **`/`**: Public leaderboard with authentication-aware UI
- **Navigation**: Dynamic navigation based on authentication state

## API Endpoints

### Ethereum Signing

- `POST /api/ethereum/personal_sign`
- Requires: `message`, `wallet_id`
- Returns: `signature` in hex format

### Solana Signing

- `POST /api/solana/sign_message`
- Requires: `message`, `wallet_id`
- Returns: `signature` in base64 format

## Authentication Flow

1. **User visits `/claim`**: Server checks for existing auth token
2. **If not authenticated**: Shows login interface with "Connect Wallet" button
3. **User clicks "Connect Wallet"**: Privy modal opens for wallet connection
4. **User connects wallet**: Privy handles authentication
5. **On completion**: Page refreshes and shows signing interface
6. **User clicks "Sign Message & Claim"**: Real message signing occurs

## Server-Side Implementation

### Claim Page (`/claim`)

```typescript
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieAuthToken = req.cookies["privy-token"];
  // Verify token and pass user claims to component
};
```

### Main Page (`/`)

```typescript
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieAuthToken = req.cookies["privy-token"];
  // Check authentication status for UI customization
};
```

## Usage

1. Set up your Privy app in the Privy dashboard
2. Add the environment variables
3. Run the development server: `npm run dev`
4. Navigate to `/claim` to start the authentication flow
5. Connect your wallet and test the message signing

## Security Features

- **Server-Side Token Verification**: All authentication is verified on the server
- **Secure API Endpoints**: Protected with proper authorization headers
- **Cookie-Based Sessions**: Uses secure HTTP-only cookies
- **Real Cryptographic Signatures**: Actual message signing, not mock data

## Next Steps

To complete the integration:

1. Add your Privy credentials to the environment variables
2. Test the authentication flow end-to-end
3. Implement signature verification on your backend
4. Connect to your reward distribution system
5. Add rate limiting and additional security measures
6. Implement proper error handling for edge cases
