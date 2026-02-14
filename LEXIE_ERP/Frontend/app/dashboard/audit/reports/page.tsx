"use client";

import React, { useState, useEffect } from 'react';
import { fetchReportTypes, generateReport } from '@/utils/api';
import { ReportSelector } from '@/components/reports/ReportSelector';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportPreview } from '@/components/reports/ReportPreview';

export default function ReportsPage() {
    const [reportTypes, setReportTypes] = useState<any[]>([]);
    const [selectedReportId, setSelectedReportId] = useState<string>("");
    const [parameters, setParameters] = useState<any[]>([]);
    const [reportData, setReportData] = useState<any>(null);
    const [currentParams, setCurrentParams] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadTypes = async () => {
            try {
                const types = await fetchReportTypes();
                setReportTypes(types);
            } catch (error) {
                console.error("Failed to load report types", error);
            }
        };
        loadTypes();
    }, []);

    const handleReportSelect = (id: string) => {
        setSelectedReportId(id);
        const report = reportTypes.find(r => r.id === id);
        setParameters(report ? report.parameters : []);
        setReportData(null);
    };

    const handleGenerate = async (params: any) => {
        setIsLoading(true);
        setCurrentParams(params);
        try {
            const response = await generateReport(selectedReportId, params);
            setReportData(response.data);
        } catch (error) {
            console.error("Failed to generate report", error);
            alert("Failed to generate report");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 min-h-screen">
            <h1 className="text-2xl font-semibold text-white mb-6">Reports Center</h1>

            <ReportSelector
                reportTypes={reportTypes}
                selectedReport={selectedReportId}
                onSelect={handleReportSelect}
            />

            {selectedReportId && (
                <ReportFilters
                    parameters={parameters}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                />
            )}

            {reportData && (
                <ReportPreview
                    data={reportData}
                    reportName={selectedReportId}
                    parameters={currentParams}
                />
            )}
        </div>
    );
}
