import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getConversations,
  createConversation,
  filterConversations,
  hasActiveFilters,
  RATING_MIN,
  RATING_MAX,
  type StatusFilter,
} from "@/services/conversationsService";

export function useConversationsList() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [minRating, setMinRating] = useState(RATING_MIN);
  const [maxRating, setMaxRating] = useState(RATING_MAX);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    minRating,
    maxRating,
    dateFrom,
    dateTo,
  });

  const filtersActive = hasActiveFilters({ statusFilter, minRating, maxRating, dateFrom, dateTo });

  function clearFilters() {
    setStatusFilter("all");
    setMinRating(RATING_MIN);
    setMaxRating(RATING_MAX);
    setDateFrom("");
    setDateTo("");
  }

  return {
    conversations,
    filtered,
    isLoading,
    createMut,
    statusFilter,
    setStatusFilter,
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
