import React, { useState } from "react";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedRole, setSelectedRole] = useState<"admin" | "user">("user");

  const handleRoleSelection = () => {
    // Save the role in localStorage
    localStorage.setItem("userRole", selectedRole);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-light rounded-lg p-6 w-full max-w-md border-2 border-primary/30">
        <h2 className="text-xl font-bold text-text-default mb-4">
          Select your user type
        </h2>
        <p className="text-text-muted mb-6">
          This selection is for testing purposes only and will be replaced by a
          real authentication implementation.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center">
            <input
              type="radio"
              id="user-role"
              name="role"
              value="user"
              checked={selectedRole === "user"}
              onChange={() => setSelectedRole("user")}
              className="h-4 w-4 text-primary-color focus:ring-primary-color"
            />
            <label htmlFor="user-role" className="ml-2 block text-text-default">
              Regular User
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id="admin-role"
              name="role"
              value="admin"
              checked={selectedRole === "admin"}
              onChange={() => setSelectedRole("admin")}
              className="h-4 w-4 text-primary-color focus:ring-primary-color"
            />
            <label
              htmlFor="admin-role"
              className="ml-2 block text-text-default"
            >
              Administrator
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-secondary-color rounded-md text-text-default hover:bg-secondary-color/10"
          >
            Cancel
          </button>
          <button
            onClick={handleRoleSelection}
            className="px-4 py-2 bg-primary-color text-white rounded-md hover:bg-primary-color/90"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
