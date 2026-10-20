import { createRoot } from "react-dom/client";
import { StoreProvider, useStore } from "@/lib/store";
import { useRoute } from "@/lib/router";
import { SessionRunner } from "@/features/quiz/components/session-runner";
import { Page, PageHeader } from "@/components/ui";
import { HomePage } from "@/app/home";
import { CategoryPage } from "@/app/category";
import { MockPage } from "@/app/mock";
import { ResultPage } from "@/app/result";
import { QuestionPage } from "@/app/question";
import { QuestionsPage } from "@/app/questions";
import { DashboardPage } from "@/app/dashboard";
import { HistoryPage } from "@/app/history";
import { SettingsPage } from "@/app/settings";

function SessionPage({ id }: { id: string }) {
  const { state } = useStore();
  const session = state.sessions.find((s) => s.id === id);
  if (!session) {
    return (
      <>
        <PageHeader title="セッション" />
        <Page>
          <p className="text-sm text-muted">このセッションは見つかりませんでした。</p>
        </Page>
      </>
    );
  }
  if (session.finishedAt) return <ResultPage id={id} />;
  return <SessionRunner key={session.id} session={session} />;
}

function App() {
  const route = useRoute();
  switch (route.name) {
    case "home":
      return <HomePage />;
    case "category":
      return <CategoryPage />;
    case "mock":
      return <MockPage />;
    case "session":
      return <SessionPage id={route.id} />;
    case "result":
      return <ResultPage id={route.id} />;
    case "question":
      return <QuestionPage key={route.id} id={route.id} />;
    case "questions":
      return <QuestionsPage slug={route.slug} />;
    case "dashboard":
      return <DashboardPage />;
    case "history":
      return <HistoryPage />;
    case "settings":
      return <SettingsPage />;
  }
}

createRoot(document.getElementById("root")!).render(
  <StoreProvider>
    <App />
  </StoreProvider>,
);
