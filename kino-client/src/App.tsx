import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthModal } from './components/modals/AuthModal';
import Home from './pages/Home';
import Profile from './pages/Profile'; // <--- Import this
import Diary from './pages/Diary';
// import Profile from './pages/Profile';

function App() {
  return (
    <Router>
        <AuthModal />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} /> {/* <--- Add this */}
            <Route path="/diary" element={<Diary />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
  );
}

export default App;