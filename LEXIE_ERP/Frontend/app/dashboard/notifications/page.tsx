"use client";

import React from 'react';
import { NotificationList } from '@/components/notifications/NotificationList';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const router = useRouter();

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read/');
            // Refresh logic would be ideal here, but for now a reload or relying on state updates if we lifted state
            window.location.reload();
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <div className="p-6 bg-slate-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-white">Notifications</h1>
                <div className="space-x-4">
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm text-sky-400 hover:text-sky-300"
                    >
                        Mark all as read
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/settings')}
                        className="text-sm text-slate-400 hover:text-white"
                    >
                        Settings
                    </button>
                </div>
            </div>

            <NotificationList />
        </div>
    );
}
