import { users } from "../data/users";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// What persists across a refresh is the user's ID, never the user object.
// A stored object goes stale the moment the record behind it changes; an id
// cannot. Rehydrating through getCurrentUser is the same shape a real app
// uses with a token: keep the credential locally, ask the server who it
// belongs to. localStorage is fine for an id that is not a secret; a real
// JWT would belong in an httpOnly cookie, out of reach of any script.
const SESSION_KEY = "vera.session.userId";

// Storage throws when it is disabled or full (Safari private mode is the
// classic). A session that cannot be persisted is still a usable session,
// it just will not survive a refresh, so this degrades instead of failing
// the sign-in the user actually asked for.
const remember = (userId) => {
    try {
        localStorage.setItem(SESSION_KEY, String(userId));
    } catch {
        // no persistence available; the in-memory session still stands
    }
};

const forget = () => {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch {
        // nothing to clean up if storage was never reachable
    }
};

// Reading throws under the same conditions as writing, and this one runs on
// every boot, so an unguarded read would take the whole app down rather than
// just costing it persistence.
const recall = () => {
    try {
        return localStorage.getItem(SESSION_KEY);
    } catch {
        return null;
    }
};

// POST /api/auth/login. The password is required but never verified: this
// is a demo sign-in and pretending to check it would be the one dishonest
// thing in the app. The real endpoint hashes and compares; this one only
// insists the field was filled so the form behaves like a form.
export const login = async (email, password) => {
    await delay(300);

    if (!email?.trim()) throw new Error("Email is required");
    if (!password?.trim()) throw new Error("Password is required");

    const user = users.find(
        (candidate) => candidate.email === email.trim().toLowerCase()
    );

    if (!user) {
        throw new Error("No demo account for that email");
    }

    remember(user.id);
    return user;
}

// GET /api/auth/me. Returns null rather than throwing: not being signed in
// is the ordinary state of a visitor, not an error anyone needs to catch.
export const getCurrentUser = async () => {
    await delay(300);

    const storedId = recall();
    if (!storedId) return null;

    const user = users.find((candidate) => candidate.id === Number(storedId));

    // An id that no longer resolves is a zombie session. Clear it here so it
    // cannot come back on the next reload and fail the same way forever.
    if (!user) {
        forget();
        return null;
    }

    return user;
}

// POST /api/auth/logout. Async because the real one invalidates a token
// server side, and the caller should already be awaiting it.
export const logout = async () => {
    await delay(300);
    forget();
}
