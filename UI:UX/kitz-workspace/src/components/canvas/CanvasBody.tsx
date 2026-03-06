import { useArtifactStore } from '../../store/artifactStore';
import type { ArtifactBlock } from '../../types';

function BlockImage({ block }: { block: ArtifactBlock }) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-kitz-purple/20 to-kitz-deep/10 border border-kitz-border h-48 flex items-center justify-center">
      <div className="text-center text-kitz-muted">
        <div className="text-3xl mb-2">🖼️</div>
        <div className="text-xs">{block.meta?.alt || 'Image placeholder'}</div>
      </div>
    </div>
  );
}

function BlockHeading({ block }: { block: ArtifactBlock }) {
  return <h1 className="text-2xl font-bold text-white leading-tight">{block.content}</h1>;
}

function BlockSubheading({ block }: { block: ArtifactBlock }) {
  return <h2 className="text-lg text-kitz-purple font-medium">{block.content}</h2>;
}

function BlockParagraph({ block }: { block: ArtifactBlock }) {
  return <p className="text-sm text-kitz-text/80 leading-relaxed whitespace-pre-line">{block.content}</p>;
}

function BlockBullets({ block }: { block: ArtifactBlock }) {
  const items = block.content.split('\n').filter(Boolean);
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-kitz-text/80">
          <span className="text-kitz-purple shrink-0 mt-0.5">
            {item.startsWith('-') ? '▸' : item.match(/^\d/) ? item.split('.')[0] + '.' : '▸'}
          </span>
          <span>{item.replace(/^[-\d.]\s*/, '')}</span>
        </li>
      ))}
    </ul>
  );
}

function BlockCta({ block }: { block: ArtifactBlock }) {
  return (
    <button className="w-full rounded-lg bg-kitz-purple hover:bg-kitz-deep transition-colors py-3 px-6 text-white font-semibold text-sm">
      {block.content}
    </button>
  );
}

function BlockDivider() {
  return <hr className="border-kitz-border my-1" />;
}

function BlockEmail({ block }: { block: ArtifactBlock }) {
  return (
    <div className="rounded-lg border border-kitz-border bg-kitz-surface/50 overflow-hidden">
      <div className="px-4 py-2 border-b border-kitz-border bg-kitz-surface">
        <div className="text-xs font-semibold text-kitz-purple">{block.content}</div>
      </div>
      {block.meta?.body && (
        <div className="px-4 py-3 text-xs text-kitz-text/70 leading-relaxed whitespace-pre-line">
          {block.meta.body}
        </div>
      )}
    </div>
  );
}

function RenderBlock({ block }: { block: ArtifactBlock }) {
  switch (block.type) {
    case 'image': return <BlockImage block={block} />;
    case 'heading': return <BlockHeading block={block} />;
    case 'subheading': return <BlockSubheading block={block} />;
    case 'paragraph': return <BlockParagraph block={block} />;
    case 'bullets': return <BlockBullets block={block} />;
    case 'cta': return <BlockCta block={block} />;
    case 'divider': return <BlockDivider />;
    case 'email': return <BlockEmail block={block} />;
    default: return <p className="text-sm text-kitz-muted">{block.content}</p>;
  }
}

export function CanvasBody() {
  const artifact = useArtifactStore((s) => {
    if (!s.activeArtifactId) return null;
    return s.artifacts.get(s.activeArtifactId) ?? null;
  });

  if (!artifact) {
    return (
      <div className="flex-1 flex items-center justify-center text-kitz-muted">
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-30">📄</div>
          <div className="text-sm">No artifact yet</div>
          <div className="text-xs mt-1">Try: <span className="font-mono text-kitz-purple">create flyer: dog food, dog reading at beach</span></div>
        </div>
      </div>
    );
  }

  const currentVer = artifact.versions.find((v) => v.version === artifact.currentVersion);
  if (!currentVer) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-6 space-y-5">
        {currentVer.blocks.map((block) => (
          <RenderBlock key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}
