import { useState, useEffect } from "react";
import { Layout } from "@/components/sidebar";
import { WinAnimation } from "@/components/win-animation";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/game-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { 
  Bomb, 
  Loader2, 
  RefreshCw, 
  DollarSign, 
  Gem 
} from "lucide-react";
import { useGameSession } from "@/hooks/use-game-session";
import useSound from "use-sound";
import explosionSound from "@/assets/sounds/explosion.mp3";
import revealSound from "@/assets/sounds/reveal.mp3";

export default function MinesGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Game state
  const [betAmount, setBetAmount] = useState(100);
  const [mineCount, setMineCount] = useState(5);
  const [gameActive, setGameActive] = useState(false);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [hitMine, setHitMine] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [potentialPayout, setPotentialPayout] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  
  // Get recent bets for the user
  const { data: bets = [] } = useQuery<any[]>({
    queryKey: ["/api/bets"],
  });
  
  // Filter and show only mines game bets
  const minesBets = bets.filter((bet) => bet.game === "mines").slice(0, 5);
  
  // Helper to validate bet amount
  const isValidBet = () => {
    return betAmount > 0 && betAmount <= (user?.balance || 0);
  };
  
  // Start game mutation
  const startGameMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/game/mines/start", {
        betAmount,
        mineCount
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setGameActive(true);
      setMinePositions(data.minePositions);
      setRevealedTiles([]);
      setHitMine(false);
      setCurrentMultiplier(1);
      setPotentialPayout(betAmount);
      
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
  
  // Reveal tile mutation
  const revealTileMutation = useMutation({
    mutationFn: async (tileIndex: number) => {
      const res = await apiRequest("POST", "/api/game/mines/reveal", {
        tileIndex,
        betAmount,
        mineCount,
        minePositions,
        revealedPositions: revealedTiles
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // Add the revealed tile to our list
      setRevealedTiles(prev => [...prev, data.tileIndex]);
      
      if (data.hitMine) {
        setHitMine(true);
        setGameActive(false);
        // Invalidate queries to refresh user data since we lost
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      } else {
        // Update multiplier and potential payout
        setCurrentMultiplier(data.currentMultiplier);
        setPotentialPayout(data.potentialPayout);
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
  
  // Cash out mutation
  const cashOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/game/mines/cashout", {
        betAmount,
        mineCount,
        minePositions,
        revealedPositions: revealedTiles
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setGameActive(false);
      
      // Show win animation
      setWinAmount(data.profit);
      setShowWinAnimation(true);
      
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
  
  // Handle reveal tile
  const handleRevealTile = (tileIndex: number) => {
    if (!gameActive || revealedTiles.includes(tileIndex)) return;
    
    revealTileMutation.mutate(tileIndex);
  };
  
  // Handle cash out
  const handleCashOut = () => {
    if (!gameActive || revealedTiles.length === 0) {
      return;
    }
    
    cashOutMutation.mutate();
  };
  
  // Generate tiles grid
  const renderTiles = () => {
    const tiles = [];
    const gridSize = 25; // 5x5 grid
    
    for (let i = 0; i < gridSize; i++) {
      const isRevealed = revealedTiles.includes(i);
      const isMine = minePositions.includes(i);
      const isExposedMine = hitMine && isMine;
      
      tiles.push(
        <button
          key={i}
          onClick={() => handleRevealTile(i)}
          disabled={!gameActive || isRevealed || hitMine}
          className={`
            relative aspect-square rounded-lg transition-all duration-200
            ${isRevealed && !isMine ? 'bg-green-500 shadow-lg' : ''}
            ${isExposedMine ? 'bg-red-500 shadow-lg' : ''}
            ${!isRevealed && !isExposedMine ? 'bg-slate-700 hover:bg-slate-600 active:scale-95' : ''}
            ${isRevealed || hitMine ? 'cursor-default' : 'cursor-pointer'}
          `}
        >
          {isRevealed && !isMine && (
            <Gem className="h-6 w-6 text-white" />
          )}
          {isExposedMine && (
            <Bomb className="h-6 w-6 text-white" />
          )}
        </button>
      );
    }
    
    return (
      <div className="grid grid-cols-5 gap-2 w-full">
        {tiles}
      </div>
    );
  };
  
  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Mines</h1>
        
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
            <Card>
              <CardContent className="p-6">
                {/* Game Error Alert */}
                {gameError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{gameError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex flex-col gap-8">
                  {/* Game Info */}
                  <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Mines</p>
                      <div className="flex items-center gap-2">
                        <Bomb className="h-5 w-5 text-red-500" />
                        <span className="text-xl font-semibold">{mineCount}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Multiplier</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <span className="text-xl font-semibold">{currentMultiplier.toFixed(2)}x</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Potential Payout</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-amber-500" />
                        <span className="text-xl font-semibold">{formatCurrency(potentialPayout)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Game Grid */}
                  <div className="flex justify-center">
                    {renderTiles()}
                  </div>
                  
                  {/* Game Controls */}
                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${gameActive ? '' : 'md:grid-cols-2'}`}>
                    {!gameActive && (
                      <>
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
                        
                        <div className="col-span-1">
                          <p className="text-sm text-muted-foreground mb-2">Mines Count</p>
                          <div className="flex gap-2 items-center">
                            <Slider
                              value={[mineCount]}
                              onValueChange={(value) => setMineCount(value[0])}
                              min={1}
                              max={24}
                              step={1}
                              className="w-full"
                            />
                            <span className="min-w-[2rem] text-center">{mineCount}</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className={`${gameActive ? 'md:col-span-3' : 'md:col-start-2 md:col-span-1'}`}>
                      {!gameActive ? (
                        <Button
                          onClick={handleStartGame}
                          disabled={startGameMutation.isPending}
                          size="lg"
                          className="w-full mt-5"
                        >
                          {startGameMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Start Game
                        </Button>
                      ) : (
                        <div className="flex gap-4 mt-5">
                          <Button
                            onClick={handleCashOut}
                            disabled={cashOutMutation.isPending}
                            variant="default"
                            size="lg"
                            className="flex-1"
                          >
                            {cashOutMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Cash Out ({formatCurrency(potentialPayout)})
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Bet History */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Bets</CardTitle>
              </CardHeader>
              <CardContent>
                {minesBets.length > 0 ? (
                  <div className="space-y-4">
                    {minesBets.map((bet: any) => {
                      const gameData = bet.gameData;
                      const isWin = bet.profit > 0;
                      
                      return (
                        <div key={bet.id} className="py-4">
                          <div className="flex justify-between items-center mb-2">
                            <span 
                              className={isWin ? "text-green-500 font-medium" : "text-red-500 font-medium"}
                            >
                              {isWin ? 'WIN' : 'LOSS'}
                            </span>
                            <span className="text-xs text-slate-400">{formatDate(bet.timestamp)}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-300">Mine Count:</span>
                            <span>{gameData.mineCount}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-300">Tiles Revealed:</span>
                            <span>{gameData.tilesRevealed}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Bet Amount:</span>
                            <span>{formatCurrency(bet.betAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium mt-1">
                            <span className="text-slate-300">Profit:</span>
                            <span 
                              className={isWin ? "text-green-500" : "text-red-500"}
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
                    <RefreshCw className="h-10 w-10 mx-auto mb-2" />
                    <p>No mines game history yet</p>
                    <p className="text-sm mt-1">Try your luck with mines!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}