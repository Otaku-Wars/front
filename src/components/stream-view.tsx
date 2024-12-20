import { Card, CardContent } from "./ui/card"
import { Play } from 'lucide-react'

export function StreamView() {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-accent to-background border-accent/50">
      <CardContent className="p-0 aspect-video bg-black/50 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <Play className="w-16 h-16 text-primary/80" />
        <span className="absolute bottom-4 left-4 text-primary font-semibold bg-black/50 px-2 py-1 rounded">LIVE</span>
      </CardContent>
    </Card>
  )
}

