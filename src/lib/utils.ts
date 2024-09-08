import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(num)
}

export const formatEther = (num: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'ETH',
    // minimumFractionDigits: 2,
    // maximumFractionDigits: 10,
    minimumSignificantDigits: 1,
    maximumSignificantDigits: 7,
  }).format(num)
}

export const formatPercentage = (num: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'percent', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(num)
}