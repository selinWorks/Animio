import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  KeyRound,
  PawPrint,
  CheckCircle2,
  Users,
  XCircle,
  Info,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';

import {useAuth} from '../data/AuthContext';
import {
  getPetInvitationByCode,
  acceptPetInvitation,
} from '../services/firestore';

import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type ModalType = 'success' | 'error' | 'info';

type AppModalState = {
  visible: boolean;
  type: ModalType;
  title: string;
  message: string;
  buttonText?: string;
  onClose?: () => void;
};

const PetJoinScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const {user} = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const [invitation, setInvitation] = useState<any>(null);

  const [modal, setModal] = useState<AppModalState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const normalizedCode = code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

  const showModal = (
    type: ModalType,
    title: string,
    message: string,
    onClose?: () => void,
    buttonText = 'Tamam',
  ) => {
    setModal({
      visible: true,
      type,
      title,
      message,
      buttonText,
      onClose,
    });
  };

  const closeModal = () => {
    const callback = modal.onClose;

    setModal(prev => ({
      ...prev,
      visible: false,
    }));

    if (callback) {
      setTimeout(() => {
        callback();
      }, 100);
    }
  };

  const handleCodeChange = (value: string) => {
    const formatted = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);

    setCode(formatted);
    setInvitation(null);
  };

  const handleCheckCode = async () => {
    if (normalizedCode.length !== 6) {
      showModal(
        'info',
        'Kod Eksik',
        'Lütfen 6 haneli davet kodunu eksiksiz şekilde gir.',
      );
      return;
    }

    try {
      setChecking(true);

      const result =
        await getPetInvitationByCode(normalizedCode);

      setInvitation(result);
    } catch (error: any) {
      setInvitation(null);

      showModal(
        'error',
        'Davet Bulunamadı',
        'Bu davet kodu geçersiz, süresi dolmuş veya artık kullanılamıyor.',
      );
    } finally {
      setChecking(false);
    }
  };

  const handleJoin = async () => {
    if (!user?.uid) {
      showModal(
        'info',
        'Oturum Gerekli',
        'Bu pet profiline katılmak için önce hesabına giriş yapmalısın.',
      );
      return;
    }

    if (!invitation) {
      await handleCheckCode();
      return;
    }

    try {
      setLoading(true);

      await acceptPetInvitation(
        normalizedCode,
        user.uid,
      );

      showModal(
        'success',
        'Katılım Başarılı 🎉',
        `${invitation.petName || 'Pet'} profiline artık erişebilirsin.`,
        () => {
          navigation.reset({
            index: 0,
            routes: [{name: 'MainTabs'}],
          });
        },
        'Petlere Git',
      );
    } catch (error: any) {
      const errorMessage =
        error?.message || '';

      const isPermissionError =
        errorMessage.includes('PERMISSION_DENIED') ||
        errorMessage.includes('permission-denied') ||
        errorMessage.includes('Missing or insufficient permissions');

      if (isPermissionError) {
        showModal(
          'info',
          'Zaten Katılmış Olabilirsin',
          `${invitation.petName || 'Bu pet'} profiline daha önce katılmış olabilirsin. Pet zaten hesabında görünüyorsa tekrar katılmana gerek yok.`,
        );
      } else if (
        errorMessage.toLowerCase().includes('daha önce') ||
        errorMessage.toLowerCase().includes('zaten')
      ) {
        showModal(
          'info',
          'Zaten Katıldın',
          `${invitation.petName || 'Bu pet'} profiline daha önce katılmışsın. Bu daveti tekrar kullanmana gerek yok.`,
        );
      } else {
        showModal(
          'error',
          'Katılım Başarısız',
          'Pet profiline katılırken bir sorun oluştu. Lütfen davet kodunu kontrol edip tekrar dene.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios' ? 'padding' : undefined
      }>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={({pressed}) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => navigation.goBack()}>
            <ArrowLeft
              size={22}
              color="#5F4B8B"
              strokeWidth={2.2}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Pet'e Katıl
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Users
              size={34}
              color="#8B6FC7"
              strokeWidth={2}
            />
          </View>

          <Text style={styles.heroTitle}>
            Aileyle Birlikte Takip Et
          </Text>

          <Text style={styles.heroDescription}>
            Bir aile üyesinden aldığın davet kodunu
            girerek pet profiline katılabilirsin.
          </Text>
        </View>

        {/* CODE CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <KeyRound
                size={20}
                color="#8B6FC7"
                strokeWidth={2}
              />
            </View>

            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>
                Davet Kodu
              </Text>

              <Text style={styles.cardDescription}>
                Sana gönderilen 6 haneli kodu gir.
              </Text>
            </View>
          </View>

          <TextInput
            value={code}
            onChangeText={handleCodeChange}
            placeholder="ABC123"
            placeholderTextColor="#B9B0C9"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={styles.codeInput}
            textAlign="center"
          />

          <Pressable
            style={({pressed}) => [
              styles.checkButton,
              normalizedCode.length !== 6 &&
                styles.disabledButton,
              pressed &&
                normalizedCode.length === 6 &&
                styles.buttonPressed,
            ]}
            onPress={handleCheckCode}
            disabled={
              checking || normalizedCode.length !== 6
            }>
            {checking ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <KeyRound
                  size={18}
                  color="#FFFFFF"
                  strokeWidth={2}
                />

                <Text style={styles.buttonText}>
                  Kodu Kontrol Et
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* INVITATION PREVIEW */}
        {invitation && (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <CheckCircle2
                size={24}
                color="#8B6FC7"
                strokeWidth={2}
              />
            </View>

            <View style={styles.successContent}>
              <Text style={styles.successTitle}>
                Davet Bulundu
              </Text>

              <Text style={styles.successDescription}>
                Bu davet aşağıdaki pet profiline ait:
              </Text>

              <View style={styles.petPreview}>
                <View style={styles.petIcon}>
                  <PawPrint
                    size={22}
                    color="#8B6FC7"
                    strokeWidth={2}
                  />
                </View>

                <View style={styles.petPreviewText}>
                  <Text style={styles.petName}>
                    {invitation.petName ||
                      'Pet Profili'}
                  </Text>

                  <Text style={styles.petInfo}>
                    Aile bakımına katılabilirsin
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* JOIN BUTTON */}
        {invitation && (
          <Pressable
            style={({pressed}) => [
              styles.joinButton,
              pressed && styles.joinButtonPressed,
            ]}
            onPress={handleJoin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Users
                  size={19}
                  color="#FFFFFF"
                  strokeWidth={2}
                />

                <Text style={styles.joinButtonText}>
                  Pet'e Katıl
                </Text>
              </>
            )}
          </Pressable>
        )}

        {/* INFO */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <PawPrint
              size={20}
              color="#8B6FC7"
              strokeWidth={2}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Nasıl çalışır?
            </Text>

            <Text style={styles.infoText}>
              Pet sahibi sana 6 haneli bir davet kodu
              gönderir. Kodu buraya girdiğinde pet
              profiline aile üyesi olarak katılırsın.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CUSTOM MODAL */}
      <Modal
        visible={modal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeModal}
          />

          <View style={styles.modalCard}>
            {/* MODAL ICON */}
            <View
              style={[
                styles.modalIcon,
                modal.type === 'success' &&
                  styles.modalIconSuccess,
                modal.type === 'error' &&
                  styles.modalIconError,
                modal.type === 'info' &&
                  styles.modalIconInfo,
              ]}>
              {modal.type === 'success' ? (
                <CheckCircle2
                  size={30}
                  color="#8B6FC7"
                  strokeWidth={2.2}
                />
              ) : modal.type === 'error' ? (
                <XCircle
                  size={30}
                  color="#9B79A8"
                  strokeWidth={2.2}
                />
              ) : (
                <Info
                  size={30}
                  color="#8B6FC7"
                  strokeWidth={2.2}
                />
              )}
            </View>

            {/* MODAL CLOSE */}
            <Pressable
              style={({pressed}) => [
                styles.modalClose,
                pressed && styles.modalClosePressed,
              ]}
              onPress={closeModal}>
              <XCircle
                size={19}
                color="#A79BB5"
                strokeWidth={1.8}
              />
            </Pressable>

            <Text style={styles.modalTitle}>
              {modal.title}
            </Text>

            <Text style={styles.modalMessage}>
              {modal.message}
            </Text>

            <Pressable
              style={({pressed}) => [
                styles.modalButton,
                pressed && styles.modalButtonPressed,
              ]}
              onPress={closeModal}>
              <Text style={styles.modalButtonText}>
                {modal.buttonText || 'Tamam'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default PetJoinScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F0EBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonPressed: {
    opacity: 0.72,
    transform: [{scale: 0.96}],
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    color: '#4C3B69',
  },

  headerSpacer: {
    width: 42,
  },

  hero: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 28,
  },

  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: '#EEE7FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  heroTitle: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#4C3B69',
    textAlign: 'center',
    marginBottom: 8,
  },

  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Quicksand-Medium',
    color: '#8D829E',
    textAlign: 'center',
    maxWidth: 330,
  },

  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#8B6FC7',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#F0EBFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontFamily: 'Quicksand-Bold',
    color: '#4C3B69',
    marginBottom: 3,
  },

  cardDescription: {
    fontSize: 13,
    fontFamily: 'Quicksand-Medium',
    color: '#9B91A8',
  },

  codeInput: {
    height: 62,
    borderRadius: 18,
    backgroundColor: '#F8F5FC',
    borderWidth: 1,
    borderColor: '#E8E0F3',
    fontSize: 25,
    letterSpacing: 7,
    fontFamily: 'Quicksand-Bold',
    color: '#5F4B8B',
    marginBottom: 14,
  },

  checkButton: {
    height: 54,
    borderRadius: 17,
    backgroundColor: '#8B6FC7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  disabledButton: {
    backgroundColor: '#CFC6DF',
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{scale: 0.985}],
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },

  successCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#F4F0FB',
    borderWidth: 1,
    borderColor: '#E6DDF3',
    flexDirection: 'row',
  },

  successIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E8DFF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  successContent: {
    flex: 1,
  },

  successTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#5F4B8B',
    marginBottom: 4,
  },

  successDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Quicksand-Medium',
    color: '#8E839F',
    marginBottom: 12,
  },

  petPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  petIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  petPreviewText: {
    flex: 1,
  },

  petName: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#4C3B69',
    marginBottom: 2,
  },

  petInfo: {
    fontSize: 12,
    fontFamily: 'Quicksand-Medium',
    color: '#9A90A6',
  },

  joinButton: {
    marginHorizontal: 20,
    marginTop: 14,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#8B6FC7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: '#8B6FC7',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },

  joinButtonPressed: {
    opacity: 0.84,
    transform: [{scale: 0.985}],
  },

  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },

  infoCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#F3EFF9',
    flexDirection: 'row',
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#E8DFF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    color: '#5F4B8B',
    marginBottom: 5,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Quicksand-Medium',
    color: '#8E839F',
  },

  /* =========================
     CUSTOM MODAL
  ========================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(62, 49, 82, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',

    shadowColor: '#4C3B69',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.16,
    shadowRadius: 25,
    elevation: 8,
  },

  modalIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  modalIconSuccess: {
    backgroundColor: '#EEE7FB',
  },

  modalIconError: {
    backgroundColor: '#F7ECF5',
  },

  modalIconInfo: {
    backgroundColor: '#EEE7FB',
  },

  modalClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F6F3F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalClosePressed: {
    opacity: 0.65,
    transform: [{scale: 0.92}],
  },

  modalTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    color: '#4C3B69',
    textAlign: 'center',
    marginBottom: 8,
  },

  modalMessage: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Quicksand-Medium',
    color: '#8D829E',
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 20,
  },

  modalButton: {
    width: '100%',
    height: 50,
    borderRadius: 17,
    backgroundColor: '#8B6FC7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalButtonPressed: {
    opacity: 0.82,
    transform: [{scale: 0.985}],
  },

  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },
});