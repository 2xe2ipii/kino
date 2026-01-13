import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthModal } from './components/modals/AuthModal';
import Home from './pages/Home';

function App() {
  return (
    <Router>
        {/* The AuthModal lives at the root level so it can overlay everything */}
        <AuthModal />
        
        <Routes>
            <Route path="/" element={<Home />} />
        </Routes>
    </Router>
  );
}

export default App;