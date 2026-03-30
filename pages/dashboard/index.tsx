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
  premium,
  canManageWatchlist
}: {
  initialData: Awaited<ReturnType<typeof getDashboardData>>;
  initialBoard: Awaited<ReturnType<typeof getMarketBoard>>;
  initialWatchlist: Array<{ id: number; symbol: string; company: string }>;
  initialSignals: Awaited<ReturnType<typeof getSignalBoard>>;
  premium: boolean;
  canManageWatchlist: boolean;
}) {
  return (
    <Dashboard
      initialData={initialData}
      initialBoard={initialBoard}
      initialWatchlist={initialWatchlist}
      initialSignals={initialSignals}
      premium={premium}
      canManageWatchlist={canManageWatchlist}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);
  const userId = session?.user?.id ?? null;

  const [initialData, initialBoard, initialWatchlist, initialSignals] = await Promise.all([
    getDashboardData(),
    getMarketBoard(),
    userId ? listUserWatchlist(userId) : Promise.resolve([]),
    getSignalBoard(STOCKS.map((stock) => stock.symbol))
  ]);

  return {
    props: {
      session,
      initialData,
      initialBoard,
      initialWatchlist,
      initialSignals,
      premium: session?.user?.premium ?? true,
      canManageWatchlist: Boolean(userId)
    }
  };
};
