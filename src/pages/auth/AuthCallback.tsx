import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const { user, loading } = useAuth();

  if (loading) return <p role="status">Completing sign-in…</p>;
  if (user) return <Navigate to="/" replace />;

  return (
    <p role="alert">
      Sign-in could not be completed. <Link to="/auth/login">Return to sign-in</Link>.
    </p>
  );
}
