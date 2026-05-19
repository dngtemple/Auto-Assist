import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  style?: ViewStyle;
}

export default function VerifiedBadge({ size = 'sm', iconOnly = false, style }: Props) {
  const iconSize = size === 'lg' ? 16 : size === 'md' ? 13 : 11;
  const fontSize = size === 'lg' ? 12 : size === 'md' ? 11 : 10;
  const padV = size === 'lg' ? 4 : 2;
  const padH = size === 'lg' ? spacing.sm : spacing.xs;

  if (iconOnly) {
    return <Ionicons name="checkmark-circle" size={iconSize + 2} color={colors.info} style={style} />;
  }

  return (
    <View style={[styles.badge, { paddingVertical: padV, paddingHorizontal: padH }, style]}>
      <Ionicons name="checkmark-circle" size={iconSize} color={colors.info} />
      <Text style={[styles.text, { fontSize }]}>Certified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.info + '22',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.info + '44',
    alignSelf: 'flex-start',
  },
  text: {
    color: colors.info,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
