import { useState } from 'react';
import { TerminalHeader } from './TerminalHeader';
import { TerminalLogs } from './TerminalLogs';
import { TerminalInput } from './TerminalInput';
import { ApprovalBanner } from './ApprovalBanner';
import { runCommand } from '../../engine/runEngine';

export function TerminalPanel() {
  const [isRunning, setIsRunning] = useState(false);

  const handleCommand = async (cmd: string) => {
    setIsRunning(true);
    await runCommand(cmd);
    setIsRunning(false);
  };

  return (
    <div className="terminal-panel flex flex-col h-full border-r border-kitz-border">
      <TerminalHeader />
      <TerminalLogs />
      <ApprovalBanner />
      <TerminalInput onSubmit={handleCommand} disabled={isRunning} />
    </div>
  );
}
