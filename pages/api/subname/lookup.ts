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
    avatar?: string;
    url?: string;
    fid?: string;
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

        console.log("Looking up ENS names and avatars for addresses:", body.addresses.length);

        const results: EnsLookupResult[] = [];

        try {
            // Get all subnames under deptofagri.eth at once
            const allSubnamesResponse = await client.getFilteredSubnames({
                parentName: "deptofagri.eth",
                size: 1000 // Get up to 1000 subnames at once
            });

            // Create maps for address -> ENS name, avatar, url, and fid for quick lookup
            const addressToEns = new Map<string, string>();
            const addressToAvatar = new Map<string, string>();
            const addressToUrl = new Map<string, string>();
            const addressToFid = new Map<string, string>();
            
            if (allSubnamesResponse?.items) {
                console.log(`Processing ${allSubnamesResponse.items.length} subnames`);
                allSubnamesResponse.items.forEach((subname) => {
                    // Use owner field directly instead of metadata
                    if (subname.owner) {
                        const normalizedOwner = subname.owner.toLowerCase().trim();
                        addressToEns.set(normalizedOwner, subname.fullName);
                        
                        // Get avatar, url, and fid from texts (which is a Record<string, string>)
                        if (subname.texts) {
                            if (subname.texts.avatar) {
                                addressToAvatar.set(normalizedOwner, subname.texts.avatar);
                                console.log(`Found avatar for ${subname.fullName}: ${subname.texts.avatar}`);
                            }
                            if (subname.texts.url) {
                                addressToUrl.set(normalizedOwner, subname.texts.url);
                                console.log(`Found url for ${subname.fullName}: ${subname.texts.url}`);
                            }
                            if (subname.texts.fid) {
                                addressToFid.set(normalizedOwner, subname.texts.fid);
                                console.log(`Found fid for ${subname.fullName}: ${subname.texts.fid}`);
                            }
                        }
                    }
                });
            }

            // Build results for requested addresses
            for (const address of body.addresses) {
                const normalizedAddress = address.toLowerCase().trim();
                const ensName = addressToEns.get(normalizedAddress);
                const avatar = addressToAvatar.get(normalizedAddress);
                const url = addressToUrl.get(normalizedAddress);
                const fid = addressToFid.get(normalizedAddress);
                results.push({
                    address: address, // Return original address format for consistency
                    ensName: ensName,
                    avatar: avatar || undefined,
                    url: url || undefined,
                    fid: fid || undefined
                });
            }

        } catch (error) {
            console.error('Error in batch ENS lookup:', error);
            // Fallback: return empty results for all addresses
            for (const address of body.addresses) {
                results.push({
                    address: address,
                    ensName: undefined,
                    avatar: undefined,
                    url: undefined,
                    fid: undefined
                });
            }
        }

        console.log(`Found ${results.filter(r => r.ensName).length} ENS names, ${results.filter(r => r.avatar).length} avatars, ${results.filter(r => r.url).length} URLs, and ${results.filter(r => r.fid).length} FIDs`);
        
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