import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext, type ReactNode } from 'react'; // <--- 1. Import ReactNode
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';

// A simple placeholder for the "Home" page
const Home = () => {
  const { logout, user } = useContext(AuthContext)!;
  return (
    <div className="p-10 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome, {user?.sub}!</h1>
      <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
        Logout
      </button>
    </div>
  );
};

// Guard: Only let users see this page if they are logged in
// 2. Change JSX.Element to ReactNode below
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useContext(AuthContext)!;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Route */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;