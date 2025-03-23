import { useState, useEffect } from "react";

type UserRole = "admin" | "user" | null;

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem("userRole");
    return (savedRole as UserRole) || null;
  });

  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);

  useEffect(() => {
    if (!userRole) {
      setShowRoleModal(true);
    }
  }, [userRole]);

  const setRole = (role: UserRole) => {
    if (role) {
      localStorage.setItem("userRole", role);
    } else {
      localStorage.removeItem("userRole");
    }
    setUserRole(role);
  };

  const clearRole = () => {
    localStorage.removeItem("userRole");
    setUserRole(null);
  };

  const isAdmin = () => userRole === "admin";

  return {
    userRole,
    setRole,
    clearRole,
    isAdmin,
    showRoleModal,
    setShowRoleModal,
  };
};
