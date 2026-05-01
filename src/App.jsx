import { useState, useEffect, useCallback } from 'react';
import { getStudentProfile, setStudentProfile } from './lib/db';
import Dashboard from './components/Dashboard';
import ChartEditor from './components/ChartEditor';
import CompareView from './components/CompareView';
import Settings from './components/Settings';
import WelcomeSetup from './components/WelcomeSetup';
import Header from './components/Header';
import AITutor from './components/AITutor';

function App() {
  const [screen, setScreen] = useState('loading');
  const [profile, setProfile] = useState({ name: '', classPeriod: '' });
  const [editingChartId, setEditingChartId] = useState(null);
  const [compareChartIds, setCompareChartIds] = useState([]);

  useEffect(() => {
    getStudentProfile().then((p) => {
      setProfile(p);
      if (p.name && p.classPeriod) {
        setScreen('dashboard');
      } else {
        setScreen('welcome');
      }
    });
  }, []);

  const handleProfileSave = useCallback(async (name, classPeriod) => {
    await setStudentProfile(name, classPeriod);
    setProfile({ name, classPeriod });
    setScreen('dashboard');
  }, []);

  const handleEditChart = useCallback((id) => {
    setEditingChartId(id);
    setScreen('editor');
  }, []);

  const handleNewChart = useCallback(() => {
    setEditingChartId(null);
    setScreen('editor');
  }, []);

  const handleCompare = useCallback((ids) => {
    setCompareChartIds(ids);
    setScreen('compare');
  }, []);

  const handleBack = useCallback(() => {
    setScreen('dashboard');
    setEditingChartId(null);
    setCompareChartIds([]);
  }, []);

  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  if (screen === 'welcome') {
    return <WelcomeSetup onSave={handleProfileSave} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        profile={profile}
        screen={screen}
        onBack={handleBack}
        onSettings={() => setScreen('settings')}
        onDashboard={() => setScreen('dashboard')}
      />
      <main className="flex-1">
        {screen === 'dashboard' && (
          <Dashboard
            onEditChart={handleEditChart}
            onNewChart={handleNewChart}
            onCompare={handleCompare}
          />
        )}
        {screen === 'editor' && (
          <ChartEditor chartId={editingChartId} onBack={handleBack} />
        )}
        {screen === 'compare' && (
          <CompareView chartIds={compareChartIds} onBack={handleBack} />
        )}
        {screen === 'settings' && (
          <Settings
            profile={profile}
            onProfileSave={handleProfileSave}
            onBack={handleBack}
          />
        )}
      </main>
      {screen !== 'welcome' && screen !== 'loading' && <AITutor />}
    </div>
  );
}

export default App;
