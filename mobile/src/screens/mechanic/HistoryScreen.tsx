import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { colors, spacing, radius, typography } from '../../theme';

export default function MechanicHistoryScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/requests/mine');
      setRequests(data);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner fullScreen message="Loading history..." />;

  const completed = requests.filter((r) => r.status === 'COMPLETED');
  const totalEarned = completed.reduce((sum, r) => sum + (r.serviceFee || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Job History</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{completed.length}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: colors.success }]}>GH₵{totalEarned}</Text>
          <Text style={styles.summaryLabel}>Total Earned</Text>
        </Card>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No jobs yet</Text>
            <Text style={styles.emptySub}>Go online to start receiving jobs</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.jobIcon}>
                <Ionicons name="construct" size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.issue} numberOfLines={1}>{item.issueDescription}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <StatusBadge status={item.status} size="sm" />
            </View>
            <View style={styles.cardBottom}>
              <View style={styles.infoChip}>
                <Ionicons name="person" size={12} color={colors.textSecondary} />
                <Text style={styles.chipText}>{item.owner?.name}</Text>
              </View>
              {item.serviceFee > 0 && (
                <View style={styles.earningChip}>
                  <Text style={styles.earningText}>GH₵{item.serviceFee}</Text>
                </View>
              )}
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.h3 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  summaryValue: { fontSize: 28, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  summaryLabel: { ...typography.bodySmall },
  list: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  jobIcon: { width: 32, height: 32, backgroundColor: colors.accent + '22', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  issue: { ...typography.body, fontWeight: '500', marginBottom: 2 },
  date: { ...typography.bodySmall },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipText: { ...typography.bodySmall },
  earningChip: { backgroundColor: colors.success + '22', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  earningText: { color: colors.success, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
  emptyTitle: { ...typography.h4, marginTop: spacing.md, marginBottom: spacing.sm },
  emptySub: { ...typography.bodySmall },
});
