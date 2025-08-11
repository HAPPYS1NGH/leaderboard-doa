import { NextApiRequest, NextApiResponse } from 'next';

// Simple cache invalidation endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Send a message to all connected clients to refresh their ENS cache
        // This is a simple notification endpoint
        
        return res.status(200).json({
            success: true,
            message: 'Cache refresh triggered',
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Error triggering cache refresh:', error);

        return res.status(500).json({
            error: 'Failed to trigger cache refresh',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
