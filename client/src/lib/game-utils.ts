/**
 * Game utility functions for formatting and calculations
 */

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a date string or timestamp into a readable format
 * @param date - Date string or timestamp
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | number): string {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
}

/**
 * Calculate win probability based on game type and parameters
 * @param gameType - Type of game ('dice', 'mines', etc.)
 * @param params - Game specific parameters
 * @returns Probability as a percentage string
 */
export function calculateWinProbability(
  gameType: 'dice' | 'mines' | 'blackjack',
  params: any
): string {
  let probability: number = 0;

  switch (gameType) {
    case 'dice':
      // For dice, probability depends on the target value (1-100) and prediction (over/under)
      const { prediction, targetValue } = params;
      probability = prediction === 'over' 
        ? (100 - targetValue) / 100 
        : targetValue / 100;
      break;
    
    case 'mines':
      // For mines, probability depends on the total tiles revealed without hitting a mine
      const { mineCount, tilesRevealed, totalTiles = 25 } = params;
      const safeSquares = totalTiles - mineCount;
      
      // Calculate probability of successfully revealing the next tile
      if (tilesRevealed < safeSquares) {
        probability = (safeSquares - tilesRevealed) / (totalTiles - tilesRevealed);
      } else {
        probability = 0; // All safe squares already revealed
      }
      break;
    
    case 'blackjack':
      // Blackjack probabilities are complex, but we can use simplified approximations
      const { playerScore } = params;
      
      if (playerScore < 12) {
        probability = 0.75; // Low risk of busting
      } else if (playerScore < 17) {
        probability = 0.5; // Medium risk
      } else if (playerScore < 21) {
        probability = 0.25; // High risk
      } else if (playerScore === 21) {
        probability = 0.8; // Strong hand but dealer could tie
      } else {
        probability = 0; // Bust
      }
      break;
  }

  // Return formatted percentage
  return `${(probability * 100).toFixed(2)}%`;
}

/**
 * Calculate potential win amount based on bet amount and multiplier
 * @param betAmount - Amount being bet
 * @param multiplier - Win multiplier
 * @returns Formatted potential win amount
 */
export function calculatePotentialWin(betAmount: number, multiplier: number): string {
  const winAmount = betAmount * multiplier;
  return formatCurrency(winAmount);
}