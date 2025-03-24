import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUserRole } from "../hooks/useUserRole";
import RoleSelectionModal from "./RoleSelectionModal";

function Header() {
  const { logout, provider, web3Auth } = useWeb3Auth();
  const location = useLocation();
  const { userRole, showRoleModal, setShowRoleModal, isAdmin } = useUserRole();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const getUserInfo = async () => {
      if (provider) {
        try {
          if (web3Auth) {
            const user = await web3Auth.getUserInfo();
            setUserInfo(user);
            const savedRole = localStorage.getItem("userRole");
            if (!savedRole) {
              setShowRoleModal(true);
            }
          }
        } catch (error) {
          console.error("Error getting user info:", error);
        }
      }
    };

    getUserInfo();
  }, [provider, setShowRoleModal, web3Auth]);

  // Force a re-render when userRole changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      // This will trigger a re-render when localStorage changes
      const currentRole = localStorage.getItem("userRole");
      if (currentRole !== userRole) {
        window.location.reload(); // Simple way to force a complete refresh
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [userRole]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="bg-secondary-color shadow-lg py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <nav className="space-x-6">
            <Link
              to="/"
              className={`text-white hover:text-primary-color font-medium transition-colors ${
                location.pathname === "/"
                  ? "border-b-2 border-primary-color pb-1"
                  : ""
              }`}
            >
              Home
            </Link>
            <Link
              to="/my-nfts"
              className={`text-white hover:text-primary-color font-medium transition-colors ${
                location.pathname === "/my-nfts"
                  ? "border-b-2 border-primary-color pb-1"
                  : ""
              }`}
            >
              My NFTs
            </Link>
            <Link
              to="/profile"
              className={`text-white hover:text-primary-color font-medium transition-colors ${
                location.pathname === "/profile"
                  ? "border-b-2 border-primary-color pb-1"
                  : ""
              }`}
            >
              Profile
            </Link>
            <Link
              to="/admin/nft-requests"
              className={`text-white hover:text-primary-color font-medium transition-colors ${
                location.pathname === "/admin/nft-requests"
                  ? "border-b-2 border-primary-color pb-1"
                  : ""
              }`}
            >
              Admin NFT Requests
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            {userInfo && userRole && (
              <span className="text-white text-sm content-bg px-3 py-1 rounded-full">
                {userRole === "admin" ? "👑 Admin" : "👤 User"}:{" "}
                {userInfo.name || userInfo.email || "User"}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="bg-primary-color hover:opacity-90 text-white font-medium px-4 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      />
    </>
  );
}

export default Header;
