import React, {useCallback, useState} from 'react';

import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ArrowLeft,
  PawPrint,
  Users,
  UserRound,
  ShieldCheck,
  Trash2,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
  UserMinus,
  CheckCircle2,
  CircleX,
  X,
} from 'lucide-react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {useAuth} from '../data/AuthContext';
import {usePets} from '../data/PetContext';

import {
  getPetMembersForManagement,
  removePetMemberFromFirestore,
} from '../services/firestore';

import type {RootStackParamList} from '../navigation/AppNavigator';

type NavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type Member = {
  uid: string;
  email: string;
  isOwner: boolean;
};

const PURPLE = '#8067E8';
const DARK_PURPLE = '#4C3B69';

type FamilyModalType = 'warning' | 'confirm' | 'success' | 'error';

type FamilyModalConfig = {
    visible: boolean;
    type: FamilyModalType;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm?: () => void | Promise<void>;
  };

export default function FamilyManagementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {user} = useAuth();
  const {pets} = usePets();

  const [selectedPetId, setSelectedPetId] =
    useState<string | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingUid, setRemovingUid] =
    useState<string | null>(null);
  const [error, setError] = useState('');

  // Yalnızca mevcut kullanıcının yöneticisi olduğu dostlar.
  const managedPets = pets.filter(
    pet => !!user?.uid && pet.ownerId === user.uid,
  );

  const selectedPet = managedPets.find(
    pet => pet.id === selectedPetId,
  );

  const loadMembers = useCallback(async () => {
    if (!selectedPetId || !user?.uid) {
      setMembers([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await getPetMembersForManagement(
        selectedPetId,
        user.uid,
      );

      setMembers(Array.isArray(result) ? result : []);
    } catch (e: any) {
      console.error(
        '[AİLE ÜYELERİ YÜKLEME HATASI]',
        e?.code,
        e?.message,
        e,
      );

      setMembers([]);
      setError(
        e?.message || 'Üyeler yüklenirken bir sorun oluştu.',
      );
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers]),
  );



  const [familyModal, setFamilyModal] = useState<FamilyModalConfig>({
    visible: false,
    type: 'warning',
    title: '',
    message: '',
  });

  const closeFamilyModal = () => {
    setFamilyModal(prev => ({...prev, visible: false}));
  };

  const handleRemoveMember = (member: Member) => {
    if (!selectedPet || !user?.uid) {
      return;
    }

    if (member.isOwner || member.uid === user.uid) {
      setFamilyModal({
        visible: true,
        type: 'warning',
        title: 'İşlem yapılamıyor',
        message: 'Yönetici bu ekrandan kaldırılamaz.',
      });
      return;
    }

    setFamilyModal({
      visible: true,
      type: 'confirm',
      title: 'Aile üyesini kaldır',
      message: `${member.email || 'Bu kullanıcı'} yalnızca ${selectedPet.name} profilinden kaldırılacak. Devam etmek istiyor musun?`,
      confirmText: 'Üyeyi Kaldır',
      onConfirm: async () => {
        closeFamilyModal();

        try {
          setRemovingUid(member.uid);

          await removePetMemberFromFirestore(
            selectedPet.id,
            user.uid,
            member.uid,
          );

          await loadMembers();

          setFamilyModal({
            visible: true,
            type: 'success',
            title: 'İşlem tamamlandı',
            message:
              'Aile üyesinin bu dost profiline erişimi kaldırıldı.',
          });
        } catch (e: any) {
          setFamilyModal({
            visible: true,
            type: 'error',
            title: 'İşlem başarısız',
            message:
              e?.message ||
              'Üye kaldırılırken bir sorun oluştu.',
          });
        } finally {
          setRemovingUid(null);
        }
      },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (selectedPetId) {
              setSelectedPetId(null);
              setMembers([]);
              setError('');
            } else {
              navigation.goBack();
            }
          }}>
          <ArrowLeft size={23} color={DARK_PURPLE} />
        </Pressable>

        <Text style={styles.headerTitle}>
          Aile ve Üye Yönetimi
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {!selectedPetId ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Users size={32} color={PURPLE} />
              </View>

              <Text style={styles.heroTitle}>
                Aile üyelerini yönet
              </Text>

              <Text style={styles.heroText}>
                Yönetici olduğun dostu seçerek profilin
                aile üyelerini görüntüleyebilirsin.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              Yöneticisi olduğun dostlar
            </Text>

            {managedPets.length === 0 ? (
              <View style={styles.emptyCard}>
                <PawPrint size={30} color={PURPLE} />

                <Text style={styles.emptyTitle}>
                  Henüz yönetilen dost yok
                </Text>

                <Text style={styles.emptyText}>
                  Bu bölümde yalnızca yöneticisi olduğun
                  dostlar listelenir.
                </Text>
              </View>
            ) : (
              managedPets.map(pet => (
                <Pressable
                  key={pet.id}
                  style={({pressed}) => [
                    styles.petCard,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setSelectedPetId(pet.id)}>
                  <View style={styles.petIcon}>
                    <PawPrint size={24} color={PURPLE} />
                  </View>

                  <View style={styles.petText}>
                    <Text style={styles.petName}>
                      {pet.name || 'İsimsiz dost'}
                    </Text>

                    <Text style={styles.petSubtitle}>
                      {pet.type || 'Dost profili'} · Aile üyelerini gör
                    </Text>
                  </View>

                  <ChevronRight
                    size={21}
                    color="#9589AB"
                  />
                </Pressable>
              ))
            )}
          </>
        ) : (
          <>
            <View style={styles.selectedPetCard}>
              <View style={styles.petIcon}>
                <PawPrint size={25} color={PURPLE} />
              </View>

              <View style={styles.petText}>
                <Text style={styles.smallLabel}>
                  Seçili dost
                </Text>

                <Text style={styles.petName}>
                  {selectedPet?.name || 'Dost profili'}
                </Text>
              </View>
            </View>

            <View style={styles.memberHeading}>
              <View>
                <Text style={styles.sectionTitle}>
                  Aile üyeleri
                </Text>

                <Text style={styles.memberCount}>
                  {members.length} üye
                </Text>
              </View>

              <Pressable
                style={styles.refreshButton}
                onPress={loadMembers}
                disabled={loading}>
                <RefreshCw size={18} color={PURPLE} />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator
                  size="large"
                  color={PURPLE}
                />

                <Text style={styles.emptyText}>
                  Üyeler yükleniyor...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.emptyCard}>
                <Text style={styles.errorText}>
                  {error}
                </Text>

                <Pressable
                  style={styles.retryButton}
                  onPress={loadMembers}>
                  <Text style={styles.retryText}>
                    Tekrar Dene
                  </Text>
                </Pressable>
              </View>
            ) : members.length === 0 ? (
              <View style={styles.emptyCard}>
                <Users size={30} color={PURPLE} />

                <Text style={styles.emptyTitle}>
                  Üye bulunamadı
                </Text>
              </View>
            ) : (
              members.map(member => (
                <View
                  key={member.uid}
                  style={styles.memberCard}>
                  <View style={styles.memberIcon}>
                    {member.isOwner ? (
                      <ShieldCheck
                        size={22}
                        color={PURPLE}
                      />
                    ) : (
                      <UserRound
                        size={22}
                        color={PURPLE}
                      />
                    )}
                  </View>

                  <View style={styles.memberText}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>
                        {member.isOwner
                          ? 'Yönetici'
                          : member.email || 'Aile üyesi'}
                      </Text>

                      {member.uid === user?.uid && (
                        <View style={styles.selfBadge}>
                          <Text style={styles.selfBadgeText}>Sen</Text>
                        </View>
                      )}
                    </View>

                    {member.isOwner && (
                      <Text style={styles.ownerBadge}>
                        Dost sahibi
                      </Text>
                    )}
                  </View>

                  {!member.isOwner &&
                    member.uid !== user?.uid && (
                      <Pressable
                        style={styles.removeButton}
                        disabled={removingUid === member.uid}
                        onPress={() =>
                          handleRemoveMember(member)
                        }>
                        {removingUid === member.uid ? (
                          <ActivityIndicator
                            size="small"
                            color="#C2415D"
                          />
                        ) : (
                          <Trash2
                            size={19}
                            color="#C2415D"
                          />
                        )}
                      </Pressable>
                    )}
                </View>
              ))
            )}

            <View style={styles.infoBox}>
              <ShieldCheck size={20} color={PURPLE} />

              <Text style={styles.infoText}>
                Üye kaldırıldığında yalnızca bu dost
                profiline erişimi kaldırılır. Diğer
                dostların üyelikleri değişmez.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

    <Modal
      visible={familyModal.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeFamilyModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Pressable
            style={styles.modalCloseButton}
            onPress={closeFamilyModal}>
            <X size={19} color="#958AA8" />
          </Pressable>

          <View
            style={[
              styles.modalIconCircle,
              familyModal.type === 'warning' && styles.warningIconCircle,
              familyModal.type === 'confirm' && styles.confirmIconCircle,
              familyModal.type === 'success' && styles.successIconCircle,
              familyModal.type === 'error' && styles.errorIconCircle,
            ]}>
            {familyModal.type === 'warning' && (
              <ShieldAlert size={34} color="#D97757" />
            )}

            {familyModal.type === 'confirm' && (
              <UserMinus size={34} color="#8067E8" />
            )}

            {familyModal.type === 'success' && (
              <CheckCircle2 size={34} color="#24966A" />
            )}

            {familyModal.type === 'error' && (
              <CircleX size={34} color="#D9485F" />
            )}
          </View>

          <Text style={styles.modalTitle}>
            {familyModal.title}
          </Text>

          <Text style={styles.modalMessage}>
            {familyModal.message}
          </Text>

          {familyModal.type === 'confirm' ? (
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={closeFamilyModal}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </Pressable>

              <Pressable
                style={styles.modalConfirmButton}
                onPress={() => {
                  void familyModal.onConfirm?.();
                }}>
                <Text style={styles.modalConfirmText}>
                  {familyModal.confirmText || 'Onayla'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.modalOkButton}
              onPress={closeFamilyModal}>
              <Text style={styles.modalOkText}>Tamam</Text>
            </Pressable>
          )}
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
  header: {
    height: 92,
    paddingTop: 35,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF7',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#F0EBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Quicksand-Bold',
    fontSize: 17,
    color: DARK_PURPLE,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#F0ECFF',
    borderRadius: 25,
    padding: 22,
    marginBottom: 25,
  },
  heroIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: '#E2DBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  heroTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 20,
    color: DARK_PURPLE,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: '#766B91',
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 17,
    color: DARK_PURPLE,
    marginBottom: 5,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    padding: 15,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE8F8',
  },
  petIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: '#F0EBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petText: {
    flex: 1,
    marginLeft: 12,
  },
  petName: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    color: DARK_PURPLE,
  },
  petSubtitle: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: '#958AA8',
    marginTop: 4,
  },
  selectedPetCard: {
    backgroundColor: '#F0ECFF',
    borderRadius: 22,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  smallLabel: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: '#8A7DA7',
    marginBottom: 3,
  },
  memberHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberCount: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: '#9287A5',
    marginTop: 3,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F0EBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE8F8',
  },
  memberIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0EBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberText: {
    flex: 1,
    marginLeft: 11,
  },
  memberName: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: DARK_PURPLE,
  },
  ownerBadge: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 11,
    color: PURPLE,
    marginTop: 5,
  },
  removeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    color: DARK_PURPLE,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: '#958AA8',
    textAlign: 'center',
    marginTop: 8,
  },
  loading: {
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  pressed: {
    opacity: 0.8,
    transform: [{scale: 0.99}],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0ECFF',
    borderRadius: 18,
    padding: 15,
    gap: 10,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    lineHeight: 19,
    color: '#766B91',
  },
  errorText: {
    color: '#B42345',
    fontFamily: 'Quicksand-Medium',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F0EBFA',
  },
  retryText: {
    color: PURPLE,
    fontFamily: 'Quicksand-Bold',
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 30, 64, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EAFB',
    elevation: 12,
    shadowColor: '#453366',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 13,
    right: 13,
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#F6F3FB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  warningIconCircle: {
    backgroundColor: '#FFF0E8',
  },
  confirmIconCircle: {
    backgroundColor: '#F0EBFF',
  },
  successIconCircle: {
    backgroundColor: '#E5F8EE',
  },
  errorIconCircle: {
    backgroundColor: '#FFF0F2',
  },
  modalTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 19,
    color: '#4C3B69',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    lineHeight: 22,
    color: '#766B91',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: '#F3EFFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#766B91',
  },
  modalConfirmButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: '#C2415D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalOkButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: '#8067E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOkText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },

  selfBadge: {
    backgroundColor: '#F0EBFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  selfBadgeText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 10,
    color: '#8067E8',
  },
});