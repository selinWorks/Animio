import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {
  Heart,
  ShieldCheck,
  Sparkles,
  PawPrint,
  CalendarDays,
} from 'lucide-react-native';

export default function AboutAppScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.logoBox}>
          <PawPrint size={34} color="#6D5CE7" strokeWidth={2.4} />
        </View>

        <Text style={styles.appName}>PetCare</Text>
        <Text style={styles.appTagline}>
          Dostlarının bakımını daha düzenli, güvenli ve kolay hale getiren
          kişisel bakım asistanın.
        </Text>

        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>Sürüm 1.0.0</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PetCare ne yapar?</Text>

        <View style={styles.infoCard}>
          <View style={[styles.iconBox, {backgroundColor: '#F1ECFF'}]}>
            <Heart size={20} color="#6D5CE7" strokeWidth={2.3} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Dost bakımı tek yerde</Text>
            <Text style={styles.infoText}>
              Mama, bakım, sağlık ve günlük ihtiyaçları tek bir ekrandan takip
              etmeye yardımcı olur.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={[styles.iconBox, {backgroundColor: '#E7FAF2'}]}>
            <CalendarDays size={20} color="#059669" strokeWidth={2.3} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Hatırlatmaları kolaylaştırır</Text>
            <Text style={styles.infoText}>
              Aşı, veteriner, bakım ve özel görevleri düzenli şekilde
              planlamayı sağlar.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={[styles.iconBox, {backgroundColor: '#FFF4D6'}]}>
            <ShieldCheck size={20} color="#D97706" strokeWidth={2.3} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Daha güvenli takip</Text>
            <Text style={styles.infoText}>
              Dostlarınla ilgili önemli bilgileri düzenli ve erişilebilir
              şekilde saklamaya odaklanır.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.highlightCard}>
        <View style={styles.highlightIcon}>
          <Sparkles size={24} color="#FFFFFF" strokeWidth={2.4} />
        </View>

        <Text style={styles.highlightTitle}>Neden geliştirildi?</Text>
        <Text style={styles.highlightText}>
          PetCare, evcil hayvan sahiplerinin günlük bakım sürecini daha pratik,
          anlaşılır ve keyifli hale getirmek için geliştirildi.
        </Text>
      </View>

      <Text style={styles.footerText}>
        PetCare • Dostlarının bakım arkadaşı
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F0F2F7',
    elevation: 2,
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 5},
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#18181B',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 15,
    color: '#707788',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: '#F3EEFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D5CE7',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#18181B',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F2F7',
    elevation: 1,
    shadowColor: '#111827',
    shadowOpacity: 0.035,
    shadowRadius: 9,
    shadowOffset: {width: 0, height: 4},
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    fontWeight: '500',
  },
  highlightCard: {
    backgroundColor: '#6D5CE7',
    borderRadius: 26,
    padding: 20,
    marginBottom: 20,
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  highlightTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 14,
    color: '#EFEFFF',
    lineHeight: 21,
    fontWeight: '500',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#8B92A3',
    fontWeight: '700',
  },
});