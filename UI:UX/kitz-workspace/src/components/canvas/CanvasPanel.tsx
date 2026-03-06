import { CanvasHeader } from './CanvasHeader';
import { CanvasBody } from './CanvasBody';
import { VersionHistory } from './VersionHistory';

export function CanvasPanel() {
  return (
    <div className="flex flex-col h-full bg-kitz-dark">
      <CanvasHeader />
      <CanvasBody />
      <VersionHistory />
    </div>
  );
}
