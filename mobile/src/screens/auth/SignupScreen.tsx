import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth, UserRole } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors, spacing, radius, typography } from '../../theme';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: { params?: { role?: UserRole } };
}

export default function SignupScreen({ navigation, route }: Props) {
  const { signup } = useAuth();
  const role = route.params?.role || 'CAR_OWNER';

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', specialization: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signup({ name: form.name, email: form.email.toLowerCase(), password: form.password, role, phone: form.phone, specialization: form.specialization });
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join as a <Text style={{ color: colors.primary }}>{role.replace('_', ' ').toLowerCase()}</Text></Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input label="Full Name" placeholder="John Doe" value={form.name} onChangeText={set('name')} autoCapitalize="words" leftIcon="person" />
          <Input label="Email Address" placeholder="you@example.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" leftIcon="mail" />
          <Input label="Phone Number" placeholder="+1 234 567 8900" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" leftIcon="call" />
          {role === 'MECHANIC' && (
            <Input label="Specialization" placeholder="e.g. Engine, Electrical, Tyres" value={form.specialization} onChangeText={set('specialization')} leftIcon="construct" />
          )}
          <Input label="Password" placeholder="••••••••" value={form.password} onChangeText={set('password')} secureTextEntry leftIcon="lock-closed" />
          <Input label="Confirm Password" placeholder="••••••••" value={form.confirm} onChangeText={set('confirm')} secureTextEntry leftIcon="lock-closed" />

          <Button title="Create Account" onPress={handleSignup} loading={loading} fullWidth size="lg" style={{ marginTop: spacing.md }} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login', { role })}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg },
  back: { marginBottom: spacing.lg, width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  header: { marginBottom: spacing.xl },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '22',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger + '44',
    gap: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, paddingBottom: spacing.lg },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
