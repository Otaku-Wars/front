import * as React from "react"
import { useState, useEffect } from "react"
import { X, Minus, Plus, Wallet, Clock } from 'lucide-react'
import { Dialog, DialogContent } from "./ui/dialog"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"

interface TradeModalProps {
  open: boolean
  onClose: () => void
  type: "Buy" | "Sell"
  balance: number
  character?: {
    name: string
    shares: number
  }
}

export function TradeModal({ open, onClose, type, balance, character = { name: "doge", shares: 3 } }: TradeModalProps) {
  const [amount, setAmount] = useState(0)
  const [activeTab, setActiveTab] = useState<"Buy" | "Sell">(type)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes example
  
  const fee = amount * 0.02 // 2% fee
  const total = amount + fee
  const ethPrice = 3903 // Example ETH price in USD
  const ethAmount = total / ethPrice

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime > 0) {
          return prevTime - 1
        } else {
          clearInterval(timer)
          return 0
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleIncrement = () => {
    setAmount(prev => prev + 1)
  }

  const handleDecrement = () => {
    setAmount(prev => Math.max(0, prev - 1))
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-gray-200 text-gray-900 p-0">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col mb-6">
            <h2 className="text-2xl font-bold capitalize">
              {activeTab} {character.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              You own: {character.shares} shares of {character.name}
            </p>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg mb-6">
            <Button
              variant="ghost"
              className={cn(
                "rounded-md",
                activeTab === "Buy" && "bg-white shadow"
              )}
              onClick={() => setActiveTab("Buy")}
            >
              Buy
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "rounded-md",
                activeTab === "Sell" && "bg-white shadow"
              )}
              onClick={() => setActiveTab("Sell")}
            >
              Sell
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium">Amount to {activeTab}</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-md bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300"
                onClick={handleDecrement}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 bg-gray-100 border border-gray-200 rounded-md p-2 text-center text-lg">
                {amount}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-md bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300"
                onClick={handleIncrement}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold">Cost Breakdown</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Base Cost:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fee (2%):</span>
                <span>${fee.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-200 my-2" />
              <div className="flex justify-between text-base text-gray-900 font-semibold">
                <span>Total Cost:</span>
                <div className="text-right">
                  <div>$ {total.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">≈ ETH {ethAmount.toFixed(6)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center justify-between text-sm bg-gray-100 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span>Balance: ETH {(balance / ethPrice).toFixed(6)} (${balance.toFixed(2)})</span>
            </div>
            <div className="text-gray-500">
              1 ETH = ${ethPrice}
            </div>
          </div>

          {/* Action Button */}
          <Button 
            className={cn(
              "w-full h-12 text-white relative overflow-hidden group text-base font-bold uppercase tracking-wider animate-aggressive-pulse",
              activeTab === "Buy" 
                ? "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700" 
                : "bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700"
            )}
            onClick={onClose}
          >
            <span className="relative z-10 animate-text-pulse">
              {activeTab.toUpperCase()} NOW
            </span>
            <span className="absolute top-0 right-0 bg-white/20 px-2 py-1 text-xs rounded-bl-md font-bold flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              {formatTime(timeLeft)}
            </span>
            <span 
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-75 animate-shimmer" 
              style={{ backgroundSize: '200% 100%' }}
            ></span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

