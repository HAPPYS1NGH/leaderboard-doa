import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const Navigation: React.FC = () => {
  const router = useRouter();

  return (
    <nav className="bg-white/70 backdrop-blur-sm shadow-sm border-b border-forest/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-futura-bold text-forest">
              🏆 Tap Day
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-futura-bold transition-colors ${
                router.pathname === "/"
                  ? "bg-forest text-cream"
                  : "text-forest hover:text-forest/80"
              }`}
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
