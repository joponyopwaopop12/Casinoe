import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/game-utils";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CreditCard,
  Plus,
  Loader2 
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BalanceManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  // Add balance mutation
  const addBalanceMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      try {
        const res = await apiRequest("POST", "/api/balance/add", {
          amount
        });
        return await res.json();
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh user balance
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Balance added",
        description: `${formatCurrency(amount)} has been added to your balance`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add balance",
      });
    },
  });

  // Handle add balance
  const handleAddBalance = () => {
    if (amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a positive amount",
      });
      return;
    }
    
    addBalanceMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Balance</CardTitle>
        <CardDescription>
          Current balance: {formatCurrency(user?.balance || 0)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount to add</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>
          <Slider
            value={[amount]}
            onValueChange={(value) => setAmount(value[0])}
            min={10}
            max={1000}
            step={10}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAddBalance}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CreditCard className="mr-2 h-4 w-4" />
          Add Funds
        </Button>
      </CardFooter>
    </Card>
  );
}