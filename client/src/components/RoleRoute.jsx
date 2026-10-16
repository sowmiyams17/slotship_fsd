import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Guard that checks authentication AND required role(s)
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}
