import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Summary from "./pages/MainContent/Dashboard/Summary";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={isAuthenticated ? <Navigate to="/main" replace /> : <Auth />} 
      />

      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/main" replace />} />
                <Route path="/main/*" element={<Dashboard />}>
                  <Route path="summary" element={<Summary />} />
                </Route> 
                <Route path="/components/*" element={<Components />} />
                <Route path="/issues/*" element={<Issues />} />
                <Route path="/orders/*" element={<Orders />} />
                <Route path="/raports/*" element={<Raports />} />
                <Route path="/settings/*" element={<Settings />}>
                  <Route path="users" element={<Users />} />
                </Route>
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
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
