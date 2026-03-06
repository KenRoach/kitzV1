import { useEffect } from 'react';
import { SplitLayout } from './components/layout/SplitLayout';
import { loadDemoData } from './engine/runEngine';

export default function App() {
  useEffect(() => {
    loadDemoData();
  }, []);

  return <SplitLayout />;
}
