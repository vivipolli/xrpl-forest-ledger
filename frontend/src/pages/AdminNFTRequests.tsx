import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { nftService, NFTRequest } from "../services/nft";

const AdminNFTRequests: React.FC = () => {
  const [requests, setRequests] = useState<NFTRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [selectedRequest, setSelectedRequest] = useState<NFTRequest | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await nftService.getAllNFTRequests(filter);
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching NFT requests:", error);
      toast.error("Failed to load NFT requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setLoading(true);
      await nftService.approveNFTRequest(id);
      toast.success("NFT request approved and minted successfully!");
      fetchRequests();
      setModalOpen(false);
    } catch (error) {
      console.error("Error approving NFT request:", error);
      toast.error("Failed to approve NFT request");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setLoading(true);
      await nftService.rejectNFTRequest(id);
      toast.success("NFT request rejected");
      fetchRequests();
      setModalOpen(false);
    } catch (error) {
      console.error("Error rejecting NFT request:", error);
      toast.error("Failed to reject NFT request");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (request: NFTRequest) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      minted: "bg-blue-100 text-blue-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses] || "bg-gray-100"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-800 mb-6">
        NFT Preservation Requests
      </h1>

      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter(undefined)}
          className={`px-4 py-2 rounded-md ${
            filter === undefined
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-md ${
            filter === "pending"
              ? "bg-yellow-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-md ${
            filter === "approved"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-md ${
            filter === "rejected"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setFilter("minted")}
          className={`px-4 py-2 rounded-md ${
            filter === "minted"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Minted
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && requests.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No requests found
          </h3>
          <p className="mt-1 text-gray-500">
            There are no NFT requests matching your filter criteria.
          </p>
        </div>
      )}

      {/* Requests Table */}
      {!loading && requests.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Wallet
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className="truncate block max-w-xs"
                      title={request.wallet_address}
                    >
                      {request.wallet_address.substring(0, 8)}...
                      {request.wallet_address.substring(
                        request.wallet_address.length - 8
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString()}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openModal(request)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      View Details
                    </button>
                    {request.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {modalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">
                  NFT Request Details
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">
                      Request ID
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRequest.id}
                    </p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">
                      User ID
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRequest.user_id}
                    </p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">
                      Wallet Address
                    </h3>
                    <p className="mt-1 text-sm text-gray-900 break-all">
                      {selectedRequest.wallet_address}
                    </p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">
                      Status
                    </h3>
                    <p className="mt-1">
                      {getStatusBadge(selectedRequest.status)}
                    </p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">
                      Created At
                    </h3>
                    {/* <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedRequest.created_at).toLocaleString()}
                    </p> */}
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">
                      Updated At
                    </h3>
                    {/* <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedRequest.updated_at).toLocaleString()}
                    </p> */}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    NFT Metadata
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {selectedRequest.metadata.image && (
                      <div className="mb-4">
                        <img
                          src={selectedRequest.metadata.image.replace(
                            "ipfs://",
                            "https://gateway.pinata.cloud/ipfs/"
                          )}
                          alt="NFT Preview"
                          className="w-full h-48 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "https://via.placeholder.com/400x300?text=Image+Not+Available";
                          }}
                        />
                      </div>
                    )}
                    <div className="mb-2">
                      <h4 className="text-xs font-medium text-gray-500">
                        Name
                      </h4>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.metadata.name}
                      </p>
                    </div>
                    <div className="mb-2">
                      <h4 className="text-xs font-medium text-gray-500">
                        Description
                      </h4>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.metadata.description}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">
                        Attributes
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedRequest.metadata.attributes &&
                          selectedRequest.metadata.attributes.map(
                            (attr, index) => (
                              <div
                                key={index}
                                className="bg-white p-2 rounded border border-gray-200"
                              >
                                <span className="text-xs font-medium text-gray-500">
                                  {attr.trait_type}
                                </span>
                                <p className="text-sm text-gray-900">
                                  {attr.value}
                                </p>
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRequest.status === "pending" && (
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve & Mint NFT
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNFTRequests;
