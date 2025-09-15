// Minimal socket shim. Project references getSocket but the socket client isn't always present.
// This returns null when socket.io-client isn't installed or when not initialized.
let socket = null;

export function initSocket(_opts) {
  // If you want real-time features, install socket.io-client and initialize here.
  // Example (after npm i socket.io-client):
  // import { io } from 'socket.io-client';
  // socket = io(_opts?.url || '/');
  return socket;
}

export function getSocket() {
  return socket;
}

export function setSocket(s) {
  socket = s;
}
