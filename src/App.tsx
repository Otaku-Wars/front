import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StreamView from './components/StreamView';
import { CharacterList } from './components/CharacterList';
import { ActivityBar } from './components/ActivityBar';
import { WorldStateView } from './components/WorldStateView';
import { NavBar } from './components/NavBar';
import { CharacterPage } from './components/CharacterPage';
import { UserPage } from './components/UserPage';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import './App.css';

function Home() {
  return (
    <Container 
      fluid 
      style={{ 
        height: 'calc(100vh - 140px)',
        width: 'calc(100vw - 60px)',
      }}
    >
      <Row className="h-100 mx-60 mt-10">
        <Col 
          md="auto" 
          className="d-flex flex-column h-100 align-items-center" 
          style={{ flexBasis: '21%' }} // 25% width
        >
          <CharacterList />
        </Col>
        <Col 
          md="auto" 
          className="d-flex flex-column h-100 px-0 justify-content-between" 
          style={{ flexBasis: '58%' }} 
        >
          <StreamView />
          <WorldStateView />
        </Col>
        <Col 
          md="auto" 
          className="d-flex flex-column h-100" 
          style={{ flexBasis: '21%' }} // 25% width
        >
          <ActivityBar />
        </Col>
      </Row>
    </Container>
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
