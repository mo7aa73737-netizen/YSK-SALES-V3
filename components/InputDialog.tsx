import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';

interface InputDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    inputType?: 'text' | 'number' | 'email' | 'password';
    required?: boolean;
}

const InputDialog: React.FC<InputDialogProps> = ({
    isOpen,
    title,
    message,
    placeholder = '',
    defaultValue = '',
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    onConfirm,
    onCancel,
    inputType = 'text',
    required = false
}) => {
    const [value, setValue] = useState(defaultValue);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            setError('');
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (required && !value.trim()) {
            setError('هذا الحقل مطلوب');
            return;
        }
        onConfirm(value);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {title}
                        </h3>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {message && (
                        <p className="text-sm text-gray-500 mb-4">
                            {message}
                        </p>
                    )}
                    
                    <div className="mb-4">
                        <input
                            type={inputType}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                if (error) setError('');
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder={placeholder}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                error ? 'border-red-500' : 'border-gray-300'
                            }`}
                            autoFocus
                        />
                        {error && (
                            <p className="mt-1 text-sm text-red-600">{error}</p>
                        )}
                    </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ms-3 sm:w-auto sm:text-sm transition-colors"
                        onClick={handleConfirm}
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

export default InputDialog;