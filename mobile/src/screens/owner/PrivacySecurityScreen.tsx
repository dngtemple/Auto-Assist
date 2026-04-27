import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';

export default function PrivacySecurityScreen({ navigation }: any) {
  const [locationAlways, setLocationAlways] = useState(false);
  const [biometrics, setBiometrics] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'A password reset link will be sent to your email.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send Link', onPress: () => Alert.alert('Sent', 'Check your email for the reset link.') },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Security */}
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={handleChangePassword} activeOpacity={0.7}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="key" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Change Password</Text>
              <Text style={styles.rowSub}>Send a reset link to your email</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.row, styles.rowBorder]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.info + '22' }]}>
              <Ionicons name="finger-print" size={18} color={colors.info} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Biometric Login</Text>
              <Text style={styles.rowSub}>Use Face ID or fingerprint to sign in</Text>
            </View>
            <Switch
              value={biometrics}
              onValueChange={setBiometrics}
              trackColor={{ false: colors.border, true: colors.primary + '88' }}
              thumbColor={biometrics ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: colors.success + '22' }]}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Two-Factor Authentication</Text>
              <Text style={styles.rowSub}>Add an extra layer of security</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </View>

        {/* Privacy */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>PRIVACY</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent + '22' }]}>
              <Ionicons name="location" size={18} color={colors.accent} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Background Location</Text>
              <Text style={styles.rowSub}>Allow location access when app is closed</Text>
            </View>
            <Switch
              value={locationAlways}
              onValueChange={setLocationAlways}
              trackColor={{ false: colors.border, true: colors.primary + '88' }}
              thumbColor={locationAlways ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: colors.warning + '22' }]}>
              <Ionicons name="analytics" size={18} color={colors.warning} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Usage Data Sharing</Text>
              <Text style={styles.rowSub}>Help improve AutoAssist with anonymous data</Text>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={setDataSharing}
              trackColor={{ false: colors.border, true: colors.primary + '88' }}
              thumbColor={dataSharing ? colors.primary : colors.textMuted}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>DANGER ZONE</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <View style={[styles.iconCircle, { backgroundColor: colors.danger + '22' }]}>
              <Ionicons name="trash" size={18} color={colors.danger} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.danger }]}>Delete Account</Text>
              <Text style={styles.rowSub}>Permanently remove your account and data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.h4 },
  scroll: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  sectionLabel: { ...typography.label, marginBottom: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconCircle: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowText: { flex: 1 },
  rowLabel: { ...typography.body, fontWeight: '600' },
  rowSub: { ...typography.bodySmall, marginTop: 2 },
});
