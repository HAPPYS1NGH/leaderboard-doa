import { NextApiRequest, NextApiResponse } from 'next';
import { ChainName } from "@thenamespace/offchain-manager";
import client from "../../../lib/namespace";

// Define the request body type
interface CreateSubnameRequest {
    label: string;
    address: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log("CALLED CREATE");
    try {
        const body: CreateSubnameRequest = req.body;

        // Validate required fields
        if (!body.label || !body.address) {
            return res.status(400).json({
                error: 'Missing required fields: label and address are required'
            });
        }
        console.log("BODY", body);

        // Normalize inputs
        const normalizedLabel = body.label.toLowerCase().trim();
        const normalizedAddress = body.address.toLowerCase().trim();
        const fullSubname = `${normalizedLabel}.deptofagri.eth`;

        // Validate label format
        if (!/^[a-z0-9]{3,63}$/.test(normalizedLabel)) {
            return res.status(400).json({
                error: 'Label must be 3-63 characters long and contain only lowercase letters and numbers'
            });
        }

        // Check if the exact subname already exists using direct availability check
        try {
            const isAvailable = await client.isSubnameAvailable(fullSubname);
            if (!isAvailable) {
                return res.status(409).json({
                    error: 'Subname with this label already exists',
                    existing: fullSubname
                });
            }
        } catch (availabilityError) {
            console.error('Error checking subname availability:', availabilityError);
            return res.status(500).json({
                error: 'Failed to check subname availability',
                details: availabilityError instanceof Error ? availabilityError.message : 'Unknown error'
            });
        }

        // Check if this address already has a subname using metadata search
        const existingAddressCheck = await client.getFilteredSubnames({
            parentName: "deptofagri.eth",
            metadata: { "sender": normalizedAddress },
            size: 1
        });

        if (existingAddressCheck?.items && existingAddressCheck.items.length > 0) {
            const existingSubname = existingAddressCheck.items[0];
            if (existingSubname?.fullName) {
                return res.status(409).json({
                    error: 'Address already has a subname',
                    existing: existingSubname.fullName
                });
            }
        }

        // Create the subname using normalized values
        const result = await client.createSubname({
            label: normalizedLabel,
            parentName: "deptofagri.eth",
            addresses: [{ chain: ChainName.Ethereum, value: normalizedAddress }],
            metadata: [{ key: "sender", value: normalizedAddress }]
        });

        // Trigger cache refresh for leaderboard
        try {
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/subname/refresh-cache`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        } catch (refreshError) {
            console.log('Note: Could not trigger cache refresh:', refreshError);
            // Don't fail the creation if refresh fails
        }

        return res.status(200).json({
            success: true,
            data: result,
            message: 'Subname created successfully',
            refreshSignal: true // Signal frontend to refresh ENS cache
        });

    } catch (error) {
        console.error('Error creating subname:', error);

        return res.status(500).json({
            error: 'Failed to create subname',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}