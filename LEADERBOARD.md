# USDC Transfer Leaderboard

A modern, mobile-responsive leaderboard that displays USDC transfer data from the `constants/usdc_transfer_leaderboard.json` file.

## Features

- **No Login Required**: Anyone can view the leaderboard without authentication
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Sortable**: Sort by USDC amount or transaction count
- **Modern UI**: Clean, modern design with gradients and smooth animations
- **Real-time Stats**: Shows total participants, USDC transferred, and transaction count

## Pages

### `/leaderboard`

- Displays the USDC transfer leaderboard
- Shows wallet addresses, USDC amounts, and transaction counts
- Includes sorting controls and statistics
- Mobile-optimized with card layout on small screens

### `/` (Home)

- Login page with link to leaderboard
- Navigation between pages

## Data Structure

The leaderboard uses data from `constants/usdc_transfer_leaderboard.json` with the following structure:

```json
{
  "wallet_address": {
    "totalUsdcSent": "amount",
    "transactionCount": number,
    "transactionHashes": ["hash1", "hash2", ...]
  }
}
```

## Components

### Leaderboard.tsx

- Main leaderboard component
- Handles sorting and data display
- Responsive design with desktop table and mobile cards
- Statistics display

### Navigation.tsx

- Simple navigation bar
- Links between home and leaderboard pages

## Styling

- Uses Tailwind CSS for responsive design
- Custom gradients and shadows
- Hover effects and smooth transitions
- Mobile-first approach with responsive breakpoints

## Usage

1. Navigate to `/leaderboard` to view the leaderboard
2. Use the sort buttons to change the sorting criteria
3. View statistics at the bottom of the page
4. On mobile, the table converts to a card layout for better usability
