import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fname } = req.query;

    if (!fname || typeof fname !== 'string') {
        return res.status(400).json({ error: 'fname parameter is required' });
    }

    if (!process.env.NEYNAR_API_KEY) {
        return res.status(500).json({ error: 'Neynar API key not configured' });
    }

    try {
        const response = await fetch(`https://api.neynar.com/v2/farcaster/fname/availability/?fname=${fname}`, {
            method: 'GET',
            headers: {
                'x-api-key': process.env.NEYNAR_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return res.status(200).json(data);
        } else {
            console.error('Neynar API error:', response.status, response.statusText);
            return res.status(response.status).json({ 
                error: 'Failed to check Farcaster fname availability',
                status: response.status 
            });
        }
    } catch (error) {
        console.error('Error checking Farcaster fname availability:', error);
        return res.status(500).json({ 
            error: 'Internal server error while checking Farcaster fname availability' 
        });
    }
}
