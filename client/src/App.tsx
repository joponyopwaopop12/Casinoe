import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DiceGame from "@/pages/dice-game";
import MinesGame from "@/pages/mines-game";
import BlackjackGame from "@/pages/blackjack-game";
import BetHistory from "@/pages/bet-history";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dice" component={DiceGame} />
      {/* Mines game with and without session ID */}
      <ProtectedRoute path="/mines" component={MinesGame} />
      <ProtectedRoute path="/mines/:gameId" component={MinesGame} />
      {/* Blackjack game with and without session ID */}
      <ProtectedRoute path="/blackjack" component={BlackjackGame} />
      <ProtectedRoute path="/blackjack/:gameId" component={BlackjackGame} />
      <ProtectedRoute path="/history" component={BetHistory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
