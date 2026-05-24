import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
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
  X,
} from 'lucide-react-native';

import {useAuth} from '../data/AuthContext';
import type {RootStackParamList} from '../navigation/AppNavigator';

import {
  addFeedbackToFirestore,
  saveUserSettingsToFirestore,
  getUserSettingsFromFirestore,
} from '../services/firestore';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ModalPage = 'notifications' | 'privacy' | 'help' | 'feedback' | null;

export default function ProfileScreen() {
  const {user, logout} = useAuth();
  const navigation = useNavigation<ProfileNavigationProp>();

  const [activeModal, setActiveModal] = React.useState<ModalPage>(null);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [careReminder, setCareReminder] = React.useState(true);
  const [privateMode, setPrivateMode] = React.useState(false);
  const [aiDataUsage, setAiDataUsage] = React.useState(true);
  const [feedback, setFeedback] = React.useState('');

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!user?.uid) return;

        const settings = await getUserSettingsFromFirestore(user.uid);

        if (settings) {
          setNotificationsEnabled(settings.notificationsEnabled ?? true);
          setCareReminder(settings.careReminder ?? true);
          setPrivateMode(settings.privateMode ?? false);
          setAiDataUsage(settings.aiDataUsage ?? true);
        }
      } catch (error) {
        console.log('Ayarlar yüklenemedi:', error);
      }
    };

    loadSettings();
  }, [user?.uid]);

  const openModal = (page: Exclude<ModalPage, null>) => {
    setActiveModal(page);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const updateUserSetting = async (
    key:
      | 'notificationsEnabled'
      | 'careReminder'
      | 'privateMode'
      | 'aiDataUsage',
    value: boolean,
  ) => {
    try {
      if (!user?.uid) return;

      await saveUserSettingsToFirestore(user.uid, {
        [key]: value,
      });
    } catch (error) {
      console.log('Ayar kaydedilemedi:', error);
    }
  };

  const handleFeedbackSubmit = async () => {
  if (!feedback.trim()) {
    Alert.alert('Eksik bilgi', 'Lütfen geri bildiriminizi yazın.');
    return;
  }

  try {
    if (!user?.uid) {
      Alert.alert('Hata', 'Geri bildirim göndermek için giriş yapmalısın.');
      return;
    }

    await addFeedbackToFirestore(feedback.trim(), user.uid, user.email || '');

    Alert.alert('Teşekkürler', 'Geri bildirimin kaydedildi.');
    setFeedback('');
    closeModal();
  } catch (error: any) {
    console.log('Geri bildirim kaydedilemedi:', error);
    Alert.alert('Hata', error?.message || 'Geri bildirim gönderilemedi.');
  }
};

  const modalTitle = {
    notifications: 'Bildirimler',
    privacy: 'Gizlilik',
    help: 'Yardım Merkezi',
    feedback: 'Geri Bildirim',
  };

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

  const renderSwitchCard = (
    title: string,
    subtitle: string,
    value: boolean,
    onChange: (value: boolean) => void,
  ) => (
    <View style={styles.switchCard}>
      <View style={styles.switchTextWrap}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchSubtitle}>{subtitle}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: '#E5E7EB', true: '#C7D2FE'}}
        thumbColor={value ? '#6D5CE7' : '#FFFFFF'}
      />
    </View>
  );

  const renderInfoCard = (title: string, subtitle: string) => (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderModalContent = () => {
    if (activeModal === 'notifications') {
      return (
        <>
          <Text style={styles.modalDescription}>
            Petlerinin bakım, aşı ve kontrol süreçleri için bildirim tercihlerini
            buradan düzenleyebilirsin.
          </Text>

          {renderSwitchCard(
            'Bildirimleri Aç',
            'Uygulama içi bakım ve sağlık hatırlatmaları aktif olsun.',
            notificationsEnabled,
            value => {
              setNotificationsEnabled(value);
              updateUserSetting('notificationsEnabled', value);
            },
          )}

          {renderSwitchCard(
            'Bakım Hatırlatmaları',
            'Mama, temizlik ve düzenli bakım notlarını hatırlat.',
            careReminder,
            value => {
              setCareReminder(value);
              updateUserSetting('careReminder', value);
            },
          )}

          {renderInfoCard(
            'Not',
            'Bu ayarlar uygulama içinde kaydedilir. Telefonun sistem bildirim iznini otomatik açmaz.',
          )}
        </>
      );
    }

    if (activeModal === 'privacy') {
      return (
        <>
          <Text style={styles.modalDescription}>
            Hesap, gizlilik ve AI kullanım tercihlerini buradan yönetebilirsin.
          </Text>

          {renderSwitchCard(
            'Gizli Mod',
            'Profil ve pet bilgilerini daha sınırlı şekilde göster.',
            privateMode,
            value => {
              setPrivateMode(value);
              updateUserSetting('privateMode', value);
            },
          )}

          {renderSwitchCard(
            'AI Veri Kullanımı',
            'AI Assistant değerlendirmelerinde seçtiğin bilgileri kullanabilir.',
            aiDataUsage,
            value => {
              setAiDataUsage(value);
              updateUserSetting('aiDataUsage', value);
            },
          )}

          {renderInfoCard(
            'Veri Güvenliği',
            'Bu tercihler Firestore içinde kullanıcı hesabına bağlı olarak saklanır.',
          )}
        </>
      );
    }

    if (activeModal === 'help') {
      return (
        <>
          <Text style={styles.modalDescription}>
            PetCare kullanırken sık sorulan sorulara buradan ulaşabilirsin.
          </Text>

          {renderInfoCard(
            'Pet nasıl eklenir?',
            'Alt menüdeki Add sekmesinden yeni pet bilgilerini kaydedebilirsin.',
          )}

          {renderInfoCard(
            'AI Assistant ne işe yarar?',
            'Seçtiğin belirti ve durumlara göre ön değerlendirme sunar. Veteriner yerine geçmez.',
          )}

          {renderInfoCard(
            'Geri bildirim nereye gider?',
            'Gönderdiğin geri bildirim Firebase Firestore içindeki feedbacks koleksiyonuna kaydedilir.',
          )}
        </>
      );
    }

    if (activeModal === 'feedback') {
      return (
        <>
          <Text style={styles.modalDescription}>
            Uygulama hakkındaki görüşlerini, hata bildirimlerini veya geliştirme
            önerilerini yazabilirsin.
          </Text>

          <TextInput
            style={styles.feedbackInput}
            placeholder="Görüşünü buraya yaz..."
            placeholderTextColor="#A1A1AA"
            value={feedback}
            onChangeText={setFeedback}
            multiline
          />

          <Pressable
            style={({pressed}) => [
              styles.primaryButton,
              pressed && styles.menuItemPressed,
            ]}
            onPress={handleFeedbackSubmit}>
            <Text style={styles.primaryButtonText}>Gönder</Text>
          </Pressable>
        </>
      );
    }

    return null;
  };

  return (
    <>
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
              <Text style={styles.email}>{user?.email || 'user@petcare.app'}</Text>
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
            () => openModal('notifications'),
          )}

          {renderMenuItem(
            <Lock size={18} color="#2563EB" strokeWidth={2.2} />,
            '#EAF2FF',
            'Gizlilik',
            'Veri ve uygulama tercihleri',
            () => openModal('privacy'),
          )}

          {renderMenuItem(
            <CircleHelp size={18} color="#6D5CE7" strokeWidth={2.2} />,
            '#F1ECFF',
            'Yardım Merkezi',
            'Sık sorulan sorular ve destek',
            () => openModal('help'),
          )}

          {renderMenuItem(
            <HeartPulse size={18} color="#DB2777" strokeWidth={2.2} />,
            '#FFE7F2',
            'Geri Bildirim',
            'Görüşlerini bizimle paylaş',
            () => openModal('feedback'),
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
            <Text style={styles.logoutSubtitle}>
              Hesabından güvenli şekilde çık
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      <Modal
        visible={activeModal !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal ? modalTitle[activeModal] : ''}
              </Text>

              <Pressable style={styles.closeButton} onPress={closeModal}>
                <X size={20} color="#6B7280" strokeWidth={2.3} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {renderModalContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 24, 27, 0.35)',
  },
  modalSheet: {
    backgroundColor: '#F7F8FC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 26,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: '#F0F2F7',
  },
  modalHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D4D4D8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF0F5',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#707788',
    fontWeight: '500',
    marginBottom: 14,
  },
  switchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F2F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#707788',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F2F7',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 5,
  },
  infoSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#707788',
    fontWeight: '500',
  },
  feedbackInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    minHeight: 140,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#F0F2F7',
    fontSize: 14,
    color: '#18181B',
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#6D5CE7',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});