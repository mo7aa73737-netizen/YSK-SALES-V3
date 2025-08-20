import React, { useState } from 'react';
import { useAppContext } from '../App';
import { XIcon, ShieldCheckIcon } from './icons';

interface SettingsAuthModalProps {
    onAuthenticate: (password: string) => void;
    onCancel: () => void;
}

const SettingsAuthModal: React.FC<SettingsAuthModalProps> = ({ onAuthenticate, onCancel }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { currentUser } = useAppContext();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser && password === currentUser.password) {
            onAuthenticate(password);
        } else {
            setError('كلمة المرور غير صحيحة.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm text-center">
                <h2 className="text-2xl font-bold flex items-center justify-center mb-6">
                    <ShieldCheckIcon className="h-7 w-7 me-2 text-blue-600" />
                    تأكيد الوصول للإعدادات
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        id="settings-password"
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        className="p-2 border rounded w-full focus:ring-blue-500 focus:border-blue-500 text-center"
                        required
                        placeholder="كلمة المرور"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-center items-center space-x-4 space-x-reverse pt-4">
                        <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
                            إلغاء
                        </button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            تأكيد
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsAuthModal;