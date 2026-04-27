import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography, shadow } from '../../theme';

type RoleCard = {
  role: 'CAR_OWNER' | 'MECHANIC' | 'ADMIN';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
};

const ROLES: RoleCard[] = [
  {
    role: 'CAR_OWNER',
    icon: 'car-sport',
    title: 'Car Owner',
    subtitle: 'Request roadside assistance & track mechanics',
    color: colors.primary,
  },
  {
    role: 'MECHANIC',
    icon: 'construct',
    title: 'Mechanic',
    subtitle: 'Accept jobs & earn on your schedule',
    color: colors.accent,
  },
  {
    role: 'ADMIN',
    icon: 'shield-checkmark',
    title: 'Administrator',
    subtitle: 'Manage users, mechanics & platform',
    color: colors.info,
  },
];

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function RoleSelectionScreen({ navigation }: Props) {
  const handleSelect = (role: RoleCard['role']) => {
    navigation.navigate('Login', { role });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="settings" size={40} color={colors.primary} />
          </View>
          <Text style={styles.appName}>AutoAssist</Text>
          <Text style={styles.tagline}>Roadside help, on demand.</Text>
        </View>

        {/* Role Cards */}
        <Text style={styles.sectionTitle}>How are you joining?</Text>
        <View style={styles.cardsContainer}>
          {ROLES.map((item) => (
            <TouchableOpacity
              key={item.role}
              style={styles.card}
              onPress={() => handleSelect(item.role)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + '22', borderColor: item.color + '44' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login', { role: null })}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    ...shadow.lg,
  },
  appName: { ...typography.h1, color: colors.textPrimary, marginBottom: 6 },
  tagline: { ...typography.body, color: colors.textSecondary },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.md,
    color: colors.textSecondary,
  },
  cardsContainer: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: spacing.md,
  },
  cardText: { flex: 1 },
  cardTitle: { ...typography.h4, marginBottom: 3 },
  cardSubtitle: { ...typography.bodySmall },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl, paddingBottom: spacing.lg },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
