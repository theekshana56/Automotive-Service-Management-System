// Minimal socket shim. Project references getSocket but the socket client isn't always present.
// This returns null when socket.io-client isn't installed or when not initialized.
let socket = null;
let socketPromise = null;
const pendingAuthCallbacks = [];

export async function initSocket(_opts) {
  if (socket) return socket;
  if (!socketPromise) {
    const url = _opts?.url || 'http://localhost:5000';
    socketPromise = import('socket.io-client')
      .then(({ io }) => {
        socket = io(url, { withCredentials: true });
        socket.on('connect', () => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (user?.email) {
              socket.emit('auth:user', user.email);
            }
            if (user?.role) {
              socket.emit('auth:role', user.role);
            }
          } catch (_) {}
          while (pendingAuthCallbacks.length) {
            const fn = pendingAuthCallbacks.shift();
            try { fn(); } catch (_) {}
          }
        });
        return socket;
      })
      .catch(() => {
        socket = null;
        return null;
      });
  }
  return socketPromise;
}

export function getSocket() {
  return socket;
}

export function setSocket(s) {
  socket = s;
}

export function rejoinSocketAuth(email) {
  if (!email) return;
  const lower = email.toLowerCase();
  if (socket && socket.connected) {
    socket.emit('auth:user', lower);
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user?.role) {
        socket.emit('auth:role', user.role);
      }
    } catch (_) {}
  } else {
    pendingAuthCallbacks.push(() => {
      if (socket) {
        socket.emit('auth:user', lower);
        try {
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          if (user?.role) {
            socket.emit('auth:role', user.role);
          }
        } catch (_) {}
      }
    });
  }
}
