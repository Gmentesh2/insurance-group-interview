/** Public HTTP contracts. Money is integer EUR cents; dates are ISO yyyy-mm-dd. */
export type Locale = "en" | "de" | "ru";
export type DemoScenario =
  | "success"
  | "no_offers"
  | "single_offer"
  | "many_offers"
  | "declined"
  | "issuance_pending"
  | "bind_unknown"
  | "document_delayed"
  | "quote_expired"
  | "price_changed";
export interface TripInput {
  residenceCountry: string;
  destinationCountries: string[];
  startDate: string;
  endDate: string;
  travelers: { age: number }[];
  scenario?: DemoScenario;
}
export interface Coverage {
  key: "medical" | "cancellation" | "baggage" | "delay" | "assistance";
  status: "covered" | "conditional" | "excluded" | "unknown";
  limitCents: number | null;
  scope: "per_person" | "per_trip";
  deductibleCents: number;
  condition?: string;
}
export interface Quote {
  id: string;
  sessionId: string;
  plan: "essential" | "comfort" | "complete";
  provider: string;
  totalCents: number;
  currency: "EUR";
  expiresAt: string;
  coverage: Coverage[];
  exclusions: string[];
  termsVersion: string;
}
export interface QuoteSession {
  id: string;
  trip: TripInput;
  quotes: Quote[];
  createdAt: string;
  expiresAt: string;
}
export interface SessionUser {
  id: string;
  email: string;
  role: "customer" | "operator";
  isGuest?: boolean;
  accessOwnerIds?: string[];
}
export interface AuthSession {
  user: SessionUser | null;
  localInboxUrl?: string;
  pendingGuestAccess?: boolean;
  pendingGuestOwnerId?: string;
}
export interface Traveler {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}
export type OrderStatus =
  | "awaiting_details"
  | "ready_to_pay"
  | "payment_declined"
  | "issuance_pending"
  | "bind_unknown"
  | "issued";
export interface TimelineEvent {
  id: string;
  status: string;
  createdAt: string;
  note?: string;
}
export interface Order {
  id: string;
  userId: string;
  quote: Quote;
  trip: TripInput;
  travelers: Traveler[];
  contactEmail?: string;
  status: OrderStatus;
  paymentStatus: "unpaid" | "declined" | "paid";
  policyId: string | null;
  createdAt: string;
  updatedAt: string;
  events: TimelineEvent[];
}
export interface Policy {
  id: string;
  orderId: string;
  userId: string;
  number: string;
  quote: Quote;
  trip: TripInput;
  travelers: Traveler[];
  contactEmail?: string;
  status: "upcoming" | "active" | "expired";
  documentStatus: "ready" | "pending";
  createdAt: string;
}
export type ClaimStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "more_information"
  | "approved"
  | "declined";
export interface ClaimDocument {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  url?: string;
}
export interface Claim {
  id: string;
  userId: string;
  policyId: string;
  incidentType: "medical" | "cancellation" | "baggage" | "delay" | "other";
  incidentDate: string;
  description: string;
  amountCents: number;
  currency: "EUR";
  status: ClaimStatus;
  documents: ClaimDocument[];
  events: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}
export interface ClaimInput {
  policyId: string;
  incidentType?: Claim["incidentType"];
  incidentDate?: string;
  description?: string;
  amountCents?: number;
}
export interface ApiError {
  error: { code: string; message: string; fields?: Record<string, string> };
}
export interface OperationsData {
  orders: Order[];
  claims: Claim[];
  events: TimelineEvent[];
}
/* API (JSON except uploads/documents):
GET /api/v1/auth/session -> AuthSession
POST /auth/guest {} -> AuthSession (private anonymous customer; existing owner reused)
POST /auth/register {email,password} -> AuthSession
POST /auth/login {email,password} -> AuthSession
POST /auth/guest-access/credentials {email,password,register:boolean} -> AuthSession (guest purchase ownership transfer)
POST /auth/sign-out {} -> {ok:true}
POST /quotes TripInput -> QuoteSession; GET /quote-sessions/:id -> QuoteSession
POST /orders {quoteId,acceptPriceChange?:boolean} -> Order; GET /orders -> {orders:Order[]}
GET /orders/:id -> Order; POST /orders/:id/customer-details {travelers:Traveler[],contactEmail?:string} -> Order (email required for guests)
POST /orders/:id/pay {} -> Order; POST /orders/:id/reconcile {} -> Order
GET /policies -> {policies:Policy[]}; GET /policies/:id -> Policy
GET /policies/:id/documents?locale=en|de|ru -> owned application/pdf response (409 DOCUMENT_PENDING)
GET /claims -> {claims:Claim[]}; POST /claims ClaimInput -> Claim
GET /claims/:id -> Claim; PATCH /claims/:id partial ClaimInput -> Claim
DELETE /claims/:id {expectedUpdatedAt?} -> {ok:true} (draft only)
POST /claims/:id/submit {} -> Claim
POST /claims/:id/documents multipart file -> Claim (files <=10MB; PDF,JPEG,PNG)
GET /claims/:id/documents/:documentId -> owned binary response
GET /ops?search= -> OperationsData (operator only)
POST /ops {action:'reconcile',orderId} OR {action:'claim_status',claimId,status} -> {ok:true}
Errors use ApiError; HTTP 401 auth,404 inaccessible/missing,409 state,422 validation.
*/
