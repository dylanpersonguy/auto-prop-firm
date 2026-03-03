/**
 * TanStack Query hooks for every data entity.
 * Polling intervals are tuned per-entity for real-time feel.
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { ModifyOrderInput, ModifyPositionInput } from './schemas';

// ── Accounts ──

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: api.fetchAccounts,
    staleTime: 10_000,
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => api.fetchAccount(id),
    enabled: !!id,
    staleTime: 5_000,
  });
}

export function useMetrics(id: string) {
  return useQuery({
    queryKey: ['metrics', id],
    queryFn: () => api.fetchMetrics(id),
    enabled: !!id,
    refetchInterval: 3_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useAccountStatus(accountId: string) {
  return useQuery({
    queryKey: ['accountStatus', accountId],
    queryFn: () => api.fetchAccountStatus(accountId),
    enabled: !!accountId,
    refetchInterval: 2_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useEquity(id: string, limit?: number) {
  return useQuery({
    queryKey: ['equity', id, limit],
    queryFn: () => api.fetchEquity(id, limit),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useLedger(id: string, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: ['ledger', id, page, pageSize],
    queryFn: () => api.fetchLedger(id, page, pageSize),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useAccountStats(id: string) {
  return useQuery({
    queryKey: ['stats', id],
    queryFn: () => api.fetchAccountStats(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ── Trading: Orders ──

export function useOrders(accountId: string, status?: string) {
  return useQuery({
    queryKey: ['orders', accountId, status],
    queryFn: () => api.fetchOrders(accountId, status),
    enabled: !!accountId,
    refetchInterval: 3_000,
    placeholderData: (prev: any) => prev,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.placeOrder,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['orders', vars.accountId] });
      qc.invalidateQueries({ queryKey: ['positions', vars.accountId] });
      qc.invalidateQueries({ queryKey: ['metrics', vars.accountId] });
    },
  });
}

export function useModifyOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ModifyOrderInput }) => api.modifyOrder(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelOrder(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); },
  });
}

export function useCancelAllOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, reason }: { accountId: string; reason?: string }) => api.cancelAllOrders(accountId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); },
  });
}

// ── Trading: Positions ──

export function usePositions(accountId: string, status?: string) {
  return useQuery({
    queryKey: ['positions', accountId, status],
    queryFn: () => api.fetchPositions(accountId, status),
    enabled: !!accountId,
    refetchInterval: 2_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useModifyPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ModifyPositionInput }) => api.modifyPosition(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['positions'] }); },
  });
}

export function useClosePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity?: number }) => api.closePosition(id, quantity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['positions'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useCloseAllPositions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, reason }: { accountId: string; reason?: string }) => api.closeAllPositions(accountId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['positions'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
    },
  });
}

export function useBreakevenPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.breakevenPosition(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['positions'] }); },
  });
}

// ── Fills / Closed ──

export function useFills(accountId: string, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: ['fills', accountId, page, pageSize],
    queryFn: () => api.fetchFills(accountId, page, pageSize),
    enabled: !!accountId,
    refetchInterval: 5_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useClosedPositions(accountId: string, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: ['closedPositions', accountId, page, pageSize],
    queryFn: () => api.fetchClosedPositions(accountId, page, pageSize),
    enabled: !!accountId,
    staleTime: 10_000,
  });
}

// ── Market Data ──

export function useSymbols() {
  return useQuery({
    queryKey: ['symbols'],
    queryFn: api.fetchSymbols,
    staleTime: 60_000 * 5,
  });
}

export function useTicks() {
  return useQuery({
    queryKey: ['ticks'],
    queryFn: api.fetchTicks,
    refetchInterval: 1_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useTick(symbol: string) {
  return useQuery({
    queryKey: ['tick', symbol],
    queryFn: () => api.fetchTick(symbol),
    enabled: !!symbol,
    refetchInterval: 1_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useCandles(symbol: string, timeframe?: string, limit?: number) {
  return useQuery({
    queryKey: ['candles', symbol, timeframe, limit],
    queryFn: () => api.fetchCandles(symbol, timeframe, limit),
    enabled: !!symbol,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}

// ── Journal ──

export function useJournal(accountId: string, opts?: { limit?: number; offset?: number; symbol?: string }) {
  return useQuery({
    queryKey: ['journal', accountId, opts],
    queryFn: () => api.fetchJournal(accountId, opts),
    enabled: !!accountId,
    staleTime: 10_000,
  });
}

export function useCreateJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createJournalEntry,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); },
  });
}

export function useUpdateJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateJournalEntry>[1] }) => api.updateJournalEntry(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); },
  });
}

export function useDeleteJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteJournalEntry(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); },
  });
}

// ── Payouts ──

export function usePayoutCalc(accountId: string) {
  return useQuery({
    queryKey: ['payoutCalc', accountId],
    queryFn: () => api.fetchPayoutCalc(accountId),
    enabled: !!accountId,
    staleTime: 30_000,
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, idempotencyKey }: { accountId: string; idempotencyKey: string }) =>
      api.requestPayout(accountId, idempotencyKey),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['payoutCalc', vars.accountId] });
      qc.invalidateQueries({ queryKey: ['payoutHistory', vars.accountId] });
      qc.invalidateQueries({ queryKey: ['allPayouts'] });
    },
  });
}

export function usePayoutHistory(accountId: string) {
  return useQuery({
    queryKey: ['payoutHistory', accountId],
    queryFn: () => api.fetchPayoutHistory(accountId),
    enabled: !!accountId,
    staleTime: 10_000,
  });
}

export function useAllPayouts() {
  return useQuery({
    queryKey: ['allPayouts'],
    queryFn: api.fetchAllPayouts,
    staleTime: 10_000,
  });
}

// Re-export types
export type { ModifyOrderInput, ModifyPositionInput } from './schemas';
