import { Outlet } from 'react-router-dom';
import { Sidebar } from '../nav/Sidebar';

export function ToolsLayout() {
  return (
    <div className="h-full flex">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
