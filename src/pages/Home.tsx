import { BattleView } from "../components/battle-view"
import { CharacterList } from "../components/character-list"

export function Home() {
  return (
    <div className="max-w-md mx-auto space-y-4 p-1">
      <div className="space-y-2">
        <BattleView />
      </div>
      <div className="">
        <CharacterList />
      </div>
    </div>
  )
} 