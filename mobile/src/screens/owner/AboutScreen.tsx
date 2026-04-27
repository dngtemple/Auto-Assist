import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';

const APP_VERSION = '1.0.0';

const LINKS = [
  { icon: 'document-text-outline' as const, label: 'Terms of Service', color: colors.info, url: 'https://autoassist.com/terms' },
  { icon: 'shield-outline' as const, label: 'Privacy Policy', color: colors.accent, url: 'https://autoassist.com/privacy' },
  { icon: 'globe-outline' as const, label: 'Website', color: colors.primary, url: 'https://autoassist.com' },
  { icon: 'logo-instagram' as const, label: 'Follow us on Instagram', color: colors.warning, url: 'https://instagram.com/autoassist' },
];

export default function AboutScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo Block */}
        <View style={styles.logoBlock}>
          <View style={styles.logoCircle}>
            <Ionicons name="settings" size={44} color={colors.primary} />
          </View>
          <Text style={styles.appName}>AutoAssist</Text>
          <Text style={styles.tagline}>Roadside help, on demand.</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>Version {APP_VERSION}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.descriptionText}>
            AutoAssist connects car owners with verified mechanics for fast, reliable roadside assistance. Whether it's a flat tyre, dead battery, or engine trouble — help is just a tap away.
          </Text>
        </View>

        {/* Links */}
        <Text style={styles.sectionLabel}>LEGAL & SOCIAL</Text>
        <View style={styles.card}>
          {LINKS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.row, i < LINKS.length - 1 && styles.rowBorder]}
              onPress={() => Linking.openURL(item.url)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Build Info */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>BUILD INFO</Text>
        <View style={styles.card}>
          {[
            { label: 'App Version', value: APP_VERSION },
            { label: 'Platform', value: 'iOS / Android' },
            { label: 'SDK', value: 'Expo SDK 54' },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.infoRow, i < arr.length - 1 && styles.rowBorder]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.copyright}>© 2025 AutoAssist. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.h4 },
  scroll: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  logoBlock: { alignItems: 'center', paddingVertical: spacing.xl },
  logoCircle: { width: 88, height: 88, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary + '44', marginBottom: spacing.md },
  appName: { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
  tagline: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  versionPill: { backgroundColor: colors.primary + '22', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: colors.primary + '44' },
  versionText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  sectionLabel: { ...typography.label, marginBottom: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  descriptionText: { ...typography.body, color: colors.textSecondary, lineHeight: 22, padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconCircle: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowLabel: { ...typography.body, fontWeight: '600', flex: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  infoLabel: { ...typography.body, color: colors.textSecondary },
  infoValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  copyright: { ...typography.bodySmall, textAlign: 'center', marginTop: spacing.lg },
});
