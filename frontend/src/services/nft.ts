interface NFTMetadata {
  vegetationCoverage: string;
  hectaresNumber: string;
  specificAttributes: string;
  waterBodiesCount: string;
  springsCount: string;
  ongoingProjects: string;
  carRegistry: string;
}

interface UploadImageResponse {
  success: boolean;
  imageUrl: string;
}

interface MintNFTResponse {
  success: boolean;
  mintAddress: string;
  metadataUrl: string;
  signature: string;
}

export interface NFTResponse {
  Flags: number;
  Issuer: string;
  NFTokenID: string;
  NFTokenTaxon: number;
  URI: string;
  nft_serial: number;
  decodedURI: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
  };
}

export interface NFTRequest {
  id: number;
  user_id: string;
  wallet_address: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: {
      trait_type: string;
      value: string | number;
    }[];
  };
  status: "pending" | "approved" | "rejected" | "minted";
  // created_at: string;
  //updated_at: string;
}

export interface PendingOffer {
  index: string;
  nft_id: string;
  offer_details?: {
    owner: string;
    destination: string;
  };
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes: {
      trait_type: string;
      value: string | number;
    }[];
  };
}

export interface XummLinkResponse {
  xummLink: string;
  message: string;
}

export interface OfferStatusResponse {
  status: "pending" | "accepted";
  message: string;
  offer?: any;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const nftService = {
  /**
   * Faz upload de uma imagem para o Pinata
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Erro ao fazer upload da imagem");
    }

    const data: UploadImageResponse = await response.json();
    return data.imageUrl;
  },

  /**
   * Cria uma solicitação de NFT (sem mintar imediatamente)
   */
  async requestNFT(
    userId: string,
    walletAddress: string,
    imageFile: File,
    metadata: NFTMetadata
  ): Promise<NFTRequest> {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("userId", userId);
    formData.append("walletAddress", walletAddress);
    formData.append("vegetationCoverage", metadata.vegetationCoverage);
    formData.append("hectares", metadata.hectaresNumber);
    formData.append("specificAttributes", metadata.specificAttributes);
    formData.append("waterBodies", metadata.waterBodiesCount);
    formData.append("springs", metadata.springsCount);
    formData.append("projects", metadata.ongoingProjects);
    formData.append("carRegistry", metadata.carRegistry);

    const response = await fetch(`${API_BASE_URL}/request-nft`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Erro ao solicitar NFT");
    }

    const data = await response.json();
    return data.request;
  },

  /**
   * Minta um novo NFT diretamente (sem processo de aprovação)
   */
  async mintNFT(
    imageFile: File,
    metadata: NFTMetadata
  ): Promise<MintNFTResponse> {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("vegetationCoverage", metadata.vegetationCoverage);
    formData.append("hectares", metadata.hectaresNumber);
    formData.append("specificAttributes", metadata.specificAttributes);
    formData.append("waterBodies", metadata.waterBodiesCount);
    formData.append("springs", metadata.springsCount);
    formData.append("projects", metadata.ongoingProjects);
    formData.append("carRegistry", metadata.carRegistry);

    const response = await fetch(`${API_BASE_URL}/mint-nft`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Erro ao mintar NFT");
    }

    return response.json();
  },

  /**
   * Busca todos os NFTs de uma carteira
   */
  async getNFTs(address: string): Promise<NFTResponse[]> {
    try {
      console.log(`Fetching NFTs for account ${address}`);
      const response = await fetch(`${API_BASE_URL}/nfts/${address}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch NFTs");
      }

      const data = await response.json();

      // Verificar se data é um array
      if (Array.isArray(data)) {
        console.log(`Found ${data.length} NFTs for account ${address}`);
        return data;
      }

      // Se data.nfts for um array, retorne-o
      if (data.nfts && Array.isArray(data.nfts)) {
        console.log(`Found ${data.nfts.length} NFTs for account ${address}`);
        return data.nfts;
      }

      // Se não for um array, retorne um array vazio
      console.log(
        `Found 0 NFTs for account ${address} (unexpected response format)`
      );
      console.log("Response data:", data);
      return [];
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      return []; // Retorna um array vazio em caso de erro
    }
  },

  /**
   * Busca todas as ofertas pendentes para uma carteira
   */
  async getPendingOffers(
    address: string
  ): Promise<{ pendingOffers: PendingOffer[] }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/nfts/${address}/pending-offers`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch pending offers");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching pending offers:", error);
      return { pendingOffers: [] };
    }
  },

  /**
   * Gera um link Xumm para aceitar uma oferta de NFT
   */
  async getXummLink(offerId: string): Promise<XummLinkResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/nft-offers/${offerId}/xumm-link`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate Xumm link");
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating Xumm link:", error);
      throw error;
    }
  },

  /**
   * Verifica o status de uma oferta de NFT
   */
  async checkOfferStatus(offerId: string): Promise<OfferStatusResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/nft-offers/${offerId}/status`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to check offer status");
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking offer status:", error);
      throw error;
    }
  },

  /**
   * Busca todas as solicitações de NFT de um usuário
   */
  async getUserNFTRequests(userId: string): Promise<NFTRequest[]> {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/nft-requests`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Erro ao buscar solicitações de NFT");
    }

    return response.json();
  },

  /**
   * Busca uma solicitação de NFT específica
   */
  async getNFTRequestById(requestId: number): Promise<NFTRequest> {
    const response = await fetch(`${API_BASE_URL}/nft-requests/${requestId}`, {
      method: "GET",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Erro ao buscar solicitação de NFT");
    }

    return response.json();
  },

  /**
   * Obtém todas as solicitações de NFT (apenas para admin)
   */
  async getAllNFTRequests(status?: string): Promise<NFTRequest[]> {
    try {
      const url = status
        ? `${API_BASE_URL}/admin/nft-requests?status=${status}`
        : `${API_BASE_URL}/admin/nft-requests`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage =
            errorJson.details ||
            errorJson.error ||
            "Erro ao buscar solicitações de NFT";
        } catch (e) {
          errorMessage = errorText || "Erro ao buscar solicitações de NFT";
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) return [];

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse response as JSON:", text);
        return [];
      }
    } catch (error) {
      console.error("Error in getAllNFTRequests:", error);
      throw error;
    }
  },

  /**
   * Aprova e minta uma solicitação de NFT (apenas para admin)
   */
  async approveNFTRequest(requestId: number): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/admin/nft-requests/${requestId}/approve`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Erro ao aprovar solicitação de NFT");
    }

    return response.json();
  },

  /**
   * Rejeita uma solicitação de NFT (apenas para admin)
   */
  async rejectNFTRequest(requestId: number): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/admin/nft-requests/${requestId}/reject`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Erro ao rejeitar solicitação de NFT");
    }

    return response.json();
  },
};
