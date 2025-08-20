import React from 'react';
import { useAppContext } from '../App';
import { Page } from '../types';
import { HomeIcon, BriefcaseIcon, ShoppingCartIcon, UsersIcon, SettingsIcon, LogoutIcon, FileTextIcon, BuildingStorefrontIcon } from './icons';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const NavItem = ({ icon, label, page, activePage, setPage }: any) => (
  <button
    onClick={() => setPage(page)}
    className={`w-full flex items-center justify-center lg:justify-start p-3 my-1 rounded-lg transition-colors duration-200 ${
      activePage === page ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-100 hover:text-blue-600'
    }`}
    title={label}
  >
    {icon}
    <span className="ms-4 hidden lg:inline">{label}</span>
  </button>
);

const Sidebar = ({ onLogout }: { onLogout: () => void }) => {
  const { page, setPage, currentUser, settings } = useAppContext();

  // Helper function to check permission
  const hasPermission = (pageToCheck: Page) => {
    // If currentUser is admin (id 'u1'), they have all permissions
    if (currentUser?.id === 'u1') {
      return true;
    }
    // Otherwise, check specific permission
    return currentUser?.permissions?.[pageToCheck] === true;
  };

  return (
    <div className="fixed top-0 right-0 h-full bg-white shadow-lg w-20 lg:w-64 flex flex-col transition-all duration-300 z-40">
      <div className="flex items-center justify-center h-20 border-b">
        <h1 className="text-2xl font-bold text-blue-600 hidden lg:inline">{settings.systemName || 'نظامي'}</h1>
      </div>
      <nav className="flex-grow px-2 py-4">
        {hasPermission(Page.Dashboard) && <NavItem icon={<HomeIcon className="h-6 w-6 sidebar-icon" />} label="الرئيسية" page={Page.Dashboard} activePage={page} setPage={setPage} />}
        {hasPermission(Page.Products) && <NavItem icon={<BriefcaseIcon className="h-6 w-6 sidebar-icon" />} label="إدارة المنتجات" page={Page.Products} activePage={page} setPage={setPage} />}
        {hasPermission(Page.Pos) && <NavItem icon={<ShoppingCartIcon className="h-6 w-6 sidebar-icon" />} label="نقطة البيع" page={Page.Pos} activePage={page} setPage={setPage} />}
        {hasPermission(Page.Customers) && <NavItem icon={<UsersIcon className="h-6 w-6 sidebar-icon" />} label="إدارة العملاء" page={Page.Customers} activePage={page} setPage={setPage} />}
        {hasPermission(Page.Invoices) && <NavItem icon={<FileTextIcon className="h-6 w-6 sidebar-icon" />} label="الفواتير" page={Page.Invoices} activePage={page} setPage={setPage} />}
        {hasPermission(Page.Expenses) && <NavItem icon={<BriefcaseIcon className="h-6 w-6 sidebar-icon" />} label="المصاريف" page={Page.Expenses} activePage={page} setPage={setPage} />}
        {hasPermission(Page.Settings) && <NavItem icon={<SettingsIcon className="h-6 w-6 sidebar-icon" />} label="الإعدادات" page={Page.Settings} activePage={page} setPage={setPage} />}
      </nav>
      <div className="px-4 py-4 border-t">
        <div className="hidden lg:block text-center text-xs text-black">
            <img src="/YSK-SALES.png" alt="YSK SALES Logo" className="h-10 w-10 mx-auto mb-2"/>
            <p>Developed by: Sameh reda</p>
            <p>للدعم الفني والمبيعات</p>
            <div className="flex justify-center items-center my-2">
                <img src="/mobile.png" alt="Phone" className="h-4 w-4 ml-2"/>
                <a href="tel:01023160657">01023160657</a>
            </div>
            <div className="flex justify-center items-center my-2">
                <img src="/whatsapp.png" alt="Whatsapp" className="h-4 w-4 ml-2"/>
                <a href="https://wa.me/201023160657" target="_blank">01023160657</a>
            </div>
            <div className="flex justify-center items-center my-2">
                <img src="/web-domain.png" alt="Website" className="h-4 w-4 ml-2"/>
                <a href="https://doc-digital.online" target="_blank">doc-digital.online</a>
            </div>
            <div className="flex justify-center items-center my-2">
                <img src="/gmail.png" alt="Email" className="h-4 w-4 ml-2"/>
                <a href="mailto:same7redaa@gmail.com">same7redaa@gmail.com</a>
            </div>
        </div>
         <div className="text-center lg:text-right mb-2 mt-4">
            <p className="text-sm font-semibold text-gray-700 hidden lg:block">مرحباً، {currentUser?.name}</p>
         </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center lg:justify-start p-3 my-1 rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
          title="تسجيل الخروج"
        >
          <LogoutIcon className="h-6 w-6 sidebar-icon" />
          <span className="ms-4 hidden lg:inline">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div className="flex">
      <Sidebar onLogout={onLogout} />
      <main className="flex-1 mr-20 lg:mr-64 bg-gray-50 min-h-screen">
        <div className="p-8">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;