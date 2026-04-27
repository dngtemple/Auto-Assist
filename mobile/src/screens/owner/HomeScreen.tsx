import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';

const QUICK_ACTIONS = [
  { icon: 'flash' as const, label: 'Request\nMechanic', screen: 'RequestMechanic', color: colors.primary },
  { icon: 'time' as const, label: 'My\nHistory', screen: 'History', color: colors.accent },
  { icon: 'person' as const, label: 'My\nProfile', screen: 'Profile', color: colors.info },
  { icon: 'chatbubbles' as const, label: 'Support', screen: 'Support', color: colors.warning },
];

export default function OwnerHomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [activeJob, setActiveJob] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data } = await api.get('/requests/mine');
      const active = data.find((r: any) => !['COMPLETED', 'CANCELLED'].includes(r.status));
      setActiveJob(active || null);
      setRecentJobs(data.slice(0, 3));
    } catch (_) {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => {}}>
            <Ionicons name="notifications" size={22} color={colors.textPrimary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Active Job Banner */}
        {activeJob && (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => navigation.navigate('Tracking', { requestId: activeJob._id })}
            activeOpacity={0.9}
          >
            <View style={styles.activeBannerLeft}>
              <View style={styles.pulsingDot} />
              <View>
                <Text style={styles.activeBannerTitle}>Active Request</Text>
                <Text style={styles.activeBannerSub} numberOfLines={1}>{activeJob.issueDescription}</Text>
              </View>
            </View>
            <View style={styles.activeBannerRight}>
              <StatusBadge status={activeJob.status} size="sm" />
              <Ionicons name="chevron-forward" size={18} color={colors.primary} style={{ marginTop: 4 }} />
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.screen}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '22' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Jobs */}
        {recentJobs.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Recent Requests</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentJobs.map((job) => (
              <TouchableOpacity
                key={job._id}
                onPress={() => navigation.navigate('Tracking', { requestId: job._id })}
                activeOpacity={0.8}
              >
                <Card style={styles.jobCard}>
                  <View style={styles.jobCardRow}>
                    <View style={styles.jobIcon}>
                      <Ionicons name="construct" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.jobInfo}>
                      <Text style={styles.jobTitle} numberOfLines={1}>{job.issueDescription}</Text>
                      <Text style={styles.jobMeta}>
                        {job.mechanic ? `Mechanic: ${job.mechanic.name}` : 'Awaiting mechanic'}
                      </Text>
                    </View>
                    <StatusBadge status={job.status} size="sm" />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* No jobs placeholder */}
        {recentJobs.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons name="car-sport-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptySubtitle}>Tap "Request Mechanic" when you need help</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greeting: { ...typography.bodySmall, color: colors.textSecondary },
  userName: { ...typography.h3 },
  notifBtn: { width: 44, height: 44, backgroundColor: colors.card, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: colors.background },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary + '18',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pulsingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginRight: spacing.md },
  activeBannerTitle: { ...typography.label, color: colors.primary, marginBottom: 2 },
  activeBannerSub: { ...typography.body, color: colors.textPrimary, maxWidth: 180 },
  activeBannerRight: { alignItems: 'flex-end' },
  sectionLabel: { ...typography.label, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.lg },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  actionCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  actionIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  actionLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', fontWeight: '500', lineHeight: 15 },
  jobCard: { marginBottom: spacing.sm },
  jobCardRow: { flexDirection: 'row', alignItems: 'center' },
  jobIcon: { width: 40, height: 40, backgroundColor: colors.primary + '22', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  jobInfo: { flex: 1, marginRight: spacing.sm },
  jobTitle: { ...typography.body, fontWeight: '500', marginBottom: 3 },
  jobMeta: { ...typography.bodySmall },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xxl, marginTop: spacing.lg },
  emptyTitle: { ...typography.h4, marginTop: spacing.md, marginBottom: spacing.sm },
  emptySubtitle: { ...typography.bodySmall, textAlign: 'center' },
});
