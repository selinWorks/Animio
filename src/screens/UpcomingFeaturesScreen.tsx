import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {
  Sparkles,
  MapPin,
  Stethoscope,
  SlidersHorizontal,
  ArrowDownUp,
  Navigation,
  CheckCircle2,
} from 'lucide-react-native';

const features = [
  {
    title: 'Canlı konum görüntüleme',
    description:
      'Kullanıcı, harita üzerinden kendi anlık konumunu kolayca görüntüleyebilecek.',
    icon: MapPin,
    color: '#2563EB',
    bg: '#EAF2FF',
  },
  {
    title: 'Yakındaki veterinerleri görme',
    description:
      'Tek dokunuşla kullanıcının çevresindeki veteriner klinikleri listelenebilecek.',
    icon: Stethoscope,
    color: '#DB2777',
    bg: '#FFE7F2',
  },
  {
    title: 'Akıllı filtreleme',
    description:
      'Veterinerler; mesafe, puan, açık olma durumu ve hizmet türüne göre filtrelenebilecek.',
    icon: SlidersHorizontal,
    color: '#6D5CE7',
    bg: '#F1ECFF',
  },
  {
    title: 'Mesafeye göre sıralama',
    description:
      'Veterinerler tek tuşla en yakından en uzağa doğru sıralanabilecek.',
    icon: ArrowDownUp,
    color: '#059669',
    bg: '#E7FAF2',
  },
  {
    title: 'Hızlı yol tarifi',
    description:
      'Seçilen veteriner için harita üzerinden kolayca yol tarifi alınabilecek.',
    icon: Navigation,
    color: '#D97706',
    bg: '#FFF4D6',
  },
];

export default function UpcomingFeaturesScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIconBox}>
            <MapPin size={34} color="#FFFFFF" strokeWidth={2.4} />
          </View>

          <View style={styles.heroBadge}>
            <Sparkles size={13} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.heroBadgeText}>Yakında</Text>
          </View>
        </View>

        <Text style={styles.title}>Harita ve Veteriner Keşfi</Text>

        <Text style={styles.subtitle}>
          PetCare’e eklenecek harita özelliği sayesinde kullanıcılar anlık
          konumlarını görebilecek, çevrelerindeki veterinerleri keşfedebilecek
          ve ihtiyaçlarına göre hızlıca filtreleme yapabilecek.
        </Text>
      </View>

      <View style={styles.mapPreviewCard}>
        <View style={styles.mapHeader}>
          <View>
            <Text style={styles.mapTitle}>Veteriner haritası</Text>
            <Text style={styles.mapSubtitle}>Konumuna en yakın klinikler</Text>
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Canlı</Text>
          </View>
        </View>

        <View style={styles.fakeMap}>
          <View style={[styles.mapPin, styles.pinOne]}>
            <Stethoscope size={15} color="#FFFFFF" strokeWidth={2.5} />
          </View>

          <View style={[styles.mapPin, styles.pinTwo]}>
            <Stethoscope size={15} color="#FFFFFF" strokeWidth={2.5} />
          </View>

          <View style={[styles.mapPin, styles.pinThree]}>
            <Stethoscope size={15} color="#FFFFFF" strokeWidth={2.5} />
          </View>

          <View style={styles.userLocation}>
            <MapPin size={18} color="#FFFFFF" strokeWidth={2.7} />
          </View>

          <View style={styles.mapLineOne} />
          <View style={styles.mapLineTwo} />
          <View style={styles.mapCircle} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Planlanan Özellikler</Text>
        <Text style={styles.sectionSubtitle}>
          Harita deneyimini güçlendirecek geliştirmeler
        </Text>
      </View>

      {features.map((item, index) => {
        const Icon = item.icon;

        return (
          <View key={index} style={styles.featureCard}>
            <View style={[styles.iconBox, {backgroundColor: item.bg}]}>
              <Icon size={21} color={item.color} strokeWidth={2.4} />
            </View>

            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDescription}>
                {item.description}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <CheckCircle2 size={13} color="#6D5CE7" strokeWidth={2.4} />
              <Text style={styles.statusText}>Plan</Text>
            </View>
          </View>
        );
      })}

      <View style={styles.bottomCard}>
        <View style={styles.bottomIconBox}>
          <Navigation size={22} color="#6D5CE7" strokeWidth={2.4} />
        </View>

        <View style={styles.bottomTextWrap}>
          <Text style={styles.bottomTitle}>Tek ekrandan hızlı erişim</Text>
          <Text style={styles.bottomText}>
            Amaç; kullanıcıların acil veya rutin veteriner ihtiyaçlarında en
            yakın ve en uygun kliniğe hızlıca ulaşmasını sağlamak.
          </Text>
        </View>
      </View>
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
    paddingBottom: 44,
  },

  heroCard: {
    backgroundColor: '#6D5CE7',
    borderRadius: 30,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroIconBox: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#EFEFFF',
    lineHeight: 22,
    fontWeight: '500',
  },

  mapPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F2F7',
    elevation: 2,
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 5},
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#18181B',
    letterSpacing: -0.3,
  },
  mapSubtitle: {
    fontSize: 13,
    color: '#7A8190',
    fontWeight: '600',
    marginTop: 3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E7FAF2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#059669',
  },
  liveText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '900',
  },

  fakeMap: {
    height: 190,
    borderRadius: 24,
    backgroundColor: '#EEF3FF',
    overflow: 'hidden',
    position: 'relative',
  },
  mapLineOne: {
    position: 'absolute',
    width: 260,
    height: 32,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.65)',
    top: 58,
    left: -20,
    transform: [{rotate: '-18deg'}],
  },
  mapLineTwo: {
    position: 'absolute',
    width: 260,
    height: 28,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.5)',
    bottom: 48,
    right: -50,
    transform: [{rotate: '21deg'}],
  },
  mapCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 100,
    backgroundColor: 'rgba(109,92,231,0.08)',
    right: -28,
    top: -24,
  },
  mapPin: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DB2777',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#111827',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },
  pinOne: {
    left: 46,
    top: 44,
  },
  pinTwo: {
    right: 52,
    top: 64,
  },
  pinThree: {
    left: 118,
    bottom: 38,
  },
  userLocation: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6D5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    left: '50%',
    top: '50%',
    marginLeft: -22,
    marginTop: -22,
    zIndex: 6,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },

  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#18181B',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#7A8190',
    fontWeight: '600',
  },

  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
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
  featureTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  featureTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3EEFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D5CE7',
  },

  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#F0F2F7',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bottomIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F1ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bottomTextWrap: {
    flex: 1,
  },
  bottomTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#18181B',
    marginBottom: 6,
  },
  bottomText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '500',
  },
});