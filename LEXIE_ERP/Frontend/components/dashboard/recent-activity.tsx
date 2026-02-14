"use client";

import { Activity, UserPlus, FileText, ShieldCheck } from "lucide-react";

interface Notification {
    id: number;
    title: string;
    description: string;
    time: string;
    icon: string;
}

interface RecentActivityProps {
    notifications: Notification[];
    isLoading: boolean;
}

export function RecentActivity({ notifications, isLoading }: RecentActivityProps) {
    if (isLoading) {
        return (
            <div className="h-[300px] w-full rounded-xl bg-muted/50 animate-pulse" />
        );
    }

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "user-plus":
                return <UserPlus className="h-5 w-5 text-blue-500" />;
            case "file-text":
                return <FileText className="h-5 w-5 text-green-500" />;
            case "shield":
                return <ShieldCheck className="h-5 w-5 text-purple-500" />;
            default:
                return <Activity className="h-5 w-5 text-primary" />;
        }
    };

    return (
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-foreground mb-4">
                Notifications
            </h3>
            <div className="space-y-6">
                {notifications.map((item) => (
                    <div key={item.id} className="flex gap-4">
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50">
                            {getIcon(item.icon)}
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none text-foreground">
                                {item.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
                {notifications.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No recent notifications.
                    </p>
                )}
            </div>
        </div>
    );
}
