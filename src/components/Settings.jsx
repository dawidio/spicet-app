import { useState, useEffect } from 'react';
import { User, Save, AlertTriangle, Key, Cpu, CheckCircle } from 'lucide-react';
import db from '../lib/db';
import { getGeminiKey, setGeminiKey, initWebLLM, getBackend, onStatus } from '../lib/ai';

export default function Settings({ profile, onProfileSave, onBack }) {
  const [name, setName] = useState(profile.name);
  const [classPeriod, setClassPeriod] = useState(profile.classPeriod);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);

  useEffect(() => {
    getGeminiKey().then((key) => {
      if (key) {
        setApiKey(key);
        setHasKey(true);
      }
    });

    const backend = getBackend();
    if (backend === 'webllm') {
      setModelStatus('ready');
    }
  }, []);

  useEffect(() => {
    onStatus((status) => {
      if (status.stage === 'ready') {
        setModelStatus('ready');
        setModelLoading(false);
      }
      if (status.stage === 'loading') {
        setModelStatus(status.message);
        setModelLoading(true);
      }
      if (status.stage === 'error') {
        setModelStatus('error');
        setModelLoading(false);
      }
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (name.trim() && classPeriod.trim()) {
      await onProfileSave(name.trim(), classPeriod.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleSaveApiKey() {
    await setGeminiKey(apiKey.trim());
    setHasKey(!!apiKey.trim());
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  }

  async function handleRemoveApiKey() {
    await setGeminiKey('');
    setApiKey('');
    setHasKey(false);
  }

  async function handleDownloadModel() {
    setModelLoading(true);
    await initWebLLM();
  }

  async function handleClearAll() {
    if (
      confirm(
        'This will permanently delete ALL your charts and data. This cannot be undone. Are you sure?'
      )
    ) {
      if (
        confirm(
          'Final confirmation: Delete everything? Your charts will be gone forever.'
        )
      ) {
        await db.charts.clear();
        await db.comparisons.clear();
        alert('All data cleared.');
        window.location.reload();
      }
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Settings</h2>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} className="text-primary" />
          <h3 className="font-semibold text-gray-800">Student Profile</h3>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Period / Section
            </label>
            <input
              type="text"
              value={classPeriod}
              onChange={(e) => setClassPeriod(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            {saved ? 'Saved!' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* AI Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={20} className="text-primary" />
          <h3 className="font-semibold text-gray-800">AI Study Tutor</h3>
        </div>

        {/* Local model */}
        <div className="mb-5 pb-5 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Option 1: Local AI (recommended)
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Runs entirely in your browser. Free, private, works offline after
            download. Requires ~1.5 GB download and a modern device with 8+ GB
            RAM.
          </p>
          {modelStatus === 'ready' ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle size={16} />
              Local AI model loaded and ready
            </div>
          ) : modelLoading ? (
            <div className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
              {modelStatus || 'Loading model...'}
            </div>
          ) : (
            <button
              onClick={handleDownloadModel}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Download Local AI Model
            </button>
          )}
        </div>

        {/* Gemini API key */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Option 2: Gemini API Key (fallback)
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Use Google's Gemini AI. Get a free API key at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              aistudio.google.com/apikey
            </a>
            . Your key is stored locally and only sent to Google.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Key
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your Gemini API key"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
              />
            </div>
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
              className="px-3 py-2.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-40"
            >
              {apiKeySaved ? 'Saved!' : 'Save'}
            </button>
          </div>
          {hasKey && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={12} /> API key saved
              </span>
              <button
                onClick={handleRemoveApiKey}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove key
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Data Storage</h3>
        <p className="text-sm text-gray-600 mb-4">
          All your charts are stored locally in this browser. They are not
          uploaded anywhere. If you clear your browser data, your charts will
          be deleted.
        </p>
        <div className="text-xs text-gray-400">
          Tip: Use the Export PDF button on any chart or comparison to create
          printable backups.
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={20} className="text-red-500" />
          <h3 className="font-semibold text-red-700">Danger Zone</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          This will permanently delete all of your SPICE-T charts and
          comparisons. This cannot be undone.
        </p>
        <button
          onClick={handleClearAll}
          className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Delete All Data
        </button>
      </div>
    </div>
  );
}
