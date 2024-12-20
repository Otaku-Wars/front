import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

const holdings = [
  {
    character: "Doge",
    image: "/placeholder.svg",
    value: 510.16,
    change: 67.67,
    shares: 2000,
  },
  {
    character: "Batman",
    image: "/placeholder.svg",
    value: 158.89,
    change: -12.33,
    shares: 800,
  },
]

export function CharacterHoldings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {holdings.map((holding) => (
          <div key={holding.character} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={holding.image} alt={holding.character} />
                <AvatarFallback>{holding.character[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{holding.character}</div>
                <div className="text-sm text-muted-foreground">{holding.shares} shares</div>
              </div>
            </div>
            <div className="text-right">
              <div>${holding.value}</div>
              <div className={holding.change > 0 ? "text-green-500" : "text-red-500"}>
                {holding.change > 0 ? "+" : ""}{holding.change}%
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

