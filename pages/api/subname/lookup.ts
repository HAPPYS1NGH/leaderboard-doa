import { NextApiRequest, NextApiResponse } from 'next';
import client from "../../../lib/namespace";

// Define the request body type
interface LookupEnsRequest {
    addresses: string[];
}

// Define the response type
interface EnsLookupResult {
    address: string;
    ensName?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
         const body: LookupEnsRequest = req.body;

        // Validate required fields
        if (!body.addresses || !Array.isArray(body.addresses)) {
            return res.status(400).json({
                error: 'Missing required field: addresses (must be an array)'
            });
        }

        console.log("Looking up ENS names for addresses:", body.addresses.length);

        const results: EnsLookupResult[] = [];

        try {
            // Get all subnames under deptofagri.eth at once
            const allSubnamesResponse = await client.getFilteredSubnames({
                parentName: "deptofagri.eth",
                size: 1000 // Get up to 1000 subnames at once
            });

            // Create a map of address -> ENS name for quick lookup
            const addressToEns = new Map<string, string>();
            
            if (allSubnamesResponse?.items) {
                allSubnamesResponse.items.forEach(subname => {
                    // Check if this subname has sender metadata
                    const senderMetadata = subname.metadata?.sender;
                    if (senderMetadata) {
                        const normalizedSender = senderMetadata.toLowerCase().trim();
                        addressToEns.set(normalizedSender, subname.fullName);
                    }
                });
            }

            // Build results for requested addresses
            for (const address of body.addresses) {
                const normalizedAddress = address.toLowerCase().trim();
                const ensName = addressToEns.get(normalizedAddress);
                results.push({
                    address: address, // Return original address format for consistency
                    ensName: ensName
                });
            }

        } catch (error) {
            console.error('Error in batch ENS lookup:', error);
            // Fallback: return empty results for all addresses
            for (const address of body.addresses) {
                results.push({
                    address: address,
                    ensName: undefined
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: results,
            message: `Looked up ${results.length} addresses`
        });

    } catch (error) {
        console.error('Error in ENS lookup:', error);

        return res.status(500).json({
            error: 'Failed to lookup ENS names',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}