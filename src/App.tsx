import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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
import 'bootstrap/dist/css/bootstrap.min.css';
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
      <Row className="h-100 mx-60 pt-75 justify-content-between gap-25">
        <Col 
          xs={12} sm={4} md={3} lg={2} 
          className="d-flex flex-column h-100 align-items-center" 
          style={{ flexBasis: '22%' }} 
        >
          <CharacterList />
        </Col>
        <Col 
          xs={12} sm={8} md={6} lg={7} 
          className="d-flex flex-column h-100 px-0 justify-content-between" 
          style={{ flexBasis: '54%' }} 
        >
          <StreamView />
          <WorldStateView />
        </Col>
        <Col 
          xs={12} sm={4} md={3} lg={2} 
          className="d-flex flex-column h-100" 
          style={{ flexBasis: '22%' }} 
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
