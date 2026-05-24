import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {
  addCareEventToFirestore,
  getCareEventsFromFirestore,
  deleteCareEventFromFirestore,
} from '../services/firestore';
import notifee, {AndroidImportance, TriggerType} from '@notifee/react-native';
import {useAuth} from '../data/AuthContext';

type CareEventType =
  | 'Vaccination'
  | 'Vet Visit'
  | 'Medication'
  | 'Grooming'
  | 'Custom';

type CareEvent = {
  id: string;
  title: string;
  date: string;
  type: CareEventType;
  petName: string;
  note?: string;
  color?: string;
};

const PASTEL_COLORS = [
  '#F9A8D4',
  '#93C5FD',
  '#C4B5FD',
  '#86EFAC',
  '#FCD34D',
  '#FCA5A5',
  '#67E8F9',
  '#FDBA74',
];

export default function CalendarScreen() {
  const today = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<CareEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [petName, setPetName] = useState('');
  const [note, setNote] = useState('');
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[2]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [toastTitle, setToastTitle] = useState('Başarılı');
  const [toastDescription, setToastDescription] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const toastTranslateX = useRef(new Animated.Value(140)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {user} = useAuth();

  const loadEvents = async () => {
      try {
        setLoading(true);

        if (!user?.uid) {
          setEvents([]);
          return;
        }

        const firestoreEvents = await getCareEventsFromFirestore(user.uid);
        setEvents(firestoreEvents as CareEvent[]);
      } catch (error: any) {
        console.log('Takvim verileri alınamadı:', error);
        Alert.alert('Hata', error?.message || 'Takvim verileri alınamadı.');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
      requestNotificationPermission();
      loadEvents();

      return () => {
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
      };
  }, []);

  const showToast = (titleText: string, descriptionText: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToastTitle(titleText);
    setToastDescription(descriptionText);
    setToastVisible(true);
    toastTranslateX.setValue(140);
    toastOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(toastTranslateX, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    toastTimeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastTranslateX, {
          toValue: 140,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToastVisible(false);
      });
    }, 3200);
  };

  const requestNotificationPermission = async () => {
  await notifee.requestPermission();

  await notifee.createChannel({
    id: 'care-reminders',
    name: 'Care Reminders',
    importance: AndroidImportance.HIGH,
  });
};

const getNotificationDate = (dateString: string) => {
  const notificationDate = new Date(`${dateString}T09:00:00`);

  if (notificationDate.getTime() <= Date.now()) {
    notificationDate.setMinutes(notificationDate.getMinutes() + 1);
  }

  return notificationDate;
};

const scheduleCareNotification = async (
  eventId: string,
  eventTitle: string,
  petNameText: string,
  dateString: string,
) => {
  await requestNotificationPermission();

  const notificationDate = getNotificationDate(dateString);
      await notifee.createTriggerNotification(
        {
          id: `care-${eventId}`,
          title: 'PetCare Hatırlatma',
          body: `${petNameText} için ${eventTitle} zamanı geldi.`,
          android: {
            channelId: 'care-reminders',
            pressAction: {
              id: 'default',
            },
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: notificationDate.getTime(),
        },
      );
    };

    const cancelCareNotification = async (eventId: string) => {
      await notifee.cancelNotification(`care-${eventId}`);
    };

  const resetForm = () => {
    setTitle('');
    setPetName('');
    setNote('');
    setSelectedColor(PASTEL_COLORS[2]);
  };

  const handleAddEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Görev başlığı girmen gerekiyor.');
      return;
    }

    if (!petName.trim()) {
      Alert.alert('Hata', 'Pet adı girmen gerekiyor.');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Hata', 'Görev eklemek için giriş yapmalısın.');
      return;
    }

    try {
      setSaving(true);

    const eventTitle = title.trim();
    const eventPetName = petName.trim();

    const eventId = await addCareEventToFirestore(
      {
        title: eventTitle,
        date: selectedDate,
        type: 'Custom',
        petName: eventPetName,
        note: note.trim(),
        color: selectedColor,
      },
      user.uid,
    );

    try {
      await scheduleCareNotification(
        eventId,
        eventTitle,
        eventPetName,
        selectedDate,
      );
    } catch (notificationError) {
      console.log('Bildirim planlanamadı:', notificationError);
    }

      resetForm();
      setModalVisible(false);
      await loadEvents();
      showToast('Başarılı', 'Bakım görevi takvime eklendi ✨');
    } catch (error: any) {
      console.log('Görev eklenemedi:', error);
      Alert.alert('Hata', error?.message || 'Görev kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedEventId) {
      return;
    }

    try {
      setDeleting(true);
      await deleteCareEventFromFirestore(selectedEventId);
      await cancelCareNotification(selectedEventId);
      setDeleteModalVisible(false);
      setSelectedEventId(null);
      await loadEvents();
      showToast('Silindi', 'Bakım görevi takvimden kaldırıldı');
    } catch (error) {
      console.log('Görev silinemedi:', error);
      Alert.alert('Hata', 'Görev silinemedi.');
    } finally {
      setDeleting(false);
    }
  };

  const eventsForSelectedDay = events.filter(
    event => event.date === selectedDate,
  );

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    events.forEach(event => {
      marked[event.date] = {
        marked: true,
        dotColor: event.color || '#A78BFA',
      };
    });

    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: '#A78BFA',
      selectedTextColor: '#FFFFFF',
    };

    return marked;
  }, [events, selectedDate]);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroTitle}>Care Calendar</Text>
              <Text style={styles.heroSubtitle}>
                Aşıları, veteriner randevularını ve bakım görevlerini tek yerden
                takip et.
              </Text>
            </View>

            <Pressable
              onPress={() => setModalVisible(true)}
              style={({pressed}) => [
                styles.heroActionButton,
                pressed && styles.heroActionButtonPressed,
              ]}>
              <Text style={styles.heroActionIcon}>＋</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <Calendar
            current={today}
            onDayPress={day => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            hideExtraDays={true}
            enableSwipeMonths={true}
            hideArrows={false}
            renderArrow={direction => (
              <Text style={styles.calendarArrow}>
                {direction === 'left' ? '‹' : '›'}
              </Text>
            )}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#94A3B8',
              selectedDayBackgroundColor: '#A78BFA',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#8B5CF6',
              dayTextColor: '#111827',
              textDisabledColor: '#CBD5E1',
              arrowColor: '#8B5CF6',
              monthTextColor: '#111827',
              indicatorColor: '#8B5CF6',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 15,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.selectedDayCard}>
          <View>
            <Text style={styles.dayHeaderTitle}>Selected Day</Text>
            <Text style={styles.dayHeaderDate}>{selectedDate}</Text>
          </View>

          <View style={styles.dayChip}>
            <Text style={styles.dayChipText}>
              {eventsForSelectedDay.length} task
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>Takvim yükleniyor</Text>
            <Text style={styles.emptyText}>
              Bakım görevleri Firestore’dan getiriliyor.
            </Text>
          </View>
        ) : eventsForSelectedDay.length > 0 ? (
          eventsForSelectedDay.map(event => {
            const eventColor = event.color || '#A78BFA';

            return (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeaderRow}>
                  <View
                    style={[
                      styles.titleChip,
                      {backgroundColor: `${eventColor}20`},
                    ]}>
                    <Text
                      style={[
                        styles.titleChipText,
                        {color: eventColor},
                      ]}>
                      {event.title}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handleDeleteEvent(event.id)}
                    style={({pressed}) => [
                      styles.deleteButton,
                      pressed && styles.deleteButtonPressed,
                    ]}>
                    <Text style={styles.deleteButtonText}>Sil</Text>
                  </Pressable>
                </View>

                <Text style={styles.eventPetName}>🐾 {event.petName}</Text>

                {event.note ? (
                  <Text style={styles.eventNote}>{event.note}</Text>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌷</Text>
            <Text style={styles.emptyTitle}>Bugün için görev yok</Text>
            <Text style={styles.emptyText}>
              Seçilen tarihte görev görünmüyor.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>✨</Text>
            <Text style={styles.modalTitle}>Yeni Bakım Görevi</Text>
            <Text style={styles.modalSubtitle}>
              Seçili tarih: {selectedDate}
            </Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Görev başlığı"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <TextInput
              value={petName}
              onChangeText={setPetName}
              placeholder="Pet adı"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={styles.colorPickerLabel}>Görev rengi seç</Text>

            <View style={styles.colorGrid}>
              {PASTEL_COLORS.map(color => {
                const selected = selectedColor === color;

                return (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.colorOption,
                      {backgroundColor: color},
                      selected && styles.colorOptionSelected,
                    ]}>
                    {selected ? (
                      <Text style={styles.colorCheck}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Not ekle"
              placeholderTextColor="#9CA3AF"
              multiline
              style={[styles.input, styles.noteInput]}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
                style={({pressed}) => [
                  styles.cancelButton,
                  pressed && styles.cancelButtonPressed,
                ]}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </Pressable>

              <Pressable
                onPress={handleAddEvent}
                style={({pressed}) => [
                  styles.saveButton,
                  pressed && styles.saveButtonPressed,
                ]}>
                <Text style={styles.saveButtonText}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteEmoji}>⚠️</Text>
            <Text style={styles.deleteTitle}>Görevi sil</Text>
            <Text style={styles.deleteText}>
              Bu bakım görevini silmek istediğine emin misin?
            </Text>

            <View style={styles.deleteButtons}>
              <Pressable
                onPress={() => {
                  setDeleteModalVisible(false);
                  setSelectedEventId(null);
                }}
                style={({pressed}) => [
                  styles.cancelDeleteBtn,
                  pressed && styles.cancelDeleteBtnPressed,
                ]}>
                <Text style={styles.cancelDeleteText}>Vazgeç</Text>
              </Pressable>

              <Pressable
                onPress={confirmDelete}
                style={({pressed}) => [
                  styles.confirmDeleteBtn,
                  pressed && styles.confirmDeleteBtnPressed,
                ]}>
                <Text style={styles.confirmDeleteText}>
                  {deleting ? 'Siliniyor...' : 'Sil'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {toastVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.successToast,
            {
              opacity: toastOpacity,
              transform: [{translateX: toastTranslateX}],
            },
          ]}>
          <Text style={styles.successToastTitle}>{toastTitle}</Text>
          <Text style={styles.successToastText}>{toastDescription}</Text>
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 5,
  },
  heroCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    maxWidth: 250,
  },
  heroActionButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  heroActionButtonPressed: {
    transform: [{scale: 0.97}],
    backgroundColor: '#FFF7FB',
  },
  heroActionIcon: {
    fontSize: 24,
    color: '#8B5CF6',
    fontWeight: '700',
    marginTop: -2,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
  },
  calendar: {
    borderRadius: 18,
  },
  calendarArrow: {
    fontSize: 24,
    color: '#8B5CF6',
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  selectedDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayHeaderTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  dayHeaderDate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  dayChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  dayChipText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 13,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '74%',
  },
  titleChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  deleteButtonPressed: {
    opacity: 0.8,
    transform: [{scale: 0.97}],
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  eventPetName: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginBottom: 6,
  },
  eventNote: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    marginBottom: 12,
  },
  emptyEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.30)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    elevation: 8,
  },
  modalEmoji: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  colorPickerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    marginTop: 2,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  colorOption: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#111827',
    transform: [{scale: 1.05}],
  },
  colorCheck: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonPressed: {
    opacity: 0.9,
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#A5B4FC',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonPressed: {
    transform: [{scale: 0.98}],
    opacity: 0.95,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    elevation: 10,
  },
  deleteEmoji: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 10,
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  deleteButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelDeleteBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelDeleteBtnPressed: {
    opacity: 0.85,
  },
  cancelDeleteText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmDeleteBtnPressed: {
    transform: [{scale: 0.98}],
    opacity: 0.95,
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successToast: {
    position: 'absolute',
    top: 18,
    right: 16,
    maxWidth: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  successToastTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8B5CF6',
    marginBottom: 2,
  },
  successToastText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});