// src/utils/useRealtimeCollection.ts
import { useEffect, useState } from "react";
import { collection, onSnapshot, Query } from "firebase/firestore";
import { db } from "../firebase"; // adjust import path if needed

/**
 * Generic hook to listen to a Firestore collection in real time.
 * Returns the documents array, loading state and any error.
 */
export function useRealtimeCollection<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const colRef = collection(db, path) as Query<T>;
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Realtime collection error:", err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
}
