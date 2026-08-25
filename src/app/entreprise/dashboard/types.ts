export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isCompany?: boolean;
  companyType?: "hotel" | "entreprise" | "ong" | null;
  companyName?: string;
  ninea?: string;
  raisonSociale?: string;
  companyAddress?: string;
  companyPhone?: string;
  bp?: string;
  image?: string;
}

export type BookingStatus =
  | "pending"
  | "assigned"
  | "approved"
  | "rejected"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Booking {
  id: number;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledDateTime: string;
  status: BookingStatus;
  price: string | null;
}
