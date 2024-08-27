import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import StreamView from './components/StreamView';
import { CharacterList } from './components/CharacterList';
import { ActivityBar } from './components/ActivityBar';
import { WorldStateView } from './components/WorldStateView';
import { NavBar } from './components/NavBar';
import { CharacterPage } from './components/CharacterPage';
import { UserPage } from './components/UserPage';
import "./globals.css"

function Home() {
  return (
    <div className="h-[calc(100vh-70px)] w-[calc(100vw)]">
      <div className="flex h-full justify-between gap-[0px]">
        <div className="w-[25%] flex flex-col h-full items-center">
          <CharacterList />
        </div>
        <div className="w-[54%] flex flex-col h-full px-0 justify-between">
          <StreamView />
          <WorldStateView />
        </div>
        <div className="w-[19%] flex flex-col h-full">
          <ActivityBar />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/character/:id" element={<CharacterPage />} />
        <Route path="/user/:id" element={<UserPage />} />
      </Routes>
    </Router>
  );
}

export default App;