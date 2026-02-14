"use client";

import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import toast from 'react-hot-toast';

interface Preference {
    notification_type: string;
    email_enabled: boolean;
    system_enabled: boolean;
}

export default function SettingsPage() {
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await api.get('/notifications/preferences/');
                // If empty (first time), we might want to show defaults or handle it. 
                // For now assuming backend returns defaults or we handle empty list.
                if (response.length === 0) {
                    // Mock defaults if none exist yet
                    const defaults = [
                        { notification_type: 'PAYROLL_APPROVAL', email_enabled: true, system_enabled: true },
                        { notification_type: 'LEAVE_REQUEST', email_enabled: true, system_enabled: true },
                        { notification_type: 'SYSTEM_ALERT', email_enabled: true, system_enabled: true },
                        { notification_type: 'TASK_ASSIGNMENT', email_enabled: true, system_enabled: true },
                    ];
                    setPreferences(defaults);
                } else {
                    setPreferences(response);
                }
            } catch (error) {
                console.error("Failed to fetch preferences", error);
                toast.error("Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        };
        fetchPreferences();
    }, []);

    const handleToggle = (index: number, field: 'email_enabled' | 'system_enabled') => {
        const newPrefs = [...preferences];
        newPrefs[index][field] = !newPrefs[index][field];
        setPreferences(newPrefs);
    };

    const handleSave = async () => {
        try {
            await api.post('/notifications/preferences/', preferences);
            toast.success("Settings saved successfully");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Failed to save settings");
        }
    };

    if (isLoading) return <div className="p-6 text-white">Loading settings...</div>;

    return (
        <div className="p-6 bg-slate-900 min-h-screen">
            <h1 className="text-2xl font-semibold text-white mb-6">Notification Settings</h1>

            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-3xl">
                <div className="space-y-6">
                    {preferences.map((pref, index) => (
                        <div key={pref.notification_type} className="flex items-center justify-between border-b border-slate-700 pb-4 last:border-0 last:pb-0">
                            <div>
                                <h3 className="text-lg font-medium text-white">
                                    {pref.notification_type.replace(/_/g, ' ')}
                                </h3>
                                <p className="text-sm text-slate-400">
                                    Manage how you receive notifications for {pref.notification_type.toLowerCase().replace(/_/g, ' ')}.
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={pref.system_enabled}
                                        onChange={() => handleToggle(index, 'system_enabled')}
                                        className="rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                                    />
                                    <span className="text-sm text-slate-300">System</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={pref.email_enabled}
                                        onChange={() => handleToggle(index, 'email_enabled')}
                                        className="rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                                    />
                                    <span className="text-sm text-slate-300">Email</span>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-medium"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
