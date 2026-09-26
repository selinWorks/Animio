import React, {useEffect, useMemo, useRef, useState} from 'react';
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

import Svg, {Path} from 'react-native-svg';

import {RouteProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileText,
  NotebookPen,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react-native';

import {RootStackParamList} from '../navigation/AppNavigator';
import {usePets} from '../data/PetContext';


type ProfileWeightChartPoint = {
  x: number;
  y: number;
  id: string;
};

const PROFILE_WEIGHT_PURPLE = '#8067E8';

function createProfileWeightPath(
  points: ProfileWeightChartPoint[],
) {
  if (points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const middleX = (current.x + next.x) / 2;

    path +=
      ` C ${middleX} ${current.y},` +
      ` ${middleX} ${next.y},` +
      ` ${next.x} ${next.y}`;
  }

  return path;
}

function formatProfileWeightDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}

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

function getDisplayAge(pet: {
  birthYear?: number;
  age?: number;
}) {
  if (pet.birthYear) {
    return Math.max(
      new Date().getFullYear() - pet.birthYear,
      0,
    );
  }

  return pet.age ?? 0;
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */


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

  const {pets, removePet} = usePets();

  // Route ile gelen pet objesi ekran açık kaldıkça eski kalabilir.
  // Context'teki güncel kaydı esas alarak kilo ve diğer alanları canlı tutuyoruz.
  const currentPet =
    pets.find(item => item.id === pet.id) ?? pet;

  const [profileChartWidth, setProfileChartWidth] =
    useState(0);

  const profileWeightRecords = useMemo(() => {
    return [...(currentPet.weightHistory ?? [])].sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime(),
    );
  }, [currentPet.weightHistory]);

  const profileChartHeight = 165;
  const profileChartPaddingX = 16;
  const profileChartPaddingY = 18;

  const profileChartPoints =
    useMemo<ProfileWeightChartPoint[]>(() => {
      if (
        profileWeightRecords.length === 0 ||
        profileChartWidth <= 0
      ) {
        return [];
      }

      const weights = profileWeightRecords.map(
        item => item.weight,
      );

      let minWeight = Math.min(...weights);
      let maxWeight = Math.max(...weights);

      if (minWeight == maxWeight) {
        minWeight -= 0.5;
        maxWeight += 0.5;
      }

      const usableWidth =
        profileChartWidth -
        profileChartPaddingX * 2;

      const usableHeight =
        profileChartHeight -
        profileChartPaddingY * 2;

      return profileWeightRecords.map(
        (record, index) => {
          const x =
            profileWeightRecords.length === 1
              ? profileChartWidth / 2
              : profileChartPaddingX +
                (index /
                  (profileWeightRecords.length - 1)) *
                  usableWidth;

          const normalized =
            (record.weight - minWeight) /
            (maxWeight - minWeight);

          const y =
            profileChartPaddingY +
            usableHeight -
            normalized * usableHeight;

          return {
            x,
            y,
            id: record.id,
          };
        },
      );
    }, [
      profileWeightRecords,
      profileChartWidth,
    ]);

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
    removePet(currentPet.id);

    setDeleteModalVisible(false);

    navigation.goBack();
  };

  const displayAge = getDisplayAge(currentPet);

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
              source={getPetHero(currentPet.type)}
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
                    {pet: currentPet},
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
                  source={
                    (currentPet as typeof currentPet & {photoUri?: string}).photoUri
                      ? {uri: (currentPet as typeof currentPet & {photoUri?: string}).photoUri}
                      : getDefaultPetAvatar(currentPet.type)
                  }
                  style={[
                    styles.avatarImage,
                    !(currentPet as typeof currentPet & {photoUri?: string}).photoUri &&
                      (
                        normalizePetType(currentPet.type).includes('diğer') ||
                        normalizePetType(currentPet.type).includes('diger') ||
                        normalizePetType(currentPet.type).includes('other')
                      ) &&
                      styles.otherAvatarImage,
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
                  {currentPet.name}
                </Text>

              </View>

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

              <View style={styles.statTextWrap}>
                <Text style={styles.statLabel}>
                  Cinsiyet
                </Text>

                <Text style={styles.statValue}>
                  {currentPet.gender || 'Belirsiz'}
                </Text>
              </View>

            </View>

            <View
              style={[
                styles.quickStatCard,
                styles.weightAgeStatCard,
              ]}>

              <View style={styles.weightAgeHalf}>
                <Text style={styles.statLabel}>
                  Kilo
                </Text>

                <Text style={styles.statValue}>
                  {currentPet.weight || '-'}
                </Text>
              </View>

              <View style={styles.weightAgeDivider} />

              <View style={styles.weightAgeHalf}>
                <Text style={styles.statLabel}>
                  Yaş
                </Text>

                <Text style={styles.statValue}>
                  {displayAge}
                </Text>
              </View>

            </View>

            <View
              style={[
                styles.quickStatCard,
                styles.statusStatCard,
              ]}>

              <View style={styles.statTextWrap}>
                <Text style={styles.statLabel}>
                  Tür
                </Text>

                <Text
                  style={styles.statValue}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {currentPet.type || '-'}
                </Text>
              </View>

            </View>

          </View>

          {/* =====================================================
              PET SUMMARY
          ===================================================== */}

          <Pressable
            style={({pressed}) => [
              styles.petSummaryCard,
              pressed && styles.pressedCard,
            ]}>

            <View style={styles.petSummaryTop}>

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

              <View style={styles.petSummaryTextWrap}>

                <Text style={styles.petSummaryTitle}>
                  Pet Özeti
                </Text>

                <Text style={styles.petSummaryDescription}>
                  {currentPet.name}’ın önemli bilgilerini tek yerde görüntüle ve paylaş.
                </Text>

              </View>

            </View>

            <View style={styles.petSummaryAction}>

              <Text style={styles.petSummaryActionText}>
                Özeti Gör
              </Text>

              <ChevronRight
                size={20}
                color="#7655F5"
                strokeWidth={2.2}
              />

            </View>

          </Pressable>

          {/* =====================================================
              WEIGHT CHANGE
          ===================================================== */}

          <View style={styles.profileWeightGraphCard}>

            <View style={styles.profileWeightGraphHeader}>

              <View>
                <Text style={styles.profileWeightGraphTitle}>
                  Kilo Değişimi
                </Text>

                <Text style={styles.profileWeightGraphSubtitle}>
                  Zaman içindeki değişim
                </Text>
              </View>

              <View style={styles.profileWeightGraphBadge}>
                <Text style={styles.profileWeightGraphBadgeText}>
                  kg
                </Text>
              </View>

            </View>

            {profileWeightRecords.length === 0 ? (
              <View style={styles.profileWeightGraphEmpty}>

                {[0, 1, 2, 3].map(item => (
                  <View
                    key={`profile-empty-h-${item}`}
                    style={[
                      styles.profileWeightHorizontalGrid,
                      {top: 18 + item * 37},
                    ]}
                  />
                ))}

                {[0, 1, 2, 3, 4].map(item => (
                  <View
                    key={`profile-empty-v-${item}`}
                    style={[
                      styles.profileWeightVerticalGrid,
                      {left: `${item * 25}%`},
                    ]}
                  />
                ))}

                <View style={styles.profileWeightPreparingBadge}>
                  <Text style={styles.profileWeightPreparingText}>
                    Grafik hazırlanıyor
                  </Text>
                </View>

              </View>
            ) : (
              <>
                <View
                  style={styles.profileWeightChartContainer}
                  onLayout={event =>
                    setProfileChartWidth(
                      event.nativeEvent.layout.width,
                    )
                  }>

                  {[0, 1, 2, 3].map(item => (
                    <View
                      key={`profile-h-${item}`}
                      style={[
                        styles.profileWeightHorizontalGrid,
                        {top: 15 + item * 42},
                      ]}
                    />
                  ))}

                  {[0, 1, 2, 3, 4].map(item => (
                    <View
                      key={`profile-v-${item}`}
                      style={[
                        styles.profileWeightVerticalGrid,
                        {left: `${item * 25}%`},
                      ]}
                    />
                  ))}

                  {profileChartWidth > 0 &&
                    profileChartPoints.length > 1 && (
                      <Svg
                        pointerEvents="none"
                        width={profileChartWidth}
                        height={profileChartHeight}
                        style={StyleSheet.absoluteFill}>

                        <Path
                          d={createProfileWeightPath(
                            profileChartPoints,
                          )}
                          fill="none"
                          stroke={PROFILE_WEIGHT_PURPLE}
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                      </Svg>
                    )}

                  {profileChartPoints.map(point => (
                    <View
                      key={point.id}
                      style={[
                        styles.profileWeightChartDotOuter,
                        {
                          left: point.x - 6,
                          top: point.y - 6,
                        },
                      ]}>

                      <View style={styles.profileWeightChartDot} />

                    </View>
                  ))}

                </View>

                <View style={styles.profileWeightChartDates}>

                  <Text style={styles.profileWeightChartDateText}>
                    {formatProfileWeightDate(
                      profileWeightRecords[0].date,
                    )}
                  </Text>

                  <Text style={styles.profileWeightChartDateText}>
                    {formatProfileWeightDate(
                      profileWeightRecords[
                        profileWeightRecords.length - 1
                      ].date,
                    )}
                  </Text>

                </View>
              </>
            )}

          </View>

          {/* =====================================================
              REMINDERS + NOTES
          ===================================================== */}

          <View style={styles.reminderNotesRow}>

            <SmallNavigationCard
              title="Hatırlatmalar"
              subtitle="Yaklaşan bakım görevleri"
              backgroundColor="#E9FAF0"
              iconBackground="#D9F5E6"
              icon={
                <CalendarDays
                  size={24}
                  color="#13A968"
                  strokeWidth={2}
                />
              }
            />

            <Pressable
              style={({pressed}) => [
                styles.notesSmallCard,
                pressed && styles.pressedCard,
              ]}>

              <View style={styles.notesSmallIcon}>
                <NotebookPen
                  size={24}
                  color="#F47A19"
                  strokeWidth={2}
                />
              </View>

              <View style={styles.notesSmallContent}>

                <Text style={styles.notesSmallTitle}>
                  Notlar
                </Text>

                <Text
                  style={styles.notesSmallText}
                  numberOfLines={2}>
                  {currentPet.notes ||
                    'Henüz not eklenmemiş.'}
                </Text>

              </View>

              <ChevronRight
                size={22}
                color="#263E73"
                strokeWidth={2.2}
              />

            </Pressable>

          </View>

          {/* =====================================================
              FAMILY SHARING
          ===================================================== */}

          <View style={styles.familyCard}>
            <View style={styles.familyHeader}>
              <View style={styles.familyIconBox}>
                <Users
                  size={24}
                  color="#7655F5"
                  strokeWidth={2}
                />
              </View>

              <View style={styles.familyHeaderText}>
                <Text style={styles.familyTitle}>
                  Aileyle Birlikte Takip Et
                </Text>

                <Text style={styles.familyDescription}>
                  {currentPet.name}’un bakımını aile üyelerinle birlikte takip et.
                </Text>
              </View>
            </View>

            <Pressable
              style={({pressed}) => [
                styles.familyButton,
                pressed && styles.actionPressed,
              ]}
              onPress={() =>
                navigation.navigate('PetInvite', {
                  pet: currentPet,
                })
              }>

              <Text style={styles.familyButtonText}>
                Aile Üyesi Davet Et
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
              {currentPet.name} için oluşturduğun profil
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
    paddingBottom: 24,
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
    fontFamily: 'Quicksand-Bold',
    color: '#23375F',
  },

  topButtonPressed: {
    opacity: 0.76,
    transform: [{scale: 0.97}],
  },

  /* PROFILE */

  profileSection: {
    minHeight: 85,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingBottom: 1,
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
    fontFamily: 'Quicksand-Bold',
    color: '#101D3D',
    letterSpacing: -0.8,
  },

  petMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#536997',
    fontFamily: 'Quicksand-Medium',
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
    fontFamily: 'Quicksand-SemiBold',
  },

  /* QUICK STATS */

  quickStatsRow: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 18,
    marginTop: 1,
    marginBottom: 14,
  },

  quickStatCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 22,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',

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

  weightAgeStatCard: {
    flex: 1.45,
    backgroundColor: '#EAFBF1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    position: 'relative',
  },

  weightAgeHalf: {
    width: '50%',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  weightAgeDivider: {
    position: 'absolute',
    left: '50%',
    width: 1,
    height: 48,
    top: '50%',
    marginTop: -24,
    backgroundColor: 'rgba(83,105,145,0.22)',
  },

  statusStatCard: {
    backgroundColor: '#EAF6FF',
  },

  statTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  statLabel: {
    color: '#536991',
    fontSize: 11,
    fontFamily: 'Quicksand-SemiBold',
    marginBottom: 3,
  },

  statValue: {
    color: '#111C37',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },

  /* PET SUMMARY */

  petSummaryCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#F5F0FF',
    shadowColor: '#24345B',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 3,
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

  petSummaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  petSummaryTextWrap: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 4,
  },

  petSummaryTitle: {
    fontSize: 17,
    fontFamily: 'Quicksand-Bold',
    color: '#101C39',
    marginBottom: 5,
  },

  petSummaryDescription: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Quicksand-Medium',
    color: '#6376A2',
  },

  petSummaryAction: {
    marginTop: 18,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EAE2FF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  petSummaryActionText: {
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
    color: '#6849D8',
  },


  profileWeightGraphCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE9F7',
    padding: 14,
    shadowColor: '#6973A0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 11,
    elevation: 2,
  },

  profileWeightGraphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  profileWeightGraphTitle: {
    color: '#172348',
    fontSize: 15.5,
    fontFamily: 'Quicksand-Bold',
  },

  profileWeightGraphSubtitle: {
    color: '#9299AC',
    fontSize: 10.5,
    fontFamily: 'Quicksand-Medium',
    marginTop: 2,
  },

  profileWeightGraphBadge: {
    minWidth: 39,
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileWeightGraphBadgeText: {
    color: PROFILE_WEIGHT_PURPLE,
    fontSize: 10.5,
    fontFamily: 'Quicksand-Bold',
  },

  profileWeightGraphEmpty: {
    height: 150,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileWeightPreparingBadge: {
    position: 'absolute',
    top: 58,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#E8E2FF',
    paddingHorizontal: 13,
    height: 29,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7565B5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  profileWeightPreparingText: {
    color: '#7867C9',
    fontSize: 9.5,
    fontFamily: 'Quicksand-Bold',
  },

  profileWeightChartContainer: {
    position: 'relative',
    height: 165,
    marginTop: 15,
    overflow: 'hidden',
  },

  profileWeightHorizontalGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F0EEF7',
  },

  profileWeightVerticalGrid: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#F3F1F8',
  },

  profileWeightChartDotOuter: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E3DCFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileWeightChartDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PROFILE_WEIGHT_PURPLE,
  },

  profileWeightChartDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  profileWeightChartDateText: {
    color: '#9BA0B0',
    fontSize: 9.5,
    fontFamily: 'Quicksand-Medium',
  },


  reminderNotesRow: {
    flexDirection: 'column',
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 18,
  },

  notesSmallCard: {
    width: '100%',
    minHeight: 50,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFF5E6',
    shadowColor: '#503C28',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },

  notesSmallIcon: {
    width: 44,
    height: 44,
    borderRadius: 17,
    backgroundColor: '#FFEBCB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notesSmallContent: {
    flex: 1,
    minWidth: 0,
  },

  notesSmallTitle: {
    color: '#101C39',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    marginBottom: 4,
  },

  notesSmallText: {
    color: '#6376A2',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Quicksand-Medium',
  },

  /* NAV CARDS */

  navigationCardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  smallNavCard: {
    width: '100%',
    minHeight: 50,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
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
    fontFamily: 'Quicksand-Bold',
    marginBottom: 4,
  },

  smallNavSubtitle: {
    color: '#6376A2',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Quicksand-Medium',
  },

  pressedCard: {
    opacity: 0.82,
    transform: [{scale: 0.985}],
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
    fontFamily: 'Quicksand-Bold',
    textAlign: 'center',
    marginBottom: 9,
  },

  modalDescription: {
    fontFamily: 'Quicksand-Medium',
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
    fontFamily: 'Quicksand-Bold',
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
    fontFamily: 'Quicksand-Bold',
  },

  familyCard: {
    marginHorizontal: 18,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: '#F7F3FF',
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderWidth: 1,
    borderColor: '#E5DBFF',

    shadowColor: '#4D3B7A',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  familyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#EEE6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  familyHeaderText: {
    flex: 1,
    marginLeft: 12,
  },

  familyTitle: {
    fontSize: 17,
    fontFamily: 'Quicksand-Bold',
    color: '#101C39',
  },

  familyDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Quicksand-Medium',
    color: '#6376A2',
  },

  familyButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#8B6FC7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  familyButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
});
