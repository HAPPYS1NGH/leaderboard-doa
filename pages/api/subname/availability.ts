import { NextApiRequest, NextApiResponse } from 'next';
import client from '../../../lib/namespace';

type AvailabilityReason = 'reserved' | 'farcaster_taken' | 'ens_taken' | 'invalid' | 'verification_failed';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const labelParam = (req.query.label || '').toString();
  const label = labelParam.toLowerCase().trim();

  if (!label) {
    return res.status(400).json({ success: false, error: 'label parameter is required' });
  }

  // Validate label format first
  if (!/^[a-z0-9]{3,63}$/.test(label)) {
    return res.status(200).json({
      success: true,
      available: false,
      reason: 'invalid' as AvailabilityReason,
      message: 'Label must be 3-63 chars and only lowercase letters and numbers'
    });
  }

  // Reserved range 1-100
  const numericLabel = parseInt(label, 10);
  if (!isNaN(numericLabel) && numericLabel >= 1 && numericLabel <= 100) {
    return res.status(200).json({
      success: true,
      available: false,
      reason: 'reserved' as AvailabilityReason,
      message: 'Labels 1-100 are reserved'
    });
  }

  // Farcaster check via Neynar, if configured. If we cannot verify, we must not show as available.
  try {
    if (process.env.NEYNAR_API_KEY) {
      const fcResp = await fetch(`https://api.neynar.com/v2/farcaster/fname/availability/?fname=${label}`, {
        method: 'GET',
        headers: {
          'x-api-key': process.env.NEYNAR_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (fcResp.ok) {
        const data = await fcResp.json();
        if (data && data.available === false) {
          return res.status(200).json({
            success: true,
            available: false,
            reason: 'farcaster_taken' as AvailabilityReason,
            message: 'Taken on Farcaster'
          });
        }
      } else {
        // Treat inability to verify as not available to prevent false positives
        return res.status(200).json({
          success: true,
          available: false,
          reason: 'verification_failed' as AvailabilityReason,
          message: 'Unable to verify Farcaster availability right now'
        });
      }
    } else {
      // No API key configured; do not show as available to avoid misleading UX
      return res.status(200).json({
        success: true,
        available: false,
        reason: 'verification_failed' as AvailabilityReason,
        message: 'Farcaster verification not configured'
      });
    }
  } catch (err) {
    return res.status(200).json({
      success: true,
      available: false,
      reason: 'verification_failed' as AvailabilityReason,
      message: 'Error verifying Farcaster availability'
    });
  }

  // ENS subname availability under parent
  const fullName = `${label}.deptofagri.eth`;
  try {
    const isAvailable = await client.isSubnameAvailable(fullName);
    if (!isAvailable) {
      return res.status(200).json({
        success: true,
        available: false,
        reason: 'ens_taken' as AvailabilityReason,
        message: 'Already registered'
      });
    }
  } catch (availabilityError) {
    // If ENS availability cannot be checked, err on the side of not available
    return res.status(200).json({
      success: true,
      available: false,
      reason: 'verification_failed' as AvailabilityReason,
      message: 'Unable to verify ENS availability'
    });
  }

  return res.status(200).json({ success: true, available: true });
}


