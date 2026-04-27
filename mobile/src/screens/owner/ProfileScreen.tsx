import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors, spacing, radius, typography } from '../../theme';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me', { name, phone });
      updateUser(data);
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const MENU_ITEMS = [
    { icon: 'notifications-outline' as const, label: 'Notifications', onPress: () => navigation.navigate('Home', { screen: 'Notifications' }) },
    { icon: 'shield-checkmark-outline' as const, label: 'Privacy & Security', onPress: () => navigation.navigate('Home', { screen: 'PrivacySecurity' }) },
    { icon: 'chatbubbles-outline' as const, label: 'Support', onPress: () => navigation.navigate('Home', { screen: 'Support' }) },
    { icon: 'information-circle-outline' as const, label: 'About', onPress: () => navigation.navigate('Home', { screen: 'About' }) },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>Car Owner</Text>
          </View>
        </View>

        {/* Profile Details */}
        <Card style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Info</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Ionicons name={editing ? 'close' : 'pencil'} size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {editing ? (
            <>
              <Input label="Full Name" value={name} onChangeText={setName} leftIcon="person" />
              <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="call" />
              <Button title="Save Changes" onPress={handleSave} loading={loading} fullWidth />
            </>
          ) : (
            <>
              <InfoRow icon="mail" label="Email" value={user?.email || ''} />
              <InfoRow icon="person" label="Name" value={user?.name || ''} />
              <InfoRow icon="call" label="Phone" value={user?.phone || 'Not set'} />
            </>
          )}
        </Card>

        {/* Menu */}
        <Card style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity key={item.label} style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuBorder]} onPress={item.onPress} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>

        <Button title="Sign Out" onPress={handleLogout} variant="outline" fullWidth style={{ borderColor: colors.danger }} textStyle={{ color: colors.danger }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={infoStyles.row}>
    <Ionicons name={icon} size={16} color={colors.textSecondary} />
    <View style={{ marginLeft: spacing.md }}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  </View>
);

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { ...typography.bodySmall, marginBottom: 2 },
  value: { ...typography.body, color: colors.textPrimary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.white },
  userName: { ...typography.h3, marginBottom: spacing.sm },
  rolePill: { backgroundColor: colors.primary + '22', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: colors.primary + '44' },
  roleText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  infoCard: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { ...typography.label },
  menuCard: { marginBottom: spacing.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuLabel: { ...typography.body },
});
