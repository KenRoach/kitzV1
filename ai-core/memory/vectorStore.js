class VectorStore {
  constructor() {
    this.items = [];
  }

  upsert({ id, embedding, metadata = {} }) {
    const index = this.items.findIndex((item) => item.id === id);
    const entry = { id, embedding, metadata };

    if (index >= 0) {
      this.items[index] = entry;
    } else {
      this.items.push(entry);
    }

    return entry;
  }

  search({ embedding, limit = 5 }) {
    const scored = this.items.map((item) => ({
      ...item,
      score: cosineSimilarity(item.embedding, embedding),
    }));

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

function cosineSimilarity(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let aMag = 0;
  let bMag = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    aMag += a[i] * a[i];
    bMag += b[i] * b[i];
  }

  if (aMag === 0 || bMag === 0) {
    return 0;
  }

  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}

module.exports = {
  VectorStore,
  cosineSimilarity,
};
