import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "../context/sessionContext";
import LoadError from "./LoadError";

// A redirect for people, not a lock: the API refuses these requests on its own.
const RequireAuth = () => {
    const { user, loading, sessionError, retrySession } = useSession();
    const location = useLocation();

    if (loading) return <p>Loading...</p>;
    if (sessionError) return <LoadError message={sessionError} onRetry={retrySession} />;
    if (!user) return <Navigate to="/" replace state={{ from: location }} />;

    return <Outlet />;
};

export default RequireAuth;
