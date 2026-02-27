import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../types/socketEvents";

/**
 * Listens for "student:kicked" event and navigates to /kicked.
 * Use this in every student page.
 */
export function useKickListener(socket: Socket | null) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleKicked = (payload: { reason?: string }) => {
      console.log("[useKickListener] Received student:kicked →", payload);
      // Clear session storage so student can't navigate back
      sessionStorage.removeItem("votedPolls");
      navigate("/kicked", { replace: true });
    };

    socket.on(SOCKET_EVENTS.STUDENT_KICKED, handleKicked);
    return () => {
      socket.off(SOCKET_EVENTS.STUDENT_KICKED, handleKicked);
    };
  }, [socket, navigate]);
}
