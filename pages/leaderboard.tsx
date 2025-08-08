import Head from "next/head";
import Leaderboard from "../components/Leaderboard";
import Navigation from "../components/Navigation";

export default function LeaderboardPage() {
  return (
    <>
      <Head>
        <title>USDC Transfer Leaderboard</title>
        <meta
          name="description"
          content="View the top USDC transfer contributors"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navigation />
      <Leaderboard />
    </>
  );
}
