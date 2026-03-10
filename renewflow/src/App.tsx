import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Renewals } from './pages/Renewals';
import { Quotes } from './pages/Quotes';
import { Resellers } from './pages/Resellers';
import { Layout } from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/renewals" element={<Renewals />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/resellers" element={<Resellers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
