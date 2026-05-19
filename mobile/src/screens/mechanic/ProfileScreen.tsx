import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import api, { SERVER_ROOT } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import VerifiedBadge from '../../components/common/VerifiedBadge';
import { colors, spacing, radius, typography } from '../../theme';

export default function MechanicProfileScreen({ navigation }: any) {
  const { user, logout, updateUser } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [spec, setSpec] = useState(user?.specialization || '');
  const [loading, setLoading] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  const certStatus = user?.certificateStatus || 'NONE';
  const hasCert = !!user?.certificateUrl;

  const pickAndUploadCertificate = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Please choose a file under 5 MB.');
        return;
      }

      setUploadingCert(true);
      const form = new FormData();
      form.append('certificate', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      } as any);

      const { data } = await api.post('/users/me/certificate', form, {
        timeout: 30000,
        transformRequest: (d) => d,
      });
      updateUser(data);
      Alert.alert('Submitted', 'Your certificate has been submitted for review.');
    } catch (err: any) {
      console.log('[cert upload] failed:', err?.message, err?.response?.status, err?.response?.data);
      Alert.alert('Upload failed', err.message || 'Could not upload certificate.');
    } finally {
      setUploadingCert(false);
    }
  };

  const viewCertificate = () => {
    if (!user?.certificateUrl) return;
    Linking.openURL(`${SERVER_ROOT}${user.certificateUrl}`).catch(() =>
      Alert.alert('Error', 'Unable to open the file.')
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: any = { name, phone };
      if (!isAdmin) payload.specialization = spec;
      const { data } = await api.patch('/users/me', payload);
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
          <View style={[styles.avatar, { backgroundColor: isAdmin ? colors.roleAdmin : colors.accent }]}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user?.name}</Text>
            {!isAdmin && user?.isCertified && <VerifiedBadge size="md" />}
          </View>
          <View style={[styles.rolePill, isAdmin && { backgroundColor: colors.roleAdmin + '22', borderColor: colors.roleAdmin + '44' }]}>
            <Text style={[styles.roleText, isAdmin && { color: colors.roleAdmin }]}>
              {isAdmin ? 'Admin' : 'Mechanic'}
            </Text>
          </View>
          {!isAdmin && user?.specialization && (
            <Text style={styles.spec}>{user.specialization}</Text>
          )}
          {!isAdmin && !user?.isCertified && (
            <View style={styles.pendingPill}>
              <Ionicons name="time-outline" size={11} color={colors.warning} />
              <Text style={styles.pendingText}>Pending verification</Text>
            </View>
          )}

          {!isAdmin && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name={s <= Math.round(user?.rating || 0) ? 'star' : 'star-outline'} size={16} color={colors.warning} />
              ))}
              <Text style={styles.ratingVal}>{user?.rating ? `${user.rating}/5` : 'No ratings'}</Text>
            </View>
          )}
        </View>

        {!isAdmin && (
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
        )}

        {!isAdmin && (
          <Card style={styles.certCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Business Certificate</Text>
              {certStatus === 'PENDING' && (
                <View style={[styles.statusPill, { backgroundColor: colors.warning + '22', borderColor: colors.warning + '44' }]}>
                  <Ionicons name="time" size={11} color={colors.warning} />
                  <Text style={[styles.statusPillText, { color: colors.warning }]}>Awaiting review</Text>
                </View>
              )}
              {certStatus === 'APPROVED' && (
                <View style={[styles.statusPill, { backgroundColor: colors.success + '22', borderColor: colors.success + '44' }]}>
                  <Ionicons name="checkmark-circle" size={11} color={colors.success} />
                  <Text style={[styles.statusPillText, { color: colors.success }]}>Approved</Text>
                </View>
              )}
              {certStatus === 'REJECTED' && (
                <View style={[styles.statusPill, { backgroundColor: colors.danger + '22', borderColor: colors.danger + '44' }]}>
                  <Ionicons name="close-circle" size={11} color={colors.danger} />
                  <Text style={[styles.statusPillText, { color: colors.danger }]}>Rejected</Text>
                </View>
              )}
            </View>

            {certStatus === 'NONE' && (
              <>
                <Text style={styles.certHelp}>
                  Upload your business certificate (image or PDF, max 5 MB). An admin will review it and certify your account.
                </Text>
                <Button
                  title="Upload Certificate"
                  onPress={pickAndUploadCertificate}
                  loading={uploadingCert}
                  fullWidth
                />
              </>
            )}

            {certStatus === 'PENDING' && (
              <>
                <Text style={styles.certHelp}>
                  Submitted on {user?.certificateSubmittedAt ? new Date(user.certificateSubmittedAt).toLocaleDateString() : '—'}. An admin will review it shortly.
                </Text>
                <View style={styles.certRow}>
                  {hasCert && (
                    <TouchableOpacity style={styles.certBtn} onPress={viewCertificate}>
                      <Ionicons name="eye" size={14} color={colors.info} />
                      <Text style={[styles.certBtnText, { color: colors.info }]}>View</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.certBtn} onPress={pickAndUploadCertificate} disabled={uploadingCert}>
                    <Ionicons name="refresh" size={14} color={colors.textSecondary} />
                    <Text style={[styles.certBtnText, { color: colors.textSecondary }]}>{uploadingCert ? 'Uploading…' : 'Replace'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {certStatus === 'APPROVED' && hasCert && (
              <View style={styles.certRow}>
                <TouchableOpacity style={styles.certBtn} onPress={viewCertificate}>
                  <Ionicons name="eye" size={14} color={colors.info} />
                  <Text style={[styles.certBtnText, { color: colors.info }]}>View certificate</Text>
                </TouchableOpacity>
              </View>
            )}

            {certStatus === 'REJECTED' && (
              <>
                <Text style={[styles.certHelp, { color: colors.danger }]}>
                  Your previous submission was rejected. Please upload an updated certificate.
                </Text>
                <Button
                  title="Submit Again"
                  onPress={pickAndUploadCertificate}
                  loading={uploadingCert}
                  fullWidth
                />
              </>
            )}
          </Card>
        )}

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
              {!isAdmin && (
                <Input label="Specialization" value={spec} onChangeText={setSpec} leftIcon="construct" />
              )}
              <Button title="Save" onPress={handleSave} loading={loading} fullWidth />
            </>
          ) : (
            <>
              <InfoRow icon="mail" label="Email" value={user?.email || ''} />
              <InfoRow icon="person" label="Name" value={user?.name || ''} />
              <InfoRow icon="call" label="Phone" value={user?.phone || 'Not set'} />
              {!isAdmin && (
                <InfoRow icon="construct" label="Specialization" value={user?.specialization || 'Not set'} />
              )}
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  userName: { ...typography.h3 },
  pendingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.warning + '18', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3, marginTop: spacing.xs, borderWidth: 1, borderColor: colors.warning + '33' },
  pendingText: { color: colors.warning, fontSize: 11, fontWeight: '600' },
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
  certCard: { marginBottom: spacing.md },
  certHelp: { ...typography.bodySmall, marginBottom: spacing.md, lineHeight: 18 },
  certRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  certBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.border },
  certBtnText: { fontSize: 12, fontWeight: '600' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, borderWidth: 1 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
});
