export type PetStatus = 'AVAILABLE' | 'PENDING' | 'ADOPTED';

export interface PetSummary {
  id: number;
  name: string;
  category: string;
  breed: string;
  ageMonths: number;
  price: number;
  status: PetStatus;
  photoUrl: string | null;
  createdAt: string;
}

export interface PetDetail {
  id: number;
  name: string;
  category: string;
  breed: string;
  ageMonths: number;
  price: number;
  status: PetStatus;
  description: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PetCreateRequest {
  name: string;
  category: string;
  breed: string;
  ageMonths: number;
  price: number;
  status: PetStatus;
  description?: string | null;
  photoUrl?: string | null;
}

export interface PetUpdateRequest {
  name: string;
  category: string;
  breed: string;
  ageMonths: number;
  price: number;
  status: PetStatus;
  description?: string | null;
  photoUrl?: string | null;
}

export interface PetStatusUpdateRequest {
  status: PetStatus;
}
