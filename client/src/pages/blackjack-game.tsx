import { useState } from "react";
import { Layout } from "@/components/sidebar";
import { WinAnimation } from "@/components/win-animation";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/game-utils";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  RefreshCw,
  Layers,
  Plus,
  Hand,
  RotateCcw
} from "lucide-react";
import { Card } from "@shared/schema";

export default function BlackjackGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Game state
  const [betAmount, setBetAmount] = useState(100);
  const [gameActive, setGameActive] = useState(false);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | 'push' | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  
  // Get recent bets for the user
  const { data: bets = [] } = useQuery<any[]>({
    queryKey: ["/api/bets"],
  });
  
  // Filter and show only blackjack game bets
  const blackjackBets = bets.filter((bet) => bet.game === "blackjack").slice(0, 5);
  
  // Helper to validate bet amount
  const isValidBet = () => {
    return betAmount > 0 && betAmount <= (user?.balance || 0);
  };
  
  // Start game mutation
  const startGameMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/game/blackjack/start", {
        betAmount
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setGameActive(true);
      setPlayerCards(data.playerCards);
      setDealerCards(data.dealerCards);
      setPlayerScore(data.playerScore);
      setDealerScore(data.dealerScore);
      setGameResult(null);
      
      // Invalidate queries to refresh user balance
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      setGameError(null);
    },
    onError: (error: Error) => {
      setGameError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
  
  // Hit mutation
  const hitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/game/blackjack/hit", {
        playerCards,
        dealerCards,
        betAmount
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setPlayerCards(data.playerCards);
      setPlayerScore(data.playerScore);
      
      // If player busts, game is over
      if (data.result) {
        setGameActive(false);
        setGameResult(data.result);
        setDealerCards(data.dealerCards);
        setDealerScore(data.dealerScore);
        
        // Show win animation if the player won
        if (data.result === 'win') {
          setWinAmount(data.profit);
          setShowWinAnimation(true);
        }
        
        // Invalidate queries to refresh user balance and bet history
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      }
      
      setGameError(null);
    },
    onError: (error: Error) => {
      setGameError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
  
  // Stand mutation
  const standMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/game/blackjack/stand", {
        playerCards,
        dealerCards,
        betAmount
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setGameActive(false);
      setGameResult(data.result);
      setDealerCards(data.dealerCards);
      setDealerScore(data.dealerScore);
      
      // Show win animation if the player won
      if (data.result === 'win') {
        setWinAmount(data.profit);
        setShowWinAnimation(true);
      }
      
      // Invalidate queries to refresh user balance and bet history
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      
      setGameError(null);
    },
    onError: (error: Error) => {
      setGameError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });
  
  // Handle start game
  const handleStartGame = () => {
    if (!isValidBet()) {
      setGameError("Invalid bet amount");
      return;
    }
    
    startGameMutation.mutate();
  };
  
  // Handle hit
  const handleHit = () => {
    if (!gameActive || hitMutation.isPending || standMutation.isPending) {
      return;
    }
    
    hitMutation.mutate();
  };
  
  // Handle stand
  const handleStand = () => {
    if (!gameActive || hitMutation.isPending || standMutation.isPending) {
      return;
    }
    
    standMutation.mutate();
  };
  
  // Render a playing card
  const renderCard = (card: Card, hidden: boolean = false) => {
    const suitSymbol = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    };
    
    const suitColor = {
      'hearts': 'text-red-500',
      'diamonds': 'text-red-500',
      'clubs': 'text-slate-900',
      'spades': 'text-slate-900'
    };
    
    return (
      <div className={`
        relative w-16 h-24 sm:w-20 sm:h-30 rounded-lg overflow-hidden
        ${hidden ? 'bg-slate-800' : 'bg-white shadow-md'}
        border border-slate-300 flex flex-col items-center justify-center
      `}>
        {!hidden && (
          <>
            <div className={`absolute top-1 left-1 text-sm font-bold ${suitColor[card.suit]}`}>
              {card.value}
            </div>
            <div className={`text-2xl ${suitColor[card.suit]}`}>
              {suitSymbol[card.suit]}
            </div>
            <div className={`absolute bottom-1 right-1 text-sm font-bold ${suitColor[card.suit]} rotate-180`}>
              {card.value}
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Get result text
  const getResultText = () => {
    if (!gameResult) return null;
    
    switch (gameResult) {
      case 'win':
        return (
          <div className="text-green-500 font-bold text-xl mb-4">You Win!</div>
        );
      case 'lose':
        return (
          <div className="text-red-500 font-bold text-xl mb-4">Dealer Wins</div>
        );
      case 'push':
        return (
          <div className="text-amber-500 font-bold text-xl mb-4">Push (Tie)</div>
        );
      default:
        return null;
    }
  };
  
  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Blackjack</h1>
        
        {/* Win Animation */}
        {showWinAnimation && (
          <WinAnimation 
            amount={winAmount} 
            onClose={() => setShowWinAnimation(false)} 
          />
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Controls */}
          <div className="lg:col-span-2">
            <UICard>
              <CardContent className="p-6">
                {/* Game Error Alert */}
                {gameError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{gameError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex flex-col gap-8">
                  {/* Game Board */}
                  <div className="flex flex-col gap-6">
                    {/* Dealer Cards */}
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-muted-foreground mb-2">Dealer {gameActive ? '' : `(${dealerScore})`}</div>
                      <div className="flex gap-2 flex-wrap justify-center">
                        {dealerCards.map((card, index) => (
                          <div key={`dealer-${index}`} className="transform transition-transform hover:scale-105">
                            {renderCard(card, gameActive && index === 1)}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Result */}
                    {!gameActive && gameResult && (
                      <div className="flex justify-center">
                        {getResultText()}
                      </div>
                    )}
                    
                    {/* Player Cards */}
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-muted-foreground mb-2">Your Hand ({playerScore})</div>
                      <div className="flex gap-2 flex-wrap justify-center">
                        {playerCards.map((card, index) => (
                          <div key={`player-${index}`} className="transform transition-transform hover:scale-105">
                            {renderCard(card)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Game Controls */}
                  {!gameActive && !gameResult ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <p className="text-sm text-muted-foreground mb-2">Bet Amount</p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="col-span-1 flex items-end">
                        <Button
                          onClick={handleStartGame}
                          disabled={startGameMutation.isPending}
                          size="lg"
                          className="w-full"
                        >
                          {startGameMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Deal Cards
                        </Button>
                      </div>
                    </div>
                  ) : !gameActive && gameResult ? (
                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          setGameActive(false);
                          setGameResult(null);
                          setPlayerCards([]);
                          setDealerCards([]);
                          setPlayerScore(0);
                          setDealerScore(0);
                        }}
                        size="lg"
                        className="w-1/2"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        New Game
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={handleHit}
                        disabled={hitMutation.isPending || !gameActive}
                        size="lg"
                        className="w-1/3"
                      >
                        {hitMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Plus className="mr-2 h-4 w-4" />
                        Hit
                      </Button>
                      
                      <Button
                        onClick={handleStand}
                        disabled={standMutation.isPending || !gameActive}
                        variant="secondary"
                        size="lg"
                        className="w-1/3"
                      >
                        {standMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Hand className="mr-2 h-4 w-4" />
                        Stand
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </UICard>
          </div>
          
          {/* Bet History */}
          <div className="lg:col-span-1">
            <UICard>
              <CardHeader>
                <CardTitle className="text-xl">Recent Bets</CardTitle>
              </CardHeader>
              <CardContent>
                {blackjackBets.length > 0 ? (
                  <div className="space-y-4">
                    {blackjackBets.map((bet: any) => {
                      const gameData = bet.gameData;
                      const isWin = bet.profit > 0;
                      
                      return (
                        <div key={bet.id} className="py-4">
                          <div className="flex justify-between items-center mb-2">
                            <span 
                              className={
                                gameData.result === 'win' ? "text-green-500 font-medium" : 
                                gameData.result === 'lose' ? "text-red-500 font-medium" : 
                                "text-amber-500 font-medium"
                              }
                            >
                              {gameData.result === 'win' ? 'WIN' : 
                               gameData.result === 'lose' ? 'LOSS' : 
                               'PUSH'}
                            </span>
                            <span className="text-xs text-slate-400">{formatDate(bet.timestamp)}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-300">Player Score:</span>
                            <span>{gameData.playerScore}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-300">Dealer Score:</span>
                            <span>{gameData.dealerScore}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Bet Amount:</span>
                            <span>{formatCurrency(bet.betAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium mt-1">
                            <span className="text-slate-300">Profit:</span>
                            <span 
                              className={isWin ? "text-green-500" : bet.profit < 0 ? "text-red-500" : "text-amber-500"}
                            >
                              {formatCurrency(bet.profit)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400">
                    <Layers className="h-10 w-10 mx-auto mb-2" />
                    <p>No blackjack game history yet</p>
                    <p className="text-sm mt-1">Try your luck with blackjack!</p>
                  </div>
                )}
              </CardContent>
            </UICard>
          </div>
        </div>
      </div>
    </Layout>
  );
}