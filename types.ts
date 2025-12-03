export type Signal = number[];

export interface SimulationState {
  x: Signal; // Input signal
  h: Signal; // Impulse response
  n: number; // Current time index
  isPlaying: boolean;
  speed: number;
}
