import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';

type NotifSetting = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  color: string;
};

const SETTINGS: NotifSetting[] = [
  { key: 'job_updates', icon: 'car-sport', label: 'Job Updates', description: 'Mechanic accepted, en route, arrived', color: colors.primary },
  { key: 'promotions', icon: 'pricetag', label: 'Promotions & Offers', description: 'Discounts and special deals', color: colors.accent },
  { key: 'reminders', icon: 'alarm', label: 'Reminders', description: 'Scheduled service reminders', color: colors.info },
  { key: 'account', icon: 'shield-checkmark', label: 'Account Activity', description: 'Login alerts and account changes', color: colors.warning },
  { key: 'messages', icon: 'chatbubbles', label: 'Messages', description: 'Chat messages from mechanics', color: colors.success },
];

export default function NotificationsScreen({ navigation }: any) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    job_updates: true,
    promotions: false,
    reminders: true,
    account: true,
    messages: true,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>PUSH NOTIFICATIONS</Text>
        <View style={styles.card}>
          {SETTINGS.map((item, i) => (
            <View key={item.key} style={[styles.row, i < SETTINGS.length - 1 && styles.rowBorder]}>
              <View style={[styles.iconCircle, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowSub}>{item.description}</Text>
              </View>
              <Switch
                value={enabled[item.key]}
                onValueChange={(val) => setEnabled((prev) => ({ ...prev, [item.key]: val }))}
                trackColor={{ false: colors.border, true: colors.primary + '88' }}
                thumbColor={enabled[item.key] ? colors.primary : colors.textMuted}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>EMAIL NOTIFICATIONS</Text>
        <View style={styles.card}>
          {['Weekly Summary', 'Service Receipts', 'News & Updates'].map((label, i, arr) => (
            <View key={label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{label}</Text>
              </View>
              <Switch
                value={i !== 2}
                trackColor={{ false: colors.border, true: colors.primary + '88' }}
                thumbColor={i !== 2 ? colors.primary : colors.textMuted}
              />
            </View>
          ))}
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
