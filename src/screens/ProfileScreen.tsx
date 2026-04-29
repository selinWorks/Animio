import React from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {
  Bell,
  ChevronRight,
  CircleHelp,
  HeartPulse,
  Lock,
  LogOut,
  Mail,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';

import {useAuth} from '../data/AuthContext';
import type {RootStackParamList} from '../navigation/AppNavigator';
type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const {user, logout} = useAuth();
  const navigation = useNavigation<ProfileNavigationProp>();
  const renderMenuItem = (
    icon: React.ReactNode,
    iconBg: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
  ) => (
    <Pressable
      style={({pressed}) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}>
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
            <Text style={styles.badgeText}>Dost Sever</Text>
          </View>

          <Text style={styles.name}>PetCare User</Text>

          <View style={styles.emailRow}>
            <Mail size={14} color="#6D5CE7" strokeWidth={2.2} />
            <Text style={styles.email}>
              {user?.email || 'user@petcare.app'}
            </Text>
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

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Uygulama</Text>

        {renderMenuItem(
          <ShieldCheck size={18} color="#059669" strokeWidth={2.2} />,
          '#E7FAF2',
          'PetCare Hakkında',
          'Uygulama bilgileri',
          () => navigation.navigate('AboutApp'),
        )}

        {renderMenuItem(
          <Sparkles size={18} color="#6D5CE7" strokeWidth={2.2} />,
          '#F1ECFF',
          'Yakında Gelecek Özellikler',
          'Yeni eklenecek geliştirmeler',
          () => navigation.navigate('UpcomingFeatures'),
        )}
      </View>

      <Pressable
        style={({pressed}) => [
          styles.logoutButton,
          pressed && styles.menuItemPressed,
        ]}
        onPress={logout}>
        <View style={styles.logoutIconBox}>
          <LogOut size={19} color="#DC2626" strokeWidth={2.4} />
        </View>

        <View style={styles.logoutTextWrap}>
          <Text style={styles.logoutTitle}>Çıkış Yap</Text>
          <Text style={styles.logoutSubtitle}>Hesabından güvenli şekilde çık</Text>
        </View>
      </Pressable>
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

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 12,
    letterSpacing: -0.3,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuItemPressed: {
    opacity: 0.65,
    transform: [{scale: 0.99}],
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

  logoutButton: {
    backgroundColor: '#FFF1F2',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoutTextWrap: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
  },
  logoutSubtitle: {
    fontSize: 13,
    color: '#991B1B',
    marginTop: 3,
    fontWeight: '500',
  },
});