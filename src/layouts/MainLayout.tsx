import { ReactNode } from 'react'
import { BottomNav } from "../components/bottom-nav"
import { TopBar } from "../components/top-bar"
import { ScrollToTop } from "../components/scroll-to-top"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <TopBar />
      <main className="flex-1 overflow-y-auto pb-16 pt-14 bg-background">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
} 