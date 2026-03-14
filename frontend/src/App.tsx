import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import LoginPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import SettlementsPage from "./pages/SettlementsPage";
import AuthProvider from "./providers/AuthProvider";

function App() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={isSignedIn ? <DashboardPage /> : <Navigate to="/auth" replace />} />
          <Route path="/auth" element={!isSignedIn ? <LoginPage /> : <Navigate to="/" replace />} />
          <Route path="/group/:groupId/settlement" element={isSignedIn ? <SettlementsPage /> : <Navigate to="/auth" replace />} />
          <Route path="*" element={<Navigate to={isSignedIn ? "/" : "/auth"} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


