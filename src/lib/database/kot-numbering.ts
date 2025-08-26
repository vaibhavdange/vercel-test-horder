import { prisma } from "./prisma";

let currentKOTNumber = 1;

/**
 * Generates the next KOT (Kitchen Order Ticket) number
 * KOT numbers are sequential and start from 1
 */
export async function generateNextKOTNumber(): Promise<number> {
  try {
    // Get the highest KOT number from existing orders
    const highestOrder = await prisma.order.findFirst({
      where: {
        kotNumber: {
          not: null
        }
      },
      orderBy: {
        kotNumber: 'desc'
      },
      select: {
        kotNumber: true
      }
    });

    if (highestOrder?.kotNumber) {
      currentKOTNumber = highestOrder.kotNumber + 1;
    } else {
      // If no orders exist, start from 1
      currentKOTNumber = 1;
    }

    return currentKOTNumber;
  } catch (error) {
    console.error("Error generating KOT number:", error);
    // Fallback to incrementing the current number
    return currentKOTNumber++;
  }
}

/**
 * Resets the KOT numbering (useful for testing or daily reset)
 */
export function resetKOTNumbering(): void {
  currentKOTNumber = 1;
}

/**
 * Gets the current KOT number without incrementing
 */
export function getCurrentKOTNumber(): number {
  return currentKOTNumber;
}
