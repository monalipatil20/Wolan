import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Drivers from "./pages/Drivers";
import LiveMap from "./pages/LiveMap";
import Merchants from "./pages/Merchants";
import Reports from "./pages/Reports";
import HQMaster from "./pages/HQMaster";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.log("ErrorBoundary caught:", error);
    toast.error("Something went wrong, please refresh the page");
  }
  render() {
    return this.state.hasError ? (
      <div className="p-8 text-center text-muted-foreground">Something went wrong</div>
    ) : (
      this.props.children
    );
  }
}

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <Layout>
                <Orders />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/drivers" element={
            <ProtectedRoute>
              <Layout>
                <Drivers />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/map" element={
            <ProtectedRoute>
              <Layout>
                <LiveMap />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/merchants" element={
            <ProtectedRoute>
              <Layout>
                <Merchants />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/hq" element={
            <ProtectedRoute>
              <Layout>
                <HQMaster />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </ErrorBoundary>
      <Toaster position="top-right" />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
