import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/game-utils";
import { Button } from "@/components/ui/button";
import { X, DollarSign, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

interface WinAnimationProps {
  amount: number;
  onClose: () => void;
}

export function WinAnimation({ amount, onClose }: WinAnimationProps) {
  const [visible, setVisible] = useState(true);
  
  // Launch confetti on mount
  useEffect(() => {
    const launchConfetti = () => {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        
        const particleCount = 50 * (timeLeft / duration);
        
        // Add confetti burst from random positions
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFC107', '#28a745', '#4273FA', '#FF4081']
        });
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFC107', '#28a745', '#4273FA', '#FF4081']
        });
      }, 250);
      
      return () => clearInterval(interval);
    };
    
    launchConfetti();
  }, []);
  
  // Handle close animation
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 500); // Allow animation to complete
  };
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 relative overflow-hidden"
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4" 
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex flex-col items-center text-center gap-4">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1 }}
                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"
              >
                <Trophy className="h-10 w-10" />
              </motion.div>
              
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold"
              >
                You won!
              </motion.h2>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-bold text-green-500 flex items-center"
              >
                <DollarSign className="h-8 w-8" />
                {formatCurrency(amount)}
              </motion.div>
              
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Button size="lg" onClick={handleClose}>
                  Continue Playing
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}