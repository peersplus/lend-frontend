import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

export function getFirebaseClient() {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  if (!firebaseAuth) {
    firebaseAuth = getAuth(firebaseApp);
  }

  return { app: firebaseApp, auth: firebaseAuth };
}

export function getCurrentFirebaseUser() {
  return getFirebaseClient()?.auth.currentUser ?? null;
}

export function observeFirebaseAuth(callback: (user: User | null) => void) {
  const client = getFirebaseClient();
  if (!client) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(client.auth, callback);
}

export function getFirebaseAuthErrorMessage(error: unknown): { title: string; description?: string } {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: string }).code || "")
    : "";

  switch (code) {
    case "auth/email-already-in-use":
      return {
        title: "This email is already registered",
        description: "Please sign in with your existing account or use a different email address.",
      };
    case "auth/invalid-email":
      return {
        title: "Please enter a valid email address",
      };
    case "auth/invalid-credential":
      return {
        title: "Incorrect email or password",
        description: "Please check your details and try again.",
      };
    case "auth/weak-password":
      return {
        title: "Choose a stronger password",
        description: "Use at least 6 characters for a more secure account.",
      };
    case "auth/user-not-found":
      return {
        title: "No account found for this email",
        description: "Please create an account or check that you entered the correct email.",
      };
    case "auth/wrong-password":
      return {
        title: "Incorrect password",
        description: "Please try again or use the password reset option.",
      };
    case "auth/too-many-requests":
      return {
        title: "Too many attempts",
        description: "Please wait a few minutes before trying again.",
      };
    case "auth/popup-closed-by-user":
      return {
        title: "Google sign-in was cancelled",
        description: "Please try again when you are ready.",
      };
    case "auth/network-request-failed":
      return {
        title: "Network problem",
        description: "Please check your internet connection and try again.",
      };
    default:
      if (error instanceof Error && error.message) {
        return { title: error.message };
      }
      return { title: "Authentication failed", description: "Please try again in a moment." };
  }
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  displayName?: string;
  neighborhood?: string;
}) {
  const client = getFirebaseClient();
  if (!client) {
    throw new Error("Firebase client is not configured. Set the VITE_FIREBASE_* environment variables.");
  }

  const credential = await createUserWithEmailAndPassword(client.auth, input.email, input.password);

  if (input.displayName) {
    await updateProfile(credential.user, { displayName: input.displayName });
  }

  await syncFirebaseUser({ displayName: input.displayName, neighborhood: input.neighborhood }, credential.user);
  await sendVerificationEmail(credential.user);
  await signOut(client.auth);
  return credential;
}

export async function signInWithEmail(input: { email: string; password: string }) {
  const client = getFirebaseClient();
  if (!client) {
    throw new Error("Firebase client is not configured. Set the VITE_FIREBASE_* environment variables.");
  }

  const credential = await signInWithEmailAndPassword(client.auth, input.email, input.password);

  if (!credential.user.emailVerified) {
    await sendVerificationEmail(credential.user);
    await signOut(client.auth);
    throw new Error("Please verify your email before signing in. A fresh verification link has been sent.");
  }

  await syncFirebaseUser(undefined, credential.user);
  return credential;
}

export async function signInWithGoogle() {
  const client = getFirebaseClient();
  if (!client) {
    throw new Error("Firebase client is not configured. Set the VITE_FIREBASE_* environment variables.");
  }

  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(client.auth, provider);
  await syncFirebaseUser({ displayName: credential.user.displayName || undefined }, credential.user);
  return credential;
}

export async function signOutFirebase() {
  const client = getFirebaseClient();
  if (!client) {
    return;
  }

  await signOut(client.auth);
}

export async function getFirebaseIdToken(forceRefresh = false) {
  const user = getCurrentFirebaseUser();
  if (!user) {
    return null;
  }

  return user.getIdToken(forceRefresh);
}

export async function sendVerificationEmail(user: User) {
  const redirectUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth?verified=true`
    : undefined;

  await sendEmailVerification(user, redirectUrl ? { url: redirectUrl } : undefined);
}

async function syncFirebaseUser(
  payload?: { displayName?: string; neighborhood?: string },
  userOverride?: User | null,
) {
  const user = userOverride ?? getCurrentFirebaseUser();
  if (!user) {
    return null;
  }

  const idToken = await user.getIdToken(true);
  const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  const response = await fetch(`${apiBaseUrl}/api/auth/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload || {}),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || "Unable to sync session with the backend.");
  }

  return response.json();
}

export type { Auth, User } from "firebase/auth";
