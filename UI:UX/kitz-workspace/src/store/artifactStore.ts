import { create } from 'zustand';
import type { Artifact, ArtifactVersion } from '../types';

interface ArtifactStore {
  artifacts: Map<string, Artifact>;
  activeArtifactId: string | null;
  setActive: (id: string) => void;
  addArtifact: (artifact: Artifact) => void;
  addVersion: (artifactId: string, version: ArtifactVersion) => void;
  setCurrentVersion: (artifactId: string, version: number) => void;
  getActive: () => Artifact | null;
}

export const useArtifactStore = create<ArtifactStore>((set, get) => ({
  artifacts: new Map(),
  activeArtifactId: null,
  setActive: (id) => set({ activeArtifactId: id }),
  addArtifact: (artifact) =>
    set((s) => {
      const next = new Map(s.artifacts);
      next.set(artifact.id, artifact);
      return { artifacts: next, activeArtifactId: artifact.id };
    }),
  addVersion: (artifactId, version) =>
    set((s) => {
      const next = new Map(s.artifacts);
      const a = next.get(artifactId);
      if (a) {
        a.versions.push(version);
        a.currentVersion = version.version;
        next.set(artifactId, { ...a });
      }
      return { artifacts: next };
    }),
  setCurrentVersion: (artifactId, version) =>
    set((s) => {
      const next = new Map(s.artifacts);
      const a = next.get(artifactId);
      if (a) {
        next.set(artifactId, { ...a, currentVersion: version });
      }
      return { artifacts: next };
    }),
  getActive: () => {
    const { artifacts, activeArtifactId } = get();
    if (!activeArtifactId) return null;
    return artifacts.get(activeArtifactId) ?? null;
  },
}));
