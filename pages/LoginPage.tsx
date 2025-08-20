import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';

const LoginPage = () => {
  const { users, setCurrentUser, addNotification } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('rememberedUsername') ? true : false);
  const [error, setError] = useState('');

  useEffect(() => {
      const rememberedUsername = localStorage.getItem('rememberedUsername');
      if (rememberedUsername) {
          setUsername(rememberedUsername);
          setRememberMe(true);
      }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.name === username && (u.password || '') === password);
    if (user) {
        if (user.status === 'نشط') {
            // Fix missing permissions for users
            if (!user.permissions || Object.keys(user.permissions).length === 0) {
                user.permissions = {
                    0: true,  // Dashboard
                    1: true,  // Products
                    2: true,  // Pos
                    3: true,  // Customers
                    4: true,  // Invoices
                    5: true,  // Expenses
                    6: user.id === 'u1'  // Settings (only admin)
                };
            }
            
            setCurrentUser(user);
            addNotification(`مرحباً بك مجدداً، ${user.name}`);
            if (rememberMe) {
                localStorage.setItem('rememberedUsername', username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }
        } else {
            setError('هذا الحساب غير نشط.');
        }
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
            <img src="/YSK-SALES.png" alt="YSK SALES Logo" className="mx-auto h-24 w-24"/>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">تسجيل الدخول</h2>
            <p className="mt-2 text-sm text-gray-600">مرحباً بك مجدداً! الرجاء إدخال بياناتك.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 text-right mb-1">اسم المستخدم</label>
              <input 
                id="username" 
                name="username" 
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                required 
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                placeholder="اسم المستخدم" />
            </div>
            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 text-right mb-1">كلمة المرور</label>
              <input 
                id="password-input" 
                name="password" 
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required 
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                placeholder="كلمة المرور" />
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
                <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ms-2 block text-sm text-gray-900 cursor-pointer">
                    تذكر اسم المستخدم
                </label>
            </div>
        </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <div>
            <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              تسجيل الدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;