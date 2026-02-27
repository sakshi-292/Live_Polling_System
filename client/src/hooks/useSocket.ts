// Re-export from context so all existing imports still work.
// The singleton socket is created once in SocketProvider (wraps <App />).
export { useSocket } from "../contexts/SocketContext";
