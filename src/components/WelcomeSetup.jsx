import { useState } from 'react';
import { BookOpen } from 'lucide-react';

export default function WelcomeSetup({ onSave }) {
  const [name, setName] = useState('');
  const [classPeriod, setClassPeriod] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && classPeriod.trim()) {
      onSave(name.trim(), classPeriod.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="bg-primary rounded-2xl p-4 inline-block mb-4">
            <BookOpen size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to SPICE-T Charts
          </h1>
          <p className="text-gray-600">
            AP World History: Modern study tool
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and Last Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
              required
            />
          </div>

          <div>
            <label
              htmlFor="classPeriod"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Class Period / Section
            </label>
            <input
              id="classPeriod"
              type="text"
              value={classPeriod}
              onChange={(e) => setClassPeriod(e.target.value)}
              placeholder="e.g., Period 3 or Section B"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !classPeriod.trim()}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Get Started
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your information is stored locally on this device only.
        </p>
      </div>
    </div>
  );
}
