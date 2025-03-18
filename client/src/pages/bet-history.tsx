import { useState } from "react";
import { Layout } from "@/components/sidebar";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/game-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  History, 
  Filter, 
  RefreshCw,
  Dice5,
  Bomb,
  Layers
} from "lucide-react";

// Game types for filtering
type GameType = "all" | "dice" | "mines" | "blackjack";

export default function BetHistory() {
  // Filter state
  const [gameFilter, setGameFilter] = useState<GameType>("all");
  
  // Get bets for the user
  const { data: bets = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/bets"],
  });
  
  // Apply filters
  const filteredBets = bets.filter((bet) => {
    if (gameFilter === "all") return true;
    return bet.game === gameFilter;
  });
  
  // Helper to get game icon
  const getGameIcon = (game: string) => {
    switch (game) {
      case "dice":
        return <Dice5 className="h-4 w-4" />;
      case "mines":
        return <Bomb className="h-4 w-4" />;
      case "blackjack":
        return <Layers className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Helper to render result badge
  const renderResultBadge = (profit: number, game: string, gameData: any) => {
    // For blackjack with push result
    if (game === "blackjack" && gameData.result === "push") {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
          PUSH
        </Badge>
      );
    }
    
    // Win or loss
    return profit > 0 ? (
      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
        WIN
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
        LOSS
      </Badge>
    );
  };
  
  // Helper to render game specific details
  const renderGameDetails = (bet: any) => {
    const { game, gameData } = bet;
    
    switch (game) {
      case "dice":
        return (
          <>
            <div className="text-xs text-muted-foreground mt-1">
              {gameData.prediction === "over" ? `Over ${gameData.targetValue}` : `Under ${gameData.targetValue}`}
            </div>
            <div className="text-xs text-muted-foreground">
              Result: {gameData.result}
            </div>
          </>
        );
      case "mines":
        return (
          <>
            <div className="text-xs text-muted-foreground mt-1">
              {gameData.mineCount} mines
            </div>
            <div className="text-xs text-muted-foreground">
              Revealed: {gameData.tilesRevealed} tiles
            </div>
          </>
        );
      case "blackjack":
        return (
          <>
            <div className="text-xs text-muted-foreground mt-1">
              Player: {gameData.playerScore}
            </div>
            <div className="text-xs text-muted-foreground">
              Dealer: {gameData.dealerScore}
            </div>
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Bet History
          </h1>
          
          {/* Filter controls */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={gameFilter} 
              onValueChange={(value) => setGameFilter(value as GameType)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Game Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                <SelectItem value="dice">Dice</SelectItem>
                <SelectItem value="mines">Mines</SelectItem>
                <SelectItem value="blackjack">Blackjack</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your Betting History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Bet Amount</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBets.map((bet: any) => (
                      <TableRow key={bet.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getGameIcon(bet.game)}
                            <span className="capitalize">{bet.game}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(bet.timestamp)}
                        </TableCell>
                        <TableCell>
                          {renderGameDetails(bet)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(bet.betAmount)}
                        </TableCell>
                        <TableCell>
                          {renderResultBadge(bet.profit, bet.game, bet.gameData)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={bet.profit > 0 ? "text-green-500" : bet.profit < 0 ? "text-red-500" : "text-amber-500"}>
                            {formatCurrency(bet.profit)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <RefreshCw className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg">No bet history found</p>
                <p className="text-sm mt-1">Try your luck on our games!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}