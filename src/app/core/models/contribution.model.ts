export interface Contribution {
  id: string;
  participantId: string;
  materialId: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface ContributionInput {
  participantId: string;
  materialId: string;
  amount: number;
  note?: string;
}
