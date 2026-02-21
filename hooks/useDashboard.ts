import { useQuery } from "@tanstack/react-query";
import { fetchLearnerDashboard } from "@/api/dashboard";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchLearnerDashboard,
  });
};
