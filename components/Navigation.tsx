import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { usePrivy } from "@privy-io/react-auth";

const Navigation: React.FC = () => {
  const router = useRouter();
  const { authenticated, logout } = usePrivy();

  return (
    <nav className="bg-white/70 backdrop-blur-sm shadow-sm border-b border-forest/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-lg font-futura-bold text-forest">
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
            <Link
              href="/claim"
              className={`px-3 py-2 rounded-md text-sm font-futura-bold transition-colors ${
                router.pathname === "/claim"
                  ? "bg-forest text-cream"
                  : "text-forest hover:text-forest/80"
              }`}
            >
              Claim
            </Link>
            {authenticated && (
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md text-sm font-futura-bold transition-colors text-forest hover:text-forest/80"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
