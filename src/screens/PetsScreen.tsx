import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  StatusBar,
} from 'react-native';

import {
  PawPrint,
  Cat,
  Dog,
  Bird,
  Rabbit,
  Plus,
  Heart,
  CalendarDays,
  Images,
  ChevronRight,
} from 'lucide-react-native';

import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';

import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';

import {
  RootStackParamList,
  TabParamList,
} from '../navigation/AppNavigator';

import {usePets} from '../data/PetContext';
import {Pet} from '../types/Pet';

/* =========================================================
   NAVIGATION
========================================================= */

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

/* =========================================================
   FONTS
========================================================= */

const F = {
  light: 'Quicksand-Light',
  regular: 'Quicksand-Regular',
  medium: 'Quicksand-Medium',
  semiBold: 'Quicksand-SemiBold',
  bold: 'Quicksand-Bold',
};

/* =========================================================
   COLORS
========================================================= */

const C = {
  bg: '#FAF9FF',
  white: '#FFFFFF',

  text: '#181642',
  secondary: '#737C9A',
  muted: '#9AA1B7',

  purple: '#7157F4',
  purpleDark: '#5943DF',
  purpleSoft: '#F2EEFF',
  purpleSoft2: '#E9E1FF',

  pinkSoft: '#FFF0F4',
  pink: '#FF4F74',

  greenSoft: '#E4F9F2',
  green: '#24C9A0',

  border: '#EEEBF6',
};

/* =========================================================
   FILTERS
========================================================= */

type FilterType =
  | 'all'
  | 'cat'
  | 'dog'
  | 'bird'
  | 'other';

const FILTERS: {
  key: FilterType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'all',
    label: 'Tümü',
    icon: <PawPrint size={20} />,
  },
  {
    key: 'cat',
    label: 'Kediler',
    icon: <Cat size={20} />,
  },
  {
    key: 'dog',
    label: 'Köpekler',
    icon: <Dog size={20} />,
  },
  {
    key: 'bird',
    label: 'Kuşlar',
    icon: <Bird size={20} />,
  },
  {
    key: 'other',
    label: 'Diğer',
    icon: <Rabbit size={20} />,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function normalizeType(type?: string) {
  return (type || '')
    .toLocaleLowerCase('tr-TR')
    .trim();
}

function getPetCategory(type?: string): FilterType {
  const value = normalizeType(type);

  if (
    value.includes('kedi') ||
    value.includes('cat')
  ) {
    return 'cat';
  }

  if (
    value.includes('köpek') ||
    value.includes('kopek') ||
    value.includes('dog')
  ) {
    return 'dog';
  }

  if (
    value.includes('kuş') ||
    value.includes('kus') ||
    value.includes('bird')
  ) {
    return 'bird';
  }

  return 'other';
}

function getPetEmoji(type?: string) {
  const value = normalizeType(type);

  if (
    value.includes('kedi') ||
    value.includes('cat')
  ) {
    return '🐱';
  }

  if (
    value.includes('köpek') ||
    value.includes('kopek') ||
    value.includes('dog')
  ) {
    return '🐶';
  }

  if (
    value.includes('kuş') ||
    value.includes('kus') ||
    value.includes('bird')
  ) {
    return '🐦';
  }

  if (
    value.includes('tavşan') ||
    value.includes('tavsan') ||
    value.includes('rabbit')
  ) {
    return '🐰';
  }

  if (
    value.includes('balık') ||
    value.includes('balik') ||
    value.includes('fish')
  ) {
    return '🐠';
  }

  if (value.includes('hamster')) {
    return '🐹';
  }

  if (
    value.includes('kaplumbağa') ||
    value.includes('kaplumbaga') ||
    value.includes('turtle')
  ) {
    return '🐢';
  }

  return '🐾';
}

/* =========================================================
   PETS SCREEN
========================================================= */

export default function PetsScreen() {
  const {pets} = usePets();

  const navigation = useNavigation<NavigationProp>();

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>('all');

  const petList: Pet[] = pets || [];

  const filteredPets = useMemo(() => {
    if (selectedFilter === 'all') {
      return petList;
    }

    return petList.filter(
      pet =>
        getPetCategory(pet.type) ===
        selectedFilter,
    );
  }, [petList, selectedFilter]);

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.bg}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* =================================================
            TITLE
        ================================================= */}

        <Text style={styles.pageTitle}>
          Dostlarım
        </Text>

        {/* =================================================
            FILTERS
        ================================================= */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>

          {FILTERS.map(filter => {
            const selected =
              selectedFilter === filter.key;

            return (
              <Pressable
                key={filter.key}
                onPress={() =>
                  setSelectedFilter(filter.key)
                }
                style={({pressed}) => [
                  styles.filterButton,

                  selected &&
                    styles.filterButtonSelected,

                  pressed &&
                    styles.filterButtonPressed,
                ]}>

                {React.cloneElement(
                  filter.icon as React.ReactElement<any>,
                  {
                    color: selected
                      ? C.purple
                      : '#7E879F',

                    strokeWidth: selected
                      ? 2.3
                      : 1.8,
                  },
                )}

                <Text
                  style={[
                    styles.filterText,

                    selected &&
                      styles.filterTextSelected,
                  ]}>
                  {filter.label}
                </Text>

              </Pressable>
            );
          })}

        </ScrollView>

        {/* =================================================
            EMPTY STATE / PET LIST
        ================================================= */}

        {petList.length === 0 ? (
          <>
            <EmptyState
              onAdd={() =>
                navigation.navigate('AddPet')
              }
            />

            <WhyAddPet />

            <BottomBanner />
          </>
        ) : (
          <>
            <View style={styles.petSectionHeader}>

              <View>
                <Text style={styles.petSectionTitle}>
                  {selectedFilter === 'all'
                    ? 'Tüm dostların'
                    : FILTERS.find(
                        item =>
                          item.key === selectedFilter,
                      )?.label}
                </Text>

                <Text style={styles.petCount}>
                  {filteredPets.length} dost
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  navigation.navigate('AddPet')
                }
                style={({pressed}) => [
                  styles.smallAddButton,

                  pressed &&
                    styles.smallAddButtonPressed,
                ]}>

                <Plus
                  size={18}
                  color={C.white}
                  strokeWidth={2.2}
                />

                <Text style={styles.smallAddText}>
                  Dost Ekle
                </Text>

              </Pressable>

            </View>

            {filteredPets.length > 0 ? (
              <View style={styles.petGrid}>

                {filteredPets.map(pet => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onPress={() =>
                      navigation.navigate(
                        'PetDetail',
                        {pet},
                      )
                    }
                  />
                ))}

              </View>
            ) : (
              <View style={styles.filterEmpty}>

                <View style={styles.filterEmptyIcon}>
                  <PawPrint
                    size={31}
                    color={C.purple}
                  />
                </View>

                <Text style={styles.filterEmptyTitle}>
                  Bu kategoride dost yok
                </Text>

                <Text style={styles.filterEmptyText}>
                  Başka bir kategori seçebilir veya
                  yeni bir dost ekleyebilirsin.
                </Text>

              </View>
            )}
          </>
        )}

      </ScrollView>
    </View>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <View style={styles.emptyCard}>

      {/* BACKGROUND BLOBS */}

      <View style={styles.blobOne} />
      <View style={styles.blobTwo} />
      <View style={styles.blobThree} />

      {/* HERO IMAGE */}

      <View style={styles.heroImageContainer}>
        <Image
          source={require(
            '../assets/images/pets/pets-empty-hero.png'
          )}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      {/* TITLE */}

      <Text style={styles.emptyTitle}>
        Henüz bir dost eklemedin
      </Text>

      {/* DESCRIPTION */}

      <Text style={styles.emptyDescription}>
        Dostunu ekleyerek onun bakım bilgilerini,
        sağlık kayıtlarını ve en özel anlarını tek
        yerde saklayabilirsin.
      </Text>

      {/* ADD BUTTON */}

      <Pressable
        onPress={onAdd}
        android_ripple={{
          color: 'rgba(255,255,255,0.15)',
        }}
        style={({pressed}) => [
          styles.addButton,

          pressed &&
            styles.addButtonPressed,
        ]}>

        <View style={styles.addButtonIcon}>
          <Plus
            size={24}
            color={C.white}
            strokeWidth={1.8}
          />
        </View>

        <Text style={styles.addButtonText}>
          İlk Dostunu Ekle
        </Text>

      </Pressable>

    </View>
  );
}

/* =========================================================
   WHY ADD PET
========================================================= */

function WhyAddPet() {
  return (
    <View style={styles.whySection}>

      <Text style={styles.whyTitle}>
        Neden dost eklemelisin?
      </Text>

      <View style={styles.benefitRow}>

        <BenefitCard
          icon={
            <Heart
              size={27}
              color={C.pink}
              strokeWidth={2}
            />
          }
          iconBackground={C.pinkSoft}
          title="Her an yanında"
          description={
            'Tüm önemli bilgiler\ntek yerde.'
          }
        />

        <BenefitCard
          icon={
            <CalendarDays
              size={27}
              color={C.green}
              strokeWidth={2}
            />
          }
          iconBackground={C.greenSoft}
          title="Rutinleri kaçırma"
          description={
            'Aşı, mama ve bakım\ntakibini kolayca yap.'
          }
        />

        <BenefitCard
          icon={
            <Images
              size={27}
              color={C.purple}
              strokeWidth={2}
            />
          }
          iconBackground={C.purpleSoft}
          title="Anıları biriktir"
          description={
            'Fotoğraflarını sakla,\nbüyüme yolculuğunu izle.'
          }
        />

      </View>

    </View>
  );
}

/* =========================================================
   BENEFIT CARD
========================================================= */

function BenefitCard({
  icon,
  iconBackground,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.benefitCard}>

      <View
        style={[
          styles.benefitIcon,
          {
            backgroundColor:
              iconBackground,
          },
        ]}>

        {icon}

      </View>

      <Text style={styles.benefitTitle}>
        {title}
      </Text>

      <Text style={styles.benefitDescription}>
        {description}
      </Text>

    </View>
  );
}

/* =========================================================
   BOTTOM BANNER
========================================================= */

function BottomBanner() {
  return (
    <View style={styles.bottomBannerContainer}>

      <Image
        source={require(
          '../assets/images/pets/pets-bottom-banner.png'
        )}
        style={styles.bottomBannerImage}
        resizeMode="contain"
      />

    </View>
  );
}

/* =========================================================
   PET CARD
========================================================= */

function PetCard({
  pet,
  onPress,
}: {
  pet: Pet;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.petCard,

        pressed &&
          styles.petCardPressed,
      ]}>

      <View style={styles.petAvatar}>

        {(pet as Pet & {photoUri?: string}).photoUri ? (
          <Image
            source={{
              uri: (pet as Pet & {photoUri?: string}).photoUri,
            }}
            style={styles.petAvatarImage}
            resizeMode="cover"
          />
        ) : (
          <>
            <View style={styles.petAvatarBlob} />

            <Text style={styles.petEmoji}>
              {getPetEmoji(pet.type)}
            </Text>
          </>
        )}

      </View>

      <View style={styles.petInfo}>

        <Text
          numberOfLines={1}
          style={styles.petName}>
          {pet.name}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.petMeta}>
          {pet.type}
          {pet.age
            ? ` • ${pet.age} yaş`
            : ''}
        </Text>

      </View>

      <View style={styles.petArrow}>

        <ChevronRight
          size={19}
          color={C.purple}
          strokeWidth={2}
        />

      </View>

    </Pressable>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* =====================================================
     SCREEN
  ===================================================== */

  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 25,
    paddingBottom: 125,
  },

  /* =====================================================
     TITLE
  ===================================================== */

  pageTitle: {
    fontSize: 34,
    lineHeight: 41,

    fontFamily: F.bold,

    color: C.text,

    letterSpacing: -1.2,

    marginBottom: 21,
  },

  /* =====================================================
     FILTERS
  ===================================================== */

  filters: {
    gap: 8,

    paddingRight: 8,

    marginBottom: 23,
  },

  filterButton: {
    height: 48,

    paddingHorizontal: 15,

    borderRadius: 24,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    backgroundColor: '#F8F7FC',
  },

  filterButtonSelected: {
    backgroundColor: C.purpleSoft,
  },

  filterButtonPressed: {
    opacity: 0.75,

    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  filterText: {
    fontSize: 13,

    fontFamily: F.semiBold,

    color: '#7E879F',
  },

  filterTextSelected: {
    color: C.purple,
  },

  /* =====================================================
     EMPTY CARD
  ===================================================== */

  emptyCard: {
    width: '100%',

    minHeight: 555,

    borderRadius: 27,

    backgroundColor: '#FCFBFF',

    borderWidth: 1,
    borderColor: '#EEE9FB',

    alignItems: 'center',

    overflow: 'hidden',

    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 27,

    shadowColor: '#453886',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.06,
    shadowRadius: 18,

    elevation: 3,
  },

  blobOne: {
    position: 'absolute',

    width: 220,
    height: 160,

    borderRadius: 100,

    backgroundColor: '#F0EBFF',

    top: 18,
    left: 75,

    transform: [
      {
        rotate: '-10deg',
      },
    ],
  },

  blobTwo: {
    position: 'absolute',

    width: 180,
    height: 140,

    borderRadius: 90,

    backgroundColor: '#F5F1FF',

    top: 45,
    right: -55,
  },

  blobThree: {
    position: 'absolute',

    width: 190,
    height: 130,

    borderRadius: 90,

    backgroundColor: '#F7F4FF',

    top: 95,
    left: -70,
  },

  /* =====================================================
     HERO IMAGE
  ===================================================== */

  heroImageContainer: {
    width: '113%',
    height: 300,

    justifyContent: 'flex-end',
    alignItems: 'center',

    zIndex: 3,

    marginBottom: -2,
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  /* =====================================================
     EMPTY TEXT
  ===================================================== */

  emptyTitle: {
    fontSize: 23,
    lineHeight: 29,

    fontFamily: F.bold,

    color: C.text,

    textAlign: 'center',

    letterSpacing: -0.5,

    zIndex: 4,
  },

  emptyDescription: {
    fontSize: 13.5,
    lineHeight: 20,

    fontFamily: F.regular,

    color: C.secondary,

    textAlign: 'center',

    maxWidth: 315,

    marginTop: 7,

    zIndex: 4,
  },

  /* =====================================================
     MAIN ADD BUTTON
  ===================================================== */

  addButton: {
    width: '68%',
    minWidth: 240,

    height: 58,

    borderRadius: 29,

    backgroundColor: C.purple,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 13,

    marginTop: 23,

    overflow: 'hidden',

    shadowColor: C.purple,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.22,
    shadowRadius: 15,

    elevation: 6,
  },

  addButtonPressed: {
    backgroundColor: C.purpleDark,

    opacity: 0.92,

    transform: [
      {
        scale: 0.97,
      },
    ],

    shadowOpacity: 0.12,
    shadowRadius: 7,

    elevation: 3,
  },

  addButtonIcon: {
    width: 30,
    height: 30,

    borderRadius: 15,

    borderWidth: 1.6,
    borderColor: C.white,

    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    fontSize: 17,

    fontFamily: F.medium,

    color: C.white,
  },

  /* =====================================================
     WHY SECTION
  ===================================================== */

  whySection: {
    marginTop: 50,
  },

  whyTitle: {
    fontSize: 22,
    lineHeight: 28,

    fontFamily: F.bold,

    color: C.text,

    letterSpacing: -0.5,

    marginBottom: 13,
  },

  benefitRow: {
    flexDirection: 'row',
    gap: 9,
  },

  /* =====================================================
     BENEFIT CARDS
  ===================================================== */

  benefitCard: {
    flex: 1,

    minHeight: 180,

    borderRadius: 22,

    backgroundColor: C.white,

    paddingHorizontal: 12,
    paddingVertical: 15,

    borderWidth: 1,
    borderColor: '#F0EDF6',

    shadowColor: '#272047',

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.04,
    shadowRadius: 12,

    elevation: 2,
  },

  benefitIcon: {
    width: 52,
    height: 52,

    borderRadius: 16,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 14,
  },

  benefitTitle: {
    fontSize: 14,
    lineHeight: 18,

    fontFamily: F.bold,

    color: C.text,

    marginBottom: 6,
  },

  benefitDescription: {
    fontSize: 11.5,
    lineHeight: 16,

    fontFamily: F.regular,

    color: C.secondary,
  },

  /* =====================================================
     BOTTOM BANNER IMAGE
  ===================================================== */

  bottomBannerContainer: {
    width: '105%',
    marginLeft:-10,

    marginTop: 10,
    marginBottom: -55,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomBannerImage: {
    width: '100%',
    height: 170,
  },

  /* =====================================================
     PET LIST HEADER
  ===================================================== */

  petSectionHeader: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 17,
  },

  petSectionTitle: {
    fontSize: 22,

    fontFamily: F.bold,

    color: C.text,
  },

  petCount: {
    fontSize: 12,

    fontFamily: F.regular,

    color: C.secondary,

    marginTop: 3,
  },

  smallAddButton: {
    height: 43,

    paddingHorizontal: 14,

    borderRadius: 22,

    backgroundColor: C.purple,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,
  },

  smallAddButtonPressed: {
    backgroundColor: C.purpleDark,

    opacity: 0.9,

    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  smallAddText: {
    fontSize: 12.5,

    fontFamily: F.semiBold,

    color: C.white,
  },

  /* =====================================================
     PET CARDS
  ===================================================== */

  petGrid: {
    gap: 12,
  },

  petCard: {
    minHeight: 96,

    borderRadius: 22,

    backgroundColor: C.white,

    paddingHorizontal: 14,
    paddingVertical: 12,

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,
    borderColor: C.border,

    shadowColor: '#322760',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.05,
    shadowRadius: 12,

    elevation: 2,
  },

  petCardPressed: {
    opacity: 0.84,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  petAvatar: {
    width: 68,
    height: 68,

    borderRadius: 22,

    backgroundColor: C.purpleSoft,

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',

    marginRight: 13,
  },

  petAvatarBlob: {
    position: 'absolute',

    width: 55,
    height: 55,

    borderRadius: 30,

    backgroundColor: '#E2D8FF',

    right: -15,
    bottom: -15,
  },

  petAvatarImage: {
    width: '100%',
    height: '100%',
  },

  petEmoji: {
    fontSize: 40,
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    fontSize: 17,

    fontFamily: F.bold,

    color: C.text,
  },

  petMeta: {
    fontSize: 12,

    fontFamily: F.regular,

    color: C.secondary,

    marginTop: 4,
  },

  petArrow: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: C.purpleSoft,

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* =====================================================
     FILTER EMPTY
  ===================================================== */

  filterEmpty: {
    minHeight: 300,

    borderRadius: 26,

    backgroundColor: C.white,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 25,

    borderWidth: 1,
    borderColor: C.border,
  },

  filterEmptyIcon: {
    width: 70,
    height: 70,

    borderRadius: 35,

    backgroundColor: C.purpleSoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 15,
  },

  filterEmptyTitle: {
    fontSize: 18,

    fontFamily: F.bold,

    color: C.text,
  },

  filterEmptyText: {
    fontSize: 13,
    lineHeight: 19,

    fontFamily: F.regular,

    color: C.secondary,

    textAlign: 'center',

    marginTop: 7,

    maxWidth: 260,
  },
});