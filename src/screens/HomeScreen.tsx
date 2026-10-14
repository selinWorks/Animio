import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Bell,
  CalendarDays,
  ChevronRight,
  FileText,
  PawPrint,
  X,
} from 'lucide-react-native';

import Svg, {Rect} from 'react-native-svg';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {EventType} from '@notifee/react-native';

import {usePets} from '../data/PetContext';
import {useAuth} from '../data/AuthContext';
import {getCareEventsFromFirestore} from '../services/firestore';

const garden = require('../assets/images/home/animio-garden.png');
const logo = require('../assets/images/home/animio-logo.png');

const gardenSize = Image.resolveAssetSource(garden);

const COLORS = {
  purple: '#6942C8',
  dark: '#422A73',
  buttonBackground: '#FAF9F6',
};

type BannerData = {
  title: string;
  note: string;
  petName: string;
};

type ButtonPosition = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const {pets} = usePets();
  const {user} = useAuth();

  const [layout, setLayout] = useState({
    width: 0,
    height: 0,
  });

  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] =
    useState(false);
  const [banner, setBanner] = useState<BannerData | null>(null);

  const bannerOpacity = useRef(new Animated.Value(0)).current;

  const bannerTimer = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const petList = pets ?? [];
  const totalPets = petList.length;

  const petsWithVaccines = petList.filter(
    pet => Boolean(pet.vaccines?.trim()),
  ).length;

  /* ANLIK BİLDİRİM */

  const showBanner = useCallback(
    (notification: BannerData) => {
      if (bannerTimer.current) {
        clearTimeout(bannerTimer.current);
      }

      setBanner(notification);
      bannerOpacity.stopAnimation();
      bannerOpacity.setValue(0);

      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      bannerTimer.current = setTimeout(() => {
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }, 4000);
    },
    [bannerOpacity],
  );

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(
      ({type, detail}) => {
        if (
          type !== EventType.DELIVERED ||
          !detail.notification
        ) {
          return;
        }

        const notification = detail.notification;
        const data = notification.data ?? {};

        setHasNewNotifications(true);

        showBanner({
          title: String(
            data.title ??
              notification.title ??
              'Bakım zamanı geldi',
          ),
          note: String(data.note ?? notification.body ?? ''),
          petName: String(data.petName ?? ''),
        });
      },
    );

    return () => {
      unsubscribe();

      if (bannerTimer.current) {
        clearTimeout(bannerTimer.current);
      }

      bannerOpacity.stopAnimation();
    };
  }, [showBanner, bannerOpacity]);

  /* OKUNMAMIŞ BİLDİRİMLER */

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let checking = false;

      const checkNotifications = async () => {
        if (!user?.uid) {
          if (active) {
            setHasNewNotifications(false);
          }

          return;
        }

        if (checking) {
          return;
        }

        checking = true;

        try {
          const events = await getCareEventsFromFirestore(
            user.uid,
          );

          const lastRead = await AsyncStorage.getItem(
            'last_notification_read_time',
          );

          if (!active) {
            return;
          }

          const parsedLastRead = lastRead
            ? new Date(lastRead).getTime()
            : 0;

          const lastReadTime = Number.isNaN(parsedLastRead)
            ? 0
            : parsedLastRead;

          const now = Date.now();

          const hasUnread = events.some((event: any) => {
            if (!event.date) {
              return false;
            }

            const eventTime = new Date(
              `${event.date}T${event.time || '00:00'}:00`,
            ).getTime();

            return (
              !Number.isNaN(eventTime) &&
              eventTime <= now &&
              eventTime > lastReadTime
            );
          });

          setHasNewNotifications(hasUnread);
        } catch (error) {
          console.log('Bildirim kontrol hatası:', error);
        } finally {
          checking = false;
        }
      };

      checkNotifications();

      const interval = setInterval(
        checkNotifications,
        10000,
      );

      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [user?.uid]),
  );

  /* WALLPAPER KONUM HESABI */

  const scale = Math.max(
    layout.width / gardenSize.width,
    layout.height / gardenSize.height,
  );

  const renderedWidth = gardenSize.width * scale;
  const renderedHeight = gardenSize.height * scale;

  const offsetX = (layout.width - renderedWidth) / 2;
  const offsetY = (layout.height - renderedHeight) / 2;

  const positionAt = (
    x: number,
    y: number,
    buttonWidth: number,
    buttonHeight = 44,
  ): ButtonPosition => ({
    left: Math.max(
      12,
      Math.min(
        layout.width - buttonWidth - 12,
        offsetX + renderedWidth * x - buttonWidth / 2,
      ),
    ),
    top: offsetY + renderedHeight * y - buttonHeight / 2,
    width: buttonWidth,
    height: buttonHeight,
  });

  const uiScale = Math.max(
    0.85,
    Math.min(layout.width / 390, 1.15),
  );

  const calendarWidth = 100 * uiScale;
  const petsWidth = 118 * uiScale;
  const pdfWidth = 122 * uiScale;

  const layoutReady = layout.width > 0 && layout.height > 0;

  return (
    <View
      style={styles.screen}
      onLayout={event => {
        const {width, height} = event.nativeEvent.layout;

        setLayout(current => {
          if (
            current.width === width &&
            current.height === height
          ) {
            return current;
          }

          return {width, height};
        });
      }}>
      <Image
        source={garden}
        style={styles.background}
        resizeMode="cover"
      />

      {/* LOGO */}

      <Image
        source={logo}
        style={[
          styles.animioLogo,
          {top: insets.top + 4},
        ]}
        resizeMode="contain"
        accessibilityLabel="Animio"
        pointerEvents="none"
      />

      {/* BİLDİRİMLER */}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bildirimler"
        onPress={() => {
          setHasNewNotifications(false);
          navigation.navigate('Notifications');
        }}
        style={({pressed}) => [
          styles.notificationButton,
          {top: insets.top + 18},
          pressed && styles.pressed,
        ]}>
        <Bell
          size={23}
          color={COLORS.dark}
          strokeWidth={1.9}
        />

        {hasNewNotifications && (
          <View style={styles.notificationDot} />
        )}
      </Pressable>

      {/* DOST SAYILARI */}

      {layoutReady && (
        <View
          style={[
            styles.statsPill,
            {
              left: Math.max(
                22,
                offsetX + renderedWidth * 0.07,
              ),
              top: Math.max(
                insets.top + 100,
                offsetY + renderedHeight * 0.135,
              ),
            },
          ]}>
          <Text style={styles.statsText}>
            {totalPets} dost
          </Text>

          <Text style={styles.statsDot}>·</Text>

          <Text style={styles.statsText}>
            {petsWithVaccines} aşı kayıtlı dost
          </Text>
        </View>
      )}

      {/* BAHÇE BUTONLARI */}

      {layoutReady && (
        <>
          <GardenButton
            title="Takvim"
            angle="-5deg"
            icon={
              <CalendarDays
                size={18}
                color={COLORS.purple}
                strokeWidth={2}
              />
            }
            position={positionAt(
              0.14,
              0.480,
              calendarWidth,
            )}
            onPress={() => navigation.navigate('Calendar')}
          />

          <GardenButton
            title="Dostlarım"
            angle="4deg"
            icon={
              <PawPrint
                size={18}
                color={COLORS.purple}
                fill={COLORS.purple}
                strokeWidth={1.4}
              />
            }
            position={positionAt(
              0.84,
              0.405,
              petsWidth,
            )}
            onPress={() => navigation.navigate('Pets')}
          />

          <GardenButton
            title={'PDF Belge\nOluştur'}
            angle="6deg"
            icon={
              <FileText
                size={20}
                color={COLORS.purple}
                strokeWidth={2}
              />
            }
            position={positionAt(
              0.80,
              0.66,
              pdfWidth,
              48,
            )}
            onPress={() => setPdfModalVisible(true)}
          />
        </>
      )}

      {/* ANLIK BİLDİRİM */}

      {banner && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.banner,
            {
              top: insets.top + 12,
              opacity: bannerOpacity,
              transform: [
                {
                  translateY: bannerOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-15, 0],
                  }),
                },
              ],
            },
          ]}>
          <CalendarDays
            size={23}
            color={COLORS.purple}
          />

          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              Bakım zamanı geldi
            </Text>

            <Text
              style={styles.bannerText}
              numberOfLines={2}>
              {banner.petName ? `${banner.petName} · ` : ''}
              {banner.title}
              {banner.note ? ` · ${banner.note}` : ''}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* PDF İÇİN DOST SEÇİMİ */}

      <Modal
        visible={pdfModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPdfModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            accessibilityLabel="Pencereyi kapat"
            onPress={() => setPdfModalVisible(false)}
          />

          <View
            accessibilityViewIsModal
            style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                PDF Belge Oluştur
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kapat"
                hitSlop={10}
                onPress={() => setPdfModalVisible(false)}
                style={styles.closeButton}>
                <X size={21} color={COLORS.dark} />
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              Belgesini hazırlamak istediğin dostunu seç.
            </Text>

            {petList.length === 0 ? (
              <View style={styles.emptyState}>
                <PawPrint
                  size={32}
                  color={COLORS.purple}
                />

                <Text style={styles.emptyText}>
                  Henüz kayıtlı bir dostun yok.
                </Text>

                <Pressable
                  style={styles.emptyButton}
                  onPress={() => {
                    setPdfModalVisible(false);
                    navigation.navigate('AddPet');
                  }}>
                  <Text style={styles.emptyButtonText}>
                    Dost Ekle
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                style={styles.petList}
                showsVerticalScrollIndicator={false}>
                {petList.map(pet => (
                  <Pressable
                    key={pet.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setPdfModalVisible(false);
                      navigation.navigate('PetSummary', {pet});
                    }}
                    style={({pressed}) => [
                      styles.petRow,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.petIcon}>
                      <PawPrint
                        size={22}
                        color={COLORS.purple}
                      />
                    </View>

                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>
                        {pet.name}
                      </Text>

                      <Text style={styles.petType}>
                        {pet.type}
                      </Text>
                    </View>

                    <ChevronRight
                      size={19}
                      color={COLORS.purple}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function GardenButton({
  title,
  angle,
  icon,
  position,
  onPress,
}: {
  title: string;
  angle: string;
  icon: React.ReactNode;
  position: ButtonPosition;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title.replace('\n', ' ')}
      onPress={onPress}
      style={({pressed}) => [
        styles.gardenButton,
        position,
        {
          transform: [
            {rotate: angle},
            {scale: pressed ? 0.96 : 1},
          ],
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Svg
        pointerEvents="none"
        width="100%"
        height="100%"
        viewBox="0 0 160 56"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFillObject}>
        <Rect
          x={2}
          y={2}
          width={156}
          height={52}
          rx={24}
          fill={COLORS.buttonBackground}
          stroke="#9D74DA"
          strokeWidth={2.5}
        />

        <Rect
          x={5}
          y={5}
          width={150}
          height={46}
          rx={21}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />
      </Svg>

      <View
        pointerEvents="none"
        style={styles.gardenButtonContent}>
        {icon}

        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          style={styles.gardenButtonText}>
          {title}
        </Text>

        <ChevronRight
          size={16}
          color={COLORS.purple}
          strokeWidth={2.3}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#DCD9E9',
    overflow: 'hidden',
  },

  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  animioLogo: {
    marginTop: -15,
    position: 'absolute',
    left: 22,
    width: 190,
    height: 106,
  },

  notificationButton: {
    position: 'absolute',
    right: 22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFBF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#49366E',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },

  notificationDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F37879',
    borderWidth: 1.5,
    borderColor: '#FFFBF5',
  },

  statsPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: 'rgba(255,250,241,0.95)',
    gap: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    marginTop: -20,
  },

  statsText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: COLORS.dark,
  },

  statsDot: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    color: COLORS.purple,
  },

  gardenButton: {
    position: 'absolute',
    shadowColor: '#513371',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },

  gardenButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    gap: 4,
  },

  gardenButtonText: {
    flex: 1,
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    color: '#38216B',
  },

  pressed: {
    opacity: 0.8,
    transform: [{scale: 0.97}],
  },

  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E0FA',
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 13,
    color: COLORS.purple,
  },

  bannerText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.dark,
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28,18,45,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    backgroundColor: '#FFFCF8',
    borderRadius: 26,
    padding: 22,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitle: {
    flex: 1,
    fontFamily: 'Quicksand-Bold',
    fontSize: 20,
    color: COLORS.dark,
    marginRight: 12,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EAF8',
  },

  modalDescription: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 13,
    lineHeight: 19,
    color: '#82718E',
    marginTop: 10,
    marginBottom: 18,
  },

  petList: {
    flexGrow: 0,
    flexShrink: 1,
  },

  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 9,
    borderRadius: 17,
    backgroundColor: '#F3EDF9',
  },

  petIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7DCF8',
  },

  petInfo: {
    flex: 1,
    marginLeft: 12,
  },

  petName: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 15,
    color: COLORS.dark,
  },

  petType: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 11,
    color: '#82718E',
    marginTop: 3,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  emptyText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    color: COLORS.dark,
    marginTop: 12,
  },

  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: COLORS.purple,
  },

  emptyButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});