import { useMediaQuery } from './hooks/use-media-query'
import StreamView from './components/StreamView'
import { CharacterList } from './components/CharacterList'
import { ActivityBar } from './components/ActivityBar'
import { WorldStateView } from './components/WorldStateView'
import { NavBar } from './components/NavBar'
import { MainLayout } from './layouts/MainLayout'
import { Home } from './pages/Home'
import { useEffect } from 'react'

function WebApp() {
  return (
    <div className="h-[91vh] w-[100vw]">
      <div className="h-full w-full overflow-y-auto">
        <div className="flex h-full justify-between">
          <div className="flex w-[27%] flex-col h-full items-center">
            <CharacterList />
          </div>
          <div className="w-[54%] flex flex-col h-full justify-between">
            <StreamView />
            <WorldStateView />
          </div>
          <div className="w-[19%] flex flex-col h-full">
            <ActivityBar />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div>
      login test
    </div>
  )
  
  useEffect(() => {
    // Debug logging
    console.log('Current URL:', window.location.href);
    console.log('Hash:', window.location.hash);

    if (isMobile) {
      document.body.classList.add('mobile')
    } else {
      document.body.classList.remove('mobile')
    }
  }, [isMobile])

  return (
    <div>
      {isMobile ? (
        <MainLayout>
          <Home />
        </MainLayout>
      ) : (
        <div>
          <NavBar/>
          <WebApp />
        </div>
      )}
    </div>
  )
}