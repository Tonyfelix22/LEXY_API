import React from 'react';
import { generateReport } from '@/utils/api';

interface ReportPreviewProps {
    data: any;
    reportName: string;
    parameters: any;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ data, reportName, parameters }) => {
    const handleExport = async (format: string) => {
        try {
            const response = await generateReport(reportName, parameters, format);
            if (response.file_url) {
                // Trigger download
                const link = document.createElement('a');
                link.href = response.file_url.startsWith('http') ? response.file_url : `http://127.0.0.1:8000${response.file_url}`;
                link.download = `${reportName}.${format.toLowerCase()}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        }
    };

    if (!data) return null;

    // Helper to render table from array of objects
    const renderTable = (items: any[]) => {
        if (!items || items.length === 0) return <p>No data found.</p>;
        const headers = Object.keys(items[0]);

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-900">
                        <tr>
                            {headers.map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    {h.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                {headers.map(h => (
                                    <td key={h} className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {typeof item[h] === 'object' ? JSON.stringify(item[h]) : item[h]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Determine how to render based on data structure
    let content;
    if (Array.isArray(data)) {
        content = renderTable(data);
    } else if (typeof data === 'object') {
        // Handle complex objects (like Balance Sheet)
        content = (
            <div className="space-y-8 text-white">
                {Object.keys(data).map(key => {
                    if (Array.isArray(data[key])) {
                        return (
                            <div key={key}>
                                <h4 className="text-md font-bold mb-2 uppercase text-sky-400">{key.replace(/_/g, ' ')}</h4>
                                {renderTable(data[key])}
                            </div>
                        );
                    } else if (typeof data[key] !== 'object') {
                        return (
                            <div key={key} className="flex justify-between border-b border-slate-700 py-2">
                                <span className="font-medium uppercase text-slate-300">{key.replace(/_/g, ' ')}</span>
                                <span className="text-white">{data[key]}</span>
                            </div>
                        )
                    }
                    return null;
                })}
            </div>
        );
    }

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow border border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Report Preview</h3>
                <div className="space-x-2">
                    <button
                        onClick={() => handleExport('EXCEL')}
                        className="inline-flex items-center px-3 py-2 border border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    >
                        Export Excel
                    </button>
                    {/* PDF Export can be added similarly */}
                </div>
            </div>
            <div className="mt-4">
                {content}
            </div>
        </div>
    );
};
