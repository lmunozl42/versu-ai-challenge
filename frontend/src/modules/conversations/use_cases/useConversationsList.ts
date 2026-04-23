import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getConversations,
  createConversation,
  filterConversations,
  paginateConversations,
  hasActiveFilters,
  RATING_MIN,
  RATING_MAX,
  PAGE_SIZE_OPTIONS,
  type StatusFilter,
  type ChannelFilter,
  type PageSize,
} from "@/services/conversationsService";

export function useConversationsList() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [minRating, setMinRating] = useState(RATING_MIN);
  const [maxRating, setMaxRating] = useState(RATING_MAX);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(PAGE_SIZE_OPTIONS[0]);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    refetchInterval: 15_000,
  });

  const createMut = useMutation({
    mutationFn: () => createConversation("web"),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate(`/conversations/${conv.id}`);
    },
  });

  const filtered = filterConversations(conversations, {
    statusFilter,
    channelFilter,
    minRating,
    maxRating,
    dateFrom,
    dateTo,
  });

  useEffect(() => { setPage(1); }, [statusFilter, channelFilter, minRating, maxRating, dateFrom, dateTo]);

  const pagination = paginateConversations(filtered, page, pageSize);

  const filtersActive = hasActiveFilters({ statusFilter, channelFilter, minRating, maxRating, dateFrom, dateTo });

  function clearFilters() {
    setStatusFilter("all");
    setChannelFilter("all");
    setMinRating(RATING_MIN);
    setMaxRating(RATING_MAX);
    setDateFrom("");
    setDateTo("");
  }

  return {
    conversations,
    filtered,
    pagination,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    createMut,
    statusFilter,
    setStatusFilter,
    channelFilter,
    setChannelFilter,
    minRating,
    setMinRating,
    maxRating,
    setMaxRating,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    hasActiveFilters: filtersActive,
    clearFilters,
  };
}
