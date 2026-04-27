import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, StatusBar, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import { colors, spacing, radius, typography, shadow } from '../../theme';

export default function MechanicHomeScreen({ navigation }: any) {
  const { user, updateUser } = useAuth();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [incomingJob, setIncomingJob] = useState<any>(null);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [stats, setStats] = useState({ today: 0, week: 0, rating: user?.rating || 0, totalJobs: user?.totalJobs || 0 });
  const [refreshing, setRefreshing] = useState(false);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const socket = useRef(getSocket());

  const loadData = useCallback(async (online?: boolean) => {
    try {
      const currentlyOnline = online !== undefined ? online : isOnline;
      const [mineRes, pendingRes] = await Promise.all([
        api.get('/requests/mine'),
        currentlyOnline ? api.get('/requests/pending-nearby') : Promise.resolve({ data: [] }),
      ]);
      const active = mineRes.data.find((r: any) => !['COMPLETED', 'CANCELLED'].includes(r.status));
      setActiveJob(active || null);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      setStats((s) => ({ ...s, today: mineRes.data.filter((r: any) => r.status === 'COMPLETED' && new Date(r.completedAt) >= today).length }));
      if (!active && pendingRes.data.length > 0) {
        setIncomingJob(pendingRes.data[0]);
      }
    } catch (_) {}
  }, [isOnline]);

  useEffect(() => {
    loadData();
    const sock = socket.current;
    sock.emit('user:register', user?._id);

    sock.on('request:incoming', (request: any) => {
      setIncomingJob(request);
    });

    sock.on('request:taken', ({ requestId }: any) => {
      setIncomingJob((j: any) => (j?._id === requestId ? null : j));
    });

    return () => {
      sock.off('request:incoming');
      sock.off('request:taken');
      locationSub.current?.remove();
    };
  }, [loadData, user?._id]);

  const toggleOnline = async (val: boolean) => {
    try {
      let coordinates: [number, number] = [0, 0];
      if (val) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required', 'Location needed to go online.'); return; }
        const loc = await Location.getCurrentPositionAsync({});
        coordinates = [loc.coords.longitude, loc.coords.latitude];
        locationSub.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
          (loc) => {
            socket.current.emit('mechanic:location', { userId: user?._id, coordinates: [loc.coords.longitude, loc.coords.latitude] });
          }
        );
      } else {
        locationSub.current?.remove();
      }
      await api.patch('/users/me/status', { isOnline: val, coordinates });
      socket.current.emit('mechanic:toggle', { userId: user?._id, isOnline: val, coordinates });
      setIsOnline(val);
      updateUser({ isOnline: val });
      if (val) loadData(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleAccept = async () => {
    if (!incomingJob) return;
    try {
      const { data } = await api.patch(`/requests/${incomingJob._id}/accept`);
      socket.current.emit('request:accepted', {
        requestId: incomingJob._id,
        mechanicId: user?._id,
        ownerId: incomingJob.owner._id,
      });
      setIncomingJob(null);
      setActiveJob(data);
      navigation.navigate('ActiveJob', { requestId: data._id });
    } catch (err: any) {
      Alert.alert('Job Unavailable', err.message);
      setIncomingJob(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

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
            <Text style={styles.greeting}>Mechanic Dashboard</Text>
            <Text style={styles.name}>{user?.name?.split(' ')[0]}</Text>
          </View>
          <View style={[styles.onlineBadge, { backgroundColor: isOnline ? colors.success + '22' : colors.surface }]}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? colors.success : colors.textMuted }]} />
            <Text style={[styles.onlineText, { color: isOnline ? colors.success : colors.textMuted }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Online Toggle */}
        <Card style={[styles.toggleCard, { borderColor: isOnline ? colors.success + '44' : colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, { backgroundColor: isOnline ? colors.success + '22' : colors.surface }]}>
                <Ionicons name={isOnline ? 'radio' : 'radio-outline'} size={24} color={isOnline ? colors.success : colors.textMuted} />
              </View>
              <View>
                <Text style={styles.toggleTitle}>{isOnline ? 'You\'re Online' : 'Go Online'}</Text>
                <Text style={styles.toggleSub}>{isOnline ? 'Receiving job requests' : 'Tap to start receiving jobs'}</Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              trackColor={{ false: colors.surface, true: colors.success + '66' }}
              thumbColor={isOnline ? colors.success : colors.textMuted}
            />
          </View>
        </Card>

        {/* Incoming Job Alert */}
        {incomingJob && (
          <Card style={styles.incomingCard} elevated>
            <View style={styles.incomingHeader}>
              <View style={styles.incomingPulse}>
                <Ionicons name="flash" size={20} color={colors.primary} />
              </View>
              <Text style={styles.incomingTitle}>New Job Request!</Text>
              <TouchableOpacity onPress={() => setIncomingJob(null)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.incomingIssue}>{incomingJob.issueDescription}</Text>
            <Text style={styles.incomingOwner}>
              <Ionicons name="person" size={12} /> {incomingJob.owner?.name} • {incomingJob.ownerLocation?.address || 'Nearby'}
            </Text>
            <View style={styles.incomingActions}>
              <TouchableOpacity style={styles.declineBtn} onPress={() => setIncomingJob(null)}>
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                <Ionicons name="checkmark" size={16} color={colors.white} />
                <Text style={styles.acceptText}>Accept Job</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Active Job */}
        {activeJob && (
          <TouchableOpacity onPress={() => navigation.navigate('ActiveJob', { requestId: activeJob._id })} activeOpacity={0.9}>
            <Card style={styles.activeJobCard}>
              <View style={styles.activeJobHeader}>
                <Text style={styles.activeJobLabel}>ACTIVE JOB</Text>
                <StatusBadge status={activeJob.status} size="sm" />
              </View>
              <Text style={styles.activeJobIssue}>{activeJob.issueDescription}</Text>
              <Text style={styles.activeJobOwner}>Client: {activeJob.owner?.name}</Text>
              <View style={styles.activeJobBtn}>
                <Text style={styles.activeJobBtnText}>View Details</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <Text style={styles.sectionLabel}>YOUR STATS</Text>
        <View style={styles.statsGrid}>
          {[
            { label: "Today's Jobs", value: stats.today, icon: 'today', color: colors.primary },
            { label: 'Total Jobs', value: user?.totalJobs || 0, icon: 'briefcase', color: colors.accent },
            { label: 'Rating', value: user?.rating ? `${user.rating}★` : 'N/A', icon: 'star', color: colors.warning },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={22} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>
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
  onlineBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, gap: spacing.xs },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: 12, fontWeight: '600' },
  toggleCard: { marginBottom: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  toggleTitle: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  toggleSub: { ...typography.bodySmall },
  incomingCard: { marginBottom: spacing.md, borderColor: colors.primary + '44', borderWidth: 1.5 },
  incomingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  incomingPulse: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  incomingTitle: { ...typography.body, fontWeight: '700', color: colors.primary, flex: 1 },
  incomingIssue: { ...typography.h4, marginBottom: spacing.xs },
  incomingOwner: { ...typography.bodySmall, marginBottom: spacing.md },
  incomingActions: { flexDirection: 'row', gap: spacing.sm },
  declineBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  declineText: { color: colors.textSecondary, fontWeight: '600' },
  acceptBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, gap: spacing.xs, ...shadow.lg },
  acceptText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  activeJobCard: { marginBottom: spacing.lg, borderColor: colors.accent + '44' },
  activeJobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  activeJobLabel: { ...typography.label, color: colors.accent },
  activeJobIssue: { ...typography.h4, marginBottom: spacing.xs },
  activeJobOwner: { ...typography.bodySmall, marginBottom: spacing.md },
  activeJobBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  activeJobBtnText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  sectionLabel: { ...typography.label, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statValue: { fontSize: 24, fontWeight: '700', marginVertical: spacing.xs },
  statLabel: { ...typography.bodySmall, textAlign: 'center' },
});
