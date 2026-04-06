import React, { useState } from 'react';
import { Search, Plus, Book, Clock } from 'lucide-react';

export default function StealthMode({ onUnlock }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val === "1234") {
      onUnlock();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans mt-[-env(safe-area-inset-top)] pt-safe">
      <div className="max-w-md mx-auto p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <h1 className="text-3xl font-serif text-slate-800 dark:text-slate-100">Notes</h1>
          <button className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <Plus className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Search Bar - Enter PIN here */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-2xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white dark:focus:ring-slate-700 sm:text-sm shadow-sm transition-colors"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Fake Notes List */}
        <div className="grid grid-cols-2 gap-4 flex-1 content-start">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 aspect-square flex flex-col justify-between">
            <div>
              <Book className="h-6 w-6 text-indigo-400 mb-2" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 line-clamp-2">Grocery List</h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-3">Milk, Eggs, Bread, Butter, Coffee beans...</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
              <Clock className="w-3 h-3" /> 2h ago
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 aspect-square flex flex-col justify-between" style={{backgroundColor: '#fef3c7'}}>
            <div>
              <Book className="h-6 w-6 text-amber-500 mb-2" />
              <h3 className="font-semibold text-amber-900 line-clamp-2">Meetings</h3>
              <p className="text-sm text-amber-800/70 mt-1 line-clamp-3">10 AM Standup. 2 PM Project Sync. Remember to ask about deployment.</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600/50 mt-2">
              <Clock className="w-3 h-3" /> Yesterday
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 aspect-square flex flex-col justify-between col-span-2">
            <div>
              <Book className="h-6 w-6 text-emerald-400 mb-2" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">Ideas</h3>
              <p className="text-sm text-slate-500 mt-1">Start a new book. Learn about machine learning algorithms. Plan vacation to mountains.</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
              <Clock className="w-3 h-3" /> 3 days ago
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
