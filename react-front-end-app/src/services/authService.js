import { users } from "../data/users";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Persist the id, never the user object, which would go stale.
const SESSION_KEY = "vera.session.userId";

// Storage throws when disabled or full. The session still works; it just won't
// survive a refresh.
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

// Runs on every boot, so an unguarded read would take the app down.
const recall = () => {
    try {
        return localStorage.getItem(SESSION_KEY);
    } catch {
        return null;
    }
};

// Demo sign-in: the password is required but never verified.
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

export const getCurrentUser = async () => {
    await delay(300);

    const storedId = recall();
    if (!storedId) return null;

    const user = users.find((candidate) => candidate.id === Number(storedId));

    // A stale id: clear it so it cannot fail the same way on every reload.
    if (!user) {
        forget();
        return null;
    }

    return user;
}

export const logout = async () => {
    await delay(300);
    forget();
}
