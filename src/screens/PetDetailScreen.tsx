import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  Easing,
  Image,
  StatusBar,
} from 'react-native';

import {RouteProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {
  Activity,
  BarChart3,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  NotebookPen,
  Pencil,
  Scale,
  Trash2,
  Venus,
} from 'lucide-react-native';

import {RootStackParamList} from '../navigation/AppNavigator';
import {usePets} from '../data/PetContext';

/* =========================================================
   IMAGES
========================================================= */

/* HERO / BANNER IMAGES */

const petDetailCatHero = require(
  '../assets/images/pets/pet-detail-cat-hero.png',
);

const petDetailDogHero = require(
  '../assets/images/pets/pet-detail-dog-hero.png',
);

const petDetailBirdHero = require(
  '../assets/images/pets/pet-detail-bird-hero.png',
);

const petDetailHamsterHero = require(
  '../assets/images/pets/pet-detail-hamster-hero.png',
);

const petDetailRabbitHero = require(
  '../assets/images/pets/pet-detail-rabbit-hero.png',
);

/* DEFAULT AVATARS */

const defaultCatAvatar = require(
  '../assets/images/pets/default-cat-pixel.png',
);

const defaultDogAvatar = require(
  '../assets/images/pets/default-dog-pixel.png',
);

const defaultRabbitAvatar = require(
  '../assets/images/pets/default-rabbit-pixel.png',
);

const defaultBirdAvatar = require(
  '../assets/images/pets/default-bird-pixel.png',
);

const defaultHamsterAvatar = require(
  '../assets/images/pets/default-hamster-pixel.png',
);

const defaultOtherAvatar = require(
  '../assets/images/pets/default-other-pixel.png',
);

/* =========================================================
   TYPES
========================================================= */

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PetDetail'
>;

type PetDetailRouteProp = RouteProp<
  RootStackParamList,
  'PetDetail'
>;

type PetDetailScreenProps = {
  route: PetDetailRouteProp;
};

type InfoRowProps = {
  label: string;
  value: string;
  last?: boolean;
};

type SmallNavigationCardProps = {
  title: string;
  subtitle: string;
  backgroundColor: string;
  iconBackground: string;
  icon: React.ReactNode;
  onPress?: () => void;
};

/* =========================================================
   HELPERS
========================================================= */

function normalizePetType(type: string) {
  return (type || '')
    .toLocaleLowerCase('tr-TR')
    .trim();
}

function getPetEmoji(type: string) {
  const lowerType = normalizePetType(type);

  if (lowerType.includes('kedi')) {
    return '🐱';
  }

  if (
    lowerType.includes('köpek') ||
    lowerType.includes('kopek')
  ) {
    return '🐶';
  }

  if (
    lowerType.includes('kuş') ||
    lowerType.includes('kus')
  ) {
    return '🐦';
  }

  if (
    lowerType.includes('balık') ||
    lowerType.includes('balik')
  ) {
    return '🐠';
  }

  if (lowerType.includes('hamster')) {
    return '🐹';
  }

  if (
    lowerType.includes('tavşan') ||
    lowerType.includes('tavsan')
  ) {
    return '🐰';
  }

  if (
    lowerType.includes('kaplumbağa') ||
    lowerType.includes('kaplumbaga')
  ) {
    return '🐢';
  }

  return '🐾';
}

/*
 * Kullanıcının kendi fotoğrafı yoksa
 * hayvan türüne göre gösterilecek default pixel avatar.
 */
function getDefaultPetAvatar(type: string) {
  const lowerType = normalizePetType(type);

  /* KEDİ */

  if (lowerType.includes('kedi')) {
    return defaultCatAvatar;
  }

  /* KÖPEK */

  if (
    lowerType.includes('köpek') ||
    lowerType.includes('kopek')
  ) {
    return defaultDogAvatar;
  }

  /* TAVŞAN */

  if (
    lowerType.includes('tavşan') ||
    lowerType.includes('tavsan')
  ) {
    return defaultRabbitAvatar;
  }

  /* KUŞ */

  if (
    lowerType.includes('kuş') ||
    lowerType.includes('kus')
  ) {
    return defaultBirdAvatar;
  }

  /* HAMSTER */

  if (lowerType.includes('hamster')) {
    return defaultHamsterAvatar;
  }

  /* DİĞER */

  if (
    lowerType.includes('diğer') ||
    lowerType.includes('diger') ||
    lowerType.includes('other')
  ) {
    return defaultOtherAvatar;
  }

  /*
   * Balık, kaplumbağa veya ileride eklenebilecek
   * tanımlanmamış türler için nötr avatar.
   */
  return defaultOtherAvatar;
}

/*
 * Hayvan türüne göre Pet Detail ekranında
 * gösterilecek hero/banner görseli.
 */
function getPetHero(type: string) {
  const lowerType = normalizePetType(type);

  /* KEDİ */

  if (lowerType.includes('kedi')) {
    return petDetailCatHero;
  }

  /* KÖPEK */

  if (
    lowerType.includes('köpek') ||
    lowerType.includes('kopek')
  ) {
    return petDetailDogHero;
  }

  /* KUŞ */

  if (
    lowerType.includes('kuş') ||
    lowerType.includes('kus')
  ) {
    return petDetailBirdHero;
  }

  /* HAMSTER */

  if (lowerType.includes('hamster')) {
    return petDetailHamsterHero;
  }

  /* TAVŞAN */

  if (
    lowerType.includes('tavşan') ||
    lowerType.includes('tavsan')
  ) {
    return petDetailRabbitHero;
  }

  /*
   * Balık, kaplumbağa, diğer veya ileride
   * eklenecek türlerde geçici varsayılan hero.
   */
  return petDetailCatHero;
}

function getStatusLabel(pet: {
  vaccines?: string;
  lastVetVisit?: string;
}) {
  if (pet.vaccines && pet.lastVetVisit) {
    return 'Aktif';
  }

  if (pet.vaccines || pet.lastVetVisit) {
    return 'Takipte';
  }

  return 'Yeni';
}

function getVaccineStatus(vaccines?: string) {
  return vaccines ? 'Güncel' : 'Eksik';
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function InfoRow({
  label,
  value,
  last = false,
}: InfoRowProps) {
  return (
    <View
      style={[
        styles.infoRow,
        last && styles.infoRowLast,
      ]}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={styles.infoValue}
        numberOfLines={1}
        ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
}

function SmallNavigationCard({
  title,
  subtitle,
  backgroundColor,
  iconBackground,
  icon,
  onPress,
}: SmallNavigationCardProps) {
  return (
    <Pressable
      style={({pressed}) => [
        styles.smallNavCard,
        {backgroundColor},
        pressed && styles.pressedCard,
      ]}
      onPress={onPress}>

      <View
        style={[
          styles.smallNavIcon,
          {backgroundColor: iconBackground},
        ]}>
        {icon}
      </View>

      <View style={styles.smallNavTextWrap}>
        <Text style={styles.smallNavTitle}>
          {title}
        </Text>

        <Text
          style={styles.smallNavSubtitle}
          numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <ChevronRight
        size={24}
        color="#263E73"
        strokeWidth={2.2}
      />
    </Pressable>
  );
}

/* =========================================================
   SCREEN
========================================================= */

export default function PetDetailScreen({
  route,
}: PetDetailScreenProps) {
  const {pet} = route.params;

  const navigation =
    useNavigation<NavigationProp>();

  const {removePet} = usePets();

  const [
    deleteModalVisible,
    setDeleteModalVisible,
  ] = useState(false);

  const screenOpacity =
    useRef(new Animated.Value(0)).current;

  const screenTranslateY =
    useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(screenTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenOpacity, screenTranslateY]);

  const handleDelete = () => {
    removePet(pet.id);

    setDeleteModalVisible(false);

    navigation.goBack();
  };

  const vaccineStatus =
    getVaccineStatus(pet.vaccines);

  const statusLabel =
    getStatusLabel(pet);

  return (
    <View style={styles.screen}>

      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <Animated.View
        style={[
          styles.animatedScreen,
          {
            opacity: screenOpacity,
            transform: [
              {
                translateY:
                  screenTranslateY,
              },
            ],
          },
        ]}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
          bounces={false}>

          {/* =====================================================
              HERO
          ===================================================== */}

          <View style={styles.hero}>

            <Image
              source={getPetHero(pet.type)}
              style={styles.heroImage}
              resizeMode="cover"
            />

            <View
              style={styles.heroSoftOverlay}
            />

            <View style={styles.heroTopBar}>

              <Pressable
                style={({pressed}) => [
                  styles.circleButton,
                  pressed &&
                    styles.topButtonPressed,
                ]}
                onPress={() =>
                  navigation.goBack()
                }>

                <ChevronLeft
                  size={28}
                  color="#263E73"
                  strokeWidth={2}
                />

              </Pressable>

              <Pressable
                style={({pressed}) => [
                  styles.editTopButton,
                  pressed &&
                    styles.topButtonPressed,
                ]}
                onPress={() =>
                  navigation.navigate(
                    'EditPet',
                    {pet},
                  )
                }>

                <Pencil
                  size={20}
                  color="#355497"
                  strokeWidth={2}
                />

                <Text
                  style={
                    styles.editTopButtonText
                  }>
                  Düzenle
                </Text>

              </Pressable>

            </View>
          </View>

          {/* =====================================================
              PROFILE
          ===================================================== */}

          <View style={styles.profileSection}>

            <View
              style={styles.profileAvatarArea}>

              <View style={styles.avatarOuter}>

                <Image
                  source={getDefaultPetAvatar(
                    pet.type,
                  )}
                  style={[
                    styles.avatarImage,
                    (
                      normalizePetType(pet.type).includes('diğer') ||
                      normalizePetType(pet.type).includes('diger') ||
                      normalizePetType(pet.type).includes('other')
                    ) && styles.otherAvatarImage,
                  ]}
                  resizeMode="cover"
                />

              </View>

              <Pressable
                style={styles.cameraButton}>

                <Camera
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={2.2}
                />

              </Pressable>

            </View>

            <View
              style={styles.profileTextArea}>

              <View style={styles.nameRow}>

                <Text
                  style={styles.petName}
                  numberOfLines={1}>
                  {pet.name}
                </Text>

              </View>

              <Text style={styles.petMeta}>
                {getPetEmoji(pet.type)}{' '}
                {pet.type}
                {'  |  '}
                {pet.age} yaş
                {'  |  '}
                {pet.weight || '-'}
              </Text>

            </View>
          </View>

          {/* =====================================================
              QUICK STATS
          ===================================================== */}

          <View style={styles.quickStatsRow}>

            <View
              style={[
                styles.quickStatCard,
                styles.genderStatCard,
              ]}>

              <View
                style={[
                  styles.statIconCircle,
                  styles.genderIconCircle,
                ]}>

                <Venus
                  size={25}
                  color="#F04478"
                  strokeWidth={2}
                />

              </View>

              <View>
                <Text style={styles.statLabel}>
                  Cinsiyet
                </Text>

                <Text style={styles.statValue}>
                  {pet.gender || 'Belirsiz'}
                </Text>
              </View>

            </View>

            <View
              style={[
                styles.quickStatCard,
                styles.weightStatCard,
              ]}>

              <View
                style={[
                  styles.statIconCircle,
                  styles.weightIconCircle,
                ]}>

                <Scale
                  size={24}
                  color="#15A96A"
                  strokeWidth={2}
                />

              </View>

              <View>
                <Text style={styles.statLabel}>
                  Kilo
                </Text>

                <Text style={styles.statValue}>
                  {pet.weight || '-'}
                </Text>
              </View>

            </View>

            <View
              style={[
                styles.quickStatCard,
                styles.statusStatCard,
              ]}>

              <View
                style={[
                  styles.statIconCircle,
                  styles.statusIconCircle,
                ]}>

                <Activity
                  size={25}
                  color="#168DE2"
                  strokeWidth={2}
                />

              </View>

              <View>
                <Text style={styles.statLabel}>
                  Durum
                </Text>

                <Text style={styles.statValue}>
                  {statusLabel}
                </Text>
              </View>

            </View>

          </View>

          {/* =====================================================
              GENERAL + HEALTH
          ===================================================== */}

          <View style={styles.twoColumnRow}>

            {/* GENERAL */}

            <View
              style={[
                styles.largeCard,
                styles.generalCard,
              ]}>

              <View style={styles.cardHeader}>

                <View
                  style={styles.cardHeaderLeft}>

                  <View
                    style={[
                      styles.cardIconCircle,
                      styles.generalIconCircle,
                    ]}>

                    <FileText
                      size={24}
                      color="#7655F5"
                      strokeWidth={2}
                    />

                  </View>

                  <Text style={styles.cardTitle}>
                    Genel Bilgiler
                  </Text>

                </View>

                <ChevronRight
                  size={23}
                  color="#172C59"
                  strokeWidth={2.2}
                />

              </View>

              <InfoRow
                label="Tür"
                value={pet.type || '-'}
              />

              <InfoRow
                label="Yaş"
                value={`${pet.age || '-'} yaş`}
              />

              <InfoRow
                label="Cinsiyet"
                value={
                  pet.gender ||
                  'Belirtilmedi'
                }
                last
              />

            </View>

            {/* HEALTH */}

            <Pressable
              style={({pressed}) => [
                styles.largeCard,
                styles.healthCard,
                pressed &&
                  styles.pressedCard,
              ]}>

              <View style={styles.cardHeader}>

                <View
                  style={styles.cardHeaderLeft}>

                  <View
                    style={[
                      styles.cardIconCircle,
                      styles.healthIconCircle,
                    ]}>

                    <Heart
                      size={24}
                      color="#F04C73"
                      strokeWidth={2}
                    />

                  </View>

                  <Text style={styles.cardTitle}>
                    Sağlık Geçmişi
                  </Text>

                </View>

                <ChevronRight
                  size={23}
                  color="#172C59"
                  strokeWidth={2.2}
                />

              </View>

              <InfoRow
                label="Son Veteriner"
                value={
                  pet.lastVetVisit ||
                  'Eklenmedi'
                }
              />

              <InfoRow
                label="Aşı Bilgisi"
                value={
                  pet.vaccines ||
                  'Eklenmedi'
                }
              />

              <View
                style={
                  styles.vaccineStatusRow
                }>

                <Text style={styles.infoLabel}>
                  Aşı Durumu
                </Text>

                <View
                  style={
                    styles.vaccineStatusRight
                  }>

                  <Text
                    style={styles.infoValue}>
                    {vaccineStatus}
                  </Text>

                  {pet.vaccines ? (
                    <View
                      style={
                        styles.checkCircle
                      }>

                      <Check
                        size={14}
                        color="#FFFFFF"
                        strokeWidth={3}
                      />

                    </View>
                  ) : null}

                </View>
              </View>

              <View
                style={styles.viewAllButton}>

                <Text
                  style={styles.viewAllText}>
                  Tümünü Gör
                </Text>

                <ChevronRight
                  size={20}
                  color="#C9203D"
                  strokeWidth={2.3}
                />

              </View>

            </Pressable>
          </View>

          {/* =====================================================
              TRACKING NAVIGATION
          ===================================================== */}

          <View
            style={
              styles.navigationCardsRow
            }>

            <SmallNavigationCard
              title="Kilo Takibi"
              subtitle={`${pet.name}’un gelişimini takip et`}
              backgroundColor="#F0EFFF"
              iconBackground="#E5E1FF"
              icon={
                <BarChart3
                  size={26}
                  color="#6552EE"
                  strokeWidth={2}
                />
              }
            />

            <SmallNavigationCard
              title="Hatırlatmalar"
              subtitle="Yaklaşan bakım görevleri"
              backgroundColor="#E9FAF0"
              iconBackground="#D9F5E6"
              icon={
                <CalendarDays
                  size={26}
                  color="#13A968"
                  strokeWidth={2}
                />
              }
            />

          </View>

          {/* =====================================================
              NOTES
          ===================================================== */}

          <Pressable
            style={({pressed}) => [
              styles.notesCard,
              pressed &&
                styles.pressedCard,
            ]}>

            <View
              style={styles.notesIconCircle}>

              <NotebookPen
                size={25}
                color="#F47A19"
                strokeWidth={2}
              />

            </View>

            <View style={styles.notesContent}>

              <Text style={styles.notesTitle}>
                Notlar
              </Text>

              <Text
                style={styles.notesText}
                numberOfLines={2}>
                {pet.notes ||
                  'Bu dost için henüz not eklenmemiş.'}
              </Text>

            </View>

            <ChevronRight
              size={24}
              color="#172C59"
              strokeWidth={2.2}
            />

          </Pressable>

          {/* =====================================================
              ACTIONS
          ===================================================== */}

          <View style={styles.actionsRow}>

            <Pressable
              style={({pressed}) => [
                styles.deleteButton,
                pressed &&
                  styles.actionPressed,
              ]}
              onPress={() =>
                setDeleteModalVisible(true)
              }>

              <Trash2
                size={22}
                color="#E31B23"
                strokeWidth={2.2}
              />

              <Text
                style={
                  styles.deleteButtonText
                }>
                Profili Sil
              </Text>

            </Pressable>

            <Pressable
              style={({pressed}) => [
                styles.editButton,
                pressed &&
                  styles.actionPressed,
              ]}
              onPress={() =>
                navigation.navigate(
                  'EditPet',
                  {pet},
                )
              }>

              <Pencil
                size={22}
                color="#FFFFFF"
                strokeWidth={2.2}
              />

              <Text
                style={
                  styles.editButtonText
                }>
                Profili Düzenle
              </Text>

            </Pressable>

          </View>

        </ScrollView>
      </Animated.View>

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setDeleteModalVisible(false)
        }>

        <View style={styles.modalOverlay}>

          <View style={styles.modalCard}>

            <View
              style={styles.modalIconCircle}>

              <Trash2
                size={28}
                color="#A66AD4"
                strokeWidth={1.8}
              />

            </View>

            <Text style={styles.modalTitle}>
              Profili silmek istiyor musunuz?
            </Text>

            <Text
              style={styles.modalDescription}>
              {pet.name} için oluşturduğun profil
              silinecek. Bu işlem geri alınamaz.
            </Text>

            <View style={styles.modalButtons}>

              <Pressable
                style={({pressed}) => [
                  styles.cancelModalButton,
                  pressed &&
                    styles.actionPressed,
                ]}
                onPress={() =>
                  setDeleteModalVisible(false)
                }>

                <Text
                  style={styles.cancelModalText}>
                  Vazgeç
                </Text>

              </Pressable>

              <Pressable
                style={({pressed}) => [
                  styles.confirmDeleteButton,
                  pressed &&
                    styles.actionPressed,
                ]}
                onPress={handleDelete}>

                <Text
                  style={
                    styles.confirmDeleteText
                  }>
                  Sil
                </Text>

              </Pressable>

            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },

  animatedScreen: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 42,
  },

  /* HERO */

  hero: {
    height: 250,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F3EEFF',
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  heroSoftOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      'rgba(246,243,255,0.06)',
  },

  heroTopBar: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  circleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.90)',

    shadowColor: '#3D4770',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  editTopButton: {
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor:
      'rgba(255,255,255,0.92)',

    shadowColor: '#3D4770',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  editTopButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#23375F',
  },

  topButtonPressed: {
    opacity: 0.76,
    transform: [{scale: 0.97}],
  },

  /* PROFILE */

  profileSection: {
    minHeight: 110,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingBottom: 20,
  },

  profileAvatarArea: {
    width: 112,
    height: 112,
    marginTop: -48,
    position: 'relative',
    marginRight: 16,
  },

  avatarOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 5,
    borderColor: '#B9A8FF',
    overflow: 'hidden',

    shadowColor: '#7258C8',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  otherAvatarImage: {
    position: 'absolute',
    width: '135%',
    height: '135%',
    left: '-17.5%',
    top: '-19.5%',
  },

  cameraButton: {
    position: 'absolute',
    right: -2,
    bottom: 1,
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: '#8467F4',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#7356DF',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  profileTextArea: {
    flex: 1,
    paddingTop: 14,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  petName: {
    flexShrink: 1,
    fontSize: 30,
    fontWeight: '900',
    color: '#101D3D',
    letterSpacing: -0.8,
  },

  petMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#536997',
    fontWeight: '500',
  },

  quotePill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: 10,
    backgroundColor: '#F3EFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  quoteText: {
    flexShrink: 1,
    color: '#6974B3',
    fontSize: 12,
    fontWeight: '600',
  },

  /* QUICK STATS */

  quickStatsRow: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 18,
    marginTop: 4,
    marginBottom: 14,
  },

  quickStatCard: {
    flex: 1,
    minHeight: 86,
    borderRadius: 22,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,

    shadowColor: '#253659',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },

  genderStatCard: {
    backgroundColor: '#FFF0F4',
  },

  weightStatCard: {
    backgroundColor: '#EAFBF1',
  },

  statusStatCard: {
    backgroundColor: '#EAF6FF',
  },

  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  genderIconCircle: {
    backgroundColor: '#FFE0EA',
  },

  weightIconCircle: {
    backgroundColor: '#D9F6E6',
  },

  statusIconCircle: {
    backgroundColor: '#D9EEFF',
  },

  statLabel: {
    color: '#536991',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },

  statValue: {
    color: '#111C37',
    fontSize: 15,
    fontWeight: '800',
  },

  /* MAIN CARDS */

  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  largeCard: {
    flex: 1,
    minHeight: 245,
    borderRadius: 24,
    padding: 14,

    shadowColor: '#24345B',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 3,
  },

  generalCard: {
    backgroundColor: '#F5F0FF',
  },

  healthCard: {
    backgroundColor: '#FFF0F1',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  generalIconCircle: {
    backgroundColor: '#E8DFFF',
  },

  healthIconCircle: {
    backgroundColor: '#FFDDE3',
  },

  cardTitle: {
    flexShrink: 1,
    fontSize: 15,
    color: '#101C39',
    fontWeight: '800',
  },

  infoRow: {
    minHeight: 45,
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(95,107,150,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
  },

  infoRowLast: {
    borderBottomWidth: 0,
  },

  infoLabel: {
    flexShrink: 1,
    color: '#536A96',
    fontSize: 11,
    fontWeight: '500',
  },

  infoValue: {
    flexShrink: 1,
    maxWidth: '58%',
    textAlign: 'right',
    color: '#17213B',
    fontSize: 11,
    fontWeight: '700',
  },

  vaccineStatusRow: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  vaccineStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#36C976',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewAllButton: {
    minHeight: 40,
    marginTop: 5,
    borderRadius: 14,
    backgroundColor: '#FFDDE3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  viewAllText: {
    color: '#C9203D',
    fontSize: 13,
    fontWeight: '800',
  },

  /* NAV CARDS */

  navigationCardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  smallNavCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 23,
    paddingHorizontal: 13,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,

    shadowColor: '#253659',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },

  smallNavIcon: {
    width: 44,
    height: 44,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallNavTextWrap: {
    flex: 1,
  },

  smallNavTitle: {
    color: '#101C39',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },

  smallNavSubtitle: {
    color: '#6376A2',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },

  pressedCard: {
    opacity: 0.82,
    transform: [{scale: 0.985}],
  },

  /* NOTES */

  notesCard: {
    marginHorizontal: 18,
    minHeight: 100,
    borderRadius: 24,
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 16,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 18,

    shadowColor: '#503C28',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },

  notesIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: '#FFEBCB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notesContent: {
    flex: 1,
  },

  notesTitle: {
    color: '#101C39',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5,
  },

  notesText: {
    color: '#34486F',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },

  /* ACTIONS */

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    marginTop: 2,
  },

  deleteButton: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderColor: '#FF9DA6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  deleteButtonText: {
    color: '#E31B23',
    fontSize: 15,
    fontWeight: '800',
  },

  editButton: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#7658F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,

    shadowColor: '#6547DD',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  actionPressed: {
    opacity: 0.78,
    transform: [{scale: 0.98}],
  },

  /* MODAL */

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(29,31,48,0.36)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#FFF9FF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    alignItems: 'center',

    shadowColor: '#101828',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },

  modalIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#F3E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  modalTitle: {
    color: '#17182B',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 9,
  },

  modalDescription: {
    maxWidth: 310,
    color: '#697089',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },

  modalButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },

  cancelModalButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFF2D9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelModalText: {
    color: '#403A36',
    fontSize: 15,
    fontWeight: '800',
  },

  confirmDeleteButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFF9FF',
    borderWidth: 1.4,
    borderColor: '#E8A9CF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmDeleteText: {
    color: '#B8325A',
    fontSize: 15,
    fontWeight: '800',
  },
});