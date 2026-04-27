import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { colors, spacing, radius, typography } from '../../theme';

const NEXT_STATUS: Record<string, string> = {
  ACCEPTED: 'EN_ROUTE',
  EN_ROUTE: 'ARRIVED',
  ARRIVED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
};

const STATUS_ACTIONS: Record<string, { label: string; icon: string }> = {
  ACCEPTED: { label: 'Start En Route', icon: 'navigate' },
  EN_ROUTE: { label: 'Mark Arrived', icon: 'location' },
  ARRIVED: { label: 'Start Work', icon: 'construct' },
  IN_PROGRESS: { label: 'Complete Job', icon: 'checkmark-circle' },
};

export default function ActiveJobScreen({ route, navigation }: any) {
  const { requestId } = route.params;
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fee, setFee] = useState('');
  const [mechCoords, setMechCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const socket = useRef(getSocket());

  useEffect(() => {
    api.get(`/requests/${requestId}`).then(({ data }) => {
      setRequest(data);
      setLoading(false);
    });
    socket.current.emit('user:register', user?._id);

    let locSub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setMechCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      locSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 15 },
        (l) => setMechCoords({ latitude: l.coords.latitude, longitude: l.coords.longitude })
      );
    })();

    return () => { locSub?.remove(); };
  }, [requestId, user?._id]);

  const advanceStatus = async () => {
    if (!request) return;
    const next = NEXT_STATUS[request.status];
    if (!next) return;

    if (next === 'COMPLETED') {
      Alert.alert('Complete Job', 'Confirm job completion?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            await api.patch(`/requests/${requestId}/status`, { status: 'COMPLETED', serviceFee: parseFloat(fee) || 0 });
            socket.current.emit('request:status_update', { requestId, status: 'COMPLETED' });
            setRequest((r: any) => ({ ...r, status: 'COMPLETED' }));
            setUpdating(false);
            Alert.alert('Job Completed!', 'Great work! Payment will be processed shortly.', [
              { text: 'OK', onPress: () => navigation.navigate('Home') },
            ]);
          },
        },
      ]);
      return;
    }

    setUpdating(true);
    try {
      await api.patch(`/requests/${requestId}/status`, { status: next });
      socket.current.emit('request:status_update', { requestId, status: next });
      setRequest((r: any) => ({ ...r, status: next }));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading job..." />;
  if (!request) return null;

  const action = STATUS_ACTIONS[request.status];
  const isCompleted = request.status === 'COMPLETED';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Active Job</Text>
        <StatusBadge status={request.status} size="sm" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Client Card */}
        <Card style={styles.clientCard}>
          <Text style={styles.cardLabel}>CLIENT</Text>
          <View style={styles.clientRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{request.owner?.name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{request.owner?.name}</Text>
              <Text style={styles.clientPhone}>{request.owner?.phone || 'No phone'}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={18} color={colors.success} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Job Details */}
        <Card style={styles.jobCard}>
          <Text style={styles.cardLabel}>JOB DETAILS</Text>
          <Text style={styles.issueTitle}>{request.issueDescription}</Text>
          {request.vehicleModel && (
            <View style={styles.detailRow}>
              <Ionicons name="car" size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>{request.vehicleModel}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={2}>{request.ownerLocation?.address || 'Location on map'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>{new Date(request.createdAt).toLocaleTimeString()}</Text>
          </View>
        </Card>

        {/* Live Map */}
        {request.ownerLocation?.coordinates && (
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: request.ownerLocation.coordinates[1],
              longitude: request.ownerLocation.coordinates[0],
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            <Marker
              coordinate={{
                latitude: request.ownerLocation.coordinates[1],
                longitude: request.ownerLocation.coordinates[0],
              }}
              title={request.owner?.name || 'Client'}
              description={request.ownerLocation.address || ''}
              pinColor={colors.primary}
            />
            {mechCoords && (
              <Marker
                coordinate={mechCoords}
                title="You"
                pinColor={colors.success}
              />
            )}
          </MapView>
        )}

        {/* Fee Input (only when completing) */}
        {request.status === 'IN_PROGRESS' && (
          <Card style={styles.feeCard}>
            <Text style={styles.cardLabel}>SERVICE FEE (GH₵)</Text>
            <View style={styles.feeInput}>
              <Text style={styles.feeCurrency}>GH₵</Text>
              <Text
                style={styles.feeValue}
                onPress={() => {
                  Alert.prompt?.('Set Fee', 'Enter service fee amount', (text) => setFee(text), 'plain-text', fee);
                }}
              >
                {fee || 'Tap to set'}
              </Text>
            </View>
          </Card>
        )}

        {/* Action Button */}
        {!isCompleted && action && (
          <Button
            title={action.label}
            onPress={advanceStatus}
            loading={updating}
            fullWidth
            size="lg"
            style={styles.actionBtn}
          />
        )}

        {isCompleted && (
          <Card style={styles.completedCard}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.completedTitle}>Job Completed!</Text>
            <Text style={styles.completedSub}>Payment will be processed shortly.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.h4 },
  scroll: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  clientCard: { marginBottom: spacing.md },
  cardLabel: { ...typography.label, marginBottom: spacing.md },
  clientRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  clientName: { ...typography.body, fontWeight: '600', marginBottom: 3 },
  clientPhone: { ...typography.bodySmall },
  callBtn: { width: 40, height: 40, backgroundColor: colors.success + '22', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  jobCard: { marginBottom: spacing.md },
  issueTitle: { ...typography.h4, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xs },
  detailText: { ...typography.bodySmall, flex: 1 },
  map: {
    height: 220,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  feeCard: { marginBottom: spacing.md },
  feeInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  feeCurrency: { ...typography.h3, color: colors.primary, marginRight: spacing.sm },
  feeValue: { ...typography.h3, color: colors.textPrimary },
  actionBtn: { marginTop: spacing.sm },
  completedCard: { alignItems: 'center', paddingVertical: spacing.xl },
  completedTitle: { ...typography.h3, marginTop: spacing.md, color: colors.success },
  completedSub: { ...typography.bodySmall, marginTop: spacing.sm },
});
