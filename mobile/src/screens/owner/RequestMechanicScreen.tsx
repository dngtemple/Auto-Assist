import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { colors, spacing, radius, typography } from '../../theme';

const ISSUE_TYPES = [
  { label: 'Engine Problem', icon: 'settings' as const },
  { label: 'Flat Tyre', icon: 'ellipse' as const },
  { label: 'Battery Dead', icon: 'battery-dead' as const },
  { label: 'Overheating', icon: 'thermometer' as const },
  { label: 'Brake Issue', icon: 'stop-circle' as const },
  { label: 'Other', icon: 'help-circle' as const },
];

export default function RequestMechanicScreen({ navigation }: any) {
  const { user } = useAuth();
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState('Fetching location...');
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Location permission denied');
        setLocLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      if (geo) {
        setAddress(`${geo.street || ''} ${geo.city || ''}, ${geo.region || ''}`.trim());
      }
      setLocLoading(false);
    })();
  }, []);

  const handleRequest = async () => {
    if (!selectedIssue) { Alert.alert('Select Issue', 'Please select the type of issue.'); return; }
    if (!location) { Alert.alert('Location Required', 'Could not get your location.'); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/requests', {
        issueDescription: selectedIssue + (description ? `: ${description}` : ''),
        vehicleModel,
        vehicleType: 'Car',
        coordinates: [location.coords.longitude, location.coords.latitude],
        address,
      });

      const socket = getSocket();
      socket.emit('user:register', user?._id);
      socket.emit('request:new', {
        requestId: data._id,
        ownerLocation: [location.coords.longitude, location.coords.latitude],
      });

      navigation.replace('Tracking', { requestId: data._id });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Request Mechanic</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Location */}
        <Card style={styles.locationCard}>
          <View style={styles.locationRow}>
            <View style={styles.locIcon}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locLabel}>YOUR LOCATION</Text>
              <Text style={styles.locText} numberOfLines={2}>{locLoading ? 'Fetching...' : address}</Text>
            </View>
            {locLoading && <Ionicons name="sync" size={16} color={colors.textSecondary} />}
          </View>
        </Card>

        {/* Issue Type */}
        <Text style={styles.sectionLabel}>What's the issue?</Text>
        <View style={styles.issueGrid}>
          {ISSUE_TYPES.map((issue) => (
            <TouchableOpacity
              key={issue.label}
              style={[styles.issueChip, selectedIssue === issue.label && styles.issueChipActive]}
              onPress={() => setSelectedIssue(issue.label)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={issue.icon}
                size={18}
                color={selectedIssue === issue.label ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.issueLabel, selectedIssue === issue.label && styles.issueLabelActive]}>
                {issue.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Additional Details (optional)"
          placeholder="Describe the problem..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Input
          label="Vehicle Model"
          placeholder="e.g. Toyota Camry 2020"
          value={vehicleModel}
          onChangeText={setVehicleModel}
          leftIcon="car"
        />

        {/* Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={18} color={colors.info} />
            <Text style={styles.infoText}>
              Nearby mechanics within 5km will be notified. First to accept gets the job.
            </Text>
          </View>
        </Card>

        <Button
          title="Find Mechanic Now"
          onPress={handleRequest}
          loading={loading}
          disabled={locLoading}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { ...typography.h4 },
  locationCard: { marginBottom: spacing.lg },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  locIcon: { width: 36, height: 36, backgroundColor: colors.primary + '22', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  locLabel: { ...typography.label, marginBottom: 2 },
  locText: { ...typography.body, color: colors.textPrimary },
  sectionLabel: { ...typography.label, marginBottom: spacing.md },
  issueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  issueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  issueChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  issueLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  issueLabelActive: { color: colors.primary, fontWeight: '600' },
  infoCard: { backgroundColor: colors.info + '11', borderColor: colors.info + '33', marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  infoText: { ...typography.bodySmall, color: colors.info, flex: 1, lineHeight: 18 },
  submitBtn: { marginTop: spacing.sm },
});
