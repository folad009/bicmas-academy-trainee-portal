import { useQuery } from "@tanstack/react-query";
import { fetchLearnerDashboard } from "@/api/dashboard";
import { getAccessToken } from "@/utils/auth";

export const useDashboard = () => {
  const token = getAccessToken();

  return useQuery({
    queryKey: ["dashboard", token],
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    queryFn: () => fetchLearnerDashboard(token!),
  });
};
