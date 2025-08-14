import React from "react";

type HeaderProps = {
  ensLoading: boolean;
  lastRefresh: number;
  onRefresh: () => void;
};

export const Header: React.FC<HeaderProps> = ({ ensLoading }) => {
  return (
    <div className="text-center mb-8 md:mb-12">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-futura-bold text-forest mb-4 md:mb-6">
        🏆 The Tap Day Leaderboard
      </h1>
      <p className="text-lg md:text-xl text-forest/80 max-w-3xl mx-auto px-4 mb-6">
        Who&rsquo;s been sipping the yield the fastest? Find out here.
      </p>
      {ensLoading && (
        <p className="text-sm text-forest/60 mb-4">Loading names...</p>
      )}
    </div>
  );
};


