import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, Clock, Shield, Flame } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Progress } from '../../../../components/ui/progress'
import { Input } from '../../../../components/ui/input'
import { Card, CardContent } from '../../../../components/ui/card'
import { AIAvatar } from '../../../../components/ai-avatar'
import { cn } from '../../../../lib/utils'
import { useCharacter, useUser, usePowerUp } from '../../../../hooks/api'
import { useAddress } from '../../../../hooks/user'
import { Attribute } from '@memeclashtv/types'

export function PowerUpPage() {
  const { characterId, statType } = useParams()
  const navigate = useNavigate()
  const address = useAddress()
  const { data: character } = useCharacter(parseInt(characterId))
  const { data: user } = useUser(address)
  const { mutateAsync: powerUp, isPending } = usePowerUp(address)
  
  const [pointsToSpend, setPointsToSpend] = useState(0)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes example

  const currentStat = character?.[statType.toLowerCase()]
  const availablePoints = (user?.points?.total ?? 0) - (user?.points?.spent ?? 0)

  const handlePowerUp = async () => {
    if (!character || !pointsToSpend) return

    const attribute = statType === 'attack' ? 2 : 3 // 2 for attack, 3 for defense

    try {
      await powerUp({
        characterId: parseInt(characterId),
        attribute,
        pointsToSpend
      })
      navigate(`/character/${characterId}`)
    } catch (error) {
      console.error('Failed to power up:', error)
    }
  }

  if (!character) return null

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-md mx-auto p-4 pt-16 space-y-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-4 mb-6">
          <AIAvatar
            src={character.pfp}
            alt={character.name}
            size="lg"
            className="h-16 w-16"
          />
          <div>
            <h2 className="text-lg font-bold">{character.name}</h2>
            <p className="text-sm text-muted-foreground">
              Power up {statType.toLowerCase()}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {statType === 'attack' ? (
                    <Flame className="h-5 w-5 text-orange-500" />
                  ) : (
                    <Shield className="h-5 w-5 text-blue-500" />
                  )}
                  <span className="font-medium">Current {statType}</span>
                </div>
                <span className="text-lg font-bold">{currentStat}</span>
              </div>

              <Progress 
                value={(currentStat / 100) * 100} 
                className="h-2"
              />

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPointsToSpend(Math.max(0, pointsToSpend - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={pointsToSpend}
                  onChange={(e) => setPointsToSpend(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPointsToSpend(pointsToSpend + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Available Points: {availablePoints}
              </div>

              <Button
                className="w-full"
                disabled={isPending || pointsToSpend <= 0 || pointsToSpend > availablePoints}
                onClick={handlePowerUp}
              >
                {isPending ? 'Powering Up...' : 'Power Up'}
              </Button>

              <div className="text-xs text-center text-muted-foreground">
                Power-ups last for the duration of the next battle only
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 