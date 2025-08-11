import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Configuration
const API_URL = "https://api.basescan.org/api";
const API_KEY = process.env.BASESCAN_API_KEY;
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC contract on Base

/**
 * Traces all addresses that a given address has sent USDC to
 * @param {string} address - The address to trace
 * @returns {Promise<Array<string>>} Array of destination addresses
 */
async function traceUsdcDestinations(address: string): Promise<string[]> {
  const params = {
    module: "account",
    action: "tokentx",
    contractaddress: USDC_CONTRACT,
    address: address,
    startblock: 0,
    endblock: 99999999,
    sort: "desc",
    apikey: API_KEY,
  };

  try {
    console.log(`Tracing USDC destinations for address: ${address}`);
    
    const response = await axios.get(API_URL, { params, timeout: 30000 });
    const data = response.data;

    if (data.status === "1" && Array.isArray(data.result)) {
      // Filter for transfers where this address was the sender
      const sentTransfers = data.result.filter(
        (tx: any) => tx.from.toLowerCase() === address.toLowerCase()
      );

      // Extract unique destination addresses
      const destinations = new Set<string>();
      for (const transfer of sentTransfers) {
        destinations.add(transfer.to);
      }

      const destinationArray = Array.from(destinations);
      console.log(`Found ${destinationArray.length} unique destinations`);
      
      return destinationArray;
    } else {
      console.log(`Failed to fetch transfers: ${data.message || "Unknown error"}`);
      return [];
    }
  } catch (error: any) {
    console.error(`Error tracing destinations: ${error.message}`);
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  // Validate address format
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: "Invalid Ethereum address format" });
  }

  try {
    const destinations = await traceUsdcDestinations(address);
    
    return res.status(200).json({
      success: true,
      address: address.toLowerCase(),
      destinations: destinations.map(addr => addr.toLowerCase()),
      count: destinations.length
    });
  } catch (error: any) {
    console.error("Error in trace-destinations API:", error);
    return res.status(500).json({ 
      error: "Failed to trace USDC destinations",
      message: error.message 
    });
  }
}
