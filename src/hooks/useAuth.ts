import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { observeFirebaseAuth } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = observeFirebaseAuth((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { session: null, user, loading };
}
