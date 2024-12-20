import { Shield, Flame, Clock, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"

interface Character {
  name: string
  winChance: number
  stats: {
    defense: number
    attack: number
  }
  price: {
    current: number
    win: number
    lose: number
  }
  shares: number
}

interface BattleStatusProps {
  timeLeft: number
  character1: Character
  character2: Character
}

export function BattleStatus({ timeLeft, character1, character2 }: BattleStatusProps) {
  return (
    <Card className="bg-background border-border">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <CharacterName name={character1.name} winChance={character1.winChance} />
          <BattleTimer timeLeft={timeLeft} />
          <CharacterName name={character2.name} winChance={character2.winChance} isReversed />
        </div>
        <WinChanceBar character1={character1} character2={character2} />
        <div className="grid grid-cols-2 gap-8 mt-4">
          <CharacterDetails character={character1} timeLeft={timeLeft} />
          <CharacterDetails character={character2} timeLeft={timeLeft} />
        </div>
      </CardContent>
    </Card>
  )
}

function CharacterName({ name, winChance, isReversed = false }: { name: string, winChance: number, isReversed?: boolean }) {
  return (
    <div className={`text-xs ${isReversed ? 'text-right' : 'text-left'}`}>
      <div className="pixel-font mb-1">{name}</div>
      <div className="text-muted-foreground">{winChance.toFixed(2)}%</div>
    </div>
  )
}

function BattleTimer({ timeLeft }: { timeLeft: number }) {
  return (
    <div className="text-center">
      <div className="pixel-font text-xl mb-1">VS</div>
      <div className="text-xs text-muted-foreground flex items-center justify-center">
        <Clock className="w-3 h-3 mr-1" />
        {timeLeft}s
      </div>
    </div>
  )
}

function WinChanceBar({ character1, character2 }: { character1: Character, character2: Character }) {
  return (
    <Progress value={character1.winChance} className="h-1" />
  )
}

function CharacterDetails({ character, timeLeft }: { character: Character, timeLeft: number }) {
  return (
    <div className="space-y-3">
      <CharacterStats stats={character.stats} />
      <PriceInfo price={character.price} />
      <div className="text-[10px] text-muted-foreground">
        You: {character.shares} shares
      </div>
      <Button className="w-full bg-primary hover:bg-primary/90 text-[10px] h-8 pixel-font">
        BUY NOW
      </Button>
    </div>
  )
}

function CharacterStats({ stats }: { stats: Character['stats'] }) {
  return (
    <div className="flex justify-between text-[10px]">
      <Stat icon={Shield} value={stats.defense} />
      <Stat icon={Flame} value={stats.attack} />
    </div>
  )
}

function Stat({ icon: Icon, value }: { icon: LucideIcon, value: number }) {
  return (
    <div className="flex items-center gap-1">
      <Icon className="h-3 w-3 text-primary" />
      <span>{value}</span>
    </div>
  )
}

function PriceInfo({ price }: { price: Character['price'] }) {
  return (
    <div className="flex justify-between text-[10px]">
      <PriceColumn icon={TrendingDown} value={price.lose} color="text-red-500" />
      <PriceColumn icon={DollarSign} value={price.current} color="text-foreground" />
      <PriceColumn icon={TrendingUp} value={price.win} color="text-green-500" />
    </div>
  )
}

function PriceColumn({ icon: Icon, value, color }: { icon: LucideIcon, value: number, color: string }) {
  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon className="h-3 w-3" />
      <span>${value.toFixed(4)}</span>
    </div>
  )
}

