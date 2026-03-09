import React, { useState, useEffect } from 'react';

interface Parameter {
    name: string;
    type: string;
    label: string;
    required?: boolean;
    default?: any;
    options?: { value: string | number; label: string }[];
}

interface ReportFiltersProps {
    parameters: Parameter[];
    onGenerate: (params: any) => void;
    isLoading: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ parameters, onGenerate, isLoading }) => {
    const [values, setValues] = useState<any>({});

    // Initialize default values
    useEffect(() => {
        const defaults: any = {};
        parameters.forEach(p => {
            if (p.default !== undefined) {
                defaults[p.name] = p.default;
            }
        });
        setValues(defaults);
    }, [parameters]);

    const handleChange = (name: string, value: any) => {
        setValues((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(values);
    };

    if (parameters.length === 0) return null;

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow mb-6 border border-slate-700">
            <h3 className="text-lg font-medium mb-4 text-white">Report Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parameters.map(param => (
                    <div key={param.name}>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            {param.label} {param.required && <span className="text-red-500">*</span>}
                        </label>

                        {param.type === 'date' && (
                            <input
                                type="date"
                                className="block w-full bg-slate-900 border-slate-700 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-white"
                                value={values[param.name] || ''}
                                onChange={(e) => handleChange(param.name, e.target.value)}
                                required={param.required}
                            />
                        )}

                        {param.type === 'select' && (
                            <select
                                className="block w-full bg-slate-900 border-slate-700 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-white"
                                value={values[param.name] || ''}
                                onChange={(e) => handleChange(param.name, e.target.value)}
                                required={param.required}
                            >
                                <option value="">Select...</option>
                                {param.options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        )}

                        {/* Add more input types as needed */}
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                >
                    {isLoading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>
        </form>
    );
};
