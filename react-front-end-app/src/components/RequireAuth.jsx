import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "../context/sessionContext";
import LoadError from "./LoadError";
import { hasRole, ROLES } from "../utils/roles";

// A redirect for people, not a lock: the API refuses these requests on its own.
const RequireAuth = ({ role }) => {
    const { user, loading, sessionError, retrySession } = useSession();
    const location = useLocation();

    if (loading) return <p>Loading...</p>;
    if (sessionError) return <LoadError message={sessionError} onRetry={retrySession} />;
    if (!user) return <Navigate to="/" replace state={{ from: location }} />;
    if (role && !hasRole(user, role)) {
        return <Navigate to={hasRole(user, ROLES.ADMIN) ? "/dashboard" : "/my-visits"} replace />;
    }

    return <Outlet />;
};

export default RequireAuth;
