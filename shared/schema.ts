import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: integer("balance").notNull().default(10000),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  game: text("game").notNull(), // 'dice', 'mines', 'blackjack'
  betAmount: integer("bet_amount").notNull(),
  profit: integer("profit").notNull(),
  gameData: json("game_data").notNull(), // Game-specific data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBetSchema = createInsertSchema(bets).pick({
  userId: true,
  game: true,
  betAmount: true,
  profit: true,
  gameData: true,
});

// Extend the bet schema for validation
export const createBetSchema = insertBetSchema.extend({
  gameData: z.any(),
});

// Game specific types
export type DiceGameData = {
  prediction: 'over' | 'under';
  targetValue: number;
  result: number;
};

export type MinesGameData = {
  mineCount: number;
  tilesRevealed: number;
  minePositions: number[];
  revealedPositions: number[];
};

export type BlackjackGameData = {
  playerCards: Card[];
  dealerCards: Card[];
  playerScore: number;
  dealerScore: number;
  result: 'win' | 'lose' | 'push';
};

export type Card = {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Bet = typeof bets.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;
