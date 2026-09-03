import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Observations from './pages/Observations';
import MyWork from './pages/MyWork';
import TeamWork from './pages/TeamWork';
import Reports from './pages/Reports';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/my-work" element={<MyWork />} />
          <Route path="/team-work" element={<TeamWork />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/observations" element={<Observations />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/activity" element={<Navigate to="/notifications" replace />} />

          {/* Admin only routes */}
          {isAdmin && (
            <>
              <Route path="/team" element={<Team />} />
              <Route path="/settings" element={<Settings />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
