'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Employee {
    id: number;
    staff_number: string;
    full_name: string;
    job_title: string;
    department_name: string;
    basic_salary: number;
    status: string;
}

interface EmployeeHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    onSubmit: (formData: any) => void;
}

const changeTypes = [
    'PROMOTION',
    'TRANSFER',
    'SALARY_INCREASE',
    'SALARY_DECREASE',
    'DEMOTION',
    'TERMINATION',
    'RESIGNATION',
    'SUSPENSION',
    'REINSTATEMENT',
];

const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED'];

export default function EmployeeHistoryModal({
    isOpen,
    onClose,
    employees,
    onSubmit,
}: EmployeeHistoryModalProps) {
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const [formData, setFormData] = useState({
        employee_id: '',
        effective_date: '',
        change_type: 'PROMOTION',
        new_department: '',
        new_job_title: '',
        new_salary: '',
        new_status: '',
        reason: '',
        notes: '',
        approved_by: '',
    });

    useEffect(() => {
        if (formData.employee_id) {
            const emp = employees.find(e => e.id === Number(formData.employee_id));
            if (emp) setSelectedEmployee(emp);
        }
    }, [formData.employee_id, employees]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.employee_id || !formData.effective_date) {
            toast.error('Please select an employee and effective date.');
            return;
        }

        // Validation for salary logic
        if (['SALARY_INCREASE', 'SALARY_DECREASE'].includes(formData.change_type) && !formData.new_salary) {
            toast.error('Please enter a new salary for this change type.');
            return;
        }

        onSubmit({
            ...formData,
            previous_department: selectedEmployee?.department_name,
            previous_job_title: selectedEmployee?.job_title,
            previous_salary: selectedEmployee?.basic_salary,
            previous_status: selectedEmployee?.status,
        });

        toast.success('Employment history record created.');
        setFormData({
            employee_id: '',
            effective_date: '',
            change_type: 'PROMOTION',
            new_department: '',
            new_job_title: '',
            new_salary: '',
            new_status: '',
            reason: '',
            notes: '',
            approved_by: '',
        });
        setSelectedEmployee(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6 overflow-y-auto">
            <div className="bg-slate-900 border border-sky-400/30 rounded-xl shadow-lg w-full max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-sky-400/30">
                    <h2 className="text-lg font-semibold text-white">Record Employee Change</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">Employee</label>
                            <select
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.staff_number} — {emp.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">Effective Date</label>
                            <input
                                type="date"
                                name="effective_date"
                                value={formData.effective_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                        </div>
                    </div>

                    {/* Change type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Change Type</label>
                        <select
                            name="change_type"
                            value={formData.change_type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                            {changeTypes.map(type => (
                                <option key={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Previous values (auto-filled) */}
                    {selectedEmployee && (
                        <div className="bg-slate-800 rounded-md p-4 border border-sky-400/30">
                            <p className="text-xs uppercase font-semibold text-sky-400 mb-2">Current Values</p>
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                                <p><strong>Dept:</strong> {selectedEmployee.department_name}</p>
                                <p><strong>Job:</strong> {selectedEmployee.job_title}</p>
                                <p><strong>Salary:</strong> ${selectedEmployee.basic_salary.toFixed(2)}</p>
                                <p><strong>Status:</strong> {selectedEmployee.status}</p>
                            </div>
                        </div>
                    )}

                    {/* New values */}
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            name="new_department"
                            placeholder="New Department"
                            value={formData.new_department}
                            onChange={handleChange}
                            className="px-3 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
                        />
                        <input
                            name="new_job_title"
                            placeholder="New Job Title"
                            value={formData.new_job_title}
                            onChange={handleChange}
                            className="px-3 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
                        />
                        <input
                            type="number"
                            name="new_salary"
                            placeholder="New Salary"
                            value={formData.new_salary}
                            onChange={handleChange}
                            className="px-3 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
                            step="0.01"
                        />
                        <select
                            name="new_status"
                            value={formData.new_status}
                            onChange={handleChange}
                            className="px-3 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                            <option value="">Select New Status</option>
                            {statuses.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Notes */}
                    <textarea
                        name="reason"
                        placeholder="Reason for change"
                        value={formData.reason}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
                    />
                    <textarea
                        name="notes"
                        placeholder="Additional Notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
                    />
                    <input
                        name="approved_by"
                        placeholder="Approved By"
                        value={formData.approved_by}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-800 border border-sky-400/30 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-500"
                    />

                    <div className="flex justify-end gap-3 border-t border-sky-400/30 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-sky-400/50 text-white rounded-md hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md transition"
                        >
                            Save Record
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
