export interface FocusState {
  activeInitiatives: number;
  maxActiveInitiatives: number;
}

export function enforceFocusCapacity(state: FocusState, eventAction?: string): { allowed: boolean; reason?: string } {
  if (eventAction !== 'start_initiative') return { allowed: true };
  if (state.activeInitiatives < state.maxActiveInitiatives) return { allowed: true };
  return { allowed: false, reason: 'Capacity reached: stop something to start something.' };
}
