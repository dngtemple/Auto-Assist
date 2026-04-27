import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  StatusBar, TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { colors, spacing, radius, typography } from '../../theme';

const ROLE_FILTERS = ['ALL', 'CAR_OWNER', 'MECHANIC', 'ADMIN'];

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
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setTotal(data.total);
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
              {r === 'CAR_OWNER' ? 'Owners' : r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
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
        renderItem={({ item }) => (
          <Card style={styles.userCard}>
            <View style={styles.userTop}>
              <View style={[styles.avatar, { backgroundColor: ROLE_COLOR[item.role] }]}>
                <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <View style={[styles.rolePill, { backgroundColor: ROLE_COLOR[item.role] + '22', borderColor: ROLE_COLOR[item.role] + '44' }]}>
                <Text style={[styles.roleText, { color: ROLE_COLOR[item.role] }]}>
                  {item.role === 'CAR_OWNER' ? 'Owner' : item.role}
                </Text>
              </View>
            </View>

            {item.role === 'MECHANIC' && (
              <View style={styles.mechanicMeta}>
                <Text style={styles.metaText}>{item.specialization || 'General'}</Text>
                <Text style={styles.metaText}>★ {item.rating || 'N/A'}</Text>
                <Text style={styles.metaText}>{item.totalJobs || 0} jobs</Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: item.isApproved ? colors.danger + '22' : colors.success + '22' }]}
                onPress={() => toggleApproval(item._id, item.isApproved)}
              >
                <Ionicons name={item.isApproved ? 'ban' : 'checkmark-circle'} size={14} color={item.isApproved ? colors.danger : colors.success} />
                <Text style={[styles.actionText, { color: item.isApproved ? colors.danger : colors.success }]}>
                  {item.isApproved ? 'Block' : 'Approve'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.danger + '11' }]}
                onPress={() => deleteUser(item._id, item.name)}
              >
                <Ionicons name="trash" size={14} color={colors.danger} />
                <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
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
  searchRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  searchInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 44, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchText: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  filtersRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  filterText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: colors.primary, fontWeight: '700' },
  list: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  userCard: { marginBottom: spacing.sm },
  userTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  userName: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  userEmail: { ...typography.bodySmall },
  rolePill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1 },
  roleText: { fontSize: 10, fontWeight: '700' },
  mechanicMeta: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm, paddingLeft: 56 },
  metaText: { ...typography.bodySmall },
  actions: { flexDirection: 'row', gap: spacing.sm, paddingLeft: 56 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  actionText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});
