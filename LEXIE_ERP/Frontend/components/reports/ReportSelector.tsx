import React from 'react';

interface ReportType {
    id: string;
    name: string;
    category: string;
}

interface ReportSelectorProps {
    reportTypes: ReportType[];
    selectedReport: string;
    onSelect: (reportId: string) => void;
}

export const ReportSelector: React.FC<ReportSelectorProps> = ({ reportTypes, selectedReport, onSelect }) => {
    // Group by category
    const categories = Array.from(new Set(reportTypes.map(r => r.category)));

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Report</label>
            <select
                className="block w-full pl-3 pr-10 py-2 text-base bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                value={selectedReport}
                onChange={(e) => onSelect(e.target.value)}
            >
                <option value="">-- Choose a Report --</option>
                {categories.map(category => (
                    <optgroup key={category} label={category}>
                        {reportTypes.filter(r => r.category === category).map(report => (
                            <option key={report.id} value={report.id}>
                                {report.name}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
};
