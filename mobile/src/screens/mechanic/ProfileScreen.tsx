import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors, spacing, radius, typography } from '../../theme';

export default function MechanicProfileScreen({ navigation }: any) {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [spec, setSpec] = useState(user?.specialization || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me', { name, phone, specialization: spec });
      updateUser(data);
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>Mechanic</Text>
          </View>
          {user?.specialization && (
            <Text style={styles.spec}>{user.specialization}</Text>
          )}

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons key={s} name={s <= Math.round(user?.rating || 0) ? 'star' : 'star-outline'} size={16} color={colors.warning} />
            ))}
            <Text style={styles.ratingVal}>{user?.rating ? `${user.rating}/5` : 'No ratings'}</Text>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.totalJobs || 0}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.rating || '—'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: user?.isOnline ? colors.success : colors.textMuted }]}>
              {user?.isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        {/* Profile Info */}
        <Card style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Info</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Ionicons name={editing ? 'close' : 'pencil'} size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {editing ? (
            <>
              <Input label="Name" value={name} onChangeText={setName} autoCapitalize="words" leftIcon="person" />
              <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="call" />
              <Input label="Specialization" value={spec} onChangeText={setSpec} leftIcon="construct" />
              <Button title="Save" onPress={handleSave} loading={loading} fullWidth />
            </>
          ) : (
            <>
              <InfoRow icon="mail" label="Email" value={user?.email || ''} />
              <InfoRow icon="person" label="Name" value={user?.name || ''} />
              <InfoRow icon="call" label="Phone" value={user?.phone || 'Not set'} />
              <InfoRow icon="construct" label="Specialization" value={user?.specialization || 'Not set'} />
            </>
          )}
        </Card>

        <Button
          title="Sign Out"
          onPress={() => Alert.alert('Sign Out', 'Sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
          ])}
          variant="outline"
          fullWidth
          style={{ borderColor: colors.danger }}
          textStyle={{ color: colors.danger }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
    <Ionicons name={icon} size={16} color={colors.textSecondary} />
    <View style={{ marginLeft: spacing.md }}>
      <Text style={{ ...typography.bodySmall, marginBottom: 2 }}>{label}</Text>
      <Text style={{ ...typography.body, color: colors.textPrimary }}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 34, fontWeight: '700', color: colors.white },
  userName: { ...typography.h3, marginBottom: spacing.xs },
  rolePill: { backgroundColor: colors.accent + '22', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: colors.accent + '44', marginBottom: spacing.xs },
  roleText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  spec: { ...typography.bodySmall, marginTop: 4, marginBottom: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  ratingVal: { ...typography.bodySmall, marginLeft: spacing.sm },
  statsRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  statLabel: { ...typography.bodySmall },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  infoCard: { marginBottom: spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { ...typography.label },
});
