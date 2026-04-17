/**
 * Task 6 — VoIP Signaling via Socket.io
 * Handles WebRTC offer/answer/ICE exchange between two users.
 */

// In-memory map of userId → socketId (for targeting specific users)
const onlineUsers = new Map();

export const registerVoIPHandlers = (io, socket) => {
  // ── Register user online ────────────────────────────────────────────────
  socket.on("user:register", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // ── Initiate call (Caller → Callee) ─────────────────────────────────────
  // Caller sends: { targetUserId, callerId, callerName, offer }
  socket.on("call:initiate", ({ targetUserId, callerId, callerName, offer }) => {
    const targetSocketId = onlineUsers.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:incoming", {
        callerId,
        callerName,
        offer,
      });
    } else {
      socket.emit("call:user-offline", { targetUserId });
    }
  });

  // ── Answer call (Callee → Caller) ───────────────────────────────────────
  // Callee sends: { callerId, answer }
  socket.on("call:answer", ({ callerId, answer }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call:answered", { answer });
    }
  });

  // ── Reject call ──────────────────────────────────────────────────────────
  socket.on("call:reject", ({ callerId }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call:rejected");
    }
  });

  // ── ICE candidate exchange ───────────────────────────────────────────────
  // Sender: { targetUserId, candidate }
  socket.on("call:ice-candidate", ({ targetUserId, candidate }) => {
    const targetSocketId = onlineUsers.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:ice-candidate", { candidate });
    }
  });

  // ── End call ─────────────────────────────────────────────────────────────
  socket.on("call:end", ({ targetUserId }) => {
    const targetSocketId = onlineUsers.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:ended");
    }
  });

  // ── Disconnect cleanup ───────────────────────────────────────────────────
  socket.on("disconnect", () => {
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
};
