import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View,
} from 'react-native';
import type {ImageSourcePropType} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  ArrowLeft, PawPrint, Users, UserRound, ShieldCheck, Trash2,
  ChevronRight, RefreshCw, ShieldAlert, UserMinus, CheckCircle2,
  CircleX, X, UserPlus, Copy, Check, Share2, Mail, Info,
} from 'lucide-react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../data/AuthContext';
import {usePets} from '../data/PetContext';
import {
  getPetMembersForManagement, removePetMemberFromFirestore, createPetInvitation,
} from '../services/firestore';
import type {RootStackParamList} from '../navigation/AppNavigator';
import type {Pet} from '../types/Pet';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type Member = {uid: string; email: string; isOwner: boolean};
type FamilyModalType = 'warning' | 'confirm' | 'success' | 'error';
type FamilyModalConfig = {
  visible: boolean; type: FamilyModalType; title: string; message: string;
  confirmText?: string; onConfirm?: () => void | Promise<void>;
};
const PURPLE = '#7257E8';
const DARK_PURPLE = '#242137';

const defaultCatAvatar = require('../assets/images/pets/default-cat-pixel.png');
const defaultDogAvatar = require('../assets/images/pets/default-dog-pixel.png');
const defaultRabbitAvatar = require('../assets/images/pets/default-rabbit-pixel.png');
const defaultBirdAvatar = require('../assets/images/pets/default-bird-pixel.png');
const defaultHamsterAvatar = require('../assets/images/pets/default-hamster-pixel.png');
const defaultAmphibianAvatar = require('../assets/images/pets/default-amfibi-pixel-head.png');
const defaultCowAvatar = require('../assets/images/pets/default-cow-pixel.png');
const defaultReptileAvatar = require('../assets/images/pets/default-reptile-pixel.png');
const defaultFishAvatar = require('../assets/images/pets/default-fish-pixel.png');

function getPetAvatar(type?: string): ImageSourcePropType {
  const value = (type || '').toLocaleLowerCase('tr-TR').trim();

  if (
    ['kedi', 'cat', 'british shorthair', 'scottish fold', 'siyam',
      'iran kedisi', 'maine coon', 'ragdoll', 'van kedisi',
      'tekir', 'sfenks', 'bengal', 'birman', 'abyssinian']
      .some(name => value.includes(name))
  ) {
    return defaultCatAvatar;
  }

  if (
    ['köpek', 'kopek', 'dog', 'golden retriever',
      'labrador', 'alman kurdu', 'french bulldog', 'poodle',
      'chihuahua', 'beagle', 'husky', 'pomeranian',
      'rottweiler', 'cocker spaniel', 'dachshund',
      'maltese', 'shih tzu', 'border collie']
      .some(name => value.includes(name))
  ) {
    return defaultDogAvatar;
  }

  if (
    ['kuş', 'kus', 'bird', 'muhabbet', 'papağan', 'papagan',
      'kanarya', 'sultan papağanı', 'sevda papağanı',
      'ispinoz', 'güvercin', 'guvercin', 'serçe', 'bülbül',
      'hint bülbülü']
      .some(name => value.includes(name))
  ) {
    return defaultBirdAvatar;
  }

  if (
    ['balık', 'balik', 'fish', 'japon balığı', 'japon baligi',
      'beta', 'lepistes', 'melek balığı', 'koi',
      'çöpçü balığı', 'neon tetra', 'moli', 'plati']
      .some(name => value.includes(name))
  ) {
    return defaultFishAvatar;
  }

  if (
    ['kemirgen', 'hamster', 'kobay', 'çinçilla', 'cincilla',
      'fare', 'sıçan', 'sican', 'gerbil', 'sincap']
      .some(name => value.includes(name))
  ) {
    return defaultHamsterAvatar;
  }

  if (
    ['sürüngen', 'surungen', 'kaplumbağa', 'kaplumbaga',
      'yılan', 'yilan', 'kertenkele', 'iguana', 'geko',
      'sakallı ejder', 'bukalemun', 'örümcek', 'orumcek',
      'akrep', 'salyangoz', 'yengeç', 'yengec']
      .some(name => value.includes(name))
  ) {
    return defaultReptileAvatar;
  }

  if (
    ['amfibi', 'kurbağa', 'kurbaga', 'semender', 'aksolotl']
      .some(name => value.includes(name))
  ) {
    return defaultAmphibianAvatar;
  }

  if (
    ['çiftlik hayvanı', 'ciftlik hayvani', 'inek', 'koyun',
      'keçi', 'keci', 'ördek', 'ordek', 'tavuk', 'kaz',
      'manda', 'eşek', 'esek', 'deve', 'at']
      .some(name => value === name || value.startsWith(`${name} `))
  ) {
    return defaultCowAvatar;
  }

  if (
    ['tavşan', 'tavsan', 'rabbit', 'kirpi', 'gelincik']
      .some(name => value.includes(name))
  ) {
    return defaultRabbitAvatar;
  }

  return defaultCatAvatar;
}


// PetsScreen ile aynı görsel seçimi: profil fotoğrafı, yoksa türün varsayılan görseli.
function PetAvatar({pet, size = 40}: {pet: Pet; size?: number}) {
  const profile = pet as Pet & {photoUrl?: string; photoUri?: string};
  const uri = profile.photoUrl || profile.photoUri;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const usePhoto = !!uri && !failed;
  return (
    <View style={[styles.petAvatar, {width: size, height: size, borderRadius: size / 2}]}>
      <Image
        source={usePhoto ? {uri: uri!} : getPetAvatar(pet.type)}
        style={{width: '100%', height: '100%'}}
        resizeMode={usePhoto ? 'cover' : 'contain'}
        onError={usePhoto ? () => setFailed(true) : undefined}
      />
    </View>
  );
}

export default function FamilyManagementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'FamilyManagement'>>();
  const requestedPetId = route.params?.petId;
  const {user} = useAuth();
  const {pets} = usePets();
  const managedPets = pets.filter(pet => !!user?.uid && pet.ownerId === user.uid);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(requestedPetId ?? null);
  const selectedPet = managedPets.find(pet => pet.id === selectedPetId);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [familyModal, setFamilyModal] = useState<FamilyModalConfig>({
    visible: false, type: 'warning', title: '', message: '',
  });
  const [inviteVisible, setInviteVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [invites, setInvites] = useState<Record<string, {code: string; email: string}>>({});
  const requestId = useRef(0);
  const creatingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {mounted.current = true; return () => {mounted.current = false; requestId.current += 1;};}, []);
  const invitation = selectedPetId ? invites[selectedPetId] : undefined;

  useEffect(() => {
    if (requestedPetId && managedPets.some(pet => pet.id === requestedPetId)) {
      requestId.current += 1;
      setMembers([]); setLoading(true); setError('');
      setSelectedPetId(requestedPetId); setCopied(false);
    }
  }, [requestedPetId, user?.uid]);

  useEffect(() => {
    if (!managedPets.some(pet => pet.id === selectedPetId)) {
      setSelectedPetId(managedPets.find(pet => pet.id === requestedPetId)?.id ?? managedPets[0]?.id ?? null);
    }
  }, [pets, user?.uid, selectedPetId, requestedPetId]);
  useEffect(() => {setInvites({}); setEmail(''); setInviteVisible(false);}, [user?.uid]);

  const loadMembers = useCallback(async () => {
    const request = ++requestId.current;
    if (!selectedPetId || !user?.uid) {
      setMembers([]); setLoading(false); return;
    }
    setLoading(true); setError(''); setMembers([]);
    try {
      const result = await getPetMembersForManagement(selectedPetId, user.uid);
      if (mounted.current && request === requestId.current) setMembers(Array.isArray(result) ? result : []);
    } catch (e) {
      if (mounted.current && request === requestId.current) {
        setMembers([]); setError('Üyeler yüklenemedi. Lütfen tekrar dene.');
      }
    } finally {
      if (mounted.current && request === requestId.current) setLoading(false);
    }
  }, [selectedPetId, user?.uid]);
  useFocusEffect(useCallback(() => {
    void loadMembers();
    return () => {requestId.current += 1;};
  }, [loadMembers]));

  const closeFamilyModal = () => setFamilyModal(prev => ({...prev, visible: false}));
  const showMessage = (type: FamilyModalType, title: string, message: string) =>
    setFamilyModal({visible: true, type, title, message});
  const handleRemoveMember = (member: Member) => {
    if (!selectedPet || !user?.uid || removingUid) return;
    if (member.isOwner || member.uid === user.uid) {
      showMessage('warning', 'İşlem yapılamıyor', 'Yönetici bu ekrandan kaldırılamaz.'); return;
    }
    const petId = selectedPet.id;
    const ownerId = user.uid;
    setFamilyModal({visible: true, type: 'confirm', title: 'Aile üyesini kaldır',
      message: `${member.email || 'Bu kullanıcı'} yalnızca ${selectedPet.name} profilinden kaldırılacak. Devam etmek istiyor musun?`,
      confirmText: 'Üyeyi Kaldır', onConfirm: async () => {
        closeFamilyModal(); setRemovingUid(member.uid);
        try {
          await removePetMemberFromFirestore(petId, ownerId, member.uid);
          if (!mounted.current) return;
          await loadMembers();
          showMessage('success', 'İşlem tamamlandı', 'Üyenin bu dost profiline erişimi kaldırıldı.');
        } catch (e) {
          if (mounted.current) showMessage('error', 'İşlem başarısız', 'Üye kaldırılamadı. Lütfen tekrar dene.');
        } finally {if (mounted.current) setRemovingUid(null);}
      }});
  };
  const openInvite = () => {
    if (!selectedPet) return;
    if (creatingRef.current) {
      showMessage('warning', 'Davet hazırlanıyor', 'Mevcut davet işleminin tamamlanmasını bekle.');
      return;
    }
    closeFamilyModal();
    setEmail(''); setInviteError(''); setInviteVisible(true);
  };
  const createInvitation = async () => {
    if (!selectedPet || !user?.uid || creatingRef.current) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setInviteError('Geçerli bir e-posta adresi gir.'); return;
    }
    if (normalizedEmail === user.email?.toLowerCase()) {
      setInviteError('Kendi hesabını davet edemezsin.'); return;
    }
    const pet = selectedPet;
    creatingRef.current = true; setCreating(true); setInviteError('');
    try {
      const result = await createPetInvitation(pet, user.uid, normalizedEmail);
      if (!result?.code) throw new Error('Davet kodu alınamadı.');
      if (!mounted.current) return;
      setInvites(prev => ({...prev, [pet.id]: {code: result.code, email: normalizedEmail}}));
      setCopied(false); setInviteVisible(false);
    } catch (e) {
      if (mounted.current) setInviteError('Davet oluşturulamadı. Lütfen tekrar dene.');
    } finally {creatingRef.current = false; if (mounted.current) setCreating(false);}
  };
  const copyCode = () => {
    if (!invitation) return;
    Clipboard.setString(invitation.code); setCopied(true);
  };
  const shareCode = async () => {
    if (!invitation || !selectedPet) return;
    try {
      await Share.share({message: `${selectedPet.name} için Animio aile davet kodun: ${invitation.code}. Bu davet ${invitation.email} hesabı içindir.`});
    } catch (e) {showMessage('error', 'Paylaşılamadı', 'Davet kodunu kopyalayarak paylaşabilirsin.');}
  };
  const selectPet = (id: string) => {
    if (id === selectedPetId || removingUid || creating) return;
    requestId.current += 1; setMembers([]); setLoading(true); setError('');
    setSelectedPetId(id); setCopied(false); setInviteVisible(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Geri dön" onPress={() => navigation.goBack()}>
          <ArrowLeft size={25} color={DARK_PURPLE} />
        </Pressable>
        <Text style={styles.headerTitle}>Aile yönetimi</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {managedPets.length === 0 ? <View style={styles.emptyCard}>
          <PawPrint size={32} color={PURPLE} /><Text style={styles.emptyTitle}>Henüz yönetilen dost yok</Text>
          <Text style={styles.emptyText}>Burada yalnızca yöneticisi olduğun dostlar görünür.</Text>
        </View> : <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petSwitcher}>
            {managedPets.map(pet => {
              const active = pet.id === selectedPetId;
              return <Pressable key={pet.id} accessibilityRole="button" accessibilityState={{selected: active, disabled: !!removingUid || creating}}
                disabled={!!removingUid || creating} onPress={() => selectPet(pet.id)}
                style={({pressed}) => [styles.petTab, active && styles.petTabActive, pressed && styles.pressed]}>
                <Text numberOfLines={1} style={[styles.petTabText, active && styles.petTabTextActive]}>{pet.name || 'Dost'}</Text>
              </Pressable>;
            })}
          </ScrollView>
          {selectedPet && <>
            <View style={styles.petContext}>
              <PetAvatar pet={selectedPet} size={64} />
              <View style={styles.contextText}>
                <Text style={styles.contextTitle}>{selectedPet.name || 'Dost'}’un ailesi</Text>
                <Text style={styles.contextSubtitle}>{selectedPet.type || 'Dost profili'}</Text>
              </View>
              <View style={styles.familyIcon}><Users size={25} color="#44A58A" /></View>
            </View>
            <Text style={styles.contextCaption}>Bakımını birlikte üstlenin.</Text>
            <View style={styles.memberHeading}>
              <Text style={styles.sectionTitle}>Aile üyeleri</Text>
              <View style={styles.headingActions}>
                {error ? <Pressable style={styles.iconButton} onPress={loadMembers} accessibilityLabel="Üyeleri yenile"><RefreshCw size={17} color={PURPLE} /></Pressable> : null}
                <View style={styles.countBadge}><Text style={styles.countText}>{loading || error ? '—' : members.length}</Text></View>
              </View>
            </View>
            <View style={styles.membersCard}>
              {loading ? <View style={styles.stateBox}><ActivityIndicator color={PURPLE} /><Text style={styles.emptyText}>Üyeler yükleniyor...</Text></View>
                : error ? <View style={styles.stateBox}><Text style={styles.errorText}>{error}</Text><Pressable onPress={loadMembers} style={styles.retryButton}><Text style={styles.retryText}>Tekrar dene</Text></Pressable></View>
                : members.length === 0 ? <View style={styles.stateBox}><Users size={25} color={PURPLE} /><Text style={styles.emptyText}>Üye bulunamadı</Text></View>
                : members.map((member, index) => <View key={member.uid} style={[styles.memberRow, index > 0 && styles.memberDivider]}>
                  <View style={styles.memberAvatar}><UserRound size={25} color={PURPLE} /></View>
                  <View style={styles.memberText}>
                    <Text style={styles.memberName} numberOfLines={2}>{member.uid === user?.uid ? 'Sen' : member.email || 'Aile üyesi'}</Text>
                  </View>
                  {member.isOwner ? <View style={styles.roleBadge}><Text style={styles.roleText}>Yönetici</Text></View>
                    : member.uid !== user?.uid ? <Pressable disabled={!!removingUid} style={styles.removeButton}
                      accessibilityLabel={`${member.email || 'Aile üyesini'} kaldır`} onPress={() => handleRemoveMember(member)}>
                      {removingUid === member.uid ? <ActivityIndicator color="#C2415D" /> : <Trash2 size={18} color="#C2415D" />}
                    </Pressable> : null}
                </View>)}
              <View style={styles.permissionRow}><ShieldCheck size={18} color="#85879D" /><Text style={styles.permissionText}>Üyeleri ve erişimleri yönetebilirsin.</Text></View>
            </View>
            <Pressable style={({pressed}) => [styles.inviteCard, pressed && styles.pressed]} onPress={openInvite} accessibilityRole="button">
              <View style={styles.inviteIcon}><UserPlus size={26} color={PURPLE} /></View>
              <View style={styles.inviteText}><Text style={styles.inviteTitle}>Aileni davet et</Text><Text style={styles.inviteSubtitle}>{selectedPet.name}’un bakımını birlikte takip edin.</Text></View>
              <ChevronRight size={21} color="#818299" />
            </Pressable>
            <View style={styles.howItWorksCard}>
              <View style={styles.howItWorksIcon}><Info size={17} color={PURPLE} strokeWidth={1.7} /></View>
              <View style={styles.howItWorksContent}>
                <Text style={styles.howItWorksTitle}>Nasıl çalışır?</Text>
                <Text style={styles.howItWorksStep}>1. Aile üyesinin e-posta adresini gir.</Text>
                <Text style={styles.howItWorksStep}>2. Oluşturulan 6 haneli kodu paylaş.</Text>
                <Text style={styles.howItWorksStep}>3. Aile üyesi bu kodla pet profiline katılır.</Text>
              </View>
            </View>
            {invitation && <>
            <Text style={[styles.sectionTitle, styles.codeHeading]}>Davet kodu</Text>
            <View style={styles.codeCard}>
              <Text style={styles.codeCaption}>Bu kodu davet ettiğin aile üyenle paylaş.</Text>
              <View style={styles.codeDisplay}><Text selectable style={styles.codeValue}>{invitation.code}</Text><Text style={styles.codeEmail}>{invitation.email}</Text></View>
              <View style={styles.codeActions}>
                <Pressable style={styles.secondaryButton} onPress={copyCode} accessibilityRole="button">
                  {copied ? <Check size={21} color={PURPLE} /> : <Copy size={21} color={PURPLE} />}
                  <Text style={styles.secondaryText}>{copied ? 'Kopyalandı' : 'Kodu kopyala'}</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={shareCode} accessibilityRole="button"><Share2 size={21} color={PURPLE} /><Text style={styles.secondaryText}>Paylaş</Text></Pressable>
              </View>
            </View>
            </>}
            <View style={styles.note}><ShieldCheck size={19} color="#85879D" /><Text style={styles.noteText}>Davet ettiğin kişiler yalnızca {selectedPet.name}’un ailesine katılır.</Text></View>
          </>}
        </>}
      </ScrollView>
      {inviteVisible && <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={() => {if (!creating) setInviteVisible(false);}}>
        <KeyboardAvoidingView style={styles.inviteOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => {if (!creating) setInviteVisible(false);}} />
          <SafeAreaView edges={['bottom']} style={styles.inviteSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Aile üyesi davet et</Text><Pressable disabled={creating} style={styles.iconButton} onPress={() => setInviteVisible(false)} accessibilityLabel="Davet ekranını kapat"><X size={22} color="#85879D" /></Pressable></View>
            <Text style={styles.sheetSubtitle}>{selectedPet?.name} için davet edeceğin kişinin e-posta adresini gir.</Text>
            <Text style={styles.fieldLabel}>E-posta adresi</Text>
            <View style={styles.emailField}><Mail size={19} color="#9392A7" /><TextInput style={styles.emailInput} value={email}
              onChangeText={text => {setEmail(text); setInviteError('');}} placeholder="ornek@eposta.com" placeholderTextColor="#AAA7B8"
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!creating} returnKeyType="done" onSubmitEditing={createInvitation} /></View>
            {!!inviteError && <Text style={styles.inlineError}>{inviteError}</Text>}
            <Pressable disabled={creating} style={[styles.sheetSubmit, creating && {opacity: 0.7}]} onPress={createInvitation}>
              {creating ? <ActivityIndicator color="#FFFFFF" /> : <UserPlus size={20} color="#FFFFFF" />}
              <Text style={styles.primaryText}>{creating ? 'Oluşturuluyor...' : 'Davet oluştur'}</Text>
            </Pressable>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>}
    {familyModal.visible && <Modal
      visible
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
    </Modal>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  howItWorksCard: {flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: '#F2EEF9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 16, marginTop: 15},
  howItWorksIcon: {width: 30, height: 30, borderRadius: 15, backgroundColor: '#EAE3FA', alignItems: 'center', justifyContent: 'center'},
  howItWorksContent: {flex: 1},
  howItWorksTitle: {fontFamily: 'Quicksand-SemiBold', fontSize: 13, color: '#4C3B69', marginBottom: 7},
  howItWorksStep: {fontFamily: 'Quicksand-Medium', fontSize: 11, lineHeight: 18, color: '#958AA8'},

  screen: {flex: 1, backgroundColor: '#F7F7FC'},
  header: {height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  iconButton: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  headerSpacer: {width: 44},
  headerTitle: {flex: 1, textAlign: 'center', fontFamily: 'Quicksand-Bold', fontSize: 21, color: DARK_PURPLE},
  content: {paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8},
  petSwitcher: {flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 4},
  petTab: {minWidth: 88, maxWidth: 180, height: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9E7F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  petTabActive: {backgroundColor: '#EFEBFF', borderColor: '#8A6CFF'},
  petTabText: {flexShrink: 1, fontFamily: 'Quicksand-Bold', fontSize: 14, color: '#747389'},
  petTabTextActive: {color: '#332566'},
  petAvatar: {backgroundColor: '#F2EEFF', overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  petContext: {flexDirection: 'row', alignItems: 'center', marginTop: 22},
  contextText: {flex: 1, marginLeft: 13},
  contextTitle: {fontFamily: 'Quicksand-Bold', fontSize: 22, color: DARK_PURPLE},
  contextSubtitle: {fontFamily: 'Quicksand-Medium', fontSize: 14, color: '#9090A6', marginTop: 3},
  familyIcon: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#E4F4EE', alignItems: 'center', justifyContent: 'center', marginLeft: 8},
  contextCaption: {fontFamily: 'Quicksand-Medium', fontSize: 14, color: '#9291A8', marginTop: 12},
  memberHeading: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12},
  sectionTitle: {fontFamily: 'Quicksand-Bold', fontSize: 18, color: DARK_PURPLE},
  headingActions: {flexDirection: 'row', alignItems: 'center'},
  countBadge: {minWidth: 28, height: 28, borderRadius: 14, backgroundColor: '#ECE9F8', paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center'},
  countText: {fontFamily: 'Quicksand-Bold', color: '#5B449A', fontSize: 13},
  membersCard: {backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 15, shadowColor: '#544479', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.035, shadowRadius: 12, elevation: 1},
  memberRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minHeight: 66},
  memberDivider: {borderTopWidth: 1, borderTopColor: '#F0EEF6'},
  memberAvatar: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8FF', alignItems: 'center', justifyContent: 'center'},
  memberText: {flex: 1, marginLeft: 12, marginRight: 8},
  memberName: {fontFamily: 'Quicksand-Bold', fontSize: 15, color: DARK_PURPLE},
  memberSubtitle: {fontFamily: 'Quicksand-Medium', fontSize: 12, color: '#9190A6', marginTop: 4},
  roleBadge: {backgroundColor: '#F0ECFF', borderRadius: 13, paddingHorizontal: 10, paddingVertical: 6},
  roleText: {fontFamily: 'Quicksand-SemiBold', fontSize: 11, color: PURPLE},
  removeButton: {width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF0F2', alignItems: 'center', justifyContent: 'center'},
  permissionRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EFEDF6'},
  permissionText: {flex: 1, fontFamily: 'Quicksand-Medium', fontSize: 12, color: '#9190A6'},
  inviteCard: {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#9A83F6', borderRadius: 16, padding: 13, marginTop: 18, backgroundColor: '#FDFCFF'},
  inviteIcon: {width: 47, height: 47, borderRadius: 24, backgroundColor: '#EFEBFF', alignItems: 'center', justifyContent: 'center'},
  inviteText: {flex: 1, marginLeft: 12, marginRight: 5},
  inviteTitle: {fontFamily: 'Quicksand-Bold', fontSize: 16, color: DARK_PURPLE},
  inviteSubtitle: {fontFamily: 'Quicksand-Medium', fontSize: 12, lineHeight: 17, color: '#9391A7', marginTop: 4},
  codeHeading: {marginTop: 25, marginBottom: 12},
  codeCard: {backgroundColor: '#FFFFFF', borderRadius: 18, padding: 15},
  codeCaption: {fontFamily: 'Quicksand-Medium', fontSize: 13, lineHeight: 19, color: '#88869D'},
  codeActions: {flexDirection: 'row', gap: 10, marginTop: 16},
  secondaryButton: {flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 5, borderRadius: 12, backgroundColor: '#F3EFFF'},
  secondaryText: {fontFamily: 'Quicksand-Bold', color: PURPLE, fontSize: 12},
  codeDisplay: {backgroundColor: '#FAF8FF', padding: 12, borderRadius: 12, marginTop: 12},
  codeValue: {fontFamily: 'Quicksand-Bold', color: PURPLE, fontSize: 22, letterSpacing: 2},
  codeEmail: {fontFamily: 'Quicksand-Medium', color: '#88869D', fontSize: 12, marginTop: 4},
  note: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 18, marginBottom: 12},
  noteText: {flex: 1, fontFamily: 'Quicksand-Medium', fontSize: 11.5, lineHeight: 17, color: '#9391A7'},
  primaryText: {fontFamily: 'Quicksand-Bold', fontSize: 16, color: '#FFFFFF'},
  pressed: {opacity: 0.8},
  emptyCard: {backgroundColor: '#FFFFFF', padding: 25, borderRadius: 18, alignItems: 'center', marginTop: 15},
  emptyTitle: {fontFamily: 'Quicksand-Bold', fontSize: 17, color: DARK_PURPLE, marginTop: 12},
  emptyText: {fontFamily: 'Quicksand-Medium', fontSize: 13, lineHeight: 20, color: '#9391A7', textAlign: 'center', marginTop: 8},
  stateBox: {paddingVertical: 24, alignItems: 'center'},
  errorText: {fontFamily: 'Quicksand-Medium', fontSize: 13, color: '#B42345', textAlign: 'center'},
  retryButton: {backgroundColor: '#F0EBFF', borderRadius: 10, padding: 12, marginTop: 10},
  retryText: {fontFamily: 'Quicksand-Bold', color: PURPLE},
  inviteOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(35,30,58,0.4)'},
  inviteSheet: {backgroundColor: '#FFFFFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20},
  sheetHandle: {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#DDD8E9', marginBottom: 10},
  sheetHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  sheetTitle: {fontFamily: 'Quicksand-Bold', fontSize: 19, color: DARK_PURPLE},
  sheetSubtitle: {fontFamily: 'Quicksand-Medium', fontSize: 13, lineHeight: 20, color: '#9391A7', marginTop: 5},
  fieldLabel: {fontFamily: 'Quicksand-Bold', fontSize: 12, color: DARK_PURPLE, marginTop: 20, marginBottom: 8},
  emailField: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5DFF4', borderRadius: 13, backgroundColor: '#FBFAFE'},
  emailInput: {flex: 1, minHeight: 49, fontFamily: 'Quicksand-Medium', fontSize: 14, color: DARK_PURPLE},
  inlineError: {fontFamily: 'Quicksand-Medium', color: '#C2415D', fontSize: 12, marginTop: 8},
  sheetSubmit: {minHeight: 51, borderRadius: 14, backgroundColor: PURPLE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20},
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


});
