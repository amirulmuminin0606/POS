import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductList } from './components/master/ProductList';
import { CustomerList } from './components/master/CustomerList';
import { SalesList as SalespeopleList } from './components/master/SalesList';
import { StockCard } from './components/master/StockCard';
import { SalesList as SalesTransactionsList } from './components/sales/SalesList';
import { CashierView } from './components/sales/CashierView';
import { ReturnView } from './components/sales/ReturnView';
import { StockReceiptView } from './components/inventory/StockReceiptView';
import { StockIssueView } from './components/inventory/StockIssueView';
import { StocktakeView } from './components/inventory/StocktakeView';
import { ItemReportView } from './components/reports/ItemReportView';
import { SalesReportView } from './components/reports/SalesReportView';
import { SmartStockView } from './components/smartstock/SmartStockView';
import { ThermalBarcodePrint } from './components/barcode/ThermalBarcodePrint';
import { AuditLogView } from './components/audit/AuditLogView';
import { db } from './services/db';
import { User } from './types';

export default function App() {
  const [currentMenu, setCurrentMenu] = useState('dashboard');
  const [activeUser, setActiveUser] = useState<User>(() => db.getActiveUser());
  const [dataVersion, setDataVersion] = useState(0);

  // Optional contextual IDs passed between views
  const [selectedProductIdForCard, setSelectedProductIdForCard] = useState<string | undefined>(undefined);
  const [selectedProductIdForBarcode, setSelectedProductIdForBarcode] = useState<string | undefined>(undefined);
  const [selectedSaleIdForCashier, setSelectedSaleIdForCashier] = useState<string | undefined>(undefined);

  const handleRefreshData = () => {
    setDataVersion((v) => v + 1);
  };

  const handleUserChange = (newUser: User) => {
    db.setActiveUser(newUser);
    setActiveUser(newUser);
    handleRefreshData();
  };

  const handleNavigateToStockCard = (productId: string) => {
    setSelectedProductIdForCard(productId);
    setCurrentMenu('master-stock-card');
  };

  const handleNavigateToThermalBarcode = (productId: string) => {
    setSelectedProductIdForBarcode(productId);
    setCurrentMenu('thermal-barcode');
  };

  const handleOpenCashierWithSale = (saleId: string) => {
    setSelectedSaleIdForCashier(saleId);
    setCurrentMenu('sales-cashier');
  };

  // Keyboard shortcut for quick POS cashier (F2 or Alt+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setCurrentMenu('sales-cashier');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentMenu={currentMenu}
        onSelectMenu={(menu) => {
          if (menu !== 'master-stock-card') setSelectedProductIdForCard(undefined);
          if (menu !== 'thermal-barcode') setSelectedProductIdForBarcode(undefined);
          if (menu !== 'sales-cashier') setSelectedSaleIdForCashier(undefined);
          setCurrentMenu(menu);
        }}
        activeUser={activeUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeUser={activeUser}
          onUserChange={handleUserChange}
          onNavigate={(menu) => setCurrentMenu(menu)}
          onRefreshData={handleRefreshData}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/60">
          <div className="max-w-7xl mx-auto">
            {currentMenu === 'dashboard' && (
              <DashboardView
                key={dataVersion}
                onNavigate={(menu) => setCurrentMenu(menu)}
              />
            )}

            {currentMenu === 'master-products' && (
              <ProductList
                key={dataVersion}
                onRefreshData={handleRefreshData}
                onNavigateToStockCard={handleNavigateToStockCard}
                onNavigateToThermalBarcode={handleNavigateToThermalBarcode}
              />
            )}

            {currentMenu === 'master-customers' && (
              <CustomerList
                key={dataVersion}
                onRefreshData={handleRefreshData}
              />
            )}

            {currentMenu === 'master-sales' && (
              <SalespeopleList
                key={dataVersion}
                onRefreshData={handleRefreshData}
              />
            )}

            {currentMenu === 'master-stock-card' && (
              <StockCard
                key={`${dataVersion}-${selectedProductIdForCard}`}
                initialProductId={selectedProductIdForCard}
                onRefreshData={handleRefreshData}
              />
            )}

            {currentMenu === 'sales-list' && (
              <SalesTransactionsList
                key={dataVersion}
                onRefreshData={handleRefreshData}
                onOpenCashierWithSale={handleOpenCashierWithSale}
              />
            )}

            {currentMenu === 'sales-cashier' && (
              <CashierView
                key={`${dataVersion}-${selectedSaleIdForCashier}`}
                initialSaleId={selectedSaleIdForCashier}
                onRefreshData={handleRefreshData}
                onNavigateToInvoice={(saleId) => setCurrentMenu('sales-list')}
              />
            )}

            {currentMenu === 'sales-returns' && (
              <ReturnView
                key={dataVersion}
                onRefreshData={handleRefreshData}
              />
            )}

            {currentMenu === 'inventory-in' && (
              <StockReceiptView
                key={dataVersion}
                onRefreshData={handleRefreshData}
              />
            )}

            {currentMenu === 'inventory-out' && (
              <StockIssueView
                key={dataVersion}
                onRefreshData={handleRefreshData}
              />
            )}

            {currentMenu === 'inventory-stocktake' && (
              <StocktakeView
                key={dataVersion}
                onRefreshData={handleRefreshData}
              />
            )}

            {currentMenu === 'reports-items' && (
              <ItemReportView key={dataVersion} />
            )}

            {currentMenu === 'reports-sales' && (
              <SalesReportView key={dataVersion} />
            )}

            {currentMenu === 'smart-stock' && (
              <SmartStockView
                key={dataVersion}
                onNavigateToStockIn={() => setCurrentMenu('inventory-in')}
              />
            )}

            {currentMenu === 'thermal-barcode' && (
              <ThermalBarcodePrint
                key={`${dataVersion}-${selectedProductIdForBarcode}`}
                initialProductId={selectedProductIdForBarcode}
              />
            )}

            {currentMenu === 'audit-log' && (
              <AuditLogView key={dataVersion} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
