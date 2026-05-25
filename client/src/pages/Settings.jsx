import { useState, useContext } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import { Save } from 'lucide-react';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: true,
    emailDigest: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* Profile Settings */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Preferences</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-gray-300">Enable Notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.emailDigest}
                onChange={(e) => setSettings({...settings, emailDigest: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-gray-300">Email Digest</span>
            </label>
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg mt-4"
            >
              <Save size={20} /> Save Settings
            </button>
            {saved && <p className="text-green-400 text-sm">Settings saved!</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
