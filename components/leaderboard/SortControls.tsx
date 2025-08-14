import React from "react";

type SortBy = "amount" | "transactions";

type SortControlsProps = {
  sortBy: SortBy;
  onChange: (sortBy: SortBy) => void;
};

export const SortControls: React.FC<SortControlsProps> = ({ sortBy, onChange }) => {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm p-1">
        <button
          onClick={() => onChange("amount")}
          className={`px-6 py-3 rounded-md text-sm font-futura-bold transition-colors ${
            sortBy === "amount" ? "bg-forest text-cream" : "text-forest hover:text-forest/80"
          }`}
        >
          Sort by Yield
        </button>
        <button
          onClick={() => onChange("transactions")}
          className={`px-6 py-3 rounded-md text-sm font-futura-bold transition-colors ${
            sortBy === "transactions" ? "bg-forest text-cream" : "text-forest hover:text-forest/80"
          }`}
        >
          Sort by Taps
        </button>
      </div>
    </div>
  );
};


