import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//if less thant 1e-14 set to 0
export const formatNumber = (num: number) => {
  const value = Math.abs(num) < 1e-13 ? 0 : num;
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 4,
    maximumSignificantDigits: 4,
  }).format(value)
}

export const formatMarketCap = (num: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumSignificantDigits: 4,
  }).format(num)
}

export const formatEther = (num: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'ETH',
    // minimumFractionDigits: 2,
    // maximumFractionDigits: 10,
    maximumSignificantDigits: 4,
  }).format(num)
}

export const formatPercentage = (num: number) => {
  const value = Math.abs(num) < 1e-10 ? 0 : num;
  return new Intl.NumberFormat('en-US', { 
    style: 'percent', 
    maximumSignificantDigits: 4,
  }).format(value)
}

export const formatCompactNumber = (num: number) => {
  const absNum = Math.abs(num);
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  } else if (absNum >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  } else if (absNum >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toFixed(1);
}
