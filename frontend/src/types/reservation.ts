export type ReservationStatus = "approved" | "pending" | "rejected" | "empty";

export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface NFTData {
  imageUrl: string;
  title: string;
  description: string;
  attributes: Record<string, string>;
  issueDate: string;
}

export interface Reservation {
  id: string;
  status: ReservationStatus;
  createdAt: string;
  nftData?: NFTData;
}
