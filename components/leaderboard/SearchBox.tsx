import React from "react";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  resultsCount?: number;
};

export const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange, resultsCount }) => {
  return (
    <>
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-forest/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by wallet address or ENS name..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-forest/20 rounded-lg bg-white/70 backdrop-blur-sm text-forest placeholder-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/50 focus:border-forest/50 font-futura-bold"
          />
          {value && (
            <button onClick={() => onChange("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg className="h-5 w-5 text-forest/40 hover:text-forest/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {value && (
        <div className="text-center mb-6">
          <p className="text-forest/70 font-futura-bold">
            Found {resultsCount ?? 0} farmer{(resultsCount ?? 0) !== 1 ? "s" : ""} matching &quot;{value}&quot;
          </p>
        </div>
      )}
    </>
  );
};


