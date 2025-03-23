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
    // Salvar a role no localStorage
    localStorage.setItem("userRole", selectedRole);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Selecione seu tipo de usuário
        </h2>
        <p className="text-gray-600 mb-6">
          Esta seleção é apenas para fins de teste e será substituída por uma
          implementação real de autenticação.
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
              className="h-4 w-4 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="user-role" className="ml-2 block text-gray-700">
              Usuário Regular
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
              className="h-4 w-4 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="admin-role" className="ml-2 block text-gray-700">
              Administrador
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleRoleSelection}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
