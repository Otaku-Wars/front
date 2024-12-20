import { BattleView } from "../components/battle-view"
import { CharacterList } from "../components/character-list"

export function Home() {
  return (
    <div className="max-w-md mx-auto space-y-6 p-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold px-1">Live Battle</h2>
        <BattleView />
      </div>
      <div className="space-y-2">
        <CharacterList />
      </div>
    </div>
  )
} 