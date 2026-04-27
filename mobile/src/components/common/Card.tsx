import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow } from '../../theme';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
}

export default function Card({ children, style, elevated = false, noPadding = false }: Props) {
  return (
    <View style={[styles.card, elevated && styles.elevated, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  elevated: {
    backgroundColor: colors.cardElevated,
    ...shadow.md,
  },
  noPadding: { padding: 0 },
});
