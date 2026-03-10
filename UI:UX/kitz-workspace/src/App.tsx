import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SplitLayout } from './components/layout/SplitLayout';
import { ToolsLayout } from './components/layout/ToolsLayout';
import { loadDemoData } from './engine/runEngine';
import { LiveDemo } from './pages/LiveDemo';
import { ROICalculator } from './pages/ROICalculator';
import { BatteryCalculator } from './pages/BatteryCalculator';
import { ProposalGenerator } from './pages/ProposalGenerator';
import { CommandCenter } from './pages/CommandCenter';
import { OnboardingFlow } from './pages/OnboardingFlow';

export default function App() {
  useEffect(() => {
    loadDemoData();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplitLayout />} />
        <Route element={<ToolsLayout />}>
          <Route path="/demo" element={<LiveDemo />} />
          <Route path="/roi" element={<ROICalculator />} />
          <Route path="/battery" element={<BatteryCalculator />} />
          <Route path="/proposals" element={<ProposalGenerator />} />
          <Route path="/command" element={<CommandCenter />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
