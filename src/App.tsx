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
    <div className="h-full w-full overflow-y-auto">
      <div className="flex h-full justify-between gap-[0px]">
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
  );
}

function App() {
  return (
    <div className="h-[90vh] w-[100vw]">
      <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/character/:id" element={<CharacterPage />} />
          <Route path="/user/:address" element={<UserPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;