import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/MainContent/Dashboard";
import Components from "./pages/MainContent/Components";
import Issues from "./pages/MainContent/Issues";
import Orders from "./pages/MainContent/Orders";
import Raports from "./pages/MainContent/Raports";
import Settings from "./pages/MainContent/Settings";
import { ThemeProvider } from "./utils/ThemeContext";
import Layout from "./layouts/MainLayout";
import Auth from "./pages/Auth";


function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Strony bez layoutu */}
          <Route path="/auth" element={<Auth />} />

          {/* Strony z layoutem */}
          <Route
            path="*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/main" replace />} />
                  <Route path="/main/*" element={<Dashboard />} />
                  <Route path="/components/*" element={<Components />} />
                  <Route path="/issues/*" element={<Issues />} />
                  <Route path="/orders/*" element={<Orders />} />
                  <Route path="/raports/*" element={<Raports />} />
                  <Route path="/settings/*" element={<Settings />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
