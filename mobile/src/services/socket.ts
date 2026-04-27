import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

const getSocketUrl = () => {
  const host =
    Constants.manifest2?.extra?.expoGo?.debuggerHost?.split(':')[0] ||
    (Constants as any).manifest?.debuggerHost?.split(':')[0];
  if (host) return `http://${host}:5000`;
  return 'http://10.0.2.2:5000'; // Android emulator fallback
};

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket || !socket.connected) {
    socket = io(getSocketUrl(), { transports: ['websocket'], autoConnect: true });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { getSocket, disconnectSocket };
