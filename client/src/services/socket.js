import { io } from "socket.io-client";

const resolveSocketUrl = () => {
  const configuredUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const trimmedUrl = configuredUrl.replace(/\/$/, "");

  if (trimmedUrl.endsWith("/api")) {
    return trimmedUrl.replace(/\/api$/, "");
  }

  return trimmedUrl;
};

const SOCKET_URL = resolveSocketUrl();

let socket = null;

/**
 * Connect the Socket.io client using the stored JWT access token.
 * Call this once after a successful login.
 */
export const connectSocket = () => {
  const token = localStorage.getItem("accessToken");
  if (!token || socket?.connected) return;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("[Socket.io] Connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket.io] Connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket.io] Disconnected:", reason);
  });

  return socket;
};

/**
 * Disconnect the socket (call on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get the active socket instance (may be null if not connected).
 */
export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };
