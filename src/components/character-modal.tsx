import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Input } from "./ui/input"
import { useState } from "react"

interface CharacterModalProps {
  character: any
  open: boolean
  onClose: () => void
}

export function CharacterModal({ character, open, onClose }: CharacterModalProps) {
  const [amount, setAmount] = useState("")

  if (!character) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={character.image} alt={character.name} />
              <AvatarFallback>{character.name[0]}</AvatarFallback>
            </Avatar>
            {character.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Price</div>
              <div className="text-lg font-medium">${character.price}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Market Cap</div>
              <div className="text-lg font-medium">${character.mcap}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">Amount</div>
            <Input
              type="number"
              placeholder="Enter amount..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onClose}>Buy</Button>
            <Button className="flex-1" variant="secondary" onClick={onClose}>Sell</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

