const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface XummPayloadResponse {
  uuid: string;
  next: {
    always: string;
  };
  refs: {
    qr_png: string;
    qr_matrix: string;
    websocket_status: string;
  };
  pushed: boolean;
}

interface XummPayloadStatus {
  meta: {
    exists: boolean;
    uuid: string;
    multisign: boolean;
    submit: boolean;
    destination: string;
    resolved: boolean;
    signed: boolean;
    cancelled: boolean;
    expired: boolean;
    pushed: boolean;
    app_opened: boolean;
    return_url_app: string;
    return_url_web: string;
  };
  application: {
    name: string;
    description: string;
    disabled: boolean;
    uuidv4: string;
    icon_url: string;
    issued_user_token: string;
  };
  payload: {
    tx_type: string;
    tx_destination: string;
    tx_destination_tag: number;
    request_json: {
      TransactionType: string;
    };
    //created_at: string;
    expires_at: string;
    expires_in_seconds: number;
  };
  response: {
    hex: string;
    txid: string;
    resolved_at: string;
    dispatched_to: string;
    dispatched_result: string;
    dispatched_nodetype: string;
    multisign_account: string;
    account: string;
  };
}

/**
 * Creates a SignIn payload with Xumm
 * @returns {Promise<XummPayloadResponse>} - Xumm payload response
 */
export async function createSignInPayload(): Promise<XummPayloadResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/xumm/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating Xumm SignIn payload:", error);
    throw error;
  }
}

/**
 * Gets the status of a Xumm payload
 * @param {string} payloadId - The UUID of the payload
 * @returns {Promise<XummPayloadStatus>} - Payload status
 */
export async function getPayloadStatus(
  payloadId: string
): Promise<XummPayloadStatus> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/xumm/payload/${payloadId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting Xumm payload status:", error);
    throw error;
  }
}
