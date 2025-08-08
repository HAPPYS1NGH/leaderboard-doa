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

        // Create the subname
        const result = await client.createSubname({
            label: body.label,
            parentName: "deptofagri.eth",
            addresses: [{ chain: ChainName.Ethereum, value: body.address }],
            metadata: [{ key: "sender", value: body.address }]

        });

        return res.status(200).json({
            success: true,
            data: result,
            message: 'Subname created successfully'
        });

    } catch (error) {
        console.error('Error creating subname:', error);

        return res.status(500).json({
            error: 'Failed to create subname',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}