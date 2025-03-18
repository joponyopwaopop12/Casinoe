import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';

/**
 * Hook for managing game sessions with unique IDs
 * @param gameType The type of game ('blackjack', 'mines', etc.)
 * @returns Game session utilities
 */
export function useGameSession(gameType: 'blackjack' | 'mines') {
  const [, setLocation] = useLocation();
  const [, params] = useRoute(`/${gameType}/:gameId`);
  const [gameId, setGameId] = useState<string | null>(params?.gameId || null);
  
  // Check if we're in an active game session
  const isActiveSession = !!gameId;
  
  // Start a new game session
  const startSession = () => {
    // Generate a unique game ID using timestamp and random string
    const newGameId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    setGameId(newGameId);
    // Update the URL
    setLocation(`/${gameType}/${newGameId}`);
    return newGameId;
  };
  
  // End current game session and redirect back to game selection
  const endSession = () => {
    setGameId(null);
    setLocation(`/${gameType}`);
  };
  
  // Update the game ID if it changes in the URL
  useEffect(() => {
    if (params?.gameId) {
      setGameId(params.gameId);
    }
  }, [params?.gameId]);
  
  return {
    gameId,
    isActiveSession,
    startSession,
    endSession
  };
}