import {
  fetchConversations,
  postConversation,
  fetchConversation,
  patchCloseConversation,
  patchRateConversation,
  type Conversation,
  type ConversationDetail,
  type Message,
} from "@/infra/repositories/conversationsRepository";

export type { Conversation, ConversationDetail, Message };

export type StatusFilter = "all" | "open" | "closed";

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export interface ConversationFilters {
  statusFilter: StatusFilter;
  minRating: number;
  maxRating: number;
  dateFrom: string;
  dateTo: string;
}

export function isConversationClosed(conv: ConversationDetail | undefined): boolean {
  return conv?.status === "closed";
}

export function hasActiveFilters(filters: ConversationFilters): boolean {
  return (
    filters.statusFilter !== "all" ||
    filters.minRating > RATING_MIN ||
    filters.maxRating < RATING_MAX ||
    !!filters.dateFrom ||
    !!filters.dateTo
  );
}

export async function getConversations(): Promise<Conversation[]> {
  return fetchConversations();
}

export async function createConversation(channel = "web"): Promise<Conversation> {
  return postConversation(channel);
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  return fetchConversation(id);
}

export async function closeConversation(id: string): Promise<Conversation> {
  return patchCloseConversation(id);
}

export async function rateConversation(id: string, rating: number): Promise<Conversation> {
  return patchRateConversation(id, rating);
}

export function filterConversations(
  conversations: Conversation[],
  filters: ConversationFilters
): Conversation[] {
  const { statusFilter, minRating, maxRating, dateFrom, dateTo } = filters;
  const applyMin = minRating > RATING_MIN;
  const applyMax = maxRating < RATING_MAX;

  return conversations.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (applyMin && (c.rating === null || c.rating < minRating)) return false;
    if (applyMax && (c.rating === null || c.rating > maxRating)) return false;
    if (dateFrom && new Date(c.created_at) < new Date(dateFrom)) return false;
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      if (new Date(c.created_at) > to) return false;
    }
    return true;
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(created: string, closed: string | null): string {
  if (!closed) return "En curso";
  const mins = Math.round(
    (new Date(closed).getTime() - new Date(created).getTime()) / 60000
  );
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}
