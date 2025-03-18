import { Layout } from "@/components/sidebar";
import { GameCard } from "@/components/game-card";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Dice, Bomb, Layers, History } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/game-utils";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const { user } = useAuth();
  
  // Get recent bets for the user
  const { data: bets = [] } = useQuery({
    queryKey: ["/api/bets"],
  });
  
  // Get only the 5 most recent bets
  const recentBets = bets.slice(0, 5);
  
  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Welcome to CryptoCasino</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <GameCard 
            title="Dice"
            description="Predict if the dice roll will be over or under your selected value."
            icon={<Dice className="h-12 w-12 text-cyan-500" />}
            href="/dice"
            maxWin="10x"
            tag="Popular"
            tagColor="cyan"
            gradientFrom="from-cyan-600/20"
            gradientTo="to-cyan-900/20"
          />
          
          <GameCard 
            title="Mines"
            description="Reveal tiles and avoid hidden mines to win big multipliers."
            icon={<Bomb className="h-12 w-12 text-purple-500" />}
            href="/mines"
            maxWin="64x"
            tag="High Risk"
            tagColor="purple"
            gradientFrom="from-purple-600/20"
            gradientTo="to-purple-900/20"
          />
          
          <GameCard 
            title="Blackjack"
            description="Classic card game where you aim to beat the dealer's hand without going over 21."
            icon={<Layers className="h-12 w-12 text-yellow-500" />}
            href="/blackjack"
            maxWin="3x"
            tag="Classic"
            tagColor="yellow"
            gradientFrom="from-yellow-600/20"
            gradientTo="to-yellow-900/20"
          />
        </div>
        
        <h2 className="text-xl font-bold mt-10 mb-6">Recent Activity</h2>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Your Recent Bets</CardTitle>
            <a href="/history" className="text-sm text-cyan-400 hover:text-cyan-300 transition">
              View All
            </a>
          </CardHeader>
          <CardContent>
            {recentBets.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {recentBets.map((bet) => (
                  <div key={bet.id} className="py-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center mr-3
                        ${bet.game === 'dice' ? 'bg-cyan-500/20 text-cyan-400' : ''}
                        ${bet.game === 'mines' ? 'bg-purple-500/20 text-purple-400' : ''}
                        ${bet.game === 'blackjack' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                      `}>
                        {bet.game === 'dice' && <Dice className="h-5 w-5" />}
                        {bet.game === 'mines' && <Bomb className="h-5 w-5" />}
                        {bet.game === 'blackjack' && <Layers className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{bet.game}</p>
                        <p className="text-xs text-slate-400">{formatDate(bet.timestamp)}</p>
                      </div>
                    </div>
                    <div className={bet.profit > 0 ? "text-green-500" : "text-red-500"} >
                      {formatCurrency(bet.profit)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">
                <History className="h-10 w-10 mx-auto mb-2" />
                <p>No bet history yet</p>
                <p className="text-sm mt-1">Try your luck in one of our games!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
