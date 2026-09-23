import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';

import {
  ArrowLeft,
  Mail,
  KeyRound,
  Copy,
  Check,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react-native';

import Clipboard from '@react-native-clipboard/clipboard';

import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/AppNavigator';
import {useAuth} from '../data/AuthContext';
import {createPetInvitation} from '../services/firestore';

import {Pet} from '../types/Pet';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type Props = {
  route: {
    params: {
      pet: Pet;
    };
  };
};

type ModalType = 'success' | 'error' | 'info';

type AppModalState = {
  visible: boolean;
  type: ModalType;
  title: string;
  message: string;
  buttonText?: string;
};

export default function PetInviteScreen({
  route,
}: Props) {
  const navigation =
    useNavigation<NavigationProp>();

  const {user} = useAuth();

  const {pet} = route.params;

  const [email, setEmail] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [inviteCode, setInviteCode] =
    useState('');

  const [copied, setCopied] =
    useState(false);

  const [modal, setModal] =
    useState<AppModalState>({
      visible: false,
      type: 'info',
      title: '',
      message: '',
      buttonText: 'Tamam',
    });

  const showModal = (
    type: ModalType,
    title: string,
    message: string,
    buttonText = 'Tamam',
  ) => {
    setModal({
      visible: true,
      type,
      title,
      message,
      buttonText,
    });
  };

  const closeModal = () => {
    setModal(prev => ({
      ...prev,
      visible: false,
    }));
  };

  const handleCreateInvitation =
    async () => {
      const normalizedEmail =
        email.trim().toLowerCase();

      if (!normalizedEmail) {
        showModal(
          'info',
          'E-posta Gerekli',
          'Lütfen davet etmek istediğin kişinin e-posta adresini gir.',
        );
        return;
      }

      if (!normalizedEmail.includes('@')) {
        showModal(
          'error',
          'Geçersiz E-posta',
          'Lütfen geçerli bir e-posta adresi gir.',
        );
        return;
      }

      if (!user?.uid) {
        showModal(
          'info',
          'Oturum Bulunamadı',
          'Davet oluşturmak için önce hesabına giriş yapmalısın.',
        );
        return;
      }

      try {
        setLoading(true);
        setCopied(false);

        const result =
          await createPetInvitation(
            pet,
            user.uid,
            normalizedEmail,
          );

        setInviteCode(
          result.code,
        );

        showModal(
          'success',
          'Davet Hazır 🎉',
          `${pet.name || 'Pet'} için davet kodu oluşturuldu. Bu kodu aile üyenle paylaşabilirsin.`,
          'Kodu Gör',
        );
      } catch (error) {
        console.log(
          'Davet oluşturma hatası:',
          error,
        );

        showModal(
          'error',
          'Davet Oluşturulamadı',
          'Davet oluşturulurken bir sorun oluştu. Lütfen tekrar dene.',
        );
      } finally {
        setLoading(false);
      }
    };

  const handleCopyCode = () => {
    if (!inviteCode) {
      return;
    }

    Clipboard.setString(
      inviteCode,
    );

    setCopied(true);

    showModal(
      'success',
      'Kod Kopyalandı',
      'Davet kodu panoya kopyalandı. Artık aile üyenle paylaşabilirsin.',
    );

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <View style={styles.screen}>

      {/* HEADER */}

      <View style={styles.header}>

        <Pressable
          style={({pressed}) => [
            styles.backButton,
            pressed &&
              styles.pressed,
          ]}
          onPress={() =>
            navigation.goBack()
          }>

          <ArrowLeft
            size={24}
            color="#5F4B8B"
            strokeWidth={2.1}
          />

        </Pressable>

        <Text style={styles.headerTitle}>
          Aile Üyesi Davet Et
        </Text>

        <View style={styles.headerSpacer} />

      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.content
          }>

          {/* PET INFO */}

          <View style={styles.petCard}>

            <View
              style={
                styles.petIconCircle
              }>

              <Text style={styles.petEmoji}>
                🐾
              </Text>

            </View>

            <View
              style={styles.petTextWrap}>

              <Text
                style={styles.petLabel}>
                Davet için pet
              </Text>

              <Text
                style={styles.petName}>
                {pet.name}
              </Text>

            </View>

          </View>

          {/* EXPLANATION */}

          <View style={styles.introCard}>

            <View
              style={
                styles.introIconCircle
              }>

              <Mail
                size={25}
                color="#8B6FC7"
                strokeWidth={2}
              />

            </View>

            <Text style={styles.introTitle}>
              Bir aile üyesini ekle
            </Text>

            <Text
              style={styles.introText}>
              Aile üyenin e-posta adresini
              gir. Ona özel bir davet kodu
              oluşturacağız.
            </Text>

          </View>

          {/* EMAIL */}

          <View style={styles.section}>

            <Text
              style={styles.inputLabel}>
              E-posta adresi
            </Text>

            <View
              style={styles.inputWrapper}>

              <Mail
                size={21}
                color="#8B80B8"
                strokeWidth={2}
              />

              <TextInput
                value={email}
                onChangeText={value => {
                  setEmail(value);
                  setInviteCode('');
                }}
                placeholder="ornek@mail.com"
                placeholderTextColor="#A9A5B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

            </View>

          </View>

          {/* CREATE BUTTON */}

          <Pressable
            style={({pressed}) => [
              styles.createButton,
              loading &&
                styles.createButtonDisabled,
              pressed &&
                styles.pressed,
            ]}
            onPress={
              handleCreateInvitation
            }
            disabled={loading}>

            <Mail
              size={21}
              color="#FFFFFF"
              strokeWidth={2}
            />

            <Text
              style={
                styles.createButtonText
              }>
              {loading
                ? 'Davet oluşturuluyor...'
                : 'Davet Oluştur'}
            </Text>

          </Pressable>

          {/* INVITE CODE */}

          {inviteCode ? (
            <View
              style={styles.codeCard}>

              <View
                style={
                  styles.codeIconCircle
                }>

                <KeyRound
                  size={25}
                  color="#8B6FC7"
                  strokeWidth={2}
                />

              </View>

              <Text
                style={styles.codeLabel}>
                Davet kodun
              </Text>

              <Text
                style={styles.codeText}>
                {inviteCode}
              </Text>

              <Text
                style={styles.codeDescription}>
                Bu kodu davet ettiğin aile
                üyesiyle paylaş.
              </Text>

              <Pressable
                style={({pressed}) => [
                  styles.copyButton,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={
                  handleCopyCode
                }>

                {copied ? (
                  <Check
                    size={19}
                    color="#FFFFFF"
                    strokeWidth={2.5}
                  />
                ) : (
                  <Copy
                    size={19}
                    color="#FFFFFF"
                    strokeWidth={2}
                  />
                )}

                <Text
                  style={
                    styles.copyButtonText
                  }>
                  {copied
                    ? 'Kopyalandı'
                    : 'Kodu Kopyala'}
                </Text>

              </Pressable>

            </View>
          ) : null}

          {/* INFO */}

          <View style={styles.infoBox}>

            <View style={styles.infoIcon}>
              <Info
                size={18}
                color="#8B6FC7"
                strokeWidth={2}
              />
            </View>

            <View style={styles.infoContent}>

              <Text
                style={styles.infoTitle}>
                Nasıl çalışır?
              </Text>

              <Text
                style={styles.infoText}>
                1. Aile üyesinin e-posta adresini
                gir.
              </Text>

              <Text
                style={styles.infoText}>
                2. Oluşturulan 6 haneli kodu
                paylaş.
              </Text>

              <Text
                style={styles.infoText}>
                3. Aile üyesi bu kodla pet
                profiline katılır.
              </Text>

            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* CUSTOM MODAL */}

      <Modal
        visible={modal.visible}
        transparent
        animationType="fade"
        onRequestClose={
          closeModal
        }>

        <View
          style={styles.modalOverlay}>

          <Pressable
            style={
              StyleSheet.absoluteFill
            }
            onPress={
              closeModal
            }
          />

          <View
            style={styles.modalCard}>

            {/* MODAL ICON */}

            <View
              style={[
                styles.modalIcon,
                modal.type ===
                  'success' &&
                  styles.modalIconSuccess,
                modal.type ===
                  'error' &&
                  styles.modalIconError,
                modal.type ===
                  'info' &&
                  styles.modalIconInfo,
              ]}>

              {modal.type ===
              'success' ? (
                <CheckCircle2
                  size={30}
                  color="#8B6FC7"
                  strokeWidth={2.2}
                />
              ) : modal.type ===
                'error' ? (
                <XCircle
                  size={30}
                  color="#A47791"
                  strokeWidth={2.2}
                />
              ) : (
                <AlertCircle
                  size={30}
                  color="#8B6FC7"
                  strokeWidth={2.2}
                />
              )}

            </View>

            {/* CLOSE */}

            <Pressable
              style={({pressed}) => [
                styles.modalClose,
                pressed &&
                  styles.modalClosePressed,
              ]}
              onPress={
                closeModal
              }>

              <XCircle
                size={19}
                color="#A79BB5"
                strokeWidth={1.8}
              />

            </Pressable>

            {/* TITLE */}

            <Text
              style={styles.modalTitle}>
              {modal.title}
            </Text>

            {/* MESSAGE */}

            <Text
              style={styles.modalMessage}>
              {modal.message}
            </Text>

            {/* BUTTON */}

            <Pressable
              style={({pressed}) => [
                styles.modalButton,
                pressed &&
                  styles.modalButtonPressed,
              ]}
              onPress={
                closeModal
              }>

              <Text
                style={
                  styles.modalButtonText
                }>
                {modal.buttonText ||
                  'Tamam'}
              </Text>

            </Pressable>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },

  flex: {
    flex: 1,
  },

  header: {
    height: 92,
    paddingTop: 40,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF7',
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F0EBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Quicksand-Bold',
    fontSize: 18,
    color: '#4C3B69',
  },

  headerSpacer: {
    width: 46,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  petCard: {
    backgroundColor: '#F0ECFF',
    borderRadius: 24,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  petIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E2DBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  petEmoji: {
    fontSize: 25,
  },

  petTextWrap: {
    marginLeft: 13,
    flex: 1,
  },

  petLabel: {
    fontFamily: 'Quicksand-Medium',
    color: '#716A92',
    fontSize: 12,
    marginBottom: 2,
  },

  petName: {
    fontFamily: 'Quicksand-Bold',
    color: '#4C3B69',
    fontSize: 19,
  },

  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,

    shadowColor: '#4B4271',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  introIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: '#EEE7FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  introTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 19,
    color: '#4C3B69',
    marginBottom: 6,
  },

  introText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: '#7D7490',
  },

  section: {
    marginBottom: 14,
  },

  inputLabel: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 13,
    color: '#5A4C75',
    marginBottom: 8,
    marginLeft: 3,
  },

  inputWrapper: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E2F3',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Quicksand-Medium',
    fontSize: 15,
    color: '#4C3B69',
  },

  createButton: {
    height: 56,
    borderRadius: 19,
    backgroundColor: '#8B6FC7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 18,

    shadowColor: '#8B6FC7',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },

  createButtonDisabled: {
    opacity: 0.55,
  },

  createButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  codeCard: {
    backgroundColor: '#F2EEFF',
    borderRadius: 27,
    padding: 23,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E3DCFF',
  },

  codeIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: '#E5DFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  codeLabel: {
    fontFamily: 'Quicksand-Bold',
    color: '#655B88',
    fontSize: 13,
  },

  codeText: {
    marginTop: 5,
    fontFamily: 'Quicksand-Bold',
    fontSize: 34,
    letterSpacing: 5,
    color: '#5D48C9',
  },

  codeDescription: {
    marginTop: 8,
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: '#777294',
    textAlign: 'center',
  },

  copyButton: {
    marginTop: 16,
    height: 46,
    paddingHorizontal: 19,
    borderRadius: 16,
    backgroundColor: '#8B6FC7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  copyButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },

  infoBox: {
    backgroundColor: '#F3EFF9',
    borderRadius: 21,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#E8DFF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontFamily: 'Quicksand-Bold',
    color: '#5F4B8B',
    fontSize: 14,
    marginBottom: 9,
  },

  infoText: {
    fontFamily: 'Quicksand-Medium',
    color: '#8E839F',
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 3,
  },

  pressed: {
    opacity: 0.78,
    transform: [{scale: 0.985}],
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