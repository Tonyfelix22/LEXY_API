"use client"

import BudgetTable from "@/components/finance/budget-table"

export default function BudgetsPage() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Budget Management</h1>
                    <p className="text-gray-500 mt-2">Create and monitor department budgets and expenditures.</p>
                </div>
            </div>

            <BudgetTable />
        </div>
    )
}
