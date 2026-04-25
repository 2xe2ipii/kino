import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthModal } from './components/modals/AuthModal';
import { UsernameModal } from './components/modals/UsernameModal';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Diary from './pages/Diary';

function App() {
  return (
    <Router>
        <AuthModal />
        <UsernameModal />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/u/:username" element={<PublicProfile />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
  );
}

export default App;
