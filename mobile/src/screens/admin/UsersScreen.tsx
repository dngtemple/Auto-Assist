import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  StatusBar, TextInput, Alert, RefreshControl, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { SERVER_ROOT } from '../../services/api';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { colors, spacing, radius, typography } from '../../theme';

const ROLE_FILTERS = ['ALL', 'CAR_OWNER', 'MECHANIC', 'ADMIN', 'PENDING_CERT'];

const FILTER_LABEL: Record<string, string> = {
  ALL: 'All',
  CAR_OWNER: 'Owners',
  MECHANIC: 'Mechanics',
  ADMIN: 'Admins',
  PENDING_CERT: 'Pending',
};

export default function AdminUsersScreen({ route }: any) {
  const initialRole = route.params?.role || 'ALL';
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(initialRole);

  const load = useCallback(async () => {
    try {
      const params: any = { limit: 50 };
      if (roleFilter === 'PENDING_CERT') {
        params.role = 'MECHANIC';
      } else if (roleFilter !== 'ALL') {
        params.role = roleFilter;
      }
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      const filtered = roleFilter === 'PENDING_CERT'
        ? data.users.filter((u: any) => u.certificateStatus === 'PENDING')
        : data.users;
      setUsers(filtered);
      setTotal(roleFilter === 'PENDING_CERT' ? filtered.length : data.total);
    } catch (_) {}
    setLoading(false);
  }, [roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const toggleApproval = async (userId: string, current: boolean) => {
    Alert.alert(current ? 'Block User' : 'Approve User', `${current ? 'Block' : 'Activate'} this user?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          await api.patch(`/admin/users/${userId}`, { isApproved: !current });
          setUsers((u) => u.map((user) => user._id === userId ? { ...user, isApproved: !current } : user));
        },
      },
    ]);
  };

  const submitDecision = async (userId: string, decision: 'APPROVE' | 'REJECT' | 'REVOKE') => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/certify`, { decision });
      setUsers((u) => u.map((user) => user._id === userId ? {
        ...user,
        isCertified: data.isCertified,
        certifiedAt: data.certifiedAt,
        certificateStatus: data.certificateStatus,
      } : user));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update certification');
    }
  };

  const confirmCertify = (userId: string) => {
    Alert.alert('Certify Mechanic', 'Approve this mechanic? They will be shown as verified to car owners.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => submitDecision(userId, 'APPROVE') },
    ]);
  };

  const confirmReject = (userId: string) => {
    Alert.alert('Reject Certificate', 'Reject this mechanic’s submitted certificate? They will be asked to upload a new one.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => submitDecision(userId, 'REJECT') },
    ]);
  };

  const confirmRevoke = (userId: string) => {
    Alert.alert('Revoke Certification', 'Revoke this mechanic’s certified status?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => submitDecision(userId, 'REVOKE') },
    ]);
  };

  const viewCertificate = (item: any) => {
    if (!item.certificateUrl) {
      Alert.alert('No certificate', 'This mechanic has not uploaded a certificate yet.');
      return;
    }
    Linking.openURL(`${SERVER_ROOT}${item.certificateUrl}`).catch(() =>
      Alert.alert('Error', 'Unable to open the file.')
    );
  };

  const openReviewSheet = (item: any) => {
    Alert.alert(
      'Review Certificate',
      `${item.name} submitted a business certificate. Choose an action.`,
      [
        { text: 'View File', onPress: () => viewCertificate(item) },
        { text: 'Approve', onPress: () => submitDecision(item._id, 'APPROVE') },
        { text: 'Reject', style: 'destructive', onPress: () => submitDecision(item._id, 'REJECT') },
      ]
    );
  };

  const deleteUser = async (userId: string, name: string) => {
    Alert.alert('Delete User', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/admin/users/${userId}`);
          setUsers((u) => u.filter((user) => user._id !== userId));
        },
      },
    ]);
  };

  const ROLE_COLOR: Record<string, string> = {
    CAR_OWNER: colors.primary,
    MECHANIC: colors.accent,
    ADMIN: colors.info,
  };

  const getUserStatus = (item: any): { label: string; color: string; icon: any } => {
    if (!item.isApproved) {
      return { label: 'Blocked', color: colors.danger, icon: 'ban' };
    }
    if (item.role === 'MECHANIC') {
      const s = item.certificateStatus || 'NONE';
      if (item.isCertified || s === 'APPROVED') {
        return { label: 'Verified', color: colors.info, icon: 'checkmark-circle' };
      }
      if (s === 'PENDING') {
        return { label: 'Pending', color: colors.warning, icon: 'time' };
      }
      if (s === 'REJECTED') {
        return { label: 'Rejected', color: colors.danger, icon: 'close-circle' };
      }
      return { label: 'Unverified', color: colors.textSecondary, icon: null };
    }
    return { label: 'Active', color: colors.success, icon: null };
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading users..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.count}>{total} total</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchText}
            placeholder="Search users..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={load}
          />
        </View>
      </View>

      {/* Role Filters */}
      <View style={styles.filtersRow}>
        {ROLE_FILTERS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, roleFilter === r && styles.filterActive]}
            onPress={() => setRoleFilter(r)}
          >
            <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>
              {FILTER_LABEL[r] || r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = getUserStatus(item);
          const roleLabel = item.role === 'CAR_OWNER' ? 'Owner' : item.role === 'MECHANIC' ? 'Mechanic' : 'Admin';
          return (
            <Card style={item.isApproved ? styles.userCard : { ...styles.userCard, ...styles.userCardBlocked }}>
              <View style={styles.userTop}>
                <View style={[styles.avatar, { backgroundColor: ROLE_COLOR[item.role] }]}>
                  <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.userSubtitle} numberOfLines={1}>
                    {item.email}  ·  <Text style={{ color: ROLE_COLOR[item.role] }}>{roleLabel}</Text>
                  </Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: status.color + '1F', borderColor: status.color + '40' }]}>
                  {status.icon && <Ionicons name={status.icon} size={10} color={status.color} />}
                  <Text style={[styles.statusChipText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              {item.role === 'MECHANIC' && (
                <Text style={styles.metaLine} numberOfLines={1}>
                  {item.specialization || 'General'}  ·  ★ {item.rating || 'N/A'}  ·  {item.totalJobs || 0} jobs
                </Text>
              )}

              <View style={styles.divider} />

              <View style={styles.actionRow}>
                <View style={styles.actionLeft}>
                  {item.role === 'MECHANIC' && item.certificateStatus === 'PENDING' && (
                    <TouchableOpacity style={[styles.primaryAction, { backgroundColor: colors.warning + '1F' }]} onPress={() => openReviewSheet(item)}>
                      <Ionicons name="document-text-outline" size={14} color={colors.warning} />
                      <Text style={[styles.primaryActionText, { color: colors.warning }]}>Review certificate</Text>
                    </TouchableOpacity>
                  )}
                  {item.role === 'MECHANIC' && item.isCertified && (
                    <TouchableOpacity style={styles.linkAction} onPress={() => confirmRevoke(item._id)}>
                      <Ionicons name="shield-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.linkActionText}>Revoke certification</Text>
                    </TouchableOpacity>
                  )}
                  {item.role === 'MECHANIC' && item.certificateStatus === 'REJECTED' && item.certificateUrl && (
                    <TouchableOpacity style={styles.linkAction} onPress={() => viewCertificate(item)}>
                      <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.linkActionText}>View rejected file</Text>
                    </TouchableOpacity>
                  )}
                  {item.role === 'MECHANIC' && (item.certificateStatus === 'NONE' || !item.certificateStatus) && (
                    <Text style={styles.mutedHint}>Awaiting upload</Text>
                  )}
                </View>

                <View style={styles.actionRight}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => toggleApproval(item._id, item.isApproved)}
                    accessibilityLabel={item.isApproved ? 'Block user' : 'Unblock user'}
                  >
                    <Ionicons
                      name={item.isApproved ? 'ban-outline' : 'checkmark-circle-outline'}
                      size={18}
                      color={item.isApproved ? colors.danger : colors.success}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => deleteUser(item._id, item.name)}
                    accessibilityLabel="Delete user"
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.h3 },
  count: { ...typography.bodySmall, color: colors.primary },
  searchRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  searchInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 44, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchText: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  filtersRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  filterText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: colors.primary, fontWeight: '700' },
  list: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  userCard: { marginBottom: spacing.sm, padding: spacing.md },
  userCardBlocked: { opacity: 0.6 },
  userTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 17 },
  userName: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  userSubtitle: { ...typography.bodySmall, color: colors.textSecondary },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1, marginLeft: spacing.sm },
  statusChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  metaLine: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm, paddingLeft: 60 },
  divider: { height: 1, backgroundColor: colors.border, marginTop: spacing.md, marginBottom: spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  actionRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  primaryAction: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  primaryActionText: { fontSize: 12, fontWeight: '700' },
  linkAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  linkActionText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  mutedHint: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  empty: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});
