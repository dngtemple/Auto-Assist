import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import { colors, spacing, radius, typography } from '../../theme';

const FAQS = [
  { q: 'How long does it take for a mechanic to arrive?', a: 'Typically 15–30 minutes depending on your location and availability.' },
  { q: 'How is the service fee calculated?', a: 'Service fees depend on the job type and mechanic. You\'ll see the fee before confirming payment.' },
  { q: 'Can I cancel a request?', a: 'Yes, you can cancel before a mechanic accepts. After acceptance, a small fee may apply.' },
  { q: 'What if the mechanic doesn\'t show up?', a: 'Contact support immediately. We\'ll dispatch another mechanic and investigate.' },
];

export default function SupportScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Contact Options */}
        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <View style={styles.contactGrid}>
          {[
            { icon: 'call', label: 'Call Us', sub: '24/7 Hotline', color: colors.success, action: () => Linking.openURL('tel:+1234567890') },
            { icon: 'mail', label: 'Email Us', sub: 'support@autoassist.com', color: colors.info, action: () => Linking.openURL('mailto:support@autoassist.com') },
            { icon: 'chatbubbles', label: 'Live Chat', sub: 'Available 9am–9pm', color: colors.accent, action: () => {} },
            { icon: 'logo-whatsapp', label: 'WhatsApp', sub: 'Quick responses', color: colors.success, action: () => {} },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.contactCard} onPress={item.action} activeOpacity={0.8}>
              <View style={[styles.contactIcon, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.contactLabel}>{item.label}</Text>
              <Text style={styles.contactSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>FREQUENTLY ASKED</Text>
        {FAQS.map((faq, i) => (
          <Card key={i} style={styles.faqCard}>
            <View style={styles.faqQ}>
              <Ionicons name="help-circle" size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <Text style={styles.faqQuestion}>{faq.q}</Text>
            </View>
            <Text style={styles.faqAnswer}>{faq.a}</Text>
          </Card>
        ))}
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
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  contactCard: { flex: 1, minWidth: '45%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  contactIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  contactLabel: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  contactSub: { ...typography.bodySmall, textAlign: 'center' },
  faqCard: { marginBottom: spacing.sm },
  faqQ: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  faqQuestion: { ...typography.body, fontWeight: '600', flex: 1, lineHeight: 21 },
  faqAnswer: { ...typography.bodySmall, lineHeight: 20, paddingLeft: spacing.lg },
});
