import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

interface Notification {
    id: number;
    title: string;
    body: string;
    status: string;
    created_at: string;
    related_link?: string;
}

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications/');
            const data = Array.isArray(response) ? response : response.results || [];
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => n.status !== 'READ').length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read/');
            setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (notification.status !== 'READ') {
            handleMarkAsRead(notification.id);
        }
        if (notification.related_link) {
            router.push(notification.related_link);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
                )}
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-indigo-600 hover:text-indigo-500"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.slice(0, 5).map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${notification.status !== 'READ' ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                    <p className="text-sm text-gray-500 truncate">{notification.body}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(notification.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-center">
                        <button
                            onClick={() => {
                                router.push('/dashboard/notifications');
                                setIsOpen(false);
                            }}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
