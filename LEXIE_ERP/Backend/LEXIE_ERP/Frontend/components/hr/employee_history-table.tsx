'use client';

import React from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';

interface EmployeeInfo {
    id: number;
    staff_number: string;
    name: string;
}

interface EmploymentRecord {
    id: number;
    employee: EmployeeInfo;
    effective_date: string;
    change_type: string;
    previous_department?: string;
    previous_job_title?: string;
    previous_salary?: number;
    new_department?: string;
    new_job_title?: string;
    new_salary?: number;
    reason?: string;
    notes?: string;
    approved_by?: string;
    created_at: string;
    created_by: string;
}

interface EmploymentHistoryTableProps {
    records: EmploymentRecord[];
    expandedId: number | null;
    onToggleExpand: (id: number) => void;
    onDelete: (id: number) => void;
}

export default function EmploymentHistoryTable({
    records,
    expandedId,
    onToggleExpand,
    onDelete,
}: EmploymentHistoryTableProps) {
    const formatDate = (date: string): string =>
        new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    const formatCurrency = (value?: number): string =>
        value !== undefined
            ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            : '-';

    if (records.length === 0) {
        return (
            <div className="bg-slate-800 rounded-lg shadow-md p-8 text-center border border-slate-700">
                <p className="text-slate-400 text-sm">No employment history records found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {records.map((record) => {
                const isExpanded = expandedId === record.id;

                return (
                    <div
                        key={record.id}
                        className="bg-slate-800 rounded-lg shadow-md overflow-hidden transition-all border border-slate-700"
                    >
                        {/* Header Row */}
                        <button
                            onClick={() => onToggleExpand(record.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors text-left"
                        >
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                    <p className="font-semibold text-white">
                                        {record.employee.staff_number} — {record.employee.name}
                                    </p>
                                    <span className="text-sm text-sky-400">{record.change_type}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs px-3 py-1 bg-slate-700 text-slate-300 rounded-full font-semibold border border-slate-600">
                                    {formatDate(record.effective_date)}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(record.id);
                                    }}
                                    className="p-2 hover:bg-red-900/30 rounded-md transition-colors"
                                    title="Delete record"
                                >
                                    <Trash2 size={16} className="text-red-400" />
                                </button>
                                <ChevronDown
                                    size={18}
                                    className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''
                                        }`}
                                />
                            </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="border-t border-slate-700 px-4 py-4 bg-slate-900/50 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase">
                                            Previous Values
                                        </p>
                                        <div className="mt-2 space-y-1 text-sm text-slate-300">
                                            <p>
                                                <span className="text-slate-500">Department:</span>{' '}
                                                {record.previous_department || '-'}
                                            </p>
                                            <p>
                                                <span className="text-slate-500">Job Title:</span>{' '}
                                                {record.previous_job_title || '-'}
                                            </p>
                                            <p>
                                                <span className="text-slate-500">Salary:</span>{' '}
                                                {formatCurrency(record.previous_salary)}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase">
                                            New Values
                                        </p>
                                        <div className="mt-2 space-y-1 text-sm text-slate-300">
                                            <p>
                                                <span className="text-slate-500">Department:</span>{' '}
                                                {record.new_department || '-'}
                                            </p>
                                            <p>
                                                <span className="text-slate-500">Job Title:</span>{' '}
                                                {record.new_job_title || '-'}
                                            </p>
                                            <p>
                                                <span className="text-slate-500">Salary:</span>{' '}
                                                {formatCurrency(record.new_salary)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {(record.reason || record.notes || record.approved_by) && (
                                    <div className="border-t border-slate-700 pt-4 text-sm space-y-2 text-slate-300">
                                        {record.reason && (
                                            <p>
                                                <span className="font-semibold text-slate-400">Reason:</span>{' '}
                                                {record.reason}
                                            </p>
                                        )}
                                        {record.notes && (
                                            <p>
                                                <span className="font-semibold text-slate-400">Notes:</span>{' '}
                                                {record.notes}
                                            </p>
                                        )}
                                        {record.approved_by && (
                                            <p>
                                                <span className="font-semibold text-slate-400">Approved By:</span>{' '}
                                                {record.approved_by}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="border-t border-slate-700 pt-3 text-xs text-slate-500">
                                    <p>
                                        Created on {formatDate(record.created_at)} by {record.created_by}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
