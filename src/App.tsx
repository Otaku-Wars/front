import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useMediaQuery } from './hooks/use-media-query'
import StreamView from './components/StreamView'
import { CharacterList } from './components/CharacterList'
import { ActivityBar } from './components/ActivityBar'
import { WorldStateView } from './components/WorldStateView'
import { NavBar } from './components/NavBar'
import { CharacterPage } from './components/CharacterPage'
import { UserPage } from './components/UserPage'
import { MainLayout } from './layouts/MainLayout'

import "./globals.css"
import "./styles/mobile.css"
import { Home } from './pages/Home'
import { Rewards } from './pages/Rewards'
import { Character } from './pages/Character'
import { Wallet } from './pages/Wallet'
import { useEffect } from 'react'
import { ActivityToast } from './components/ActivityToast'
import { Toaster } from "./components/ui/toaster"

// Type declaration for Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
      };
    };
  }
}

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
      <h1>Hello World</h1>
    </div>
  )
  
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('mobile')
    } else {
      document.body.classList.remove('mobile')
    }
  }, [isMobile])

  useEffect(() => {
    // Debug Telegram WebApp data
    console.log('Window Location:', {
      href: window.location.href,
      hash: window.location.hash,
      search: window.location.search
    });

    

    const twa = window.Telegram?.WebApp;
    if (twa) {
      console.log('Telegram WebApp Data:', {
        initData: twa.initData,
        initDataUnsafe: twa.initDataUnsafe
      });
    } else {
      console.log('Telegram WebApp not found');
    }
  }, []);

  return (
    <Router>
      {isMobile ? (
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/character/:id" element={<Character />} />
            <Route path="/wallet" element={<Wallet />} />
          </Routes>
        </MainLayout>
      ) : (
        <div>
          <NavBar/>
          <Routes>
            <Route path="/" element={<WebApp />} />
            <Route path="/character/:id" element={<CharacterPage />} />
            <Route path="/user/:address" element={<UserPage />} />
          </Routes>
        </div>
      )}
      {/* <ActivityToast />
      <Toaster /> */}
    </Router>
  )
}