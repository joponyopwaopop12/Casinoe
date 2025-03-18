import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { createBetSchema, DiceGameData, MinesGameData, BlackjackGameData, Card } from "@shared/schema";
import { randomBytes } from "crypto";

// Helper function to generate cryptographically secure random numbers
function secureRandom(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = 256 ** bytesNeeded;
  const cutoff = maxValue - (maxValue % range);
  
  let value: number;
  do {
    value = parseInt(randomBytes(bytesNeeded).toString('hex'), 16);
  } while (value >= cutoff);
  
  return min + (value % range);
}

// Game utilities
function createDeck(): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = secureRandom(0, i);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

function calculateHandValue(hand: Card[]): number {
  let value = 0;
  let aces = 0;
  
  for (const card of hand) {
    if (card.value === 'A') {
      aces++;
      value += 11;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  }
  
  // Adjust for aces if needed
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Authentication middleware for game routes
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Get user balance
  app.get("/api/balance", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ balance: user.balance });
    } catch (error) {
      res.status(500).json({ message: "Error fetching balance" });
    }
  });

  // Get bet history
  app.get("/api/bets", requireAuth, async (req, res) => {
    try {
      const bets = await storage.getUserBets(req.user!.id);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bet history" });
    }
  });

  // Dice game endpoints
  app.post("/api/game/dice/roll", requireAuth, async (req, res) => {
    try {
      const { betAmount, prediction, targetValue } = req.body;
      
      // Validate input
      if (!betAmount || !prediction || !targetValue || 
          !["over", "under"].includes(prediction) || 
          betAmount <= 0 || 
          targetValue < 1 || 
          targetValue > 6) {
        return res.status(400).json({ message: "Invalid game parameters" });
      }
      
      // Check if user has enough balance
      const user = await storage.getUser(req.user!.id);
      if (!user || user.balance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Generate dice roll result using cryptographic RNG
      const diceResult = secureRandom(1, 6);
      
      // Determine if player won
      let isWin = false;
      if (prediction === "over" && diceResult > targetValue) {
        isWin = true;
      } else if (prediction === "under" && diceResult < targetValue) {
        isWin = false;
      }
      
      // Calculate profit/loss
      let profit = -betAmount;
      if (isWin) {
        // Calculate multiplier based on probability
        let multiplier = 0;
        if (prediction === 'over') {
          multiplier = 6 / (6 - targetValue);
        } else {
          multiplier = 6 / (targetValue - 1);
        }
        // Apply house edge
        multiplier = multiplier * 0.95;
        profit = Math.floor(betAmount * (multiplier - 1));
      }
      
      // Update user balance
      const newBalance = user.balance + profit;
      await storage.updateUserBalance(user.id, newBalance);
      
      // Record the bet
      const gameData: DiceGameData = {
        prediction,
        targetValue,
        result: diceResult
      };
      
      await storage.createBet({
        userId: user.id,
        game: "dice",
        betAmount,
        profit,
        gameData
      });
      
      res.json({
        result: diceResult,
        profit,
        newBalance,
        win: isWin
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing dice game" });
    }
  });

  // Mines game endpoint
  // Mines game - start game
  app.post("/api/game/mines/start", requireAuth, async (req, res) => {
    try {
      const { betAmount, mineCount } = req.body;
      
      // Validate input
      if (!betAmount || !mineCount || 
          betAmount <= 0 || 
          mineCount < 1 || 
          mineCount > 24) {
        return res.status(400).json({ message: "Invalid game parameters" });
      }
      
      // Check if user has enough balance
      const user = await storage.getUser(req.user!.id);
      if (!user || user.balance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Generate mine positions
      const totalCells = 25;
      const minePositions: number[] = [];
      
      while (minePositions.length < mineCount) {
        const position = secureRandom(0, totalCells - 1);
        if (!minePositions.includes(position)) {
          minePositions.push(position);
        }
      }
      
      // Deduct bet amount from user balance
      const newBalance = user.balance - betAmount;
      await storage.updateUserBalance(user.id, newBalance);
      
      // We don't record a bet yet - will be recorded when game ends
      
      res.json({
        minePositions,
        newBalance
      });
    } catch (error) {
      res.status(500).json({ message: "Error starting mines game" });
    }
  });
  
  // Mines game - reveal tile
  app.post("/api/game/mines/reveal", requireAuth, async (req, res) => {
    try {
      const { tileIndex, betAmount, mineCount, minePositions, revealedPositions } = req.body;
      
      // Validate input
      if (tileIndex === undefined || !betAmount || !mineCount || 
          !Array.isArray(minePositions) || !Array.isArray(revealedPositions)) {
        return res.status(400).json({ message: "Invalid game parameters" });
      }
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the revealed tile contains a mine
      const hitMine = minePositions.includes(tileIndex);
      const newRevealedPositions = [...revealedPositions, tileIndex];
      
      // Calculate current multiplier and potential payout
      const totalCells = 25;
      const safeCells = totalCells - mineCount;
      const safeRevealCount = newRevealedPositions.length;
      
      // Calculate multiplier
      const baseMultiplier = 1;
      const maxMultiplier = 10;
      const multiplier = baseMultiplier + (safeRevealCount / safeCells) ** 2 * maxMultiplier;
      
      // Calculate potential profit
      let profit = hitMine ? -betAmount : Math.floor(betAmount * (multiplier - 1));
      
      res.json({
        tileIndex,
        hitMine,
        currentMultiplier: multiplier,
        potentialPayout: betAmount + Math.floor(betAmount * (multiplier - 1)),
        revealedPositions: newRevealedPositions
      });
      
    } catch (error) {
      res.status(500).json({ message: "Error revealing tile" });
    }
  });
  
  // Mines game - cash out
  app.post("/api/game/mines/cashout", requireAuth, async (req, res) => {
    try {
      const { betAmount, mineCount, minePositions, revealedPositions } = req.body;
      
      // Validate input
      if (!betAmount || !mineCount || 
          !Array.isArray(minePositions) || !Array.isArray(revealedPositions) || 
          betAmount <= 0 || 
          mineCount < 1 || 
          mineCount > 24) {
        return res.status(400).json({ message: "Invalid game parameters" });
      }
      
      // Check if user exists
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate multiplier based on revealed positions and mine count
      const totalCells = 25;
      const safeRevealCount = revealedPositions.length;
      const safeCells = totalCells - mineCount;
      
      // Multiplier increases with more revealed cells
      const baseMultiplier = 1;
      const maxMultiplier = 10;
      const multiplier = baseMultiplier + (safeRevealCount / safeCells) ** 2 * maxMultiplier;
      
      // Calculate profit
      const profit = Math.floor(betAmount * (multiplier - 1));
      
      // Update user balance (add original bet amount back plus profit)
      const newBalance = user.balance + betAmount + profit;
      await storage.updateUserBalance(user.id, newBalance);
      
      // Record the bet
      const gameData: MinesGameData = {
        mineCount,
        tilesRevealed: revealedPositions.length,
        minePositions,
        revealedPositions
      };
      
      await storage.createBet({
        userId: user.id,
        game: "mines",
        betAmount,
        profit,
        gameData
      });
      
      res.json({
        minePositions,
        profit,
        newBalance,
        win: true
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing mines game cashout" });
    }
  });

  // Blackjack game - start game
  app.post("/api/game/blackjack/start", requireAuth, async (req, res) => {
    try {
      const { betAmount } = req.body;
      
      // Validate input
      if (!betAmount || betAmount <= 0) {
        return res.status(400).json({ message: "Invalid bet amount" });
      }
      
      // Check if user has enough balance
      const user = await storage.getUser(req.user!.id);
      if (!user || user.balance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create and shuffle a deck
      const deck = createDeck();
      
      // Deal initial cards
      const playerCards = [deck.pop()!, deck.pop()!];
      const dealerCards = [deck.pop()!, deck.pop()!];
      
      // Check for natural blackjack
      const playerValue = calculateHandValue(playerCards);
      const dealerValue = calculateHandValue(dealerCards);
      
      let gameResult: 'win' | 'lose' | 'push' | null = null;
      let profit = 0;
      
      if (playerValue === 21) {
        if (dealerValue === 21) {
          gameResult = 'push';
        } else {
          gameResult = 'win';
          // Natural blackjack pays 3:2
          profit = Math.floor(betAmount * 1.5);
        }
        
        // Update user balance
        const newBalance = user.balance + profit;
        await storage.updateUserBalance(user.id, newBalance);
        
        // Record the bet
        const gameData: BlackjackGameData = {
          playerCards,
          dealerCards,
          playerScore: playerValue,
          dealerScore: dealerValue,
          result: gameResult
        };
        
        await storage.createBet({
          userId: user.id,
          game: "blackjack",
          betAmount,
          profit,
          gameData
        });
      } else {
        // Deduct bet amount from balance for ongoing game
        const newBalance = user.balance - betAmount;
        await storage.updateUserBalance(user.id, newBalance);
      }
      
      // Return game state
      res.json({
        playerCards,
        dealerCards,
        playerScore: playerValue,
        dealerScore: dealerValue,
        result: gameResult,
        profit,
        gameOver: gameResult !== null
      });
    } catch (error) {
      res.status(500).json({ message: "Error starting blackjack game" });
    }
  });
  
  // Blackjack game - hit
  app.post("/api/game/blackjack/hit", requireAuth, async (req, res) => {
    try {
      const { playerCards, dealerCards, betAmount } = req.body;
      
      if (!playerCards || !dealerCards || !betAmount) {
        return res.status(400).json({ message: "Invalid game parameters" });
      }
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create deck
      const deck = createDeck();
      
      // Deal another card to player
      const currentPlayerCards = [...playerCards];
      const currentDealerCards = [...dealerCards];
      currentPlayerCards.push(deck.pop()!);
      
      // Check if player busts
      const playerValue = calculateHandValue(currentPlayerCards);
      const dealerValue = calculateHandValue(currentDealerCards);
      
      let gameResult: 'win' | 'lose' | 'push' | null = null;
      let profit = 0;
      
      if (playerValue > 21) {
        gameResult = 'lose';
        profit = -betAmount;
        
        // Record the bet
        const gameData: BlackjackGameData = {
          playerCards: currentPlayerCards,
          dealerCards: currentDealerCards,
          playerScore: playerValue,
          dealerScore: dealerValue,
          result: gameResult
        };
        
        await storage.createBet({
          userId: user.id,
          game: "blackjack",
          betAmount,
          profit,
          gameData
        });
      }
      
      res.json({
        playerCards: currentPlayerCards,
        dealerCards: currentDealerCards,
        playerScore: playerValue,
        dealerScore: dealerValue,
        result: gameResult,
        profit,
        gameOver: gameResult !== null
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing hit" });
    }
  });
  
  // Blackjack game - stand
  app.post("/api/game/blackjack/stand", requireAuth, async (req, res) => {
    try {
      const { playerCards, dealerCards, betAmount } = req.body;
      
      if (!playerCards || !dealerCards || !betAmount) {
        return res.status(400).json({ message: "Invalid game parameters" });
      }
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create deck
      const deck = createDeck();
      
      const currentPlayerCards = [...playerCards];
      let currentDealerCards = [...dealerCards];
      
      // Dealer plays
      while (calculateHandValue(currentDealerCards) < 17) {
        currentDealerCards.push(deck.pop()!);
      }
      
      const playerValue = calculateHandValue(currentPlayerCards);
      const dealerValue = calculateHandValue(currentDealerCards);
      
      // Determine winner
      let gameResult: 'win' | 'lose' | 'push';
      let profit = 0;
      
      if (dealerValue > 21) {
        gameResult = 'win';
        profit = betAmount;
      } else if (playerValue > dealerValue) {
        gameResult = 'win';
        profit = betAmount;
      } else if (playerValue < dealerValue) {
        gameResult = 'lose';
        profit = -betAmount;
      } else {
        gameResult = 'push';
        profit = 0;
      }
      
      // Update balance
      const newBalance = user.balance + betAmount + profit;
      await storage.updateUserBalance(user.id, newBalance);
      
      // Record the bet
      const gameData: BlackjackGameData = {
        playerCards: currentPlayerCards,
        dealerCards: currentDealerCards,
        playerScore: playerValue,
        dealerScore: dealerValue,
        result: gameResult
      };
      
      await storage.createBet({
        userId: user.id,
        game: "blackjack",
        betAmount,
        profit,
        gameData
      });
      
      res.json({
        playerCards: currentPlayerCards,
        dealerCards: currentDealerCards,
        playerScore: playerValue,
        dealerScore: dealerValue,
        result: gameResult,
        profit,
        newBalance,
        gameOver: true
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing stand" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
