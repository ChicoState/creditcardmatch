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

export interface RequestSummary extends CardRequest {
  submission_details: import('./details').CardDetails | null;
  decision_note: string | null;
  catalog_card_id: number | null;
  revision: number;
}
export type RequestResult =
  | { ok: true; requestId?: number }
  | {
      ok: false;
      code:
        | 'validation'
        | 'unauthorized'
        | 'forbidden'
        | 'conflict'
        | 'persistence';
      message: string;
      fields?: Record<string, string>;
    };
