import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import StreamView from './components/StreamView'
import { CharacterList } from './components/CharacterList'
import { ActivityBar } from './components/ActivityBar'
import { WorldStateView } from './components/WorldStateView'
import { NavBar } from './components/NavBar'

function App() {

  return (
    <>  
      <NavBar />
      <CharacterList />      
      <StreamView />
      <ActivityBar />
      <WorldStateView />
    </>
  )
}

export default App
