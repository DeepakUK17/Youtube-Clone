/**
 * Global Socket.io singleton — shared across the entire app.
 * The socket stays connected as long as the app is open.
 * Import getSocket() anywhere to use the same connection.
 */
import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!_socket) {
    _socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
      {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      }
    );

    _socket.on("connect", () => {
      console.log("🔌 Socket connected:", _socket?.id);
    });

    _socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });
  }
  return _socket;
};

export const registerUserSocket = (userId: string) => {
  const s = getSocket();
  s.emit("user:register", userId);
  console.log("📡 Registered user socket:", userId);
};
