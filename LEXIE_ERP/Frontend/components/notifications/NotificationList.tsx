import React, { useState, useEffect } from 'react';
import api from '@/utils/api';

interface Notification {
    id: number;
    title: string;
    body: string;
    status: string;
    created_at: string;
    related_link?: string;
    notification_type: string;
}

export const NotificationList = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications/');
            const data = Array.isArray(response) ? response : response.results || [];
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    if (isLoading) return <div className="text-white">Loading notifications...</div>;

    return (
        <div className="space-y-4">
            {notifications.length === 0 ? (
                <div className="text-center text-slate-400 py-8">No notifications found.</div>
            ) : (
                notifications.map(notification => (
                    <div
                        key={notification.id}
                        className={`p-4 rounded-lg border ${notification.status === 'READ'
                            ? 'bg-slate-800 border-slate-700'
                            : 'bg-slate-800 border-sky-500 shadow-sm shadow-sky-500/20'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className={`text-lg font-medium ${notification.status === 'READ' ? 'text-slate-300' : 'text-white'}`}>
                                    {notification.title}
                                </h4>
                                <p className="text-slate-400 mt-1">{notification.body}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                                        {notification.notification_type.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                            {notification.status !== 'READ' && (
                                <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs text-sky-400 hover:text-sky-300"
                                >
                                    Mark as read
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
