import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import RunnersList from './pages/RunnersList';
import ImportRunners from './pages/ImportRunners';
import CheckIn from './pages/CheckIn';
import CheckPoint from './pages/CheckPoint';
import FinishLine from './pages/FinishLine';
import Results from './pages/Results';
import ScanLog from './pages/ScanLog';
import LiveStream from './pages/LiveStream';
import Toast from './components/Toast';
import AutoBibGenerator from './pages/AutoBibGenerator';
import RebuildBib from './pages/RebuildBib';
import Monitor from './pages/Monitor';

function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/runners" element={<RunnersList />} />
          <Route path="/import" element={<ImportRunners />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/checkpoint" element={<CheckPoint />} />
          <Route path="/finish" element={<FinishLine />} />
          <Route path="/results" element={<Results />} />
          <Route path="/log" element={<ScanLog />} />
          <Route path="/live" element={<LiveStream />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/auto-bib" element={<AutoBibGenerator />} />
          <Route path="/rebuild-bib" element={<RebuildBib />} />
        </Routes>
      </main>
      <Toast />
    </div>
  );
}

export default App;
