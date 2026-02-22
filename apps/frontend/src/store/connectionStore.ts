import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ConnectionState {
  isConnected: boolean;
  error: string | null;
  actions: {
    setConnected: (connected: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
  };
}

const initialState = {
  isConnected: false,
  error: null,
};

export const useConnectionStore = create<ConnectionState>()(
  immer((set) => ({
    ...initialState,
    actions: {
      setConnected: (connected) => set((state) => {
        state.isConnected = connected;
      }),
      setError: (error) => set((state) => {
        state.error = error;
      }),
      reset: () => set((state) => {
        Object.assign(state, initialState);
      }),
    },
  }))
);

export const useConnectionActions = () => useConnectionStore((state) => state.actions);
export const useIsConnected = () => useConnectionStore((state) => state.isConnected);
export const useConnectionError = () => useConnectionStore((state) => state.error);
