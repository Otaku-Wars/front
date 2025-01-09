import { useUsers } from '../hooks/api'
import { Card } from '../components/ui/card'
import { Trophy, Medal } from 'lucide-react'
import { SmallRotatingCoin } from '../components/ui/rotating-coin'
import { cn } from '../lib/utils'
import { UserAvatar } from '../components/ui/user-avatar'
import { useAddress } from '../hooks/user'

function getOrdinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

export function Rankings() {
  const { data: users, isLoading } = useUsers()
  const address = useAddress()
  const currentUserAddress = address as `0x${string}`

  const sortedUsers = users?.slice()
    .sort((a, b) => {
      const pointsA = (a.points?.total ?? 0) - (a.points?.spent ?? 0)
      const pointsB = (b.points?.total ?? 0) - (b.points?.spent ?? 0)
      return pointsB - pointsA
    })

  const currentUserRank = sortedUsers?.reduce((rank, user, index) => {
    const points = (user.points?.total ?? 0) - (user.points?.spent ?? 0)
    if (user.address.toLowerCase() === currentUserAddress.toLowerCase() && points > 0) {
      return index + 1
    }
    return rank
  }, 0) ?? 0

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-md mx-auto p-2 space-y-6">
        {!isLoading && currentUserAddress && (
          <div className="text-sm text-muted-foreground text-center bg-muted/50 py-2 rounded-lg">
            {currentUserRank > 0 
              ? `You are ${currentUserRank}${getOrdinalSuffix(currentUserRank)} on the leaderboard`
              : "Start trading to appear on the leaderboard!"
            }
          </div>
        )}
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Points Leaderboard</h1>
          <p className="text-muted-foreground">
            Top traders ranked by their points
          </p>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : (
            sortedUsers?.map((user, index) => {
              const points = (user.points?.total ?? 0) - (user.points?.spent ?? 0)
              if (points === 0) return null

              return (
                <Card 
                  key={user.address} 
                  className={cn(
                    "p-4 flex items-center justify-between",
                    index === 0 && "bg-yellow-500/10",
                    index === 1 && "bg-gray-300/10",
                    index === 2 && "bg-amber-600/10",
                    user.address.toLowerCase() === currentUserAddress.toLowerCase() && "border-primary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 text-center flex items-center">
                      {index === 0 && (
                        <>
                          <Trophy className="h-6 w-6 text-yellow-500" />
                          <span className="text-sm text-yellow-500 ml-1">1st</span>
                        </>
                      )}
                      {index === 1 && (
                        <>
                          <Medal className="h-6 w-6 text-gray-300" />
                          <span className="text-sm text-gray-300 ml-1">2nd</span>
                        </>
                      )}
                      {index === 2 && (
                        <>
                          <Medal className="h-6 w-6 text-amber-600" />
                          <span className="text-sm text-amber-600 ml-1">3rd</span>
                        </>
                      )}
                      {index > 2 && (
                        <div className="flex items-baseline">
                          <span className="text-lg font-bold">{index + 1}</span>
                          <span className="text-sm ml-0.5">{getOrdinalSuffix(index + 1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="sm" />
                      <div>
                        <div className="font-medium">
                          {user.username || `User ${user.address.slice(0, 6)}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.points?.total ?? 0} total points
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-bold">
                    {points}
                    <SmallRotatingCoin />
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
} 