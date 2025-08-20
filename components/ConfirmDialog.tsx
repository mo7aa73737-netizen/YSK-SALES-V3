import React from 'react';
import { XIcon } from './icons';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    onConfirm,
    onCancel,
    type = 'warning'
}) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: '⚠️',
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    confirmBtn: 'bg-red-600 hover:bg-red-700',
                    titleColor: 'text-red-900'
                };
            case 'warning':
                return {
                    icon: '⚠️',
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    confirmBtn: 'bg-yellow-600 hover:bg-yellow-700',
                    titleColor: 'text-yellow-900'
                };
            case 'info':
                return {
                    icon: 'ℹ️',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    confirmBtn: 'bg-blue-600 hover:bg-blue-700',
                    titleColor: 'text-blue-900'
                };
            default:
                return {
                    icon: '❓',
                    iconBg: 'bg-gray-100',
                    iconColor: 'text-gray-600',
                    confirmBtn: 'bg-gray-600 hover:bg-gray-700',
                    titleColor: 'text-gray-900'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
                <div className="p-6">
                    <div className="flex items-start">
                        <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                            <span className={`text-xl ${styles.iconColor}`}>
                                {styles.icon}
                            </span>
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ms-4 sm:text-right flex-1">
                            <h3 className={`text-lg leading-6 font-medium ${styles.titleColor} mb-2`}>
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button
                        type="button"
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${styles.confirmBtn} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ms-3 sm:w-auto sm:text-sm transition-colors`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ms-3 sm:w-auto sm:text-sm transition-colors"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;