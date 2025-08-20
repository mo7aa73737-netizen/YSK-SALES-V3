import React, { useEffect } from 'react';
import { useAppContext } from '../App';
import { Invoice } from '../types';
import { printInvoice } from '../utils/print-utils';

const InvoiceModal = ({ invoice, onClose, autoPrint = false }: { invoice: Invoice, onClose: () => void, autoPrint?: boolean }) => {
    const { settings } = useAppContext();

    useEffect(() => {
        if (autoPrint) {
            printInvoice(invoice, settings);
            onClose(); 
        }
    }, [invoice, settings, autoPrint, onClose]);

    // This modal will no longer be rendered, as printing is handled directly.
    // The component is kept for structure and future potential use (e.g., non-autoprint scenarios).
    return null;
};

export default InvoiceModal;