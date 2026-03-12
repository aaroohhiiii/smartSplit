
import { createContext, ReactNode, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axiosInstance from "../lib/axios";

interface AuthContextType {}

export const AuthContext = createContext<AuthContextType>({});

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { getToken, isLoaded } = useAuth();
  const { isLoaded: userLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !userLoaded) return;

    const interceptor = axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          // Request Clerk session token
          const token = await getToken({ template: "default" });
          console.log("TOKEN:", token);

          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.error("[AuthProvider] Failed to get token", err);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axiosInstance.interceptors.request.eject(interceptor);
    };
  }, [getToken, isLoaded, userLoaded]);

  if (!isLoaded || !userLoaded) {
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}
