import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Dashboard from "./pages/MainContent/Dashboard";
import Components from "./pages/MainContent/Components";
import Issues from "./pages/MainContent/Issues";
import Orders from "./pages/MainContent/Orders";
import Raports from "./pages/MainContent/Raports";
import Settings from "./pages/MainContent/Settings";
import { ThemeProvider } from "./utils/ThemeContext";
import { AuthProvider, useAuth } from "./utils/AuthContext";
import Layout from "./layouts/MainLayout";
import Auth from "./pages/Auth";
import Users from "./pages/MainContent/Settings/Users";
import QR from "./pages/MainContent/Settings/QR";
import Location from "./pages/MainContent/Settings/Location";
import Summary from "./pages/MainContent/Dashboard/Summary";
import ComponentList from "./pages/MainContent/Components/ComponentList";
import RegisterIssue from "./pages/MainContent/Issues/RegisterIssue";
import CreateOrder from "./pages/MainContent/Orders/CreateOrder";
import InventoryStatus from "./pages/MainContent/Raports/InventoryStatus";
import LastOperations from "./pages/MainContent/Dashboard/Last-operations";
import CategoriesPreview from "./pages/MainContent/Dashboard/Categories-preview";
import Alerts from "./pages/MainContent/Dashboard/Alerts";
import Products from "./pages/MainContent/Components/Products";
import AddComponentsAndProducts from "./pages/MainContent/Components/AddComponentsAndProducts";
import Search from "./pages/MainContent/Components/Search";
import IssueHistory from "./pages/MainContent/Issues/IssueHistory";
import OrderHistory from "./pages/MainContent/Orders/OrderHistory";
import OrderStatus from "./pages/MainContent/Orders/OrderStatus";
import OutboundSummary from "./pages/MainContent/Raports/Outbound-summary";
import PDFExport from "./pages/MainContent/Raports/PDF_export";
import InboundSummary from "./pages/MainContent/Raports/Inbound-summary";
import ItemEditPage from "./pages/MainContent/Items/ItemEditPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  console.log('ProtectedRoute check - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading)
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">⏳ Ładowanie...</div>
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={isAuthenticated ? <Navigate to="/main" replace /> : <Auth />} 
      />

      {/* ItemEditPage - bez Layout */}
      <Route
        path="/items/:id/edit"
        element={
          <ProtectedRoute>
            <ItemEditPage />
          </ProtectedRoute>
        }
      />

      {/* Protected routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <LayoutWrapper />
          </ProtectedRoute>
        }
      >
        {/* MAIN - bez ITEMS rute (jest wyżej) */}
        <Route path="/main" element={<Navigate to="/main/summary" replace />} />
        <Route path="/main/*" element={<Dashboard />}>
          <Route path="summary" element={<Summary />} />
          <Route path="last-operations" element={<LastOperations />} />
          <Route path="categories-preview" element={<CategoriesPreview />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>

        {/* COMPONENTS */}
        <Route path="/components" element={<Navigate to="/components/componentlist" replace />} />
        <Route path="/components/*" element={<Components />}>
          <Route path="componentlist" element={<ComponentList />} />
          <Route path="products" element={<Products />} />
          <Route path="add" element={<AddComponentsAndProducts />} />
          <Route path="search" element={<Search />} />
        </Route>

        {/* ISSUES */}
        <Route path="/issues" element={<Navigate to="/issues/register" replace />} />
        <Route path="/issues/*" element={<Issues />}>
          <Route path="register" element={<RegisterIssue />} />
          <Route path="history" element={<IssueHistory />} />
        </Route>

        {/* ORDERS */}
        <Route path="/orders" element={<Navigate to="/orders/create" replace />} />
        <Route path="/orders/*" element={<Orders />}>
          <Route path="create" element={<CreateOrder />} />
          <Route path="history" element={<OrderHistory />} />
          <Route path="status" element={<OrderStatus />} />
        </Route>

        {/* RAPORTS */}
        <Route path="/raports" element={<Navigate to="/raports/inventory" replace />} />
        <Route path="/raports/*" element={<Raports />}>
          <Route path="inventory" element={<InventoryStatus />} />
          <Route path="inbound-summary" element={<InboundSummary />} />
          <Route path="outbound-summary" element={<OutboundSummary />} />
          <Route path="export" element={<PDFExport />} />
        </Route>

        {/* SETTINGS */}
        <Route path="/settings/*" element={<Settings />}>
          <Route path="users" element={<Users />} />
          <Route path="qr" element={<QR />} />
          <Route path="location" element={<Location />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/main/summary" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
