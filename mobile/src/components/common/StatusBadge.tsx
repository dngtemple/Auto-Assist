import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../../theme';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: colors.statusPending, label: 'Pending' },
  ACCEPTED: { color: colors.statusAccepted, label: 'Accepted' },
  EN_ROUTE: { color: colors.statusEnRoute, label: 'En Route' },
  ARRIVED: { color: colors.statusArrived, label: 'Arrived' },
  IN_PROGRESS: { color: colors.primary, label: 'In Progress' },
  COMPLETED: { color: colors.statusCompleted, label: 'Completed' },
  CANCELLED: { color: colors.statusCancelled, label: 'Cancelled' },
};

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status] || { color: colors.textSecondary, label: status };
  return (
    <View style={[styles.badge, { backgroundColor: config.color + '22', borderColor: config.color + '55' }, size === 'sm' && styles.sm]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }, size === 'sm' && styles.textSm]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 7, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  text: { fontSize: 12, fontWeight: '600' },
  textSm: { fontSize: 10 },
});
