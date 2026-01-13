import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthModal } from './components/modals/AuthModal';
import Home from './pages/Home';

function App() {
  return (
    <Router>
        {/* The AuthModal lives at the root level so it can overlay everything */}
        <AuthModal />
        
        <Routes>
            {/* The Main Page */}
            <Route path="/" element={<Home />} />
            
            {/* CATCH-ALL: If user is at /login or any unknown URL, send them to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
  );
}

export default App;