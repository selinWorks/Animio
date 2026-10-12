import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {
  Bell,
  CalendarDays,
  Clock,
  PawPrint,
} from 'lucide-react-native';

import {useAuth} from '../data/AuthContext';
import {getCareEventsFromFirestore} from '../services/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* =========================================================
   COLORS & FONTS — HOME SCREEN İLE UYUMLU
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
  border: '#ECE9F4',
};

const F = {
  regular: 'Quicksand-Regular',
  medium: 'Quicksand-Medium',
  semiBold: 'Quicksand-SemiBold',
  bold: 'Quicksand-Bold',
};

/* =========================================================
   NOTIFICATIONS SCREEN
========================================================= */

const NotificationsScreen = () => {
  const {user} = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* BİLDİRİMLERİ OKUNDU OLARAK İŞARETLE */

  useEffect(() => {
    const markAsRead = async () => {
      try {
        await AsyncStorage.setItem(
          'last_notification_read_time',
          new Date().toISOString(),
        );
      } catch (error) {
        console.log('Okundu işaretlenemedi:', error);
      }
    };

    markAsRead();
  }, []);

  /* FIRESTORE VERİLERİNİ GETİR */

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      if (!user?.uid) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const events = await getCareEventsFromFirestore(user.uid);
        const now = new Date();

        const activeNotifications = events
          .filter((item: any) => {
            if (!item.date) {
              return false;
            }

            const eventDate = new Date(
              `${item.date}T${item.time || '00:00'}:00`,
            );

            return (
              !Number.isNaN(eventDate.getTime()) &&
              eventDate.getTime() <= now.getTime()
            );
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(
              `${a.date}T${a.time || '00:00'}:00`,
            ).getTime();

            const dateB = new Date(
              `${b.date}T${b.time || '00:00'}:00`,
            ).getTime();

            return dateB - dateA;
          });

        if (isMounted) {
          setNotifications(activeNotifications);
        }
      } catch (error) {
        console.log('Bildirimler yüklenirken hata:', error);

        if (isMounted) {
          setNotifications([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  /* TARİH FORMATLAMA */

  const formatNotificationDate = (date: string, time?: string) => {
    const eventDate = new Date(`${date}T${time || '00:00'}:00`);

    if (Number.isNaN(eventDate.getTime())) {
      return `${date} · ${time || '00:00'}`;
    }

    const formattedDate = eventDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return `${formattedDate} · ${time || '00:00'}`;
  };

  /* NOTIFICATION CARD */

  const renderNotification = ({item}: {item: any}) => {
    return (
      <View style={styles.notificationCard}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: item.color || C.purpleSoft,
            },
          ]}>
          <CalendarDays
            size={22}
            color={C.purple}
            strokeWidth={1.9}
          />
        </View>

        <View style={styles.notificationContent}>
          {item.petName ? (
            <View style={styles.petLabel}>
              <PawPrint
                size={12}
                color={C.purple}
                strokeWidth={2}
              />
              <Text style={styles.petName}>{item.petName}</Text>
            </View>
          ) : null}

          <Text style={styles.notifTitle}>
            {item.title || 'Bakım etkinliği'}
          </Text>

          {item.note ? (
            <Text style={styles.notifMessage}>
              {item.note}
            </Text>
          ) : null}

          <View style={styles.timeRow}>
            <Clock
              size={13}
              color={C.muted}
              strokeWidth={1.9}
            />

            <Text style={styles.notifDate}>
              {formatNotificationDate(item.date, item.time)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  /* UI */

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Bell
            size={23}
            color={C.purple}
            strokeWidth={2}
          />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Bildirimler</Text>
          <Text style={styles.headerSubtitle}>
            Dostlarının bakım kayıtları
          </Text>
        </View>

        {notifications.length > 0 && !loading ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {notifications.length}
            </Text>
          </View>
        ) : null}
      </View>

      {/* LOADING */}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={C.purple}
          />

          <Text style={styles.loadingText}>
            Bildirimlerin yükleniyor...
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        /* EMPTY STATE */

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Bell
              size={34}
              color={C.purple}
              strokeWidth={1.6}
            />
          </View>

          <Text style={styles.emptyTitle}>
            Her şey yolunda!
          </Text>

          <Text style={styles.emptyText}>
            Şu an görüntülenecek bir bakım bildirimin bulunmuyor.
            Yeni bakım kayıtlarını buradan takip edebilirsin.
          </Text>
        </View>
      ) : (
        /* NOTIFICATION LIST */

        <FlatList
          data={notifications}
          keyExtractor={(item, index) =>
            item.id
              ? String(item.id)
              : `notification-${index}`
          }
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>
              BAKIM GEÇMİŞİ
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#44366C',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontFamily: F.bold,
    color: C.text,
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    fontSize: 11.5,
    fontFamily: F.regular,
    color: C.secondary,
    marginTop: 3,
  },

  countBadge: {
    minWidth: 29,
    height: 29,
    borderRadius: 15,
    paddingHorizontal: 8,
    backgroundColor: C.purpleSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },

  countText: {
    fontSize: 12,
    fontFamily: F.bold,
    color: C.purpleDark,
  },

  /* LOADING */

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  loadingText: {
    marginTop: 13,
    fontFamily: F.medium,
    fontSize: 12,
    color: C.secondary,
  },

  /* EMPTY STATE */

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingBottom: 70,
  },

  emptyIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 30,
    backgroundColor: C.purpleSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E0FF',
  },

  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 19,
    color: C.text,
    marginBottom: 9,
  },

  emptyText: {
    fontFamily: F.regular,
    fontSize: 12.5,
    lineHeight: 20,
    color: C.secondary,
    textAlign: 'center',
  },

  /* LIST */

  listContainer: {
    paddingHorizontal: 18,
    paddingBottom: 35,
  },

  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    letterSpacing: 1.1,
    color: C.muted,
    marginBottom: 13,
    marginLeft: 3,
  },

  /* CARD */

  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#392D65',
    shadowOpacity: 0.045,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  notificationContent: {
    flex: 1,
    paddingTop: 1,
  },

  petLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 5,
    gap: 5,
  },

  petName: {
    fontFamily: F.semiBold,
    fontSize: 10.5,
    color: C.purple,
  },

  notifTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    lineHeight: 20,
    color: C.text,
    marginBottom: 4,
  },

  notifMessage: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 18,
    color: C.secondary,
    marginBottom: 9,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },

  notifDate: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 10.5,
    color: C.muted,
  },
});

export default NotificationsScreen;