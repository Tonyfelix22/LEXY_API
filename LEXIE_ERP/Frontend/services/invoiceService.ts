import { apiFetch } from "@/utils/api";

export interface Contact {
    id?: number;
    name: string;
    type: 'CUSTOMER' | 'VENDOR';
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
}

export interface InvoiceItem {
    id?: number;
    description: string;
    account: number;
    account_name?: string;
    quantity: number;
    unit_price: number;
    amount?: number;
}

export interface Invoice {
    id?: number;
    contact: number;
    contact_name?: string;
    type: 'INVOICE' | 'BILL';
    reference?: string;
    date: string;
    due_date: string;
    status: 'DRAFT' | 'POSTED' | 'PAID' | 'CANCELLED';
    status_display?: string;
    total_amount?: number;
    amount_due?: number;
    journal_entry?: number;
    items: InvoiceItem[];
}

export interface Payment {
    id?: number;
    invoice: number;
    amount: number;
    method: 'CASH' | 'BANK' | 'CHECK' | 'MOBILE';
    reference?: string;
    date: string;
}

export const invoiceService = {
    // Contacts
    getContacts: async (): Promise<Contact[]> => {
        const response = await apiFetch("/finance/contacts/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    createContact: async (data: Contact): Promise<Contact> => {
        return await apiFetch("/finance/contacts/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    // Invoices
    getInvoices: async (): Promise<Invoice[]> => {
        const response = await apiFetch("/finance/invoices/");
        return Array.isArray(response) ? response : (response.results || []);
    },

    getInvoice: async (id: number): Promise<Invoice> => {
        return await apiFetch(`/finance/invoices/${id}/`);
    },

    createInvoice: async (data: any): Promise<Invoice> => {
        return await apiFetch("/finance/invoices/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    postInvoice: async (id: number): Promise<any> => {
        return await apiFetch(`/finance/invoices/${id}/post/`, {
            method: "POST",
        });
    },

    registerPayment: async (id: number, data: { amount: number; method: string; reference: string }): Promise<any> => {
        return await apiFetch(`/finance/invoices/${id}/register_payment/`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
};
