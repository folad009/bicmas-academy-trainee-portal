import { useEffect, useState } from "react";
import { fetchLearningPaths, BackendLearningPath } from "@/api/learningPaths";

export function useLearningPaths() {
  const [data, setData] = useState<BackendLearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const paths = await fetchLearningPaths();
        setData(paths);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load learning paths");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return { data, isLoading, error };
}