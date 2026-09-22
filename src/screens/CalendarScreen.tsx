import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Animated,
} from 'react-native';

import {Calendar} from 'react-native-calendars';

import {
  addCareEventToFirestore,
  getCareEventsFromFirestore,
  deleteCareEventFromFirestore,
} from '../services/firestore';

import notifee, {
  AndroidImportance,
  TriggerType,
} from '@notifee/react-native';

import {useAuth} from '../data/AuthContext';

import {
  FileText,
  PawPrint,
  LockKeyhole,
  Clock3,
  CalendarX2,
  TriangleAlert,
  Save,
  Trash2,
} from 'lucide-react-native';

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
  time?: string;
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

  const {user} = useAuth();

  /* =========================================================
     STATE
  ========================================================= */

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

  /* SAAT */

  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* =========================================================
     TOAST
  ========================================================= */

  const [toastTitle, setToastTitle] = useState('Başarılı');
  const [toastDescription, setToastDescription] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  /* =========================================================
     ERROR POPUP
  ========================================================= */

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [errorModalType, setErrorModalType] =
    useState<
      | 'title'
      | 'pet'
      | 'login'
      | 'time'
      | 'date'
      | 'load'
      | 'save'
      | 'delete'
    >('title');

  /* =========================================================
     REFS
  ========================================================= */

  const toastTranslateX = useRef(new Animated.Value(140)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const toastTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  /* =========================================================
     ERROR POPUP HELPER
  ========================================================= */

  const showErrorModal = (
    titleText: string,
    messageText: string,
    type:
      | 'title'
      | 'pet'
      | 'login'
      | 'time'
      | 'date'
      | 'load'
      | 'save'
      | 'delete',
  ) => {
    setErrorModalTitle(titleText);
    setErrorModalMessage(messageText);
    setErrorModalType(type);
    setErrorModalVisible(true);
  };

  /* =========================================================
     LOAD EVENTS
  ========================================================= */

  const loadEvents = async () => {
    try {
      setLoading(true);

      if (!user?.uid) {
        setEvents([]);
        return;
      }

      const firestoreEvents =
        await getCareEventsFromFirestore(user.uid);

      setEvents(firestoreEvents as CareEvent[]);
    } catch (error: any) {
      console.log(
        'Takvim verileri alınamadı:',
        error,
      );

      showErrorModal(
        'Takvim yüklenemedi',
        error?.message ||
          'Takvim verileri alınırken bir sorun oluştu.',
        'load',
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FIRST LOAD
  ========================================================= */

  useEffect(() => {
    requestNotificationPermission();
    loadEvents();

    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [user?.uid]);

  /* =========================================================
     TOAST
  ========================================================= */

  const showToast = (
    titleText: string,
    descriptionText: string,
  ) => {
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

  /* =========================================================
     NOTIFICATION
  ========================================================= */

  const requestNotificationPermission = async () => {
    await notifee.requestPermission();

    await notifee.createChannel({
      id: 'care-reminders',
      name: 'Care Reminders',
      importance: AndroidImportance.HIGH,
    });
  };

  const getNotificationDate = (
    dateString: string,
    timeString: string,
  ) => {
    const [year, month, day] =
      dateString.split('-').map(Number);

    const [hour, minute] =
      timeString.split(':').map(Number);

    return new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
      0,
    );
  };

  const scheduleCareNotification = async ({
    eventId,
    eventTitle,
    petNameText,
    dateString,
    timeString,
  }: {
    eventId: string;
    eventTitle: string;
    petNameText: string;
    dateString: string;
    timeString: string;
  }) => {
    try {
      const notificationDate =
        getNotificationDate(
          dateString,
          timeString,
        );

      console.log(
        'PLANLANAN BİLDİRİM:',
        notificationDate.toString(),
      );

      console.log(
        'TIMESTAMP:',
        notificationDate.getTime(),
      );

      console.log(
        'ŞİMDİ:',
        Date.now(),
      );

      if (
        notificationDate.getTime() <=
        Date.now()
      ) {
        console.log(
          'Bildirim zamanı geçmiş.',
        );

        return;
      }

      const channelId =
        await notifee.createChannel({
          id: 'care-reminders',
          name: 'PetCare Hatırlatıcıları',
          importance:
            AndroidImportance.HIGH,
        });

      await notifee.createTriggerNotification(
        {
          id: `care-${eventId}`,

          title: 'Bakım zamanı geldi ✨',

          body: petNameText
            ? `${petNameText} · ${eventTitle}`
            : eventTitle,

          data: {
            eventId: String(eventId),
            title: eventTitle || '',
            note: '',
            petName: petNameText || '',
            type: 'Custom',
            date: dateString,
            time: timeString,
          },

          android: {
            channelId,

            smallIcon: 'ic_launcher',

            pressAction: {
              id: 'default',
            },
          },
        },

        {
          type: TriggerType.TIMESTAMP,

          timestamp:
            notificationDate.getTime(),
        },
      );

      console.log(
        'NOTİFİKASYON BAŞARIYLA PLANLANDI',
      );
    } catch (error) {
      console.log(
        'Bildirim planlama hatası:',
        error,
      );
    }
  };

  const cancelCareNotification = async (
    eventId: string,
  ) => {
    await notifee.cancelNotification(
      `care-${eventId}`,
    );
  };

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setTitle('');
    setPetName('');
    setNote('');
    setSelectedColor(PASTEL_COLORS[2]);

    setSelectedHour('09');
    setSelectedMinute('00');
  };

  /* =========================================================
     ADD EVENT
  ========================================================= */

  const handleAddEvent = async () => {
    if (!title.trim()) {
      showErrorModal(
        'Görev başlığı eksik',
        'Bakım görevini kaydetmek için önce görev başlığını girmen gerekiyor.',
        'title',
      );

      return;
    }

    if (!petName.trim()) {
      showErrorModal(
        'Pet adı eksik',
        'Bu bakım görevinin hangi pet için olduğunu belirtmek için pet adını gir.',
        'pet',
      );

      return;
    }

    if (!user?.uid) {
      showErrorModal(
        'Giriş gerekli',
        'Bakım görevi eklemek için hesabına giriş yapman gerekiyor.',
        'login',
      );

      return;
    }

    const hour = Number(selectedHour);
    const minute = Number(selectedMinute);

    if (
      selectedHour === '' ||
      selectedMinute === '' ||
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      showErrorModal(
        'Geçersiz saat',
        'Lütfen 00-23 arasında bir saat ve 00-59 arasında bir dakika seç.',
        'time',
      );

      return;
    }

    const selectedTime =
      `${String(hour).padStart(2, '0')}:${String(
        minute,
      ).padStart(2, '0')}`;

    const selectedDateTime =
      getNotificationDate(
        selectedDate,
        selectedTime,
      );

    if (selectedDateTime.getTime() <= Date.now()) {
      showErrorModal(
        'Geçersiz tarih veya saat',
        'Hatırlatma için gelecekte bir tarih ve saat seçmelisin.',
        'date',
      );

      return;
    }

    try {
      setSaving(true);

      const eventTitle = title.trim();
      const eventPetName = petName.trim();

      const eventId =
        await addCareEventToFirestore(
          {
            title: eventTitle,
            date: selectedDate,
            time: selectedTime,
            type: 'Custom',
            petName: eventPetName,
            note: note.trim(),
            color: selectedColor,
          },
          user.uid,
        );

      try {
        await scheduleCareNotification({
          eventId,
          eventTitle,
          petNameText: eventPetName,
          dateString: selectedDate,
          timeString: selectedTime,
        });
      } catch (notificationError) {
        console.log(
          'Bildirim planlanamadı:',
          notificationError,
        );
      }

      resetForm();

      setModalVisible(false);

      await loadEvents();

      showToast(
        'Başarılı',
        `Bakım görevi ${selectedTime} için planlandı ✨`,
      );
    } catch (error: any) {
      console.log(
        'Görev eklenemedi:',
        error,
      );

      showErrorModal(
        'Görev kaydedilemedi',
        error?.message ||
          'Bakım görevi kaydedilirken bir sorun oluştu.',
        'save',
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE EVENT
  ========================================================= */

  const handleDeleteEvent = (
    eventId: string,
  ) => {
    setSelectedEventId(eventId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedEventId) {
      return;
    }

    try {
      setDeleting(true);

      await deleteCareEventFromFirestore(
        selectedEventId,
      );

      await cancelCareNotification(
        selectedEventId,
      );

      setDeleteModalVisible(false);
      setSelectedEventId(null);

      await loadEvents();

      showToast(
        'Silindi',
        'Bakım görevi takvimden kaldırıldı',
      );
    } catch (error) {
      console.log(
        'Görev silinemedi:',
        error,
      );

      showErrorModal(
        'Görev silinemedi',
        'Bakım görevi silinirken bir sorun oluştu. Lütfen tekrar dene.',
        'delete',
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =========================================================
     EVENTS FOR DAY
  ========================================================= */

  const eventsForSelectedDay =
    events.filter(
      event =>
        event.date === selectedDate,
    );

  /* =========================================================
     MARKED DATES
  ========================================================= */

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    events.forEach(event => {
      marked[event.date] = {
        marked: true,
        dotColor:
          event.color || '#A78BFA',
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

  /* =========================================================
     ERROR ICON
  ========================================================= */

  const renderErrorIcon = () => {
    switch (errorModalType) {
      case 'title':
        return (
          <FileText
            size={42}
            color="#9B87F5"
            strokeWidth={1.8}
          />
        );

      case 'pet':
        return (
          <PawPrint
            size={42}
            color="#9B87F5"
            strokeWidth={1.8}
          />
        );

      case 'login':
        return (
          <LockKeyhole
            size={42}
            color="#9B87F5"
            strokeWidth={1.8}
          />
        );

      case 'time':
        return (
          <Clock3
            size={42}
            color="#9B87F5"
            strokeWidth={1.8}
          />
        );

      case 'date':
        return (
          <CalendarX2
            size={42}
            color="#9B87F5"
            strokeWidth={1.8}
          />
        );

      case 'load':
        return (
          <TriangleAlert
            size={42}
            color="#9B87F5"
            strokeWidth={1.8}
          />
        );

      case 'save':
        return (
          <Save
            size={42}
            color="#9B87F5"
            strokeWidth={1.8}
          />
        );

      case 'delete':
        return (
          <Trash2
            size={42}
            color="#9B87F5"
            strokeWidth={1.8}
          />
        );

      default:
        return (
          <TriangleAlert
            size={42}
            color="#9B87F5"
            strokeWidth={1.8}
          />
        );
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* HERO */}

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>

            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>
                Care Calendar
              </Text>

              <Text style={styles.heroSubtitle}>
                Aşıları, veteriner randevularını ve bakım
                görevlerini tek yerden takip et.
              </Text>
            </View>

            <Pressable
              onPress={() =>
                setModalVisible(true)
              }
              style={({pressed}) => [
                styles.heroActionButton,
                pressed &&
                  styles.heroActionButtonPressed,
              ]}>

              <Text
                style={styles.heroActionIcon}>
                ＋
              </Text>

            </Pressable>
          </View>
        </View>

        {/* CALENDAR */}

        <View style={styles.calendarCard}>
          <Calendar
            current={today}

            onDayPress={day =>
              setSelectedDate(
                day.dateString,
              )
            }

            markedDates={markedDates}

            hideExtraDays={true}
            enableSwipeMonths={true}
            hideArrows={false}

            renderArrow={direction => (
              <Text
                style={styles.calendarArrow}>
                {direction === 'left'
                  ? '‹'
                  : '›'}
              </Text>
            )}

            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#94A3B8',

              selectedDayBackgroundColor:
                '#A78BFA',

              selectedDayTextColor:
                '#FFFFFF',

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

        {/* SELECTED DAY */}

        <View style={styles.selectedDayCard}>

          <View>
            <Text
              style={styles.dayHeaderTitle}>
              Selected Day
            </Text>

            <Text
              style={styles.dayHeaderDate}>
              {selectedDate}
            </Text>
          </View>

          <View style={styles.dayChip}>
            <Text
              style={styles.dayChipText}>
              {eventsForSelectedDay.length}{' '}
              task
            </Text>
          </View>

        </View>

        {/* EVENTS */}

        {loading ? (
          <View style={styles.emptyCard}>

            <Text style={styles.emptyEmoji}>
              ✨
            </Text>

            <Text style={styles.emptyTitle}>
              Takvim yükleniyor
            </Text>

            <Text style={styles.emptyText}>
              Bakım görevleri Firestore’dan
              getiriliyor.
            </Text>

          </View>
        ) : eventsForSelectedDay.length > 0 ? (
          eventsForSelectedDay.map(event => {
            const eventColor =
              event.color || '#A78BFA';

            return (
              <View
                key={event.id}
                style={styles.eventCard}>

                <View
                  style={styles.eventHeaderRow}>

                  <View
                    style={[
                      styles.titleChip,
                      {
                        backgroundColor:
                          `${eventColor}20`,
                      },
                    ]}>

                    <Text
                      style={[
                        styles.titleChipText,
                        {
                          color: eventColor,
                        },
                      ]}>
                      {event.title}
                    </Text>

                  </View>

                  <Pressable
                    onPress={() =>
                      handleDeleteEvent(
                        event.id,
                      )
                    }
                    style={({pressed}) => [
                      styles.deleteButton,
                      pressed &&
                        styles.deleteButtonPressed,
                    ]}>

                    <Text
                      style={
                        styles.deleteButtonText
                      }>
                      Sil
                    </Text>

                  </Pressable>

                </View>

                <Text
                  style={styles.eventPetName}>
                  🐾 {event.petName}
                </Text>

                {/* SAAT */}

                <View style={styles.eventTimeRow}>

                  <Text style={styles.eventTimeIcon}>
                    ⏰
                  </Text>

                  <Text style={styles.eventTime}>
                    {event.time || '09:00'}
                  </Text>

                </View>

                {event.note ? (
                  <Text style={styles.eventNote}>
                    {event.note}
                  </Text>
                ) : null}

              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>

            <Text style={styles.emptyEmoji}>
              🌷
            </Text>

            <Text style={styles.emptyTitle}>
              Bugün için görev yok
            </Text>

            <Text style={styles.emptyText}>
              Seçilen tarihte görev görünmüyor.
            </Text>

          </View>
        )}

      </ScrollView>

      {/* =====================================================
          ADD MODAL
      ===================================================== */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"

        onRequestClose={() => {
          resetForm();
          setModalVisible(false);
        }}>

        <View style={styles.modalOverlay}>

          <View style={styles.modalCard}>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

              <Text style={styles.modalEmoji}>
                ✨
              </Text>

              <Text style={styles.modalTitle}>
                Yeni Bakım Görevi
              </Text>

              <Text style={styles.modalSubtitle}>
                Seçili tarih: {selectedDate}
              </Text>

              {/* TITLE */}

              <TextInput
                value={title}
                onChangeText={setTitle}

                placeholder="Görev başlığı"
                placeholderTextColor="#9CA3AF"

                style={styles.input}
              />

              {/* PET */}

              <TextInput
                value={petName}
                onChangeText={setPetName}

                placeholder="Pet adı"
                placeholderTextColor="#9CA3AF"

                style={styles.input}
              />

              {/* =================================================
                  TIME
              ================================================= */}

              <Text style={styles.timePickerLabel}>
                Hatırlatma saati
              </Text>

              <View style={styles.timePickerContainer}>

                {/* HOUR */}

                <View style={styles.timeBlock}>

                  <Pressable
                    onPress={() => {
                      const hour =
                        Number(selectedHour);

                      const nextHour =
                        hour >= 23
                          ? 0
                          : hour + 1;

                      setSelectedHour(
                        String(
                          nextHour,
                        ).padStart(2, '0'),
                      );
                    }}
                    style={({pressed}) => [
                      styles.timeControlButton,
                      pressed &&
                        styles.timeControlButtonPressed,
                    ]}>

                    <Text
                      style={
                        styles.timeControlText
                      }>
                      +
                    </Text>

                  </Pressable>

                  <TextInput
                    value={selectedHour}
                    onChangeText={text => {
                      const digits = text.replace(/\D/g, '');

                      if (digits === '') {
                        setSelectedHour('');
                        return;
                      }

                      const value = Number(digits);

                      if (value >= 0 && value <= 23) {
                        setSelectedHour(
                          digits.padStart(2, '0').slice(-2),
                        );
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={styles.timeInput}
                    textAlign="center"
                  />

                  <Pressable
                    onPress={() => {
                      const hour =
                        Number(selectedHour);

                      const nextHour =
                        hour <= 0
                          ? 23
                          : hour - 1;

                      setSelectedHour(
                        String(
                          nextHour,
                        ).padStart(2, '0'),
                      );
                    }}
                    style={({pressed}) => [
                      styles.timeControlButton,
                      pressed &&
                        styles.timeControlButtonPressed,
                    ]}>

                    <Text
                      style={
                        styles.timeControlText
                      }>
                      −
                    </Text>

                  </Pressable>

                  <Text style={styles.timeUnit}>
                    Saat
                  </Text>

                </View>

                {/* COLON */}

                <Text style={styles.timeColon}>
                  :
                </Text>

                {/* MINUTE */}

                <View style={styles.timeBlock}>

                  <Pressable
                    onPress={() => {
                      const minute =
                        Number(selectedMinute);

                      const nextMinute =
                        minute >= 59
                          ? 0
                          : minute + 1;

                      setSelectedMinute(
                        String(
                          nextMinute,
                        ).padStart(2, '0'),
                      );
                    }}
                    style={({pressed}) => [
                      styles.timeControlButton,
                      pressed &&
                        styles.timeControlButtonPressed,
                    ]}>

                    <Text
                      style={
                        styles.timeControlText
                      }>
                      +
                    </Text>

                  </Pressable>

                  <TextInput
                    value={selectedMinute}
                    onChangeText={text => {
                      const digits = text.replace(/\D/g, '');

                      if (digits === '') {
                        setSelectedMinute('');
                        return;
                      }

                      const value = Number(digits);

                      if (value >= 0 && value <= 59) {
                        setSelectedMinute(
                          digits.padStart(2, '0').slice(-2),
                        );
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={styles.timeInput}
                    textAlign="center"
                  />

                  <Pressable
                    onPress={() => {
                      const minute =
                        Number(selectedMinute);

                      const nextMinute =
                        minute <= 0
                          ? 59
                          : minute - 1;

                      setSelectedMinute(
                        String(
                          nextMinute,
                        ).padStart(2, '0'),
                      );
                    }}
                    style={({pressed}) => [
                      styles.timeControlButton,
                      pressed &&
                        styles.timeControlButtonPressed,
                    ]}>

                    <Text
                      style={
                        styles.timeControlText
                      }>
                      −
                    </Text>

                  </Pressable>

                  <Text style={styles.timeUnit}>
                    Dakika
                  </Text>

                </View>

              </View>

              <View style={styles.selectedTimePreview}>

                <Text
                  style={
                    styles.selectedTimePreviewLabel
                  }>
                  Bildirim
                </Text>

                <Text
                  style={
                    styles.selectedTimePreviewValue
                  }>
                  ⏰ {selectedHour}:{selectedMinute}
                </Text>

              </View>

              {/* COLOR */}

              <Text style={styles.colorPickerLabel}>
                Görev rengi seç
              </Text>

              <View style={styles.colorGrid}>

                {PASTEL_COLORS.map(color => {
                  const selected =
                    selectedColor === color;

                  return (
                    <Pressable
                      key={color}

                      onPress={() =>
                        setSelectedColor(color)
                      }

                      style={[
                        styles.colorOption,
                        {
                          backgroundColor:
                            color,
                        },
                        selected &&
                          styles.colorOptionSelected,
                      ]}>

                      {selected ? (
                        <Text
                          style={styles.colorCheck}>
                          ✓
                        </Text>
                      ) : null}

                    </Pressable>
                  );
                })}

              </View>

              {/* NOTE */}

              <TextInput
                value={note}
                onChangeText={setNote}

                placeholder="Not ekle"
                placeholderTextColor="#9CA3AF"

                multiline

                style={[
                  styles.input,
                  styles.noteInput,
                ]}
              />

              {/* BUTTONS */}

              <View style={styles.modalButtons}>

                <Pressable
                  onPress={() => {
                    resetForm();
                    setModalVisible(false);
                  }}

                  disabled={saving}

                  style={({pressed}) => [
                    styles.cancelButton,
                    pressed &&
                      styles.cancelButtonPressed,
                  ]}>

                  <Text
                    style={
                      styles.cancelButtonText
                    }>
                    İptal
                  </Text>

                </Pressable>

                <Pressable
                  onPress={handleAddEvent}
                  disabled={saving}

                  style={({pressed}) => [
                    styles.saveButton,
                    pressed &&
                      styles.saveButtonPressed,
                    saving &&
                      styles.disabledButton,
                  ]}>

                  <Text
                    style={
                      styles.saveButtonText
                    }>
                    {saving
                      ? 'Kaydediliyor...'
                      : 'Kaydet'}
                  </Text>

                </Pressable>

              </View>

            </ScrollView>

          </View>

        </View>

      </Modal>

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"

        onRequestClose={() =>
          setDeleteModalVisible(false)
        }>

        <View style={styles.modalOverlay}>

          <View style={styles.deleteModalCard}>

            <Text style={styles.deleteEmoji}>
              ⚠️
            </Text>

            <Text style={styles.deleteTitle}>
              Görevi sil
            </Text>

            <Text style={styles.deleteText}>
              Bu bakım görevini silmek
              istediğine emin misin?
            </Text>

            <View style={styles.deleteButtons}>

              <Pressable
                onPress={() => {
                  setDeleteModalVisible(false);
                  setSelectedEventId(null);
                }}

                style={({pressed}) => [
                  styles.cancelDeleteBtn,
                  pressed &&
                    styles.cancelDeleteBtnPressed,
                ]}>

                <Text
                  style={
                    styles.cancelDeleteText
                  }>
                  Vazgeç
                </Text>

              </Pressable>

              <Pressable
                onPress={confirmDelete}
                disabled={deleting}

                style={({pressed}) => [
                  styles.confirmDeleteBtn,
                  pressed &&
                    styles.confirmDeleteBtnPressed,
                  deleting &&
                    styles.disabledButton,
                ]}>

                <Text
                  style={
                    styles.confirmDeleteText
                  }>
                  {deleting
                    ? 'Siliniyor...'
                    : 'Sil'}
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

      {/* =====================================================
          ERROR POPUP
      ===================================================== */}

      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setErrorModalVisible(false)
        }>

        <View style={styles.modalOverlay}>

          <View style={styles.errorModalCard}>

            <View style={styles.errorIconCircle}>
              {renderErrorIcon()}
            </View>

            <Text style={styles.errorModalTitle}>
              {errorModalTitle}
            </Text>

            <Text style={styles.errorModalText}>
              {errorModalMessage}
            </Text>

            <Pressable
              onPress={() =>
                setErrorModalVisible(false)
              }
              style={({pressed}) => [
                styles.errorModalButton,
                pressed &&
                  styles.errorModalButtonPressed,
              ]}>

              <Text
                style={
                  styles.errorModalButtonText
                }>
                Tamam
              </Text>

            </Pressable>

          </View>

        </View>

      </Modal>

      {/* =====================================================
          TOAST
      ===================================================== */}

      {toastVisible ? (
        <Animated.View
          pointerEvents="none"

          style={[
            styles.successToast,
            {
              opacity: toastOpacity,

              transform: [
                {
                  translateX:
                    toastTranslateX,
                },
              ],
            },
          ]}>

          <Text
            style={
              styles.successToastTitle
            }>
            {toastTitle}
          </Text>

          <Text
            style={
              styles.successToastText
            }>
            {toastDescription}
          </Text>

        </Animated.View>
      ) : null}

    </>
  );
}

/* =========================================================
   STYLES
========================================================= */

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

  heroTextContainer: {
    flex: 1,
    paddingRight: 6,
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

  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  eventTimeIcon: {
    fontSize: 13,
    marginRight: 5,
  },

  eventTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B5CF6',
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
    backgroundColor:
      'rgba(17, 24, 39, 0.30)',
    justifyContent: 'center',
    padding: 24,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    elevation: 8,
    maxHeight: '90%',
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

  /* TIME PICKER */

  timePickerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    marginTop: 2,
  },

  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },

  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },

  timeControlButton: {
    width: 38,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  timeControlButtonPressed: {
    opacity: 0.7,
    transform: [{scale: 0.96}],
  },

  timeControlText: {
    color: '#7C3AED',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },

  timeInput: {
    minWidth: 64,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    marginVertical: 7,

    fontSize: 22,
    color: '#111827',
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 0,
  },

  timeValue: {
    fontSize: 22,
    color: '#111827',
    fontWeight: '800',
  },

  timeColon: {
    fontSize: 27,
    color: '#8B5CF6',
    fontWeight: '800',
    marginHorizontal: 8,
    marginBottom: 18,
  },

  timeUnit: {
    marginTop: 5,
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  selectedTimePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    backgroundColor: '#F5F3FF',
    borderRadius: 14,

    paddingHorizontal: 14,
    paddingVertical: 10,

    marginBottom: 14,
  },

  selectedTimePreviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  selectedTimePreviewValue: {
    fontSize: 15,
    color: '#7C3AED',
    fontWeight: '800',
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

  disabledButton: {
    opacity: 0.55,
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

  /* =========================================================
     ERROR POPUP
  ========================================================= */

  errorModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    elevation: 12,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,

    borderWidth: 1,
    borderColor: '#F0EBFF',
  },

  errorIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,

    backgroundColor: '#F6F2FF',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 16,

    borderWidth: 1,
    borderColor: '#E9E1FF',
  },

  errorModalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#11163A',
    textAlign: 'center',
    marginBottom: 8,
  },

  errorModalText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#687492',
    textAlign: 'center',

    paddingHorizontal: 8,

    marginBottom: 22,
  },

  errorModalButton: {
    width: '100%',
    backgroundColor: '#A78BFA',

    borderRadius: 16,

    paddingVertical: 14,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,

    elevation: 3,
  },

  errorModalButtonPressed: {
    opacity: 0.88,
    transform: [{scale: 0.98}],
  },

  errorModalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* =========================================================
     SUCCESS TOAST
  ========================================================= */

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

    shadowOffset: {
      width: 0,
      height: 8,
    },

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