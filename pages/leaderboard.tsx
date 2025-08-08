import Head from "next/head";
import Leaderboard from "../components/Leaderboard";
import Navigation from "../components/Navigation";

export default function LeaderboardPage() {
  return (
    <>
      <Head>
        <title>The Tap Day Leaderboard</title>
        <meta
          name="description"
          content="Who's been sipping the yield the fastest? Find out here."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navigation />
      <Leaderboard />
    </>
  );
}
