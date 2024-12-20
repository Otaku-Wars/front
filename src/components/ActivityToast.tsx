import { useToast } from "./ui/use-toast"
import { useEffect } from 'react'
import { useActivities } from './ActivityListenerProvider'
import { useCharacters, useUsers } from '../hooks/api'
import { useConvertEthToUsd } from '../EthPriceProvider'
import { ActivityItem } from './ActivityBar'

export const ActivityToast = () => {
  const { toast } = useToast()
  const activities = useActivities()
  const { data: characters } = useCharacters()
  const { data: users } = useUsers()
  const convertEthToUsd = useConvertEthToUsd()

  useEffect(() => {
    if (!activities.length) return

    const latestActivity = activities[0]
    if (!latestActivity) return

    toast({
      description: (
        <ActivityItem 
          activity={latestActivity}
          characters={characters}
          convertEthToUsd={convertEthToUsd}
          users={users}
        />
      ),
      duration: 5000,
    })
  }, [activities])

  return null
} 