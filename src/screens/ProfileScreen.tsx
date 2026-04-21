import React from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable} from 'react-native';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  HeartPulse,
  Lock,
  Mail,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import {usePets} from '../data/PetContext';

type PetLike = {
  name?: string;
  type?: string;
  animal?: string;
  species?: string;
  age?: string | number;
  vaccines?: string;
};

export default function ProfileScreen() {
  const {pets} = usePets();

  const petList = (pets || []) as PetLike[];
  const lastPet = petList.length > 0 ? petList[petList.length - 1] : null;

  const getPetTypeLabel = (pet: PetLike | null) => {
    if (!pet) return 'Pet';
    return pet.type || pet.animal || pet.species || 'Pet';
  };

  const getPetEmoji = (petType?: string) => {
    const key = (petType || '').toLowerCase().trim();

    if (
      key.includes('dog') ||
      key.includes('köpek') ||
      key.includes('kopek')
    ) {
      return '🐶';
    }
    if (key.includes('cat') || key.includes('kedi')) {
      return '🐱';
    }
    if (
      key.includes('rabbit') ||
      key.includes('tavşan') ||
      key.includes('tavsan')
    ) {
      return '🐰';
    }
    if (key.includes('bird') || key.includes('kuş') || key.includes('kus')) {
      return '🐦';
    }
    if (key.includes('fish') || key.includes('balık') || key.includes('balik')) {
      return '🐠';
    }
    if (key.includes('hamster')) {
      return '🐹';
    }
    if (
      key.includes('turtle') ||
      key.includes('kaplumbağa') ||
      key.includes('kaplumbaga')
    ) {
      return '🐢';
    }

    return '🐾';
  };

  const renderMenuItem = (
    icon: React.ReactNode,
    iconBg: string,
    title: string,
    subtitle?: string,
  ) => (
    <Pressable style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <View style={[styles.menuIconBox, {backgroundColor: iconBg}]}>
          {icon}
        </View>

        <View style={styles.menuTextWrap}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <ChevronRight size={18} color="#A1A1AA" strokeWidth={2.2} />
    </Pressable>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarInner}>
            <PawPrint size={28} color="#6D5CE7" strokeWidth={2.2} />
          </View>
        </View>

        <View style={styles.profileTextArea}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Pet Lover</Text>
          </View>

          <Text style={styles.name}>PetCare User</Text>

          <View style={styles.emailRow}>
            <Mail size={14} color="#6D5CE7" strokeWidth={2.2} />
            <Text style={styles.email}>user@petcare.app</Text>
          </View>

          <Text style={styles.profileDescription}>
            Dostunu düzenli ve güvenli şekilde yönet.
          </Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Ayarlar</Text>

        {renderMenuItem(
          <Bell size={18} color="#D97706" strokeWidth={2.2} />,
          '#FFF4D6',
          'Bildirimler',
          'Hatırlatma ve bakım uyarıları',
        )}

        {renderMenuItem(
          <Lock size={18} color="#2563EB" strokeWidth={2.2} />,
          '#EAF2FF',
          'Gizlilik',
          'Veri ve uygulama tercihleri',
        )}

        {renderMenuItem(
          <CircleHelp size={18} color="#6D5CE7" strokeWidth={2.2} />,
          '#F1ECFF',
          'Yardım Merkezi',
          'Sık sorulan sorular ve destek',
        )}

        {renderMenuItem(
          <HeartPulse size={18} color="#DB2777" strokeWidth={2.2} />,
          '#FFE7F2',
          'Geri Bildirim',
          'Görüşlerini bizimle paylaş',
        )}
      </View>

      <View style={[styles.menuSection, styles.lastMenuSection]}>
        <Text style={styles.sectionTitle}>Uygulama</Text>

        {renderMenuItem(
          <ShieldCheck size={18} color="#059669" strokeWidth={2.2} />,
          '#E7FAF2',
          'PetCare Hakkında',
          'Uygulama bilgileri',
        )}

        {renderMenuItem(
          <Sparkles size={18} color="#6D5CE7" strokeWidth={2.2} />,
          '#F1ECFF',
          'Yakında Gelecek Özellikler',
          'Yeni eklenecek geliştirmeler',
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
    backgroundColor: '#F7F8FC',
  },

  profileHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    borderWidth: 1,
    borderColor: '#F0F2F7',
  },
  avatarWrap: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInner: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextArea: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3EEFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D5CE7',
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#6D5CE7',
    fontWeight: '700',
  },
  profileDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#707788',
    fontWeight: '500',
  },

  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  lastPetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    elevation: 1,
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    borderWidth: 1,
    borderColor: '#F0F2F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastPetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lastPetAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EEF9F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  lastPetEmoji: {
    fontSize: 26,
  },
  lastPetTextWrap: {
    flex: 1,
  },
  lastPetTopLabel: {
    fontSize: 12,
    color: '#8B92A3',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  lastPetName: {
    fontSize: 18,
    color: '#18181B',
    fontWeight: '800',
    marginBottom: 2,
  },
  lastPetMeta: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    borderWidth: 1,
    borderColor: '#F0F2F7',
  },
  lastMenuSection: {
    marginBottom: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  menuTitle: {
    fontSize: 16,
    color: '#18181B',
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 18,
  },
});