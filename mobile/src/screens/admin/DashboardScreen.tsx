import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { colors, spacing, radius, typography } from '../../theme';

interface Stats {
  totalUsers: number;
  totalMechanics: number;
  totalOwners: number;
  totalRequests: number;
  completedJobs: number;
  pendingJobs: number;
  revenue: number;
}

const StatCard = ({ icon, label, value, color, onPress }: any) => (
  <TouchableOpacity style={[styles.statCard, { borderColor: color + '33' }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function AdminDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading dashboard..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Panel</Text>
            <Text style={styles.name}>{user?.name}</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.info} />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>

        {/* Revenue Banner */}
        {stats && (
          <Card style={styles.revenueBanner} elevated>
            <View style={styles.revenueLeft}>
              <Text style={styles.revenueLabel}>TOTAL PLATFORM REVENUE</Text>
              <Text style={styles.revenueValue}>GH₵{stats.revenue.toLocaleString()}</Text>
            </View>
            <Ionicons name="trending-up" size={36} color={colors.success} />
          </Card>
        )}

        {/* Stats Grid */}
        <Text style={styles.sectionLabel}>OVERVIEW</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="people" label="Total Users" value={stats?.totalUsers || 0} color={colors.primary} onPress={() => navigation.navigate('Users')} />
          <StatCard icon="construct" label="Mechanics" value={stats?.totalMechanics || 0} color={colors.accent} onPress={() => navigation.navigate('Users', { role: 'MECHANIC' })} />
          <StatCard icon="car-sport" label="Car Owners" value={stats?.totalOwners || 0} color={colors.info} onPress={() => navigation.navigate('Users', { role: 'CAR_OWNER' })} />
          <StatCard icon="briefcase" label="Total Jobs" value={stats?.totalRequests || 0} color={colors.warning} onPress={() => navigation.navigate('Jobs')} />
          <StatCard icon="checkmark-circle" label="Completed" value={stats?.completedJobs || 0} color={colors.success} onPress={() => navigation.navigate('Jobs', { status: 'COMPLETED' })} />
          <StatCard icon="time" label="Pending" value={stats?.pendingJobs || 0} color={colors.danger} onPress={() => navigation.navigate('Jobs', { status: 'PENDING' })} />
        </View>

        {/* Quick Nav */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        {[
          { icon: 'people-outline', label: 'Manage Users', sub: 'View & manage all users', screen: 'Users', color: colors.primary },
          { icon: 'briefcase-outline', label: 'Manage Jobs', sub: 'Monitor all service requests', screen: 'Jobs', color: colors.accent },
          { icon: 'construct-outline', label: 'Mechanics', sub: 'View mechanic performance', screen: 'Users', params: { role: 'MECHANIC' }, color: colors.info },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickItem}
            onPress={() => navigation.navigate(item.screen, item.params)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIcon, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickLabel}>{item.label}</Text>
              <Text style={styles.quickSub}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { ...typography.bodySmall, color: colors.textSecondary },
  name: { ...typography.h3 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.info + '22', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.info + '44' },
  adminBadgeText: { color: colors.info, fontSize: 11, fontWeight: '700' },
  revenueBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg, borderColor: colors.success + '33' },
  revenueLeft: {},
  revenueLabel: { ...typography.label, color: colors.success, marginBottom: 4 },
  revenueValue: { fontSize: 36, fontWeight: '800', color: colors.success },
  sectionLabel: { ...typography.label, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, minWidth: '30%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1 },
  statIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { ...typography.bodySmall, textAlign: 'center' },
  quickItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  quickIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  quickLabel: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  quickSub: { ...typography.bodySmall },
});
