import { NextApiRequest, NextApiResponse } from 'next';
import client from "../../../lib/namespace";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { address } = req.query;
        console.log("ADDRESS", address);
        // Look up existing subnames for this address
        const existingSubnames = await client.getFilteredSubnames({
            parentName: "deptofagri.eth",
            metadata: { sender: address as string }
        });

        console.log("EXISTING SUBNAMES", existingSubnames);

        // Extract all the full subname labels from the items
        const subnameLabels = existingSubnames.items.map(item => item.fullName);

        return res.status(200).json({
            success: true,
            subnames: subnameLabels,
            address: address as string
        });

    } catch (error) {
        console.error('Error looking up subnames:', error);

        return res.status(500).json({
            error: 'Failed to lookup subnames',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
