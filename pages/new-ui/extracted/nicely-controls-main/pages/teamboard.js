import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";
import KanbanBoard from "../components/kanban/KanbanBoard";

function TeamBoard() {
  const { session } = useAuth();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Head>
        <title>Team Board</title>
      </Head>
      <NavigationSidebar />
      <main className="flex-1 overflow-hidden max-md:pt-16">
        <KanbanBoard session={session} />
      </main>
    </div>
  );
}

export default withAuth(TeamBoard);
