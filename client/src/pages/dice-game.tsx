import { useState } from "react";
import { Layout } from "@/components/sidebar";
import { WinAnimation } from "@/components/win-animation";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/game-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function DiceGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Game state
  const [betAmount, setBetAmount] = useState(100);
  const [targetValue, setTargetValue] = useState(3);
  const [prediction, setPrediction] = useState<'over' | 'under'>('over');
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [gameError, setGameError] = useState<string | null>(null);
  
  // Get bet history
  const { data: bets = [] } = useQuery<any[]>({
    queryKey: ["/api/bets"],
  });
  
  // Filter only dice bets
  const diceHistory = bets.filter((bet: any) => bet.game === 'dice');
  
  // Dot positions for dice visualization (1-6)
  const dotPositions = [
    [5], // 1
    [1, 9], // 2
    [1, 5, 9], // 3
    [1, 3, 7, 9], // 4
    [1, 3, 5, 7, 9], // 5
    [1, 3, 4, 6, 7, 9] // 6
  ];
  
  // Calculate potential win based on probability
  const calculatePotentialWin = () => {
    let multiplier = 0;
    
    if (prediction === 'over') {
      // Probability of rolling over the target
      multiplier = 6 / (6 - targetValue);
    } else {
      // Probability of rolling under the target
      multiplier = 6 / (targetValue - 1);
    }
    
    return betAmount * (multiplier * 0.95 - 1); // Apply house edge
  };
  
  // Validate bet
  const isValidBet = () => {
    return betAmount > 0 && betAmount <= (user?.balance || 0);
  };
  
  // Dice roll mutation
  const rollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/game/dice/roll", {
        betAmount,
        prediction,
        targetValue
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setDiceResult(data.result);
      
      // Show win animation if the player won
      if (data.win) {
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
  
  // Handle dice roll
  const handleRollDice = () => {
    if (!isValidBet()) {
      setGameError("Invalid bet amount");
      return;
    }
    
    setGameError(null);
    setIsRolling(true);
    
    // Simulate dice roll animation
    setTimeout(() => {
      rollMutation.mutate();
      setIsRolling(false);
    }, 2000);
  };
  
  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dice</h1>
        
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
                <div className="mb-8 flex justify-center">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                    <div 
                      className="w-full h-full bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl shadow-lg transition-transform duration-2000"
                      style={{ 
                        transform: `rotateY(${isRolling ? '1440deg' : '0deg'})`,
                        transitionDuration: isRolling ? '2s' : '0s'
                      }}
                    >
                      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-4">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="flex items-center justify-center">
                            {diceResult !== null && dotPositions[diceResult - 1].includes(i + 1) && (
                              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300 text-sm">Target Value</span>
                    <span className="font-medium">{targetValue}</span>
                  </div>
                  <Slider
                    value={[targetValue]}
                    min={1}
                    max={6}
                    step={1}
                    onValueChange={(value) => setTargetValue(value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1 text-xs text-slate-400">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-300 mb-1">Prediction</label>
                    <div className="flex gap-2">
                      <Button 
                        variant={prediction === 'under' ? 'default' : 'outline'}
                        className={prediction === 'under' ? 'flex-1 bg-cyan-600 hover:bg-cyan-700' : 'flex-1'}
                        onClick={() => setPrediction('under')}
                      >
                        Under
                      </Button>
                      <Button 
                        variant={prediction === 'over' ? 'default' : 'outline'}
                        className={prediction === 'over' ? 'flex-1 bg-cyan-600 hover:bg-cyan-700' : 'flex-1'}
                        onClick={() => setPrediction('over')}
                      >
                        Over
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-300 mb-1">Bet Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <Input 
                        type="number" 
                        value={betAmount} 
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="pl-8"
                        min={1} 
                        max={user?.balance || 0}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800 mb-6">
                  <span className="text-slate-300">Potential Win:</span>
                  <span className="font-medium text-cyan-400">
                    {formatCurrency(calculatePotentialWin())}
                  </span>
                </div>
                
                {gameError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{gameError}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  onClick={handleRollDice}
                  disabled={isRolling || !isValidBet() || rollMutation.isPending}
                  className="w-full py-6 bg-cyan-600 hover:bg-cyan-700 text-lg font-bold"
                >
                  {isRolling || rollMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Rolling...
                    </span>
                  ) : (
                    "Roll Dice"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* History Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Dice Roll History</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {diceHistory.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {diceHistory.map((bet: any) => {
                    const gameData = bet.gameData as any;
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
                          <span className="text-slate-300">Prediction:</span>
                          <span className="capitalize">{gameData.prediction} {gameData.targetValue}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">Result:</span>
                          <span>{gameData.result}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Bet Amount:</span>
                          <span>{formatCurrency(bet.betAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium mt-1">
                          <span className="text-slate-300">Profit:</span>
                          <span 
                            className={bet.profit > 0 ? "text-green-500" : "text-red-500"}
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
                  <div className="inline-block p-3 rounded-full bg-slate-800 mb-2">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M20 12H4" 
                      />
                    </svg>
                  </div>
                  <p>No dice rolls yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
