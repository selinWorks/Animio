import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Bell, Calendar, Clock } from 'lucide-react-native';
import { useAuth } from '../data/AuthContext';
import { getCareEventsFromFirestore } from '../services/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// useEffect içerisine şunu ekleyebilirsin:
useEffect(() => {
  const markAsRead = async () => {
    try {
      const nowTime = new Date().toISOString();
      await AsyncStorage.setItem('last_notification_read_time', nowTime);
    } catch (error) {
      console.log('Okundu işaretlenemedi:', error);
    }
  };

  markAsRead();
}, []);

const NotificationsScreen = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.uid) return;
      try {
        const events = await getCareEventsFromFirestore(user.uid);

        // ŞU ANKI ZAMAN
        const now = new Date();

        // FİLTRELEME: Sadece tarihi ve saati gelmiş (veya geçmiş) etkinlikleri bildirim yapıyoruz
        const activeNotifications = events.filter(item => {
          if (!item.date) return false;
          const eventDate = new Date(item.date);
          return eventDate <= now; // Etkinlik zamanı şimdiki zamandan önce veya şimdi ise göster
        });

        setNotifications(activeNotifications);
      } catch (error) {
        console.log('Bildirimler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user?.uid]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Bell size={24} color="#7257FF" />
        <Text style={styles.headerTitle}>Bildirimler</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#9B86FF" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Şuan aktif bir bildiriminiz bulunmuyor.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.notificationCard}>
              <View style={[styles.iconBox, { backgroundColor: item.color || '#F3F0FF' }]}>
                <Calendar size={20} color="#7257FF" />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                {item.note ? <Text style={styles.notifMessage}>{item.note}</Text> : null}
                <View style={styles.timeRow}>
                  <Clock size={12} color="#687492" />
                  <Text style={styles.notifDate}>
                    {new Date(item.date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    color: '#11163A',
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontFamily: 'Quicksand-Medium', fontSize: 14, color: '#687492', textAlign: 'center' },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E8F2',
    shadowColor: '#7257FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  notificationContent: { flex: 1 },
  notifTitle: { fontFamily: 'Quicksand-Bold', fontSize: 15, color: '#11163A', marginBottom: 4 },
  notifMessage: { fontFamily: 'Quicksand-Regular', fontSize: 13, color: '#687492', marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notifDate: { fontFamily: 'Quicksand-Medium', fontSize: 11, color: '#687492' },
});

export default NotificationsScreen;