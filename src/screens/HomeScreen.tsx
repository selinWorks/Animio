import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Image,
  ImageSourcePropType,
} from 'react-native';

import {
  PawPrint,
  Plus,
  CalendarDays,
  Bot,
  ChevronRight,
  Heart,
  Bell,
  Stethoscope,
  Utensils,
  Lightbulb,
} from 'lucide-react-native';

import {useNavigation} from '@react-navigation/native';
import {usePets} from '../data/PetContext';
import {Pet} from '../types/Pet';

/* =========================================================
   DEFAULT PET AVATARS
========================================================= */

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

  text: '#18162B',
  secondary: '#66647A',
  muted: '#9693A7',

  purple: '#7457E8',
  purpleDark: '#5D42CF',
  purpleSoft: '#F1EDFF',

  pink: '#FFF0F4',
  pinkText: '#EF557A',

  orange: '#FFF2E5',
  orangeText: '#F28A32',

  blue: '#EEF3FF',
  blueText: '#536FE8',

  green: '#EAF9F4',
  greenText: '#2FA77D',

  border: '#ECE9F4',
};

/* =========================================================
   PET AVATAR HELPERS
========================================================= */

function normalizePetType(type?: string) {
  return (type || '')
    .toLocaleLowerCase('tr-TR')
    .trim();
}

function getDefaultPetAvatar(
  type?: string,
): ImageSourcePropType {
  const value = normalizePetType(type);

  /* KEDİ */

  if (
    value.includes('kedi') ||
    value.includes('cat')
  ) {
    return defaultCatAvatar;
  }

  /* KÖPEK */

  if (
    value.includes('köpek') ||
    value.includes('kopek') ||
    value.includes('dog')
  ) {
    return defaultDogAvatar;
  }

  /* TAVŞAN */

  if (
    value.includes('tavşan') ||
    value.includes('tavsan') ||
    value.includes('rabbit')
  ) {
    return defaultRabbitAvatar;
  }

  /* KUŞ */

  if (
    value.includes('kuş') ||
    value.includes('kus') ||
    value.includes('bird') ||
    value.includes('muhabbet')
  ) {
    return defaultBirdAvatar;
  }

  /* HAMSTER */

  if (value.includes('hamster')) {
    return defaultHamsterAvatar;
  }

  /*
   * Balık ve "Diğer" için henüz özel pixel avatar
   * hazırlamadığımız için geçici fallback.
   */
  return defaultCatAvatar;
}

/* =========================================================
   HOME SCREEN
========================================================= */

export default function HomeScreen() {
  const {pets} = usePets();

  const navigation = useNavigation<any>();

  const petList: Pet[] = pets || [];

  const totalPets = petList.length;

  const petsWithVaccines = petList.filter(
    pet => pet.vaccines?.trim(),
  ).length;

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.bg}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>
          <View style={styles.brandArea}>

            <View style={styles.logo}>
              <PawPrint
                size={24}
                color={C.purple}
                strokeWidth={2.3}
              />
            </View>

            <View>
              <Text style={styles.brand}>
                PetCare
              </Text>

              <Text style={styles.tagline}>
                Happy Pets, Happier Lives
              </Text>
            </View>

          </View>

          <Pressable
            style={({pressed}) => [
              styles.notification,
              pressed && styles.pressed,
            ]}>

            <Bell
              size={21}
              color={C.text}
              strokeWidth={1.9}
            />

            <View style={styles.notificationDot} />

          </Pressable>
        </View>

        {/* =====================================================
            HERO
        ===================================================== */}

        <View style={styles.hero}>
          <Image
            source={require(
              '../assets/images/hero/petcare-home-hero.png'
            )}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* =====================================================
            STATS
        ===================================================== */}

        <View style={styles.stats}>

          {/* KAYITLI DOST */}

          <Pressable
            onPress={() =>
              navigation.navigate('Pets')
            }
            style={({pressed}) => [
              styles.statCard,
              pressed && styles.pressed,
            ]}>

            <View style={styles.statIconPurple}>
              <PawPrint
                size={22}
                color={C.purple}
                strokeWidth={2}
              />
            </View>

            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {totalPets}
              </Text>

              <Text style={styles.statLabel}>
                Kayıtlı dost
              </Text>
            </View>

            <ChevronRight
              size={17}
              color="#B4AFC0"
            />

          </Pressable>

          {/* AŞI KAYDI */}

          <View style={styles.statCard}>

            <View style={styles.statIconPink}>
              <Heart
                size={21}
                color={C.pinkText}
                strokeWidth={2}
              />
            </View>

            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {petsWithVaccines}
              </Text>

              <Text style={styles.statLabel}>
                Aşı kaydı
              </Text>
            </View>

          </View>

        </View>

        {/* =====================================================
            HIZLI İŞLEMLER
        ===================================================== */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Hızlı İşlemler
          </Text>
        </View>

        <View style={styles.quickGrid}>

          {/* 1. SATIR */}

          <View style={styles.quickRow}>

            <QuickAction
              title="Aşı Takvimi"
              description="Yaklaşan aşıları takip et"
              background={C.orange}
              iconBackground="#FFE7CD"
              onPress={() =>
                navigation.navigate('Calendar')
              }
              icon={
                <CalendarDays
                  size={24}
                  color={C.orangeText}
                  strokeWidth={1.9}
                />
              }
            />

            <QuickAction
              title="Sağlık Kaydı"
              description="Sağlık bilgilerini görüntüle"
              background={C.blue}
              iconBackground="#DDE7FF"
              onPress={() =>
                navigation.navigate('Pets')
              }
              icon={
                <Stethoscope
                  size={24}
                  color={C.blueText}
                  strokeWidth={1.9}
                />
              }
            />

          </View>

          {/* 2. SATIR */}

          <View style={styles.quickRow}>

            <QuickAction
              title="Mama Rehberi"
              description="Beslenme hakkında bilgi al"
              background={C.green}
              iconBackground="#D8F2E8"
              onPress={() =>
                navigation.navigate('Assistant')
              }
              icon={
                <Utensils
                  size={23}
                  color={C.greenText}
                  strokeWidth={1.9}
                />
              }
            />

            <QuickAction
              title="Uzmanına Sor"
              description="PetCare asistana danış"
              background={C.purpleSoft}
              iconBackground="#E2DAFF"
              onPress={() =>
                navigation.navigate('Assistant')
              }
              icon={
                <Bot
                  size={24}
                  color={C.purple}
                  strokeWidth={1.9}
                />
              }
            />

          </View>

        </View>

        {/* =====================================================
            DOSTLARIN
        ===================================================== */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Dostların
          </Text>

          {totalPets > 0 && (
            <Pressable
              onPress={() =>
                navigation.navigate('Pets')
              }>

              <Text style={styles.seeAll}>
                Tümünü Gör
              </Text>

            </Pressable>
          )}

        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.petProfiles}>

          {/* KAYITLI DOSTLAR */}

          {petList.map(pet => (
            <PetProfile
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

          {/* DOST EKLE */}

          <Pressable
            onPress={() =>
              navigation.navigate('AddPet')
            }
            style={({pressed}) => [
              styles.addPetProfile,
              pressed && styles.pressed,
            ]}>

            <View style={styles.addPetCircle}>
              <Plus
                size={27}
                color={C.purple}
                strokeWidth={1.8}
              />
            </View>

            <Text style={styles.addPetText}>
              Dost Ekle
            </Text>

          </Pressable>

        </ScrollView>

        {/* =====================================================
            BUGÜNÜN ÖNERİSİ
        ===================================================== */}

        <View style={styles.tipCard}>

          {/* Arka plan dekorları */}

          <View style={styles.tipCircleTop} />
          <View style={styles.tipCircleRight} />
          <View style={styles.tipCircleBottom} />

          {/* Ampul */}

          <View style={styles.tipIcon}>
            <Lightbulb
              size={28}
              color="#F2A900"
              strokeWidth={1.9}
            />
          </View>

          {/* Yazılar */}

          <View style={styles.tipContent}>

            <Text style={styles.tipTitle}>
              Bugünün Önerisi
            </Text>

            <Text style={styles.tipDescription}>
              Dostlarının su tüketimini{'\n'}
              kontrol etmeyi unutma!
            </Text>

          </View>

          {/* KEDİ PNG */}

          <View style={styles.tipCatArea}>
            <Image
              source={require(
                '../assets/images/home/tip-cat.png'
              )}
              style={styles.tipCatImage}
              resizeMode="contain"
            />
          </View>

        </View>

      </ScrollView>
    </View>
  );
}

/* =========================================================
   QUICK ACTION COMPONENT
========================================================= */

function QuickAction({
  icon,
  title,
  description,
  background,
  iconBackground,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  background: string;
  iconBackground: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.quickCard,
        {backgroundColor: background},
        pressed && styles.pressed,
      ]}>

      <View
        style={[
          styles.quickIcon,
          {backgroundColor: iconBackground},
        ]}>
        {icon}
      </View>

      <Text style={styles.quickTitle}>
        {title}
      </Text>

      <Text style={styles.quickDescription}>
        {description}
      </Text>

      <View style={styles.quickArrow}>
        <ChevronRight
          size={15}
          color={C.secondary}
          strokeWidth={2}
        />
      </View>

    </Pressable>
  );
}

/* =========================================================
   PET PROFILE COMPONENT
========================================================= */

function PetProfile({
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
        styles.petProfile,
        pressed && styles.pressed,
      ]}>

      <View style={styles.petProfileCircle}>

        <View style={styles.petProfileBlob} />

        <Image
          source={getDefaultPetAvatar(pet.type)}
          style={styles.petProfileImage}
          resizeMode="contain"
        />

      </View>

      <Text
        numberOfLines={1}
        style={styles.petProfileName}>
        {pet.name}
      </Text>

      <Text
        numberOfLines={1}
        style={styles.petProfileType}>
        {pet.type}
      </Text>

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
    paddingTop: 18,
    paddingBottom: 125,
  },

  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.985}],
  },

  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 17,
  },

  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 46,
    height: 46,

    borderRadius: 15,

    backgroundColor: C.white,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 11,

    borderWidth: 1,
    borderColor: '#EFECF6',

    shadowColor: '#44366C',
    shadowOpacity: 0.07,
    shadowRadius: 11,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 2,
  },

  brand: {
    fontSize: 22,
    fontFamily: F.bold,

    color: C.text,

    letterSpacing: -0.7,
  },

  tagline: {
    fontSize: 9.5,
    fontFamily: F.regular,

    color: C.muted,

    marginTop: 1,
  },

  notification: {
    width: 45,
    height: 45,

    borderRadius: 23,

    backgroundColor: C.white,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#EFECF6',

    shadowColor: '#44366C',
    shadowOpacity: 0.07,
    shadowRadius: 11,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 2,
  },

  notificationDot: {
    position: 'absolute',

    width: 9,
    height: 9,

    borderRadius: 5,

    backgroundColor: '#F0525E',

    right: 8,
    top: 7,

    borderWidth: 2,
    borderColor: C.white,
  },

  /* =====================================================
     HERO
  ===================================================== */

  hero: {
    width: '100%',
    height: 250,

    borderRadius: 28,

    overflow: 'hidden',

    backgroundColor: '#EEE9FF',

    marginBottom: 14,

    shadowColor: '#513B92',
    shadowOpacity: 0.09,
    shadowRadius: 15,

    shadowOffset: {
      width: 0,
      height: 7,
    },

    elevation: 3,
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  /* =====================================================
     STATS
  ===================================================== */

  stats: {
    flexDirection: 'row',

    gap: 11,

    marginBottom: 30,
  },

  statCard: {
    flex: 1,

    height: 88,

    borderRadius: 20,

    backgroundColor: C.white,

    paddingHorizontal: 13,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#EEEAF4',

    shadowColor: '#392D65',
    shadowOpacity: 0.06,
    shadowRadius: 11,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 2,
  },

  statIconPurple: {
    width: 43,
    height: 43,

    borderRadius: 14,

    backgroundColor: C.purpleSoft,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 10,
  },

  statIconPink: {
    width: 43,
    height: 43,

    borderRadius: 14,

    backgroundColor: C.pink,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 10,
  },

  statContent: {
    flex: 1,
  },

  statNumber: {
    fontSize: 21,
    fontFamily: F.bold,

    color: C.text,
  },

  statLabel: {
    fontSize: 10.5,
    fontFamily: F.regular,

    color: C.secondary,

    marginTop: 1,
  },

  /* =====================================================
     SECTION
  ===================================================== */

  sectionHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontFamily: F.bold,

    letterSpacing: -0.35,

    color: C.text,
  },

  seeAll: {
    fontSize: 11.5,
    fontFamily: F.semiBold,

    color: C.purple,
  },

  /* =====================================================
     QUICK ACTIONS
  ===================================================== */

  quickGrid: {
    gap: 10,

    marginBottom: 31,
  },

  quickRow: {
    flexDirection: 'row',

    gap: 10,
  },

  quickCard: {
    flex: 1,

    height: 122,

    borderRadius: 22,

    padding: 14,

    position: 'relative',

    overflow: 'hidden',
  },

  quickIcon: {
    width: 40,
    height: 40,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 9,
  },

  quickTitle: {
    fontSize: 13,
    fontFamily: F.bold,

    color: C.text,
  },

  quickDescription: {
    fontSize: 9.5,
    lineHeight: 13,

    fontFamily: F.regular,

    color: C.secondary,

    marginTop: 3,

    maxWidth: '78%',
  },

  quickArrow: {
    position: 'absolute',

    right: 12,
    bottom: 12,

    width: 27,
    height: 27,

    borderRadius: 14,

    backgroundColor: 'rgba(255,255,255,0.65)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* =====================================================
     PETS
  ===================================================== */

  petProfiles: {
    paddingBottom: 4,
    paddingRight: 10,

    gap: 15,

    marginBottom: 29,
  },

  petProfile: {
    width: 78,

    alignItems: 'center',
  },

  petProfileCircle: {
    width: 74,
    height: 74,

    borderRadius: 37,

    backgroundColor: '#EEE9FF',

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',

    marginBottom: 7,
  },

  petProfileBlob: {
    position: 'absolute',

    width: 65,
    height: 65,

    borderRadius: 33,

    backgroundColor: '#DDD3FF',

    right: -16,
    bottom: -18,
  },

  /*
   * Eski petProfileEmoji kaldırıldı.
   * Artık hazırladığımız PNG avatar burada.
   */

  petProfileImage: {
    width: 68,
    height: 68,

    zIndex: 2,
  },

  petProfileName: {
    fontSize: 12.5,
    fontFamily: F.bold,

    color: C.text,

    maxWidth: 75,
  },

  petProfileType: {
    fontSize: 10,
    fontFamily: F.regular,

    color: C.muted,

    marginTop: 2,

    maxWidth: 75,
  },

  /* =====================================================
     ADD PET
  ===================================================== */

  addPetProfile: {
    width: 78,

    alignItems: 'center',
  },

  addPetCircle: {
    width: 74,
    height: 74,

    borderRadius: 37,

    backgroundColor: C.purpleSoft,

    borderWidth: 1.5,
    borderColor: '#DED5FF',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 7,
  },

  addPetText: {
    fontSize: 11,
    fontFamily: F.semiBold,

    color: C.purple,
  },

  /* =====================================================
     BUGÜNÜN ÖNERİSİ
  ===================================================== */

  tipCard: {
    width: '100%',
    height: 132,

    borderRadius: 25,

    backgroundColor: '#EEE9FF',

    flexDirection: 'row',
    alignItems: 'center',

    paddingLeft: 17,
    paddingRight: 12,

    overflow: 'hidden',

    position: 'relative',

    marginTop: 2,

    borderWidth: 1,
    borderColor: '#E9E3FC',
  },

  tipCircleTop: {
    position: 'absolute',

    width: 100,
    height: 100,

    borderRadius: 50,

    backgroundColor: '#F8F6FF',

    left: -45,
    top: -55,
  },

  tipCircleRight: {
    position: 'absolute',

    width: 120,
    height: 120,

    borderRadius: 60,

    backgroundColor: '#E5DCFF',

    right: -55,
    top: -65,
  },

  tipCircleBottom: {
    position: 'absolute',

    width: 150,
    height: 150,

    borderRadius: 75,

    backgroundColor: '#DCD1FF',

    right: -65,
    bottom: -95,
  },

  tipIcon: {
    width: 59,
    height: 68,

    borderRadius: 18,

    backgroundColor: '#FFF3C9',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 14,

    zIndex: 3,

    shadowColor: '#E5B13B',
    shadowOpacity: 0.05,
    shadowRadius: 7,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 1,
  },

  tipContent: {
    flex: 1,

    zIndex: 3,

    paddingRight: 63,
  },

  tipTitle: {
    fontSize: 15.5,
    lineHeight: 20,

    fontFamily: F.bold,

    color: C.text,

    letterSpacing: -0.2,
  },

  tipDescription: {
    fontSize: 11,
    lineHeight: 16,

    fontFamily: F.regular,

    color: C.secondary,

    marginTop: 6,
  },

  /* =====================================================
     TIP CAT PNG
  ===================================================== */

  tipCatArea: {
    position: 'absolute',

    right: 0,
    bottom: -25,

    width: 125,
    height: 120,

    justifyContent: 'flex-end',
    alignItems: 'flex-end',

    zIndex: 4,
  },

  tipCatImage: {
    width: 200,
    height: 150,
  },
});