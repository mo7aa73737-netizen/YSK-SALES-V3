import { Invoice, Settings } from '../types';

const generateInvoiceHtml = (invoice: Invoice, settings: Settings): string => {
    const itemsHtml = invoice.items.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td class="product-name">${item.product.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)}</td>
            <td>${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    const getDiscountDisplay = () => {
        if (typeof invoice.discount === 'number') return `${invoice.discount}%`;
        if (invoice.discount.type === 'percentage') return `${invoice.discount.value}%`;
        return `${invoice.discount.value.toFixed(2)} ج.م`;
    }

    const getTaxDisplay = () => {
        if (typeof invoice.tax === 'number') return `${invoice.tax}%`;
        if (invoice.tax.type === 'percentage') return `${invoice.tax.value}%`;
        return `${invoice.tax.value.toFixed(2)} ج.م`;
    }

    const barcodeHtml = settings.customInvoiceBarcode ? `
        <div class="barcode-area">
            <p>${settings.barcodeText || ''}</p>
            <img src="${settings.customInvoiceBarcode}" alt="Barcode"/>
        </div>
    ` : '';

    // تنسيق التاريخ والوقت
    const invoiceDate = new Date(invoice.date);
    const formattedDate = invoiceDate.toLocaleDateString('ar-EG');
    const formattedTime = invoice.time || invoiceDate.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });

    // تحديد نوع العميل
    let customerType = '';
    if (invoice.customer) {
        customerType = `العميل: ${invoice.customer.name}`;
    } else if (invoice.paymentType === 'نقدي') {
        customerType = 'عميل نقدي';
    } else if (invoice.paymentType === 'آجل') {
        customerType = 'عميل آجل';
    }

    return `
        <div class="invoice-box">
            <div class="header">
                <h3>${settings.companyName || ''}</h3>
                <p>${settings.companyAddress || ''}</p>
                <p>${settings.companyPhone || ''}</p>
                <p>التاريخ: ${formattedDate}</p>
                <p>الوقت: ${formattedTime}</p>
                <p>رقم الفاتورة: ${invoice.id}</p>
                ${customerType ? `<p>${customerType}</p>` : ''}
            </div>
            <h3 class="title">فاتورة بيع</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th class="product-name">المنتج</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>الإجمالي</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div class="totals-section">
                <div><span>المجموع:</span> <span>${invoice.subtotal.toFixed(2)}</span></div>
                <div><span>الخصم:</span> <span>${getDiscountDisplay()}</span></div>
                <div><span>الضريبة:</span> <span>${getTaxDisplay()}</span></div>
                <div class="final-total"><span>الإجمالي النهائي:</span> <span>${invoice.total.toFixed(2)}</span></div>
            </div>
            <div class="payment-method">طريقة الدفع: ${invoice.paymentType}</div>
            <div class="footer">
                ${barcodeHtml}
                <p>${settings.thankYouMessage || ''}</p>
            </div>
        </div>
    `;
};

export const printInvoice = (invoice: Invoice, settings: Settings) => {
    const invoiceHtml = generateInvoiceHtml(invoice, settings);

    const printStyles = `
        @page { 
            size: 58mm auto;
            margin: 0;
        }
        @media print {
            html, body {
                width: 58mm !important;
                margin: 0 !important;
                padding: 0 !important;
                direction: ltr; /* Force LTR on page for Edge bug */
            }
            * {
                box-sizing: border-box;
            }
        }
        .invoice-box {
            font-family: 'Cairo', sans-serif;
            width: 100%;
            padding: 1.5mm;
            direction: rtl; /* Apply RTL to the content itself */
            font-weight: bold; /* Make all text bold */
        }
        .header, .footer, .title { text-align: center; }
        .header h3 { margin: 0; font-size: 12px; }
        .header p { margin: 0; font-size: 9px; }
        .title { font-size: 11px; margin: 2mm 0; }
        .items-table { width: 100%; border-collapse: collapse; font-size: 9px; }
        .items-table th, .items-table td { padding: 1mm; text-align: center; border-bottom: 1px dashed #999; }
        .items-table th { background-color: #eee; border-top: 1px dashed #999; }
        .items-table .product-name { text-align: center; }
        .totals-section { margin-top: 2mm; text-align: center; }
        .totals-section div { font-size: 9px; margin-bottom: 0.5mm; }
        .totals-section .final-total { font-size: 11px; padding-top: 1mm; border-top: 1px solid #000; margin-top: 1mm; }
        .payment-method { text-align: center; font-size: 9px; margin-top: 2mm; }
        .footer { font-size: 9px; margin-top: 2mm; text-align: center; }
        .barcode-area { margin-top: 2mm; }
        .barcode-area p { margin: 0 0 1mm 0; font-size: 8px; }
        .barcode-area img { max-width: 100%; height: auto; max-height: 50px; }
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>فاتورة بيع</title>
                    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
                    <style>${printStyles}</style>
                </head>
                <body>
                    ${invoiceHtml}
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500); // Increased timeout for Edge
    }
};
