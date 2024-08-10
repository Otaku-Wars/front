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
    <Container fluid className="mt-3">
      <Row>
        <Col md={3}>
          <CharacterList />
        </Col>
        <Col md={6}>
          <StreamView />
          <WorldStateView />

        </Col>
        <Col md={3}>
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
