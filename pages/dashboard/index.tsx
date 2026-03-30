import type { GetServerSideProps } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";
import { getPageSession } from "@/lib/auth";
import { getDashboardData, getMarketBoard, getSignalBoard } from "@/lib/market-data";
import { listUserWatchlist } from "@/lib/repository";
import { STOCKS } from "@/data/stocks";

export default function DashboardPage({
  initialData,
  initialBoard,
  initialWatchlist,
  initialSignals,
  premium
}: {
  initialData: Awaited<ReturnType<typeof getDashboardData>>;
  initialBoard: Awaited<ReturnType<typeof getMarketBoard>>;
  initialWatchlist: Array<{ id: number; symbol: string; company: string }>;
  initialSignals: Awaited<ReturnType<typeof getSignalBoard>>;
  premium: boolean;
}) {
  return (
    <Dashboard
      initialData={initialData}
      initialBoard={initialBoard}
      initialWatchlist={initialWatchlist}
      initialSignals={initialSignals}
      premium={premium}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    };
  }

  const [initialData, initialBoard, initialWatchlist, initialSignals] = await Promise.all([
    getDashboardData(),
    getMarketBoard(),
    listUserWatchlist(session.user.id),
    getSignalBoard(STOCKS.map((stock) => stock.symbol))
  ]);

  return {
    props: {
      session,
      initialData,
      initialBoard,
      initialWatchlist,
      initialSignals,
      premium: session.user.premium
    }
  };
};
