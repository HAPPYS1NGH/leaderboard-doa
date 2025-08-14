import { useState, useEffect } from "react";
import Head from "next/head";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { PrivyClient } from "@privy-io/server-auth";
import { GetServerSideProps } from "next";
import Navigation from "../components/Navigation";
import leaderboardData from "../constants/usdc_transfer_leaderboard.json";
import clientSideClient from "../lib/namespace-client";

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

type LeaderboardEntry = {
  totalUsdcSent: string;
  transactionCount: number;
  destinationAddresses: string[];
};

type LeaderboardData = Record<string, LeaderboardEntry>;

export default function ClaimPage() {
  const { login } = useLogin();
  const { authenticated, user, logout } = usePrivy();
  const [error, setError] = useState<string>("");

  // Subname claiming states
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [subnameLabel, setSubnameLabel] = useState<string>("");
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "checking" | "available" | "unavailable" | "idle"
  >("idle");
  const [isCreatingSubname, setIsCreatingSubname] = useState(false);
  const [subnameCreated, setSubnameCreated] = useState<string>("");
  const [eligibleAddresses, setEligibleAddresses] = useState<string[]>([]);
  const [showSubnameForm, setShowSubnameForm] = useState(false);
  const [existingSubnames, setExistingSubnames] = useState<string[]>([]);
  const [isLoadingSubnames, setIsLoadingSubnames] = useState(false);
  const [manualAddress, setManualAddress] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [isValidatingEligibility, setIsValidatingEligibility] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

  // Check eligible addresses when user connects using live blockchain data
  const checkEligibleAddresses = async () => {
    if (!user?.wallet?.address) return;

    const connectedAddress = user.wallet.address.toLowerCase();
    setIsValidatingEligibility(true);
    setError("");
    setValidationError("");

    try {
      // First check static leaderboard for eligible sender addresses
      const staticEligible = findEligibleAddresses(connectedAddress);
      
      if (staticEligible.length === 0) {
        setEligibleAddresses([]);
        setShowSubnameForm(false);
        return;
      }

      // For each eligible address, verify authority using live blockchain data
      const authorizedAddresses: string[] = [];
      
      for (const eligibleAddress of staticEligible) {
        // If connected address is the sender, they can claim for themselves
        if (connectedAddress === eligibleAddress.toLowerCase()) {
          authorizedAddresses.push(eligibleAddress);
          continue;
        }
        
        // Otherwise, verify they received USDC from this sender using live data
        try {
          const response = await fetch("/api/trace-destinations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: eligibleAddress }),
          });

          const result = await response.json();
          
          if (response.ok && result.success) {
            const destinations = result.destinations || [];
            if (destinations.includes(connectedAddress)) {
              authorizedAddresses.push(eligibleAddress);
            }
          }
        } catch (error) {
          console.warn(`Failed to verify authority for ${eligibleAddress}:`, error);
          // If API fails, fall back to static data for this address
          const eligibleAddressData = (leaderboardData as LeaderboardData)[eligibleAddress.toLowerCase()];
          if (eligibleAddressData?.destinationAddresses.some(
            dest => dest.toLowerCase() === connectedAddress
          )) {
            authorizedAddresses.push(eligibleAddress);
          }
        }
      }

      // Filter out addresses that already have subnames
      const addressesWithoutSubnames: string[] = [];
      
      for (const address of authorizedAddresses) {
        try {
          const response = await fetch('/api/subname/lookup', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addresses: [address] }),
          });
          
          const result = await response.json();
          
          if (response.ok && result.success) {
            const addressResult = result.data.find((item: any) => 
              item.address.toLowerCase() === address.toLowerCase()
            );
            
            // Only include addresses that don't have an ENS name yet
            if (!addressResult?.ensName) {
              addressesWithoutSubnames.push(address);
            }
          } else {
            // If lookup fails, include the address (benefit of doubt)
            addressesWithoutSubnames.push(address);
          }
        } catch (error) {
          console.warn(`Failed to check existing subname for ${address}:`, error);
          // If lookup fails, include the address (benefit of doubt)
          addressesWithoutSubnames.push(address);
        }
      }

      setEligibleAddresses(addressesWithoutSubnames);
      
      if (addressesWithoutSubnames.length > 0 && addressesWithoutSubnames[0]) {
        setSelectedAddress(addressesWithoutSubnames[0]);
        setShowSubnameForm(true);
      } else if (authorizedAddresses.length > 0) {
        // All authorized addresses already have subnames - this is actually good!
        setError(""); // Clear any previous errors
        setShowSubnameForm(false);
        // Set a special state to show success message
        setEligibleAddresses(authorizedAddresses); // Keep them to show the success state
      }
    } catch (error) {
      console.error("Error checking eligible addresses:", error);
      setError("Failed to verify eligibility. Please try again.");
      setEligibleAddresses([]);
      setShowSubnameForm(false);
    } finally {
      setIsValidatingEligibility(false);
    }
  };

  // Helper function to find eligible addresses for any given address (from leaderboard data)
  const findEligibleAddresses = (inputAddress: string): string[] => {
    const address = inputAddress.toLowerCase();
    const typedLeaderboardData = leaderboardData as LeaderboardData;
    const eligible: string[] = [];

    // Check if address is in leaderboard as a sender (key)
    if (typedLeaderboardData[address]) {
      eligible.push(address); // Can claim subname for themselves (the sender)
    }

    // Check if address is a destination address for any sender
    for (const [senderAddress, data] of Object.entries(typedLeaderboardData)) {
      if (
        data.destinationAddresses.some((dest) => dest.toLowerCase() === address)
      ) {
        // If this address received USDC, they can claim for the sender who sent to them
        if (!eligible.includes(senderAddress.toLowerCase())) {
          eligible.push(senderAddress.toLowerCase());
        }
      }
    }

    return eligible;
  };

  // Validate eligibility using live USDC transaction data
  const validateEligibilityWithAPI = async (
    connectedAddress: string,
    senderAddress: string
  ): Promise<boolean> => {
    setIsValidatingEligibility(true);
    setValidationError("");

    try {
      // If connected address is the sender, they can always claim for themselves
      if (connectedAddress.toLowerCase() === senderAddress.toLowerCase()) {
        return true;
      }

      // Check if the sender has sent USDC to the connected address
      const response = await fetch("/api/trace-destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: senderAddress }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const destinations = result.destinations || [];
        const hasReceivedFromSender = destinations.includes(
          connectedAddress.toLowerCase()
        );

        if (!hasReceivedFromSender) {
          setValidationError(
            `The connected address has not received USDC from ${senderAddress.slice(
              0,
              6
            )}...${senderAddress.slice(
              -4
            )} according to Base blockchain records.`
          );
          return false;
        }

        return true;
      } else {
        console.error("API validation failed:", result.error);
        setValidationError(
          "Failed to validate eligibility. Please try again."
        );
        return false;
      }
    } catch (error) {
      console.error("Error validating eligibility:", error);
      setValidationError(
        "Network error during validation. Please try again."
      );
      return false;
    } finally {
      setIsValidatingEligibility(false);
    }
  };

  // Handle manual address input and check eligibility using live blockchain data
  const checkManualAddress = async () => {
    if (
      !manualAddress ||
      manualAddress.length !== 42 ||
      !manualAddress.startsWith("0x")
    ) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    const connectedAddress = user?.wallet?.address?.toLowerCase();
    if (!connectedAddress) {
      setError("Please connect your wallet first to check claiming authority.");
      setEligibleAddresses([]);
      setShowSubnameForm(false);
      return;
    }

    setIsValidatingEligibility(true);
    setError("");
    setValidationError("");

    try {
      // Query live blockchain data to get all addresses this manual address has sent USDC to
      const response = await fetch("/api/trace-destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: manualAddress }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.error || "Failed to fetch USDC transaction data from blockchain"
        );
        setEligibleAddresses([]);
        setShowSubnameForm(false);
        return;
      }

      const destinations = result.destinations || [];
      
      // Check authority based on live blockchain data
      let hasAuthority = false;
      let authorityReason = "";

      // Case 1: Connected wallet is the same as the manual address (sender can claim for themselves)
      if (connectedAddress === manualAddress.toLowerCase()) {
        hasAuthority = true;
        authorityReason = "You are the sender address";
      }
      // Case 2: Connected wallet received USDC from this sender
      else if (destinations.includes(connectedAddress)) {
        hasAuthority = true;
        authorityReason = "You received USDC from this sender";
      }

      if (hasAuthority) {
        // Also verify the address is in our leaderboard (has meaningful USDC activity)
        const leaderboardEntry = (leaderboardData as LeaderboardData)[manualAddress.toLowerCase()];
        
        if (!leaderboardEntry) {
          setError(
            `Address ${manualAddress.slice(0, 6)}...${manualAddress.slice(-4)} is not found in the Tap Day Leaderboard. Only addresses that participated in the leaderboard can have subnames assigned.`
          );
          setEligibleAddresses([]);
          setShowSubnameForm(false);
          return;
        }

        // Check if this address already has a subname before showing the form
        try {
          const response = await fetch('/api/subname/lookup', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addresses: [manualAddress.toLowerCase()] }),
          });
          
          const result = await response.json();
          
          if (response.ok && result.success) {
            const addressResult = result.data.find((item: any) => 
              item.address.toLowerCase() === manualAddress.toLowerCase()
            );
            
            if (addressResult?.ensName) {
              // Address already has a subname
              setError(`Address ${manualAddress.slice(0, 6)}...${manualAddress.slice(-4)} already has a subname: ${addressResult.ensName}. No further action needed!`);
              setEligibleAddresses([]);
              setShowSubnameForm(false);
              return;
            }
          }
        } catch (lookupError) {
          console.warn('Failed to check existing subname, proceeding anyway:', lookupError);
        }

        // Success - show the form
        setEligibleAddresses([manualAddress.toLowerCase()]);
        setSelectedAddress(manualAddress.toLowerCase());
        setShowSubnameForm(true);
        setError("");
        
        // Show success message with authority reason
        console.log(`✅ Authority confirmed: ${authorityReason}`);
      } else {
        setError(
          `Your connected wallet (${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}) does not have authority to claim subnames for ${manualAddress.slice(0, 6)}...${manualAddress.slice(-4)}. You can only claim for addresses you are the sender of, or addresses that sent USDC to you according to live blockchain records.`
        );
        setEligibleAddresses([]);
        setShowSubnameForm(false);
      }
    } catch (error) {
      console.error("Error checking manual address:", error);
      setError("Network error while checking blockchain data. Please try again.");
      setEligibleAddresses([]);
      setShowSubnameForm(false);
    } finally {
      setIsValidatingEligibility(false);
    }
  };

  // Reset to wallet-based checking
  const resetToWalletCheck = async () => {
    setManualAddress("");
    setShowManualInput(false);
    setError("");
    setValidationError("");
    setIsValidatingEligibility(false);
    if (authenticated && user?.wallet?.address) {
      await checkEligibleAddresses();
    } else {
      setEligibleAddresses([]);
      setShowSubnameForm(false);
    }
  };

  // Check existing subnames for an address
  const checkExistingSubnames = async (address: string) => {
    if (!address) return;

    setIsLoadingSubnames(true);
    try {
      const response = await fetch('/api/subname/lookup', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: [address] }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Extract ENS names from the result
        const addressResult = result.data.find((item: any) => 
          item.address.toLowerCase() === address.toLowerCase()
        );
        const existingEnsNames = addressResult?.ensName ? [addressResult.ensName] : [];
        setExistingSubnames(existingEnsNames);
      } else {
        console.error("Failed to lookup existing subnames:", result.error);
        setExistingSubnames([]);
      }
    } catch (error) {
      console.error("Error looking up existing subnames:", error);
      setExistingSubnames([]);
    } finally {
      setIsLoadingSubnames(false);
    }
  };

  // Check subname availability with debouncing
  const checkAvailability = async (label: string) => {
    if (!label || label.length < 3) {
      setAvailabilityStatus("idle");
      return;
    }

    setAvailabilityStatus("checking");

    try {
      const fullName = `${label}.deptofagri.eth`;
      const isAvailable = await clientSideClient.isSubnameAvailable(fullName);
      setAvailabilityStatus(isAvailable ? "available" : "unavailable");
    } catch (error) {
      console.error("Error checking availability:", error);
      setError("Failed to check availability");
      setAvailabilityStatus("idle");
    }
  };

  // Handle subname label change with debounced availability check
  const handleLabelChange = (value: string) => {
    setSubnameLabel(value);
    setError("");

    // Debounce availability check
    const timeoutId = setTimeout(() => {
      checkAvailability(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Create subname
  const createSubname = async () => {
    if (!selectedAddress || !subnameLabel) {
      setError("Please select an address and enter a label");
      return;
    }

    if (availabilityStatus !== "available") {
      setError("Please choose an available subname");
      return;
    }

    if (existingSubnames.length > 0) {
      setError(
        `This address already has a subname: ${existingSubnames[0]}. Only one subname per address is allowed.`
      );
      return;
    }

    // Final validation using live blockchain data before creating subname
    const connectedAddr = showManualInput
      ? manualAddress
      : user?.wallet?.address;
    
    if (!connectedAddr) {
      setError("No address available for validation");
      return;
    }

    // Double-check authority using live blockchain data
    const isValid = await validateEligibilityWithAPI(
      connectedAddr,
      selectedAddress
    );
    
    if (!isValid) {
      setError(
        validationError ||
          "Final blockchain validation failed. You can only claim subnames for addresses you have sent/received USDC with according to live Base blockchain records."
      );
      return;
    }

    setIsCreatingSubname(true);
    setError("");

    try {
      const response = await fetch("/api/subname/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: subnameLabel,
          address: selectedAddress,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubnameCreated(`${subnameLabel}.deptofagri.eth`);
        setSubnameLabel("");
        setAvailabilityStatus("idle");
        
        // Signal other tabs/pages to refresh ENS names
        if (result.refreshSignal) {
          localStorage.setItem('ensRefreshNeeded', 'true');
          // Also trigger a storage event for the current tab
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'ensRefreshNeeded',
            newValue: 'true'
          }));
        }
      } else {
        // Handle different error types
        if (response.status === 409 && result.existing) {
          // Duplicate error with existing subname info
          setError(`${result.error}: ${result.existing}`);
        } else {
          setError(result.error || "Failed to create subname");
        }
      }
    } catch (error) {
      console.error("Error creating subname:", error);
      setError("Failed to create subname");
    } finally {
      setIsCreatingSubname(false);
    }
  };

  // Check eligible addresses when user authenticates
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      checkEligibleAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user?.wallet?.address]);

  // Check existing subnames when selected address changes
  useEffect(() => {
    if (selectedAddress) {
      checkExistingSubnames(selectedAddress);
      // Clear previous form state when switching addresses
      setSubnameLabel("");
      setAvailabilityStatus("idle");
      setError("");
    }
  }, [selectedAddress]);

  const handleLogout = () => {
    logout();
    setError("");
    setSubnameCreated("");
    setSubnameLabel("");
    setSelectedAddress("");
    setEligibleAddresses([]);
    setShowSubnameForm(false);
    setAvailabilityStatus("idle");
    setExistingSubnames([]);
    setIsLoadingSubnames(false);
    setManualAddress("");
    setShowManualInput(false);
    setValidationError("");
    setIsValidatingEligibility(false);
  };

  return (
    <>
      <Head>
        <title>Assign Subnames - The Tap Day Leaderboard</title>
        <meta
          name="description"
          content="Assign custom deptofagri.eth subnames to eligible sender addresses from the Tap Day Leaderboard"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navigation />

      <div className="min-h-screen bg-gradient-to-br from-forest/5 to-cream/30">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-futura-bold text-forest mb-3">
              🏆 Claim Your Subname
            </h1>
            <p className="text-base md:text-lg text-forest/70 max-w-2xl mx-auto mb-6">
              Get your custom deptofagri.eth name from the Tap Day Leaderboard
            </p>

            {/* Quick guide */}
            <div className="bg-forest/5 rounded-xl p-4 md:p-6 max-w-2xl mx-auto">
              <h3 className="text-base md:text-lg font-futura-bold text-forest mb-3">
                Quick Guide
              </h3>
              <div className="text-xs md:text-sm text-forest/70 space-y-1.5">
                <p>• Connect wallet → Check eligibility</p>
                <p>• Send USDC to the connected address from hat account</p>
                <p>• Pick name → Get .deptofagri.eth</p>
                <p>• One subname per Hat</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-forest/10 p-6 md:p-8 max-w-2xl mx-auto">
            {!authenticated ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl md:text-3xl">🔐</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-futura-bold text-forest mb-2">
                    Connect Wallet
                  </h2>
                  <p className="text-sm md:text-base text-forest/60">
                    Sign in to claim your subname
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

                {/* Alternative: Manual Address Check */}
                <div className="mt-6 pt-6 border-t border-forest/10">
                  <p className="text-xs md:text-sm text-forest/60 mb-3">
                    Check different address?<br/>
                    <span className="text-xs text-forest/50">
                      (Connect wallet first)
                    </span>
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full p-3 border border-forest/20 rounded-lg font-mono text-sm focus:border-forest focus:outline-none"
                      disabled
                    />
                    <button
                      disabled
                      className="w-full bg-forest/10 text-forest/50 font-futura-bold py-2 px-4 rounded-lg cursor-not-allowed text-sm"
                    >
                      Connect Wallet First
                    </button>
                  </div>
                  <p className="text-xs text-forest/50 mt-2">
                    Connect wallet to verify authority
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-futura-bold text-forest mb-2">
                    Connected
                  </h2>
                  <p className="text-xs md:text-sm text-forest/60 font-mono bg-forest/5 p-2 rounded-lg">
                    {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                  </p>
                  <p className="text-xs text-forest/40 mt-1">
                    {user?.wallet?.chainType || "Unknown"}
                  </p>

                  {/* Manual Address Option Toggle */}
                  <div className="mt-4">
                    <button
                      onClick={() => setShowManualInput(!showManualInput)}
                      className="text-xs md:text-sm text-forest hover:text-forest/80 underline"
                    >
                      {showManualInput ? "Use wallet" : "Check other address"}
                    </button>
                  </div>
                </div>

                {/* Manual Address Input */}
                {showManualInput && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-blue-600 mr-2">🔍</span>
                        <span className="font-futura-bold text-blue-800 text-sm">
                          Check Address
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-blue-700 mb-3">
                        Enter address to check authority. Only claim for addresses you sent your USDC to.
                      </p>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          placeholder="0x..."
                          className="w-full p-3 border border-blue-300 rounded-lg font-mono text-sm focus:border-blue-500 focus:outline-none"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={checkManualAddress}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-futura-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                          >
                            Check Authority
                          </button>
                          <button
                            onClick={resetToWalletCheck}
                            className="px-4 py-2 text-blue-600 hover:text-blue-800 font-futura-bold text-sm"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Eligibility Status */}
                {eligibleAddresses.length === 0 &&
                  showSubnameForm === false &&
                  !isValidatingEligibility && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-orange-600 mr-2">⚠️</span>
                        <span className="font-futura-bold text-orange-800 text-sm">
                          No Authority
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-orange-700">
                        No authority to claim subnames. Only for addresses you sent your USDC to.
                      </p>
                    </div>
                  )}

                {/* All Addresses Already Have Subnames Success State */}
                {eligibleAddresses.length > 0 &&
                  showSubnameForm === false &&
                  !isValidatingEligibility && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-green-600 mr-2">🎉</span>
                        <span className="font-futura-bold text-green-800 text-sm">
                          All Set!
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-green-700 mb-2">
                        All addresses already have subnames! No action needed.
                      </p>
                      <p className="text-xs text-green-600">
                        Names are already on the leaderboard.
                      </p>
                    </div>
                  )}

                {/* Validation Status */}
                {isValidatingEligibility && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="font-futura-bold text-blue-800 text-sm">
                        Validating
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-blue-700">
                      Checking blockchain records...
                    </p>
                  </div>
                )}

                {/* Validation Error */}
                {validationError && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-orange-600 mr-2">⚠️</span>
                      <span className="font-futura-bold text-orange-800 text-sm">
                        Validation Failed
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-orange-700">{validationError}</p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-red-600 mr-2">❌</span>
                      <span className="font-futura-bold text-red-800 text-sm">
                        Error
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Subname Creation Success */}
                {subnameCreated && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-green-600 mr-2">🎉</span>
                      <span className="font-futura-bold text-green-800 text-sm">
                        Success!
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-green-700">
                      <strong>{subnameCreated}</strong> created and linked.
                    </p>
                  </div>
                )}

                {/* Subname Claiming Form */}
                {showSubnameForm && eligibleAddresses.length > 0 && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-blue-600 mr-2">✅</span>
                        <span className="font-futura-bold text-blue-800 text-sm">
                          Eligible!
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-blue-700">
                        {eligibleAddresses.length} address{eligibleAddresses.length > 1 ? "es" : ""} eligible
                      </p>
                      <div className="mt-2 text-xs text-blue-600">
                        {showManualInput
                          ? `From: ${manualAddress.slice(0, 6)}...${manualAddress.slice(-4)}`
                          : "From your wallet & leaderboard participation"}
                      </div>
                    </div>

                    {/* Address Selection */}
                    <div className="space-y-2">
                      <label className="block text-xs md:text-sm font-futura-bold text-forest">
                        Select Address:
                      </label>
                      <select
                        value={selectedAddress}
                        onChange={(e) => setSelectedAddress(e.target.value)}
                        className="w-full p-3 border border-forest/20 rounded-lg font-mono text-sm focus:border-forest focus:outline-none"
                      >
                        {eligibleAddresses.map((address) => {
                          const connectedWalletLower =
                            user?.wallet?.address?.toLowerCase();
                          const manualAddressLower =
                            manualAddress.toLowerCase();
                          const addressLower = address.toLowerCase();
                          const typedLeaderboardData =
                            leaderboardData as LeaderboardData;

                          let label = `${address.slice(0, 6)}...${address.slice(
                            -4
                          )}`;
                          let relationship = "";

                          // This is always a sender address (key in leaderboard)
                          if (addressLower === connectedWalletLower) {
                            relationship = " (You are the sender)";
                          } else if (addressLower === manualAddressLower) {
                            relationship = " (Checked address is sender)";
                          } else {
                            // Check if connected/manual address received from this sender
                            const checkAddress = showManualInput
                              ? manualAddressLower
                              : connectedWalletLower;
                            if (
                              checkAddress &&
                              typedLeaderboardData[
                                addressLower
                              ]?.destinationAddresses.some(
                                (dest) => dest.toLowerCase() === checkAddress
                              )
                            ) {
                              relationship = " (Sent USDC to you)";
                            } else {
                              relationship = " (Sender)";
                            }
                          }

                          return (
                            <option key={address} value={address}>
                              {label}
                              {relationship}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Existing Subnames Display */}
                    {selectedAddress && (
                      <div className="space-y-2">
                        <label className="block text-xs md:text-sm font-futura-bold text-forest">
                          Existing Subnames:
                        </label>
                        {isLoadingSubnames ? (
                          <div className="flex items-center space-x-2 text-sm text-forest/60">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-forest"></div>
                            <span>Loading existing subnames...</span>
                          </div>
                        ) : existingSubnames.length > 0 ? (
                          <div className="space-y-2">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center mb-2">
                                <span className="text-green-600 mr-2">🎉</span>
                                <span className="font-futura-bold text-green-800 text-sm">
                                  Already Has Subname!
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-green-700 mb-3">
                                Address already has ENS subname:
                              </p>
                              <div className="space-y-1">
                                {existingSubnames.map((subname, index) => (
                                  <div
                                    key={index}
                                    className="text-sm font-mono bg-green-100 p-3 rounded text-green-800 border border-green-300"
                                  >
                                    ✅ {subname}
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-green-600 mt-3">
                                ✨ All set! Subname is linked and on leaderboard.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-xs md:text-sm text-gray-600">
                              No existing subnames found.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subname Label Input */}
                    {existingSubnames.length === 0 && (
                      <div className="space-y-2">
                        <label className="block text-xs md:text-sm font-futura-bold text-forest">
                          Choose Subname:
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={subnameLabel}
                            onChange={(e) => {
                              const value = e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, "");
                              setSubnameLabel(value);
                              handleLabelChange(value);
                            }}
                            placeholder="Enter label (e.g., myname)"
                            className="w-full p-3 border border-forest/20 rounded-lg focus:border-forest focus:outline-none pr-32"
                            maxLength={63}
                          />
                          <span className="absolute right-3 top-3 text-sm text-forest/40">
                            .deptofagri.eth
                          </span>
                        </div>

                        {/* Availability Status */}
                        {subnameLabel.length >= 3 && (
                          <div className="flex items-center space-x-2 text-sm">
                            {availabilityStatus === "checking" && (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-forest"></div>
                                <span className="text-forest/60">
                                  Checking availability...
                                </span>
                              </>
                            )}
                            {availabilityStatus === "available" && (
                              <>
                                <span className="text-green-600">✅</span>
                                <span className="text-green-700 font-futura-bold">
                                  Available!
                                </span>
                              </>
                            )}
                            {availabilityStatus === "unavailable" && (
                              <>
                                <span className="text-red-600">❌</span>
                                <span className="text-red-700 font-futura-bold">
                                  Not available
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Create Subname Button */}
                        <button
                          onClick={createSubname}
                          disabled={
                            isCreatingSubname ||
                            isValidatingEligibility ||
                            availabilityStatus !== "available" ||
                            !selectedAddress ||
                            !subnameLabel
                          }
                          className="w-full bg-forest hover:bg-forest/90 disabled:bg-forest/50 text-cream font-futura-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                        >
                          {isValidatingEligibility
                            ? "Validating Eligibility..."
                            : isCreatingSubname
                            ? "Assigning Subname..."
                            : "Assign Subname"}
                        </button>
                        
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-forest font-futura-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-forest/50">
              By connecting wallet and claiming subname, you agree to terms of service.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
