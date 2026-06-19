import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getListObligationsQueryKey } from "@workspace/api-client-react";

export function useCreateObligation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const key = crypto.randomUUID();
      const res = await fetch("/api/obligations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create obligation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListObligationsQueryKey() });
    }
  });
}
