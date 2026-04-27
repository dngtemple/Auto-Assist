import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { colors, spacing, radius, typography } from '../../theme';

const STATUS_FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'EN_ROUTE', 'COMPLETED', 'CANCELLED'];

export default function AdminJobsScreen({ route }: any) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState(route.params?.status || 'ALL');

  const load = useCallback(async () => {
    try {
      const params: any = { limit: 50 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await api.get('/admin/jobs', { params });
      setJobs(data.jobs);
      setTotal(data.total);
    } catch (_) {}
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner fullScreen message="Loading jobs..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>All Jobs</Text>
        <Text style={styles.count}>{total} total</Text>
      </View>

      {/* Status Filters */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STATUS_FILTERS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === item && styles.filterActive]}
            onPress={() => setStatusFilter(item)}
          >
            <Text style={[styles.filterText, statusFilter === item && styles.filterTextActive]}>
              {item === 'ALL' ? 'All' : item.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={jobs}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No jobs found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.jobCard}>
            <View style={styles.jobTop}>
              <View style={styles.jobIcon}>
                <Ionicons name="construct" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobIssue} numberOfLines={1}>{item.issueDescription}</Text>
                <Text style={styles.jobDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              <StatusBadge status={item.status} size="sm" />
            </View>

            <View style={styles.partiesRow}>
              <View style={styles.partyChip}>
                <Ionicons name="person" size={12} color={colors.primary} />
                <Text style={styles.partyText}>{item.owner?.name || 'Unknown'}</Text>
              </View>
              {item.mechanic && (
                <View style={styles.partyChip}>
                  <Ionicons name="construct" size={12} color={colors.accent} />
                  <Text style={[styles.partyText, { color: colors.accent }]}>{item.mechanic.name}</Text>
                </View>
              )}
            </View>

            {item.serviceFee > 0 && (
              <View style={styles.feeRow}>
                <Ionicons name="cash" size={14} color={colors.success} />
                <Text style={styles.feeText}>GH₵{item.serviceFee}</Text>
              </View>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.h3 },
  count: { ...typography.bodySmall, color: colors.primary },
  filtersRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  filterText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: colors.primary, fontWeight: '700' },
  list: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  jobCard: { marginBottom: spacing.sm },
  jobTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  jobIcon: { width: 32, height: 32, backgroundColor: colors.primary + '22', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  jobIssue: { ...typography.body, fontWeight: '500', marginBottom: 2 },
  jobDate: { ...typography.bodySmall },
  partiesRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  partyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  partyText: { ...typography.bodySmall, color: colors.primary },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  feeText: { color: colors.success, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});
