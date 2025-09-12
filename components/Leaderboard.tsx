import React, { useMemo, useState } from "react";
import leaderboardData from "../constants/usdc_transfer_leaderboard.json";
import { useEnsNames } from "../hooks/useEnsNames";
import { useEnsAvatars } from "../hooks/useEnsAvatars";
import { useLeaderboardData, SortBy } from "../hooks/useLeaderboardData";
import { Header } from "./leaderboard/Header";
import { SearchBox } from "./leaderboard/SearchBox";
import { SortControls } from "./leaderboard/SortControls";
import { Table } from "./leaderboard/Table";
import { MobileCards } from "./leaderboard/MobileCards";

interface LeaderboardProps {
  maxEntries?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ maxEntries }) => {
  const [sortBy, setSortBy] = useState<SortBy>("amount");
  const [searchQuery, setSearchQuery] = useState("");

  // Prepare address list once
  const allAddresses = useMemo(() => Object.keys(leaderboardData), []);
  const { ensNames, ensLoading, lastRefresh } = useEnsNames(allAddresses);
  const { ensAvatars, ensAvatarLoading } = useEnsAvatars(allAddresses);

  const { entries, totalUsdcClaimed, totalTaps, totalFarmers, formatWallet, formatUsdc, calculateCapProgress } =
    useLeaderboardData(leaderboardData, sortBy, searchQuery, maxEntries, ensNames);

  return (
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Header ensLoading={ensLoading || ensAvatarLoading} lastRefresh={lastRefresh} onRefresh={() => {}} />
        <SearchBox value={searchQuery} onChange={setSearchQuery} resultsCount={entries.length} />
        <SortControls sortBy={sortBy} onChange={setSortBy} />
        <Table
          entries={entries}
          formatUsdc={formatUsdc}
          calculateCapProgress={calculateCapProgress}
          formatWallet={formatWallet}
          ensAvatars={ensAvatars}
        />
        <MobileCards
          entries={entries}
          formatUsdc={formatUsdc}
          calculateCapProgress={calculateCapProgress}
          formatWallet={formatWallet}
          ensAvatars={ensAvatars}
        />
        {/* Leaderboard Stats */}
        <div className="mt-8 mb-6">
          <h2 className="text-2xl md:text-3xl font-futura-bold text-forest text-center mb-6">📊 Leaderboard Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4 md:p-6 shadow-lg">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-futura-bold text-yellow-800 mb-2">{totalFarmers}</div>
                <div className="text-sm md:text-base text-yellow-700 font-futura-bold">🏆 Total Farmers</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 md:p-6 shadow-lg">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-futura-bold text-green-800 mb-2">${formatUsdc(totalUsdcClaimed.toString())}</div>
                <div className="text-sm md:text-base text-green-700 font-futura-bold">💰 Total USDC Claimed</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 md:p-6 shadow-lg">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-futura-bold text-blue-800 mb-2">{totalTaps}</div>
                <div className="text-sm md:text-base text-blue-700 font-futura-bold">🚰 Total Taps</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
