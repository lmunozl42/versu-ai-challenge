import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/commons/AuthContext";

export function useOrgBroadcast() {
  const { token } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const apiBaseUrl =
      import.meta.env.VITE_API_URL ??
      `${window.location.protocol}//${window.location.hostname}:8000`;
    const wsBaseUrl = apiBaseUrl.replace(/^http/, "ws").replace(/\/$/, "");
    const ws = new WebSocket(`${wsBaseUrl}/ws/presence?token=${token}`);

    ws.onmessage = (e: MessageEvent) => {
      const msg = JSON.parse(e.data as string);
      if (msg.type === "new_conversation") {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    };

    return () => ws.close();
  }, [token, qc]);
}
