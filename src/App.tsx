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
import { AffiliateHandler } from './components/AffiliateHandler'
import { Rankings } from './pages/Rankings'
import { useCheckNewActivities } from './components/ActivityListenerProvider'

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
        platform?: string;
        version?: string;
        colorScheme?: string;
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
  const shouldRefetch = useCheckNewActivities()
  const isMobile = useMediaQuery('(max-width: 1100px)')
  
  useEffect(() => {
    if (isMobile) {
      //alert('Mobile detected');
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
      console.log('Telegram WebApp Found:', {
        // Log all available data
        initData: twa.initData,
        initDataRaw: decodeURIComponent(twa.initData),
        platform: window.Telegram?.WebApp?.platform,
        version: window.Telegram?.WebApp?.version,
        colorScheme: window.Telegram?.WebApp?.colorScheme,
      });

      // Try to parse the initData
      const searchParams = new URLSearchParams(twa.initData);
      const entries = Array.from(searchParams.entries());
      console.log('Parsed initData entries:', entries);
    } else {
      console.log('Telegram WebApp not found');
    }
  }, []);

  return (
    <Router>
      {isMobile ? (
        <MainLayout>
          <AffiliateHandler />

          <style>
          {`
            @keyframes rotateHue {
              0% {
                filter: hue-rotate(0deg);
              }
              100% {
                filter: hue-rotate(360deg);
              }
            }
          `}
          </style>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/character/:id" element={<Character />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/rankings" element={<Rankings />} />
          </Routes>
          <ActivityToast />
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
    </Router>
  )
}