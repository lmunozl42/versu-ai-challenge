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
export type ChannelFilter = "all" | "web" | "whatsapp" | "instagram";

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export interface ConversationFilters {
  statusFilter: StatusFilter;
  channelFilter: ChannelFilter;
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
    filters.channelFilter !== "all" ||
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
  const { statusFilter, channelFilter, minRating, maxRating, dateFrom, dateTo } = filters;
  const applyMin = minRating > RATING_MIN;
  const applyMax = maxRating < RATING_MAX;

  return conversations.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
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

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export interface PaginationResult {
  items: Conversation[];
  page: number;
  pageSize: PageSize;
  total: number;
  totalPages: number;
}

export function paginateConversations(
  conversations: Conversation[],
  page: number,
  pageSize: PageSize
): PaginationResult {
  const total = conversations.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: conversations.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
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
