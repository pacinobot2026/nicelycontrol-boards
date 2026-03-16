import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";
import KanbanBoard from "../components/kanban/KanbanBoard";
import { TeamBoard as UserTeamBoard } from "./team";

const CHAD_USER_ID = '08dee908-d31b-4c19-ae7d-227ccbb068cf';

function TeamBoardPage() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  if (userId === CHAD_USER_ID) {
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

  return <UserTeamBoard />;
}

export default withAuth(TeamBoardPage);
