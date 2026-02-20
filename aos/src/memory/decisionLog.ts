import { MemoryStore } from './memoryStore.js';

export const decisionLog = (store: MemoryStore) => ({
  logDecision: store.logDecision.bind(store),
  retrieveSimilarDecisions: store.retrieveSimilarDecisions.bind(store)
});
