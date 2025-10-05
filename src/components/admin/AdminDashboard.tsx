"use client";

import { useState } from 'react';
import { DriversManager } from './DriversManager';
import { VehiclesManager } from './VehiclesManager';
import { BookingsManager } from './BookingsManager';
import { AdminStats } from './AdminStats';
import { UsersRoleManager } from './UsersRoleManager';
import { QuotesManagement } from './QuotesManagement';

type TabType = 'overview' | 'drivers' | 'vehicles' | 'bookings' | 'quotes' | 'users';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Vue d\'ensemble', icon: '📊' },
    { id: 'drivers' as TabType, label: 'Chauffeurs', icon: '👥' },
    { id: 'vehicles' as TabType, label: 'Véhicules', icon: '🚗' },
    { id: 'bookings' as TabType, label: 'Réservations', icon: '📅' },
    { id: 'quotes' as TabType, label: 'Devis', icon: '💰' },
    { id: 'users' as TabType, label: 'Utilisateurs', icon: '🔐' },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-2">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && <AdminStats />}
        {activeTab === 'drivers' && <DriversManager />}
        {activeTab === 'vehicles' && <VehiclesManager />}
        {activeTab === 'bookings' && <BookingsManager />}
        {activeTab === 'quotes' && <QuotesManagement />}
        {activeTab === 'users' && <UsersRoleManager />}
      </div>
    </div>
  );
}

