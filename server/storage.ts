import { User, InsertUser, Bet, InsertBet, bets } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<void>;
  getUserBets(userId: number): Promise<Bet[]>;
  createBet(bet: InsertBet): Promise<Bet>;
  sessionStore: session.SessionStore;
}

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bets: Map<number, Bet>;
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentBetId: number;

  constructor() {
    this.users = new Map();
    this.bets = new Map();
    this.currentUserId = 1;
    this.currentBetId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      balance: 10000, // Starting balance for new users
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.balance = newBalance;
    this.users.set(userId, user);
  }

  async getUserBets(userId: number): Promise<Bet[]> {
    return Array.from(this.bets.values())
      .filter(bet => bet.userId === userId)
      .sort((a, b) => {
        // Sort by timestamp descending (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const id = this.currentBetId++;
    const now = new Date();
    const bet: Bet = {
      ...insertBet,
      id,
      timestamp: now
    };
    this.bets.set(id, bet);
    return bet;
  }
}

export const storage = new MemStorage();
