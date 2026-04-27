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

export default function HistoryScreen({ navigation }: any) {
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading history..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Request History</Text>
        <Text style={styles.count}>{requests.length} total</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptySub}>Your service history will appear here</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Tracking', { requestId: item._id })} activeOpacity={0.8}>
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.issueIcon}>
                  <Ionicons name="construct" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.issue} numberOfLines={1}>{item.issueDescription}</Text>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <StatusBadge status={item.status} size="sm" />
              </View>

              {item.mechanic && (
                <View style={styles.mechanicRow}>
                  <Ionicons name="person-circle" size={16} color={colors.textSecondary} />
                  <Text style={styles.mechanicName}>{item.mechanic.name}</Text>
                  {item.rating && (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color={colors.warning} />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  )}
                </View>
              )}

              {item.serviceFee > 0 && (
                <View style={styles.feeRow}>
                  <Ionicons name="card" size={14} color={colors.success} />
                  <Text style={styles.fee}>Service Fee: GH₵{item.serviceFee}</Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h3 },
  count: { ...typography.bodySmall, color: colors.primary },
  list: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  issueIcon: { width: 36, height: 36, backgroundColor: colors.primary + '22', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  issue: { ...typography.body, fontWeight: '500', marginBottom: 3, flex: 1 },
  date: { ...typography.bodySmall },
  mechanicRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  mechanicName: { ...typography.bodySmall, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { color: colors.warning, fontSize: 11, fontWeight: '600' },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  fee: { color: colors.success, fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
  emptyTitle: { ...typography.h4, marginTop: spacing.md, marginBottom: spacing.sm },
  emptySub: { ...typography.bodySmall, textAlign: 'center' },
});
