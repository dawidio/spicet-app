import { BookOpen, ArrowLeft, Settings, LayoutDashboard } from 'lucide-react';

export default function Header({ profile, screen, onBack, onSettings, onDashboard }) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {screen !== 'dashboard' && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          )}
          <button
            onClick={onDashboard}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="bg-primary rounded-lg p-2">
              <BookOpen size={20} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                SPICE-T Charts
              </h1>
              <p className="text-xs text-gray-500">AP World History: Modern</p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{profile.name}</p>
            <p className="text-xs text-gray-500">{profile.classPeriod}</p>
          </div>
          <div className="flex items-center gap-1">
            {screen !== 'dashboard' && (
              <button
                onClick={onDashboard}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Dashboard"
              >
                <LayoutDashboard size={20} className="text-gray-600" />
              </button>
            )}
            <button
              onClick={onSettings}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
