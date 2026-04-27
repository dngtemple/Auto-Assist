import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = StyleSheet.create({
  h1: { fontSize: 32, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  h3: { fontSize: 22, fontWeight: '600', color: colors.textPrimary },
  h4: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400', color: colors.textSecondary, lineHeight: 19 },
  caption: { fontSize: 11, fontWeight: '500', color: colors.textMuted, letterSpacing: 0.5 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  button: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  buttonSmall: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
});
