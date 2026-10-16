import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirect unauthenticated users to /login
export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
