import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { colors, spacing, radius, typography } from '../../theme';

const STATUS_STEPS = ['PENDING', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];

export default function TrackingScreen({ route, navigation }: any) {
  const { requestId } = route.params;
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [mechanicCoords, setMechanicCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const socketRef = useRef(getSocket());
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    api.get(`/requests/${requestId}`).then(({ data }) => {
      setRequest(data);
      setLoading(false);
      if (data.mechanic?.location?.coordinates) {
        const [lng, lat] = data.mechanic.location.coordinates;
        setMechanicCoords({ latitude: lat, longitude: lng });
      }
    }).catch(() => setLoading(false));

    const socket = socketRef.current;
    socket.emit('user:register', user?._id);
    socket.emit('job:join', { requestId });

    socket.on('mechanic:location:update', ({ coordinates }: any) => {
      const [lng, lat] = coordinates;
      setMechanicCoords({ latitude: lat, longitude: lng });
    });

    socket.on('request:status_changed', ({ status }: any) => {
      setRequest((r: any) => r ? { ...r, status } : r);
    });

    socket.on('request:mechanic_assigned', () => {
      api.get(`/requests/${requestId}`).then(({ data }) => setRequest(data));
    });

    return () => {
      socket.off('mechanic:location:update');
      socket.off('request:status_changed');
      socket.off('request:mechanic_assigned');
    };
  }, [requestId, user?._id]);

  useEffect(() => {
    if (mechanicCoords && mapRef.current) {
      mapRef.current.animateToRegion({
        ...mechanicCoords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [mechanicCoords]);

  const handleCancel = async () => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await api.patch(`/requests/${requestId}/status`, { status: 'CANCELLED' });
          socketRef.current.emit('request:cancel', { requestId });
          navigation.goBack();
        },
      },
    ]);
  };

  const handleRate = async (stars: number) => {
    setRating(stars);
    await api.patch(`/requests/${requestId}/rate`, { rating: stars });
    Alert.alert('Thank you!', 'Your rating has been submitted.');
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading request..." />;
  if (!request) return (
    <SafeAreaView style={styles.safe}>
      <Text style={{ color: colors.textPrimary, textAlign: 'center', marginTop: 100 }}>Request not found.</Text>
    </SafeAreaView>
  );

  const ownerCoords = request.ownerLocation?.coordinates
    ? { latitude: request.ownerLocation.coordinates[1], longitude: request.ownerLocation.coordinates[0] }
    : null;

  const initialRegion = mechanicCoords || ownerCoords
    ? {
        latitude: (mechanicCoords || ownerCoords)!.latitude,
        longitude: (mechanicCoords || ownerCoords)!.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : undefined;

  const stepIndex = STATUS_STEPS.indexOf(request.status);
  const isActive = !['COMPLETED', 'CANCELLED'].includes(request.status);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          showsUserLocation={false}
          customMapStyle={darkMapStyle}
        >
          {ownerCoords && (
            <Marker coordinate={ownerCoords} title="Your location" anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.ownerMarker}>
                <Ionicons name="person" size={14} color={colors.white} />
              </View>
            </Marker>
          )}
          {mechanicCoords && (
            <Marker coordinate={mechanicCoords} title="Mechanic" anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.mechanicMarker}>
                <Ionicons name="construct" size={14} color={colors.white} />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Back button over map */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Status badge over map */}
        <View style={styles.statusOverlay}>
          <StatusBadge status={request.status} size="sm" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle}>Track Request</Text>

        {/* Progress Steps */}
        <Card style={styles.progressCard}>
          <Text style={[typography.label, { marginBottom: spacing.md }]}>REQUEST PROGRESS</Text>
          {STATUS_STEPS.map((step, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            if (step === 'CANCELLED') return null;
            return (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                    {done ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
                    {active ? <View style={styles.innerDot} /> : null}
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[styles.stepLine, done && styles.stepLineDone]} />
                  )}
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}>
                  {step.replace('_', ' ')}
                </Text>
              </View>
            );
          })}
        </Card>

        {/* Mechanic Card */}
        {request.mechanic ? (
          <Card style={styles.mechanicCard}>
            <Text style={styles.cardSectionTitle}>YOUR MECHANIC</Text>
            <View style={styles.mechanicRow}>
              <View style={styles.mechanicAvatar}>
                <Ionicons name="person" size={24} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mechanicName}>{request.mechanic.name}</Text>
                <Text style={styles.mechanicSpec}>{request.mechanic.specialization || 'General Mechanic'}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color={colors.warning} />
                <Text style={styles.ratingText}>{request.mechanic.rating || '—'}</Text>
              </View>
            </View>
            <View style={styles.contactRow}>
              <TouchableOpacity style={styles.contactBtn}>
                <Ionicons name="call" size={16} color={colors.success} />
                <Text style={[styles.contactBtnText, { color: colors.success }]}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactBtn}>
                <Ionicons name="chatbubble" size={16} color={colors.info} />
                <Text style={[styles.contactBtnText, { color: colors.info }]}>Message</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <Card style={styles.waitingCard}>
            <View style={styles.waitingRow}>
              <View style={styles.waitIcon}><Ionicons name="time" size={24} color={colors.warning} /></View>
              <View>
                <Text style={styles.waitTitle}>Finding a mechanic...</Text>
                <Text style={styles.waitSub}>Notifying nearby mechanics</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Rating */}
        {request.status === 'COMPLETED' && !request.rating && (
          <Card style={styles.ratingCard}>
            <Text style={styles.cardSectionTitle}>RATE YOUR EXPERIENCE</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => handleRate(s)}>
                  <Ionicons name={s <= rating ? 'star' : 'star-outline'} size={32} color={colors.warning} />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {isActive && request.status === 'PENDING' && (
          <Button title="Cancel Request" onPress={handleCancel} variant="danger" fullWidth />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1E2D3D' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8899AA' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D1B2A' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#243447' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0D1B2A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D1B2A' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  mapContainer: { height: 260, position: 'relative' },
  map: { flex: 1 },
  backBtn: {
    position: 'absolute', top: 12, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.card + 'EE',
    alignItems: 'center', justifyContent: 'center',
  },
  statusOverlay: { position: 'absolute', top: 12, right: 16 },
  ownerMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  mechanicMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  screenTitle: { ...typography.h3, marginBottom: spacing.lg },
  progressCard: { marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  stepLeft: { alignItems: 'center', width: 24, marginRight: spacing.md },
  stepDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  stepDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  innerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  stepLine: { width: 2, height: 24, backgroundColor: colors.border, marginTop: 2 },
  stepLineDone: { backgroundColor: colors.success },
  stepLabel: { ...typography.body, color: colors.textMuted, paddingTop: 1, paddingBottom: spacing.md, flex: 1 },
  stepLabelActive: { color: colors.primary, fontWeight: '600' },
  stepLabelDone: { color: colors.success },
  mechanicCard: { marginBottom: spacing.md },
  cardSectionTitle: { ...typography.label, marginBottom: spacing.md },
  mechanicRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  mechanicAvatar: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.accent + '22', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderWidth: 1, borderColor: colors.accent + '44' },
  mechanicName: { ...typography.h4, marginBottom: 3 },
  mechanicSpec: { ...typography.bodySmall },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.warning + '22', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  ratingText: { color: colors.warning, fontSize: 12, fontWeight: '600' },
  contactRow: { flexDirection: 'row', gap: spacing.sm },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: spacing.sm, gap: spacing.xs, borderWidth: 1, borderColor: colors.border },
  contactBtnText: { fontSize: 13, fontWeight: '600' },
  waitingCard: { marginBottom: spacing.md },
  waitingRow: { flexDirection: 'row', alignItems: 'center' },
  waitIcon: { width: 48, height: 48, backgroundColor: colors.warning + '22', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  waitTitle: { ...typography.body, fontWeight: '600', marginBottom: 3 },
  waitSub: { ...typography.bodySmall },
  ratingCard: { marginBottom: spacing.lg },
  starsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
