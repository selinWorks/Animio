
import React, {useCallback, useState} from 'react';

import {
  ActivityIndicator,
  Alert,
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

  const handleRemoveMember = (member: Member) => {
    if (!selectedPet || !user?.uid) {
      return;
    }

    if (member.isOwner || member.uid === user.uid) {
      Alert.alert(
        'İşlem yapılamıyor',
        'Yönetici bu ekrandan kaldırılamaz.',
      );
      return;
    }

    Alert.alert(
      'Aile üyesini kaldır',
      `${member.email || 'Bu kullanıcı'} yalnızca ${selectedPet.name} profilinden kaldırılacak. Devam etmek istiyor musun?`,
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'Üyeyi Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingUid(member.uid);

              await removePetMemberFromFirestore(
                selectedPet.id,
                user.uid,
                member.uid,
              );

              await loadMembers();

              Alert.alert(
                'İşlem tamamlandı',
                'Aile üyesinin bu dost profiline erişimi kaldırıldı.',
              );
            } catch (e: any) {
              Alert.alert(
                'İşlem başarısız',
                e?.message ||
                  'Üye kaldırılırken bir sorun oluştu.',
              );
            } finally {
              setRemovingUid(null);
            }
          },
        },
      ],
    );
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
                    <Text style={styles.memberName}>
                      {member.isOwner
                        ? 'Yönetici'
                        : member.email || 'Aile üyesi'}
                    </Text>

                    <Text
                      style={styles.memberUid}
                      numberOfLines={1}>
                      {member.email
                        ? member.uid
                        : `Kullanıcı ID: ${member.uid}`}
                    </Text>

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
  memberUid: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 10,
    color: '#958AA8',
    marginTop: 4,
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
});