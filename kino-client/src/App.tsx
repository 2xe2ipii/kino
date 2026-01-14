import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthModal } from './components/modals/AuthModal';
import Home from './pages/Home';
import Profile from './pages/Profile'; 
import PublicProfile from './pages/PublicProfile'; // <--- Import
import Diary from './pages/Diary';

function App() {
  return (
    <Router>
        <AuthModal />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} /> 
            <Route path="/member/:userId" element={<PublicProfile />} /> {/* <--- New Route */}
            <Route path="/diary" element={<Diary />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
  );
}

export default App;