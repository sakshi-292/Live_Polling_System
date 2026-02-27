import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { useToast } from "../components/ui/Toast";
import { SOCKET_EVENTS } from "../types/socketEvents";

/**
 * Global hook that shows toasts for socket disconnection,
 * reconnection, and server error:message events.
 * Mount this once in a layout component or on key pages.
 */
export function useSocketErrors(socket: Socket | null) {
  const { showToast } = useToast();
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      if (wasConnectedRef.current) {
        showToast("Reconnected to server.", "success");
      }
      wasConnectedRef.current = true;
    };

    const handleDisconnect = (reason: string) => {
      showToast(`Disconnected from server: ${reason}`, "warning");
    };

    const handleError = (payload: { message: string }) => {
      showToast(payload.message || "An error occurred.", "error");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(SOCKET_EVENTS.ERROR_MESSAGE, handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(SOCKET_EVENTS.ERROR_MESSAGE, handleError);
    };
  }, [socket, showToast]);
}
