import { useMemo, useState } from "react";
import { loginAdmin } from "../api/bookingApi";

export const useAdminAuth = () => {
  const [authToken, setAuthToken] = useState(
    () => sessionStorage.getItem("adminToken") || "",
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(sessionStorage.getItem("adminToken")),
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const authConfig = useMemo(
    () => ({ headers: { Authorization: `Bearer ${authToken}` } }),
    [authToken],
  );

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await loginAdmin({
        username: username.trim(),
        password: password.trim(),
      });
      if (response.data.success && response.data.token) {
        sessionStorage.setItem("adminToken", response.data.token);
        setAuthToken(response.data.token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      alert("Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    setAuthToken("");
    setIsAuthenticated(false);
  };

  return {
    authToken,
    authConfig,
    isAuthenticated,
    username,
    password,
    loading,
    setUsername,
    setPassword,
    handleLogin,
    handleLogout,
  };
};
