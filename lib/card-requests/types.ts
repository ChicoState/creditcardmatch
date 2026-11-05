export type CardRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CardRequest {
  request_id: number;
  user_id: string;
  card_name: string;
  issuer: string;
  reward_types: string[];
  notification_email: string | null;
  comments: string | null;
  status: CardRequestStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}
