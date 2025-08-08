import { useState } from "react";
import Head from "next/head";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { PrivyClient } from "@privy-io/server-auth";
import { GetServerSideProps } from "next";
import Navigation from "../components/Navigation";
import axios from "axios";

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieAuthToken = req.cookies["privy-token"];

  // If no cookie is found, skip any further checks
  if (!cookieAuthToken) return { props: {} };

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    console.error("Missing Privy environment variables");
    return { props: {} };
  }

  const client = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

  try {
    const claims = await client.verifyAuthToken(cookieAuthToken);
    console.log({ claims });

    return {
      props: {
        userClaims: claims,
      },
    };
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return { props: {} };
  }
};

export default function ClaimPage() {
  const { login } = useLogin();
  const { authenticated, user, logout, getAccessToken } = usePrivy();
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSignMessage = async () => {
    if (!user) return;

    setIsSigning(true);
    setError("");

    try {
      // Get the access token for API calls
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Failed to get access token");
      }

      // Create the message to sign
      const message = `I am signing this message to verify my identity for the Tap Day Leaderboard claim.\n\nTimestamp: ${Date.now()}`;

      // Get the user's wallet information
      const wallet = user.wallet;
      if (!wallet) {
        throw new Error("No wallet found. Please connect your wallet first.");
      }

      // For now, we'll use a simplified approach
      // In production, you would get the wallet ID from the user's linked accounts
      const walletId = wallet.address; // Using address as a fallback
      const chainType = wallet.chainType || "ethereum";

      const endpoint =
        chainType === "solana"
          ? "/api/solana/sign_message"
          : "/api/ethereum/personal_sign";

      const response = await axios.post(
        endpoint,
        {
          message,
          wallet_id: walletId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const responseSignature = response.data.data.signature;
      setSignature(responseSignature);

      console.log("Signed message:", responseSignature);
      console.log("User wallet address:", wallet.address);
      console.log("User linked accounts:", user.linkedAccounts);
    } catch (error) {
      console.error("Error signing message:", error);
      setError(
        error instanceof Error ? error.message : "Failed to sign message"
      );
    } finally {
      setIsSigning(false);
    }
  };

  const handleLogout = () => {
    logout();
    setSignature("");
    setError("");
  };

  return (
    <>
      <Head>
        <title>Claim - The Tap Day Leaderboard</title>
        <meta
          name="description"
          content="Claim your rewards from the Tap Day Leaderboard"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navigation />

      <div className="min-h-screen bg-gradient-to-br from-forest/5 to-cream/30">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-futura-bold text-forest mb-4">
              🏆 Claim Your Rewards
            </h1>
            <p className="text-lg text-forest/70 max-w-2xl mx-auto">
              Connect your wallet and sign a message to verify your identity and
              claim your rewards from the Tap Day Leaderboard.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-forest/10 p-8 max-w-2xl mx-auto">
            {!authenticated ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-24 h-24 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔐</span>
                  </div>
                  <h2 className="text-2xl font-futura-bold text-forest mb-2">
                    Connect Your Wallet
                  </h2>
                  <p className="text-forest/60">
                    Sign in with your wallet to access your rewards
                  </p>
                </div>

                <button
                  onClick={() => {
                    console.log("login");
                    login();
                  }}
                  className="bg-forest hover:bg-forest/90 text-cream font-futura-bold py-3 px-8 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h2 className="text-2xl font-futura-bold text-forest mb-2">
                    Wallet Connected
                  </h2>
                  <p className="text-sm text-forest/60 font-mono bg-forest/5 p-2 rounded-lg">
                    {user?.wallet?.address?.slice(0, 6)}...
                    {user?.wallet?.address?.slice(-4)}
                  </p>
                  <p className="text-xs text-forest/40 mt-1">
                    Chain: {user?.wallet?.chainType || "Unknown"}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-red-600 mr-2">❌</span>
                      <span className="font-futura-bold text-red-800">
                        Error
                      </span>
                    </div>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    onClick={handleSignMessage}
                    disabled={isSigning}
                    className="w-full bg-forest hover:bg-forest/90 disabled:bg-forest/50 text-cream font-futura-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  >
                    {isSigning ? "Signing..." : "Sign Message & Claim"}
                  </button>

                  {signature && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-green-600 mr-2">✅</span>
                        <span className="font-futura-bold text-green-800">
                          Message Signed Successfully!
                        </span>
                      </div>
                      <p className="text-sm text-green-700">
                        Your signature has been recorded. Your rewards will be
                        processed shortly.
                      </p>
                      <div className="mt-3 p-2 bg-green-100 rounded text-xs font-mono text-green-800 break-all">
                        {signature.slice(0, 50)}...
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-forest font-futura-bold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-forest/50">
              By connecting your wallet and signing the message, you agree to
              our terms of service.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
