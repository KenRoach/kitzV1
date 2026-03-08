/** Artifact types mirroring kitz_os/src/tools/artifactPreview.ts */

export type ArtifactCategory = 'document' | 'presentation' | 'plan' | 'report' | 'content' | 'media'

export interface ArtifactAction {
  id: string
  label: string
  icon: string
  type: 'primary' | 'secondary' | 'danger'
  endpoint: string
  payload: Record<string, unknown>
}

export interface CanvasArtifact {
  id: string
  contentId: string
  category: ArtifactCategory
  title: string
  html: string
  previewUrl: string
  actions: ArtifactAction[]
  status: 'draft' | 'approved' | 'sent'
  timestamp: number
}
