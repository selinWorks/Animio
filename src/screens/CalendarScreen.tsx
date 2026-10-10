import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Animated,
  Image,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Switch,
  AppState,
} from 'react-native';


import {
  addCareEventToFirestore,
  updateCareEventInFirestore,
  getCareEventsFromFirestore,
  deleteCareEventFromFirestore,
  setCareEventCompletedInFirestore,
} from '../services/firestore';

import notifee, {
  AndroidImportance,
  TriggerType,
} from '@notifee/react-native';

import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../data/AuthContext';
import {usePets} from '../data/PetContext';

import {
  FileText,
  PawPrint,
  LockKeyhole,
  Clock3,
  CalendarX2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  TriangleAlert,
  Save,
  Trash2,
  Pencil,
  X,
  Syringe,
  Stethoscope,
  Pill,
  Scissors,
  MoreHorizontal,
  Bell,
  Plus,
  Check,
  Palette,
  ChevronDown,
} from 'lucide-react-native';

type CareEventType =
  | 'Vaccination'
  | 'Vet Visit'
  | 'Medication'
  | 'Grooming'
  | 'Operation'
  | 'Custom';

type CareEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: CareEventType;
  petName: string;
  petId?: string;
  notes?: string;
  description?: string;
  note?: string;
  color?: string;
  completed?: boolean;
  reminderEnabled?: boolean;
  completedAt?: any;
};

const TITLE_PLACEHOLDERS: Record<CareEventType, string> = {
  Vaccination: 'Örn. Karma Aşı, Kuduz Aşısı',
  'Vet Visit': 'Örn. Genel veteriner kontrolü',
  Medication: 'Örn. İç parazit ilacı, antibiyotik',
  Grooming: 'Örn. Tırnak kesimi, tüy bakımı',
  Operation: 'Örn. Kısırlaştırma ameliyatı, diş çekimi',
  Custom: 'Örn. Özel bakım, alerji takibi',
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

function getDefaultPetImage(type?: string) {
  const value = (type || '')
    .toLocaleLowerCase('tr-TR')
    .trim();

  if (value.includes('kedi') || value.includes('cat')) {
    return require('../assets/images/pets/default-cat-pixel.png');
  }

  if (value.includes('köpek') || value.includes('kopek') || value.includes('dog')) {
    return require('../assets/images/pets/default-dog-pixel.png');
  }

  if (value.includes('kuş') || value.includes('kus') || value.includes('bird')) {
    return require('../assets/images/pets/default-bird-pixel.png');
  }

  if (value.includes('tavşan') || value.includes('tavsan') || value.includes('rabbit')) {
    return require('../assets/images/pets/default-rabbit-pixel.png');
  }

  if (value.includes('hamster')) {
    return require('../assets/images/pets/default-hamster-pixel.png');
  }

  return require('../assets/images/pets/default-other-pixel.png');
}

export default function CalendarScreen() {
  const navigation = useNavigation<any>();

  useLayoutEffect(() => {
    navigation.setOptions({headerShown: false});
  }, [navigation]);

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString();

  const {user} = useAuth();
  const {pets} = usePets();
  /* =========================================================
     STATE
  ========================================================= */

  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<CareEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthExpanded, setMonthExpanded] = useState(false);

  const [editingEvent, setEditingEvent] = useState<CareEvent | null>(null);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [pendingHour, setPendingHour] = useState('09');
  const [pendingMinute, setPendingMinute] = useState('00');
  const [editDate, setEditDate] = useState('');
  const [newEventDate, setNewEventDate] = useState(selectedDate);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => new Date());
  const [pendingDate, setPendingDate] = useState('');
  const actionMenuRootRef = useRef<View>(null);
  const [actionMenu, setActionMenu] = useState<{
    event: CareEvent;
    x: number;
    y: number;
  } | null>(null);
  const [upcomingModalVisible, setUpcomingModalVisible] = useState(false);
  const [upcomingNow, setUpcomingNow] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setUpcomingNow(Date.now());
    const timer = setInterval(refresh, 60000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [petName, setPetName] = useState('');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [petDropdownOpen, setPetDropdownOpen] = useState(false);

  const [note, setNote] = useState('');
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[2]);
  const [selectedType, setSelectedType] = useState<CareEventType>('Custom');
  const [completingEventId, setCompletingEventId] = useState<string | null>(null);

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
    if (!dateString || !timeString) {
      return null;
    }

    const dateParts = dateString.split('-');
    const timeParts = timeString.split(':');

    if (
      dateParts.length !== 3 ||
      timeParts.length !== 2
    ) {
      return null;
    }

    const year = Number(dateParts[0]);
    const month = Number(dateParts[1]);
    const day = Number(dateParts[2]);

    const hour = Number(timeParts[0]);
    const minute = Number(timeParts[1]);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      !Number.isInteger(hour) ||
      !Number.isInteger(minute)
    ) {
      return null;
    }

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    // Yerel saat ile oluşturuyoruz.
    const date = new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
      0,
    );

    // JavaScript'in örneğin 31 Şubat'ı Mart'a
    // otomatik çevirmesini engelle.
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute
    ) {
      return null;
    }

    return date;
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

      if (!notificationDate) throw new Error('Geçersiz bildirim tarihi.');

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
      throw error;
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
    setEditingEvent(null);
    setEditDate('');
    setNewEventDate(selectedDate);
    setDatePickerVisible(false);
    setTimePickerVisible(false);
    setNoteExpanded(false);
    setReminderEnabled(true);
    setTitle('');
    setPetName('');
    setSelectedPetId(null);
    setPetDropdownOpen(false);
    setNote('');
    setSelectedColor(PASTEL_COLORS[2]);
    setSelectedType('Custom');

    setSelectedHour('09');
    setSelectedMinute('00');
  };

  /* =========================================================
     ADD EVENT
  ========================================================= */

  const handleEditEvent = (event: CareEvent) => {
    resetForm();
    setEditingEvent(event);
    setReminderEnabled(event.reminderEnabled !== false);
    setNoteExpanded(Boolean(event.note || event.notes || event.description));
    setEditDate(event.date);
    setTitle(event.title);
    const matchingPets = pets.filter(pet => pet.name === event.petName);
    const pet = event.petId
      ? pets.find(item => String(item.id) === String(event.petId))
      : matchingPets.length === 1 ? matchingPets[0] : undefined;
    setSelectedPetId(pet ? String(pet.id) : null);
    setPetName(pet?.name || event.petName);
    setNote(event.note ?? event.notes ?? event.description ?? '');
    setSelectedColor(event.color || PASTEL_COLORS[2]);
    setSelectedType(event.type || 'Custom');
    const [hour, minute] = (event.time || '09:00').split(':');
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setModalVisible(true);
  };

  const handleEventActions = (event: CareEvent, pageX: number, pageY: number) => {
    actionMenuRootRef.current?.measureInWindow((rootX, rootY, width, height) => {
      const screen = Dimensions.get('window');
      const availableWidth = width || screen.width;
      const availableHeight = height || screen.height;
      setActionMenu({
        event,
        x: Math.max(12, Math.min(pageX - rootX - 148, availableWidth - 172)),
        y: Math.max(12, Math.min(pageY - rootY + 12, availableHeight - 112)),
      });
    });
  };

  const handleAddEvent = async () => {
    if (saving) return;
    const eventDate = editingEvent ? editDate.trim() : newEventDate.trim();
    if (!title.trim()) {
      showErrorModal(
        'Görev başlığı eksik',
        'Bakım görevini kaydetmek için önce görev başlığını girmen gerekiyor.',
        'title',
      );

      return;
    }

    if (!selectedPetId) {
      showErrorModal(
        'Dost seçilmedi',
        'Bakım görevi eklemek için önce bir dost seçmelisin.',
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
        eventDate,
        selectedTime,
      );

    if (!selectedDateTime) {
      showErrorModal(
        'Geçersiz tarih veya saat',
        'Seçtiğin tarih veya saat geçerli değil. Lütfen tekrar kontrol et.',
        'date',
      );

      return;
    }

    const unchangedSchedule = editingEvent &&
      eventDate === editingEvent.date && selectedTime === (editingEvent.time || '09:00');
    if (selectedDateTime.getTime() <= Date.now() &&
        !editingEvent?.completed && !unchangedSchedule) {
      showErrorModal(
        'Geçersiz tarih veya saat',
        'Hatırlatma için gelecekte bir tarih ve saat seçmelisin.',
        'date',
      );

      return;
    }

    try {
      setSaving(true);

      // Önce dost seçilmiş mi kontrol et
      if (!selectedPetId) {
        showErrorModal(
          'Dost seçilmedi',
          'Bakım görevi eklemek için önce bir dost seçmelisin.',
          'pet',
        );

        setSaving(false);
        return;
      }

      // Seçilen dostu ID üzerinden bul
      const selectedPet = pets.find(
        pet =>
          String(pet.id) ===
          String(selectedPetId),
      );

      // Dost bulunamadıysa
      if (!selectedPet) {
        showErrorModal(
          'Dost seçilemedi',
          'Seçilen dost bulunamadı. Lütfen dostu tekrar seç.',
          'pet',
        );

        setSaving(false);
        return;
      }

      // Dostun ID'si doğrulanamadıysa
      if (!selectedPet.id) {
        showErrorModal(
          'Dost seçilemedi',
          'Seçilen dostun kimliği doğrulanamadı. Lütfen dostu tekrar seç.',
          'pet',
        );

        setSaving(false);
        return;
      }

      // İsim sadece seçilen ID'ye ait dosttan alınır
      const eventPetName = selectedPet.name;

      const eventTitle = title.trim();

      // Görev başlığı kontrolü
      if (!eventTitle) {
        showErrorModal(
          'Eksik bilgi',
          'Lütfen bakım görevi için bir başlık gir.',
          'save',
        );

        setSaving(false);
        return;
      }

      const payload = {
        title: eventTitle,
        date: eventDate,
        time: selectedTime,
        type: selectedType,
        petName: eventPetName,
        petId: selectedPet.id,
        note: note.trim(),
        notes: note.trim(),
        color: selectedColor,
        reminderEnabled,
      };
      const eventId = editingEvent
        ? editingEvent.id
        : await addCareEventToFirestore(payload, user.uid);
      if (editingEvent) {
        await updateCareEventInFirestore({...payload, id: eventId}, user.uid);
      }

      let reminderFailed = false;
      try {
        await cancelCareNotification(eventId);
        if (reminderEnabled && !editingEvent?.completed && selectedDateTime.getTime() > Date.now()) {
          await scheduleCareNotification({
            eventId,
            eventTitle,
            petNameText: eventPetName,
            dateString: eventDate,
            timeString: selectedTime,
          });
        }
      } catch (notificationError) {
        reminderFailed = true;
        console.log('Bildirim güncellenemedi:', notificationError);
      }
      const wasEditing = Boolean(editingEvent);
      setSelectedDate(eventDate);

      // Formu temizle
      resetForm();

      // Modalı kapat
      setModalVisible(false);

      // Etkinlikleri yeniden yükle
      await loadEvents();

      // Başarılı mesajı
      showToast(
        wasEditing ? 'Güncellendi' : 'Başarılı',
        reminderFailed
          ? 'Görev kaydedildi, ancak telefon hatırlatıcısı güncellenemedi.'
          : wasEditing ? 'Bakım görevi güncellendi ✨'
          : `${eventPetName} için bakım görevi ${selectedTime} için planlandı ✨`,
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
     COMPLETE / UNCOMPLETE EVENT
  ========================================================= */

  const handleToggleCompleted = async (event: CareEvent) => {
    if (!user?.uid) {
      showErrorModal(
        'Giriş gerekli',
        'Görev durumunu değiştirmek için hesabına giriş yapman gerekiyor.',
        'login',
      );
      return;
    }

    try {
      setCompletingEventId(event.id);

      const nextCompleted = !event.completed;

      await setCareEventCompletedInFirestore(
        event.id,
        nextCompleted,
        user.uid,
      );

      if (nextCompleted) {
        await cancelCareNotification(event.id);
      }

      await loadEvents();

      showToast(
        nextCompleted ? 'Tamamlandı' : 'Geri alındı',
        nextCompleted
          ? 'Bakım görevi tamamlandı olarak işaretlendi ✨'
          : 'Bakım görevi yeniden bekleyen duruma alındı.',
      );
    } catch (error: any) {
      console.log(
        'Görev durumu güncellenemedi:',
        error,
      );

      showErrorModal(
        'Görev güncellenemedi',
        error?.message ||
          'Görev durumu değiştirilirken bir sorun oluştu.',
        'save',
      );
    } finally {
      setCompletingEventId(null);
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


  const formatTurkishDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('tr-TR', {day: 'numeric', month: 'long', weekday: 'long'});
  };

  const weekDays = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selected = new Date(year, month - 1, day);
    const mondayOffset = selected.getDay() === 0 ? -6 : 1 - selected.getDay();
    const monday = new Date(selected);
    monday.setDate(selected.getDate() + mondayOffset);

    return Array.from({length: 7}, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateString = getLocalDateString(date);
      return {
        date,
        dateString,
        dayName: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][date.getDay()],
        dayNumber: date.getDate(),
        eventColors: events.filter(event => event.date === dateString).slice(0, 3).map(event => event.color || '#A78BFA'),
      };
    });
  }, [selectedDate, events]);

  const selectedMonthTitle = useMemo(() => {
    const [year, month] = selectedDate.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('tr-TR', {month: 'long', year: 'numeric'});
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const [year, month] = selectedDate.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const mondayOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const totalCells = Math.ceil((mondayOffset + lastDay.getDate()) / 7) * 7;

    return Array.from({length: totalCells}, (_, index) => {
      const dayNumber = index - mondayOffset + 1;
      const date = new Date(year, month - 1, dayNumber);
      const dateString = getLocalDateString(date);
      const inCurrentMonth = date.getMonth() === month - 1;

      return {
        dateString,
        dayNumber: date.getDate(),
        inCurrentMonth,
        eventColors: events
          .filter(event => event.date === dateString)
          .slice(0, 3)
          .map(event => event.color || '#A78BFA'),
      };
    });
  }, [selectedDate, events]);

  const moveMonth = (amount: number) => {
    const [year, month] = selectedDate.split('-').map(Number);
    const next = new Date(year, month - 1 + amount, 1);
    setSelectedDate(getLocalDateString(next));
  };

  const upcomingMonthEvents = useMemo(() => {
    const now = new Date(upcomingNow);
    // One calendar month; clamp month-end dates (31 January -> 28/29 February).
    const limit = new Date(now);
    const day = limit.getDate();
    limit.setDate(1);
    limit.setMonth(limit.getMonth() + 1);
    const lastDay = new Date(limit.getFullYear(), limit.getMonth() + 1, 0).getDate();
    limit.setDate(Math.min(day, lastDay));
    return events
      .filter(event => {
        if (event.completed) return false;
        const date = getNotificationDate(event.date, event.time || '09:00');
        return date !== null && date.getTime() >= upcomingNow && date.getTime() <= limit.getTime();
      })
      .sort((a, b) => `${a.date} ${a.time || '09:00'}`.localeCompare(`${b.date} ${b.time || '09:00'}`));
  }, [events, upcomingNow]);
  const upcomingEvents = upcomingMonthEvents.slice(0, 3);

  const getPetForEvent = (event: CareEvent) =>
    pets.find(pet => pet.name === event.petName);

  const getTypeLabel = (type: CareEventType) => {
    if (type === 'Vaccination') return 'Aşı';
    if (type === 'Vet Visit') return 'Veteriner Kontrolü';
    if (type === 'Medication') return 'İlaç / Parazit';
    if (type === 'Grooming') return 'Bakım';
    if (type === 'Operation') return 'Ameliyat / Kısırlaştırma';
    return 'Diğer';
  };

  const openDatePicker = () => {
    Keyboard.dismiss();
    const value = editingEvent ? editDate : newEventDate;
    const parsed = getNotificationDate(value, '12:00') || new Date();
    setPendingDate(getLocalDateString(parsed));
    setDatePickerMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    setDatePickerVisible(true);
  };

  const datePickerCells = useMemo(() => {
    const year = datePickerMonth.getFullYear();
    const month = datePickerMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    const cellCount = Math.ceil((offset + count) / 7) * 7;
    return Array.from({length: cellCount}, (_, index) => {
      const day = index - offset + 1;
      return day > 0 && day <= count ? day : null;
    });
  }, [datePickerMonth]);

  const shiftPickerMonth = (amount: number) => {
    setDatePickerMonth(value => new Date(value.getFullYear(), value.getMonth() + amount, 1));
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <View ref={actionMenuRootRef} style={{flex: 1}} collapsable={false}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.plannerContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.calendarArea}>
          <View style={styles.calendarBackRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.calendarBackButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.calendarBackText}>‹</Text>
            </Pressable>

            <Pressable
              onPress={() => { resetForm(); setModalVisible(true); }}
              style={({pressed}) => [
                styles.compactNewButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.compactNewPlus}>＋</Text>
              <Text style={styles.compactNewText}>Yeni Kayıt</Text>
            </Pressable>
          </View>

          <View style={styles.monthRow}>
            <View style={styles.monthNavigation}>
              <Pressable
                onPress={() => moveMonth(-1)}
                style={styles.monthArrowButton}>
                <Text style={styles.monthArrow}>‹</Text>
              </Pressable>

              <Text style={styles.monthTitle}>{selectedMonthTitle}</Text>

              <Pressable
                onPress={() => moveMonth(1)}
                style={styles.monthArrowButton}>
                <Text style={styles.monthArrow}>›</Text>
              </Pressable>
            </View>

            <View style={styles.monthActions}>

            </View>
          </View>

          <View style={styles.weekStrip}>
            {weekDays.map(item => {
              const active = item.dateString === selectedDate;

              return (
                <Pressable
                  key={item.dateString}
                  onPress={() => setSelectedDate(item.dateString)}
                  style={[
                    styles.weekDay,
                    active && styles.weekDayActive,
                  ]}>
                  <Text
                    style={[
                      styles.weekDayName,
                      active && styles.weekDayNameActive,
                    ]}>
                    {item.dayName}
                  </Text>

                  <Text
                    style={[
                      styles.weekDayNumber,
                      active && styles.weekDayNumberActive,
                    ]}>
                    {item.dayNumber}
                  </Text>

                  <View style={styles.dayDots}>
                    {item.eventColors.length > 0 ? (
                      item.eventColors.map((color, index) => (
                        <View
                          key={`${item.dateString}-${index}`}
                          style={[
                            styles.dayDot,
                            {
                              backgroundColor: active
                                ? '#FFFFFF'
                                : color,
                            },
                          ]}
                        />
                      ))
                    ) : (
                      <View style={styles.dayDotPlaceholder} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {monthExpanded ? (
            <View style={styles.monthCalendar}>
              <View style={styles.monthWeekHeader}>
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                  <Text key={day} style={styles.monthWeekHeaderText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.monthGrid}>
                {monthDays.map((item, index) => {
                  const active = item.dateString === selectedDate;
                  const isToday = item.dateString === today;

                  return (
                    <Pressable
                      key={`${item.dateString}-${index}`}
                      onPress={() => setSelectedDate(item.dateString)}
                      style={({pressed}) => [
                        styles.monthDayCell,
                        active && styles.monthDayCellActive,
                        isToday && !active && styles.monthDayCellToday,
                        pressed && styles.buttonPressed,
                      ]}>
                      <Text
                        style={[
                          styles.monthDayNumber,
                          !item.inCurrentMonth && styles.monthDayNumberMuted,
                          active && styles.monthDayNumberActive,
                        ]}>
                        {item.dayNumber}
                      </Text>

                      <View style={styles.monthDayDots}>
                        {item.eventColors.map((color, dotIndex) => (
                          <View
                            key={`${item.dateString}-dot-${dotIndex}`}
                            style={[
                              styles.monthDayDot,
                              {backgroundColor: active ? '#FFFFFF' : color},
                            ]}
                          />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.monthExpandWrap}>
            <Pressable
              onPress={() => setMonthExpanded(prev => !prev)}
              style={({pressed}) => [
                styles.monthExpandButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={[styles.monthExpandIcon, monthExpanded && styles.monthExpandIconOpen]}>
                ⌄
              </Text>
              <Text style={styles.monthExpandText}>
                {monthExpanded ? 'Ayı gizle' : 'Ayı göster'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.agendaPanel}>
          <View style={styles.agendaHeadingRow}>
            <View style={styles.agendaHeadingText}>
              <Text style={styles.selectedDateText}>
                {formatTurkishDate(selectedDate)}
              </Text>
              <Text style={styles.agendaTitle}>Bugünün Bakımları</Text>
            </View>

            <View style={styles.recordCountBadge}>
              <Text style={styles.recordCountText}>
                {eventsForSelectedDay.length} kayıt
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.plannerEmpty}>
              <Text style={styles.plannerEmptyTitle}>
                Takvim yükleniyor
              </Text>
              <Text style={styles.plannerEmptyText}>
                Bakım kayıtların hazırlanıyor.
              </Text>
            </View>
          ) : eventsForSelectedDay.length > 0 ? (
            eventsForSelectedDay.map(event => {
              const eventColor = event.color || '#A78BFA';
              const pet = getPetForEvent(event);
              const petPhoto = pet?.photoUrl || pet?.photoUri;

              return (
                <View key={event.id} style={styles.careCard}>
                  <View
                    style={[
                      styles.careAccent,
                      {backgroundColor: eventColor},
                    ]}
                  />

                  <View style={styles.careCardContent}>
                    <View style={styles.careMainRow}>
                      <Image
                        source={
                          petPhoto
                            ? {uri: petPhoto}
                            : getDefaultPetImage(pet?.type)
                        }
                        style={styles.carePetImage}
                        resizeMode={petPhoto ? 'cover' : 'contain'}
                      />

                      <View style={styles.careTextBlock}>
                        <Text style={styles.carePetName}>
                          {event.petName}
                        </Text>

                        <View style={styles.eventNameRow}>
                          <View
                            style={[
                              styles.eventTypeIcon,
                              {backgroundColor: `${eventColor}20`},
                            ]}>
                            <PawPrint
                              size={14}
                              color={eventColor}
                              strokeWidth={2.2}
                            />
                          </View>
                          <Text
                            style={styles.careEventTitle}
                            numberOfLines={1}>
                            {event.title}
                          </Text>
                        </View>

                        <View style={styles.careMetaRow}>
                          <Clock3
                            size={14}
                            color="#8D88A8"
                            strokeWidth={1.8}
                          />
                          <Text style={styles.careTime}>
                            {event.time || '09:00'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardRight}>
                        <Pressable
                          onPress={() => handleToggleCompleted(event)}
                          disabled={completingEventId !== null}
                          accessibilityRole="button"
                          accessibilityLabel={event.completed ? 'Tamamlanmayı geri al' : 'Bakımı tamamla'}
                          accessibilityState={{disabled: completingEventId !== null}}
                          style={({pressed}) => [
                            styles.statusBadge,
                            event.completed ? styles.statusDone : styles.statusPending,
                            pressed && styles.buttonPressed,
                          ]}>
                          <Text style={[
                            styles.statusText,
                            event.completed ? styles.statusDoneText : styles.statusPendingText,
                          ]}>
                            {completingEventId === event.id
                              ? 'İşleniyor...'
                              : event.completed ? 'Tamamlandı' : 'Tamamla'}
                          </Text>
                        </Pressable>

                        <View style={styles.careActions}>
                          <Pressable
                            onPress={pressEvent => handleEventActions(
                              event,
                              pressEvent.nativeEvent.pageX,
                              pressEvent.nativeEvent.pageY,
                            )}
                            style={({pressed}) => [
                              styles.moreCircle,
                              pressed && styles.buttonPressed,
                            ]}>
                            <Text style={styles.moreDots}>•••</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>

                    {event.note ? (
                      <Text style={styles.careNote}>{event.note}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.plannerEmpty}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>♡</Text>
              </View>
              <Text style={styles.plannerEmptyTitle}>
                Bugün bakım kaydı yok
              </Text>
              <Text style={styles.plannerEmptyText}>
                Dostlarının programı bugün sakin görünüyor.
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => setModalVisible(true)}
            style={({pressed}) => [
              styles.addCareButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.addCarePlus}>＋</Text>
            <Text style={styles.addCareButtonText}>Kayıt Ekle</Text>
          </Pressable>
        </View>


          <View style={styles.upcomingSection}>
            <View style={styles.upcomingHeader}>
              <Text style={styles.upcomingTitle}>Yaklaşan Bakımlar</Text>

              {upcomingEvents.length > 0 && <Pressable onPress={() => { setUpcomingNow(Date.now()); setUpcomingModalVisible(true); }}
                accessibilityRole="button" style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>Tümünü Gör</Text>
                <Text style={styles.seeAllArrow}>›</Text>
              </Pressable>}
            </View>

            {loading ? (
              <View style={styles.plannerEmpty}>
                <Text style={styles.plannerEmptyText}>Yaklaşan bakımlar yükleniyor.</Text>
              </View>
            ) : upcomingEvents.length === 0 ? (
              <View style={styles.plannerEmpty}>
                <View style={styles.emptyIconCircle}>
                  <CalendarDays size={22} color="#9275DF" />
                </View>
                <Text style={styles.plannerEmptyTitle}>Yaklaşan bakım yok</Text>
                <Text style={styles.plannerEmptyText}>Önümüzdeki 1 ay için bekleyen bakım bulunmuyor.</Text>
              </View>
            ) : (
            <View style={styles.upcomingList}>
              {upcomingEvents.map((event, index) => {
                const eventColor = event.color || '#A78BFA';

                return (
                  <Pressable
                    key={event.id}
                    onPress={() => setSelectedDate(event.date)}
                    style={[
                      styles.upcomingCard,
                      index === upcomingEvents.length - 1 &&
                        styles.upcomingCardLast,
                    ]}>
                    <View
                      style={[
                        styles.upcomingIconCircle,
                        {backgroundColor: `${eventColor}22`},
                      ]}>
                      <PawPrint
                        size={22}
                        color={eventColor}
                        strokeWidth={2}
                      />
                    </View>

                    <View style={styles.upcomingText}>
                      <Text style={styles.upcomingDate}>
                        {formatTurkishDate(event.date)}
                      </Text>
                      <Text style={styles.upcomingEventTitle}>
                        {event.title}
                      </Text>
                      <Text style={styles.upcomingPet}>
                        {event.petName}
                      </Text>
                    </View>

                    <Text style={styles.upcomingArrow}>›</Text>
                  </Pressable>
                );
              })}
            </View>
            )}
          </View>


      </ScrollView>

      {actionMenu && (
        <View style={styles.actionMenuOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setActionMenu(null)}
            accessibilityLabel="Menüyü kapat"
          />
          <View style={[styles.actionMenu, {left: actionMenu.x, top: actionMenu.y}]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bakım görevini düzenle"
              onPress={() => {
                const event = actionMenu.event;
                setActionMenu(null);
                handleEditEvent(event);
              }}
              style={({pressed}) => [styles.actionMenuItem, pressed && styles.actionMenuItemPressed]}>
              <Pencil size={16} color="#7256E8" strokeWidth={2} />
              <Text style={styles.actionMenuEditText}>Düzenle</Text>
            </Pressable>
            <View style={styles.actionMenuDivider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bakım görevini sil"
              onPress={() => {
                const eventId = actionMenu.event.id;
                setActionMenu(null);
                handleDeleteEvent(eventId);
              }}
              style={({pressed}) => [styles.actionMenuItem, pressed && styles.actionMenuItemPressed]}>
              <Trash2 size={16} color="#E45B72" strokeWidth={2} />
              <Text style={styles.actionMenuDeleteText}>Sil</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* =====================================================
          ADD MODAL
      ===================================================== */}

      <Modal visible={upcomingModalVisible} transparent animationType="slide"
        onRequestClose={() => setUpcomingModalVisible(false)}>
        <View style={styles.careSheetBackdrop}>
          <View style={[styles.careSheet, {paddingBottom: 24}]}>
            <View style={styles.careSheetHandle} />
            <View style={styles.careSheetHeader}>
              <Text style={styles.careSheetTitle}>Yaklaşan bakımlar</Text>
              <Pressable style={styles.careSheetClose} accessibilityLabel="Listeyi kapat"
                onPress={() => setUpcomingModalVisible(false)}><X size={20} color="#817B9E" /></Pressable>
            </View>
            <Text style={{fontFamily: 'Quicksand-SemiBold', fontSize: 12, color: '#817B9E', marginHorizontal: 20, marginBottom: 14}}>
              Önümüzdeki 1 ay · {upcomingMonthEvents.length} bakım
            </Text>
            <ScrollView contentContainerStyle={{paddingHorizontal: 20}}>
              {upcomingMonthEvents.length === 0 ? (
                <Text style={styles.plannerEmptyText}>Önümüzdeki 1 ay için bekleyen bakım bulunmuyor.</Text>
              ) : upcomingMonthEvents.map(event => (
                <Pressable key={event.id} style={styles.upcomingCard}
                  onPress={() => { setSelectedDate(event.date); setUpcomingModalVisible(false); }}>
                  <View style={[styles.upcomingIconCircle, {backgroundColor: '#F0ECFF'}]}>
                    <PawPrint size={21} color="#7954EF" />
                  </View>
                  <View style={styles.upcomingText}>
                    <Text style={styles.upcomingDate}>{formatTurkishDate(event.date)} · {event.time || '09:00'}</Text>
                    <Text style={styles.upcomingEventTitle}>{event.title}</Text>
                    <Text style={styles.upcomingPet}>{event.petName}</Text>
                  </View>
                  <Text style={styles.upcomingArrow}>›</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="slide"
        onRequestClose={() => {
          if (saving) return;
          if (datePickerVisible) { setDatePickerVisible(false); return; }
          if (timePickerVisible) { setTimePickerVisible(false); return; }
          Keyboard.dismiss(); resetForm(); setModalVisible(false);
        }}>
        <KeyboardAvoidingView style={styles.careSheetBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {datePickerVisible ? (
            <View style={styles.datePickerCard}>
              <View style={styles.careSheetHandle} />
              <View style={styles.datePickerHeading}>
                <View style={styles.datePickerIconBadge}>
                  <CalendarDays size={24} color="#7256E8" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.datePickerTitle}>Bakım tarihi</Text>
                </View>
                <Pressable onPress={() => setDatePickerVisible(false)}
                  accessibilityLabel="Takvimi kapat" style={styles.datePickerClose}>
                  <Text style={styles.datePickerCloseText}>×</Text>
                </Pressable>
              </View>
              <View style={styles.datePickerMonthRow}>
                <Pressable onPress={() => shiftPickerMonth(-1)}
                  accessibilityLabel="Önceki ay" style={styles.datePickerArrow}>
                  <ChevronLeft size={20} color="#7256E8" />
                </Pressable>
                <Text style={styles.datePickerMonthTitle}>
                  {datePickerMonth.toLocaleDateString('tr-TR', {month: 'long', year: 'numeric'})}
                </Text>
                <Pressable onPress={() => shiftPickerMonth(1)}
                  accessibilityLabel="Sonraki ay" style={styles.datePickerArrow}>
                  <ChevronRight size={20} color="#7256E8" />
                </Pressable>
              </View>
              <View style={styles.datePickerGrid}>
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                  <View key={day} style={styles.datePickerCell}>
                    <Text style={styles.datePickerWeekday}>{day}</Text>
                  </View>
                ))}
                {datePickerCells.map((day, index) => {
                  const value = day ? getLocalDateString(new Date(
                    datePickerMonth.getFullYear(), datePickerMonth.getMonth(), day,
                  )) : '';
                  const selected = value === pendingDate;
                  return (
                    <View key={index} style={styles.datePickerCell}>
                      {day !== null && (
                        <Pressable onPress={() => setPendingDate(value)}
                          accessibilityRole="button"
                          accessibilityLabel={value}
                          accessibilityState={{selected}}
                          style={[styles.datePickerDay, selected && styles.datePickerDaySelected]}>
                          <Text style={[styles.datePickerDayText,
                            value === today && styles.datePickerTodayText,
                            selected && styles.datePickerDaySelectedText]}>{day}</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
              <Text style={styles.datePickerSelectedDate}>Seçili tarih: {pendingDate}</Text>
              <View style={styles.modalButtons}>
                <Pressable style={styles.cancelButton} onPress={() => setDatePickerVisible(false)}>
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={() => {
                  if (editingEvent) setEditDate(pendingDate);
                  else setNewEventDate(pendingDate);
                  setDatePickerVisible(false);
                }}>
                  <Text style={styles.saveButtonText}>Onayla</Text>
                </Pressable>
              </View>
            </View>
          ) : timePickerVisible ? (
            <View style={styles.careSheetTimeCard}>
              <View style={styles.careSheetHeader}>
                <View style={styles.careSheetHeadingIcon}><Clock3 size={23} color="#FFFFFF" /></View>
                <Text style={styles.careSheetTitle}>Saat seç</Text>
                <Pressable style={styles.careSheetClose} onPress={() => setTimePickerVisible(false)} accessibilityLabel="Saat seçimini kapat">
                  <X size={20} color="#817B9E" />
                </Pressable>
              </View>
              <View style={styles.careSheetTimeColumns}>
                {[{label: 'Saat', count: 24, value: pendingHour, set: setPendingHour},
                  {label: 'Dakika', count: 60, value: pendingMinute, set: setPendingMinute}].map(column => (
                  <View key={column.label} style={styles.careSheetTimeColumn}>
                    <Text style={styles.careSheetLabel}>{column.label}</Text>
                    <ScrollView style={{height: 220}} showsVerticalScrollIndicator={false}
                      contentOffset={{x: 0, y: Math.max(0, Number(column.value) * 44 - 88)}}>
                      {Array.from({length: column.count}, (_, index) => {
                        const value = String(index).padStart(2, '0');
                        const active = value === column.value;
                        return <Pressable key={value} onPress={() => column.set(value)}
                          accessibilityState={{selected: active}}
                          style={[styles.careSheetTimeOption, active && styles.careSheetCategoryActive]}>
                          <Text style={[styles.careSheetTimeValue, active && {color: '#7954EF'}]}>{value}</Text>
                        </Pressable>;
                      })}
                    </ScrollView>
                  </View>
                ))}
              </View>
              <Pressable style={styles.careSheetSave} onPress={() => {
                setSelectedHour(pendingHour); setSelectedMinute(pendingMinute); setTimePickerVisible(false);
              }}><Check size={19} color="#FFFFFF" /><Text style={styles.careSheetSaveText}>Onayla</Text></Pressable>
            </View>
          ) : (
            <View style={styles.careSheet}>
              <View style={styles.careSheetHandle} />
              <View style={styles.careSheetHeader}>
                <View style={styles.careSheetHeadingIcon}><PawPrint size={24} color="#FFFFFF" /></View>
                <Text style={styles.careSheetTitle}>{editingEvent ? 'Bakımı düzenle' : 'Yeni bakım'}</Text>
                <Pressable disabled={saving} hitSlop={8} accessibilityLabel="Kaydetmeden kapat"
                  onPress={() => { Keyboard.dismiss(); resetForm(); setModalVisible(false); }}
                  style={styles.careSheetClose}><X size={20} color="#817B9E" /></Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.careSheetBody}>
              <View style={styles.petDropdownContainer}>

                <Pressable
                  onPress={() =>
                    setPetDropdownOpen(prev => !prev)
                  }
                  style={[
                    styles.petSelectButton,
                    styles.careSheetPetButton,
                    petDropdownOpen &&
                      styles.petSelectButtonOpen,
                  ]}>

                  {selectedPetId ? (
                    (() => {
                      const selectedPet = pets.find(
                        pet =>
                          String(pet.id) ===
                          String(selectedPetId),
                      );

                      if (!selectedPet) {
                        return (
                          <>
                            <View style={styles.petSelectIcon}>
                              <PawPrint
                                size={20}
                                color="#7C3AED"
                                strokeWidth={2}
                              />
                            </View>

                            <Text style={styles.petPlaceholderText}>
                              Bir dost seç
                            </Text>
                          </>
                        );
                      }

                      return (
                        <>
                          {selectedPet.photoUrl ||
                          selectedPet.photoUri ? (
                            <Image
                              source={{
                                uri:
                                  selectedPet.photoUrl ||
                                  selectedPet.photoUri,
                              }}
                              style={styles.careSheetPetImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Image
                              source={getDefaultPetImage(
                                selectedPet.type,
                              )}
                              style={styles.careSheetPetImage}
                              resizeMode="contain"
                            />
                          )}

                          <View style={{flex: 1, justifyContent: 'center'}}>
                            <Text style={[styles.petSelectText, {
                              flex: 0,
                              lineHeight: 20,
                              includeFontPadding: false,
                            }]}>{selectedPet.name}</Text>
                          </View>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <View style={styles.petSelectIcon}>
                        <PawPrint
                          size={20}
                          color="#7C3AED"
                          strokeWidth={2}
                        />
                      </View>

                      <Text style={styles.petPlaceholderText}>
                        Bir dost seç
                      </Text>
                    </>
                  )}

                  <Text style={styles.petArrow}>
                    {petDropdownOpen ? '⌃' : '⌄'}
                  </Text>

                </Pressable>

                {petDropdownOpen && (
                  <View style={styles.petDropdownList}>

                    {pets.length > 0 ? (
                      pets.map(pet => {

                        const isSelected =
                          String(selectedPetId) ===
                          String(pet.id);

                        const petPhoto =
                          pet.photoUrl ||
                          pet.photoUri;

                        return (
                          <Pressable
                            key={String(pet.id)}
                            onPress={() => {
                              setSelectedPetId(
                                String(pet.id),
                              );

                              setPetName(pet.name);

                              setPetDropdownOpen(false);
                            }}
                            style={[
                              styles.petDropdownItem,
                              isSelected &&
                                styles.petDropdownItemSelected,
                            ]}>

                            {petPhoto ? (
                              <Image
                                source={{
                                  uri: petPhoto,
                                }}
                                style={styles.petDropdownImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <Image
                                source={getDefaultPetImage(
                                  pet.type,
                                )}
                                style={styles.petDropdownImage}
                                resizeMode="contain"
                              />
                            )}

                            <Text
                              style={[
                                styles.petDropdownText,
                                isSelected &&
                                  styles.petDropdownTextSelected,
                              ]}>
                              {pet.name}
                            </Text>

                            {isSelected && (
                              <Text style={styles.petCheck}>
                                ✓
                              </Text>
                            )}

                          </Pressable>
                        );
                      })
                    ) : (
                      <Text style={styles.noPetsText}>
                        Kayıtlı dostun bulunmuyor.
                      </Text>
                    )}

                  </View>
                )}

              </View>


                <Text style={styles.careSheetLabel}>Görev adı</Text>
                <TextInput value={title} onChangeText={setTitle}
                  placeholder={TITLE_PLACEHOLDERS[selectedType]} placeholderTextColor="#A19BB2"
                  style={styles.careSheetInput} />
                <Text style={styles.careSheetLabel}>Kategori</Text>
                <View style={styles.careSheetCategories}>
                  {([
                    ['Vaccination', 'Aşı', Syringe], ['Vet Visit', 'Veteriner', Stethoscope],
                    ['Medication', 'İlaç', Pill], ['Grooming', 'Bakım', PawPrint],
                    ['Operation', 'Ameliyat', Scissors], ['Custom', 'Diğer', MoreHorizontal],
                  ] as const).map(([value, label, Icon]) => {
                    const active = selectedType === value;
                    return <Pressable key={value} onPress={() => setSelectedType(value)}
                      accessibilityState={{selected: active}}
                      style={({pressed}) => [styles.careSheetCategory, active && styles.careSheetCategoryActive,
                        pressed && styles.buttonPressed]}>
                      <Icon size={19} color={active ? '#7954EF' : '#77718F'} strokeWidth={1.8} />
                      <Text style={[styles.careSheetCategoryText, active && {color: '#7954EF'}]}>{label}</Text>
                    </Pressable>;
                  })}
                </View>
                <View style={styles.careSheetSchedule}>
                  <Pressable style={styles.careSheetScheduleItem} onPress={openDatePicker} accessibilityLabel="Tarih seç">
                    <CalendarDays size={22} color="#7954EF" />
                    <View style={{flex: 1}}>
                      <Text style={styles.careSheetSmallLabel}>Tarih</Text>
                      <Text style={styles.careSheetScheduleValue}>
                        {(getNotificationDate(editingEvent ? editDate : newEventDate, '12:00') || new Date())
                          .toLocaleDateString('tr-TR', {day: 'numeric', month: 'short', year: 'numeric'})}
                      </Text>
                    </View><ChevronDown size={16} color="#77718F" />
                  </Pressable>
                  <View style={styles.careSheetScheduleDivider} />
                  <Pressable style={styles.careSheetScheduleItem} accessibilityLabel="Saat seç" onPress={() => {
                    Keyboard.dismiss(); setPendingHour(selectedHour); setPendingMinute(selectedMinute); setTimePickerVisible(true);
                  }}>
                    <Clock3 size={22} color="#7954EF" />
                    <View style={{flex: 1}}><Text style={styles.careSheetSmallLabel}>Saat</Text>
                      <Text style={styles.careSheetScheduleValue}>{selectedHour}:{selectedMinute}</Text>
                    </View><ChevronDown size={16} color="#77718F" />
                  </Pressable>
                </View>
                <View style={styles.careSheetRow}>
                  <Bell size={21} color="#77718F" /><Text style={styles.careSheetRowText}>Hatırlatma</Text>
                  <Switch value={reminderEnabled} onValueChange={setReminderEnabled}
                    trackColor={{false: '#E5E0EE', true: '#7954EF'}} thumbColor="#FFFFFF"
                    ios_backgroundColor="#E5E0EE" accessibilityLabel="Bakım hatırlatması" />
                </View>
                <Pressable style={styles.careSheetRow} onPress={() => setNoteExpanded(value => !value)}>
                  <FileText size={21} color="#77718F" /><Text style={styles.careSheetRowText}>Not ekle</Text>
                  {noteExpanded ? <ChevronDown size={21} color="#77718F" /> : <Plus size={21} color="#77718F" />}
                </Pressable>
                {noteExpanded && <TextInput value={note} onChangeText={setNote} multiline
                  placeholder="Notunu yaz..." placeholderTextColor="#A19BB2"
                  style={[styles.careSheetInput, {minHeight: 88, textAlignVertical: 'top', marginTop: 8}]} />}
                <View style={styles.careSheetRow}>
                  <Palette size={21} color="#77718F" /><Text style={styles.careSheetRowText}>Görev rengi</Text>
                  <View style={styles.careSheetSwatches}>
                    {PASTEL_COLORS.slice(0, 5).map(color => <Pressable key={color} onPress={() => setSelectedColor(color)}
                      accessibilityLabel={`Görev rengi ${color}`} accessibilityState={{selected: color === selectedColor}}
                      hitSlop={4} style={[styles.careSheetSwatch, {backgroundColor: color},
                        color === selectedColor && styles.careSheetSwatchSelected]}>
                      {color === selectedColor && <Check size={17} color="#5B36CE" strokeWidth={2.5} />}
                    </Pressable>)}
                  </View>
                </View>
              </ScrollView>
              <View style={styles.careSheetFooter}>
                <Pressable onPress={handleAddEvent} disabled={saving}
                  style={({pressed}) => [styles.careSheetSave, pressed && styles.buttonPressed, saving && styles.disabledButton]}>
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.careSheetSaveText}>{saving ? 'Kaydediliyor...' : editingEvent ? 'Değişiklikleri kaydet' : 'Bakımı kaydet'}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      <Modal visible={deleteModalVisible} transparent animationType="fade"
        onRequestClose={() => {
          if (deleting) return;
          setDeleteModalVisible(false); setSelectedEventId(null);
        }}>
        <View style={styles.deleteConfirmOverlay}>
          <View style={styles.deleteConfirmCard}>
            <Text style={styles.deleteConfirmTitle}>Bu bakımı silelim mi?</Text>
            <Text style={styles.deleteConfirmDescription}>Bakım kaydı takviminden kaldırılacak. Bu işlem geri alınamaz.</Text>
            {(() => {
              const event = events.find(item => item.id === selectedEventId);
              if (!event) return null;
              return <View style={styles.deleteConfirmSummary}>
                <View style={styles.deleteConfirmPetIcon}><PawPrint size={20} color="#7954EF" /></View>
                <View style={{flex: 1}}>
                  <Text style={styles.deleteConfirmPetName} numberOfLines={1}>{event.petName}</Text>
                  <Text style={styles.deleteConfirmEventName} numberOfLines={2}>{event.title}</Text>
                  <View style={styles.deleteConfirmDateRow}>
                    <CalendarDays size={12} color="#918BA5" />
                    <Text style={styles.deleteConfirmDate}>{event.date.split('-').reverse().join('.')} · {event.time || '09:00'}</Text>
                  </View>
                </View>
              </View>;
            })()}
            <View style={styles.deleteConfirmActions}>
              <Pressable disabled={deleting} onPress={() => {
                setDeleteModalVisible(false); setSelectedEventId(null);
              }} style={({pressed}) => [styles.deleteConfirmCancel, pressed && styles.buttonPressed]}>
                <Text style={styles.deleteConfirmCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable disabled={deleting} onPress={confirmDelete}
                style={({pressed}) => [styles.deleteConfirmDelete, pressed && styles.buttonPressed, deleting && styles.disabledButton]}>
                <Trash2 size={17} color="#FFFFFF" strokeWidth={1.8} />
                <Text style={styles.deleteConfirmDeleteText}>{deleting ? 'Siliniyor...' : 'Bakımı sil'}</Text>
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

    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  deleteConfirmOverlay: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(25,22,56,0.40)'},
  deleteConfirmCard: {width: '100%', maxWidth: 380, backgroundColor: '#FFFFFF', borderRadius: 26, padding: 22},
  deleteConfirmHeader: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8},
  deleteConfirmIcon: {width: 54, height: 54, borderRadius: 18, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center'},
  deleteConfirmClose: {width: 32, height: 32, borderRadius: 16, backgroundColor: '#F6F3FB', alignItems: 'center', justifyContent: 'center'},
  deleteConfirmTitle: {fontFamily: 'Quicksand-Bold', fontSize: 20, lineHeight: 26, color: '#191638', marginBottom: 8},
  deleteConfirmDescription: {fontFamily: 'Quicksand-Regular', fontSize: 12, lineHeight: 19, color: '#817B9E'},
  deleteConfirmSummary: {flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: '#F7F4FD', borderWidth: 1, borderColor: '#EEE7FA', marginVertical: 20},
  deleteConfirmPetIcon: {width: 38, height: 38, borderRadius: 13, backgroundColor: '#EDE5FF', alignItems: 'center', justifyContent: 'center'},
  deleteConfirmPetName: {fontFamily: 'Quicksand-Bold', fontSize: 13, color: '#302A59', marginBottom: 3},
  deleteConfirmEventName: {fontFamily: 'Quicksand-SemiBold', fontSize: 12, lineHeight: 17, color: '#575171'},
  deleteConfirmDateRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7},
  deleteConfirmDate: {fontFamily: 'Quicksand-Regular', fontSize: 10, color: '#918BA5'},
  deleteConfirmActions: {flexDirection: 'row', gap: 10},
  deleteConfirmCancel: {flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: '#E7E0F1', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center'},
  deleteConfirmCancelText: {fontFamily: 'Quicksand-Bold', fontSize: 13, color: '#6F6688'},
  deleteConfirmDelete: {flex: 1, flexDirection: 'row', gap: 7, minHeight: 46, borderRadius: 13, backgroundColor: '#D94B65', alignItems: 'center', justifyContent: 'center'},
  deleteConfirmDeleteText: {fontFamily: 'Quicksand-Bold', fontSize: 13, color: '#FFFFFF'},

  careSheetBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(25,22,56,0.32)'},
  careSheet: {backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', overflow: 'hidden'},
  careSheetHandle: {width: 38, height: 4, borderRadius: 2, backgroundColor: '#D6D0E5', alignSelf: 'center', marginTop: 9, marginBottom: 12},
  careSheetHeader: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, marginBottom: 16},
  careSheetHeadingIcon: {width: 42, height: 42, borderRadius: 21, backgroundColor: '#7954EF', alignItems: 'center', justifyContent: 'center'},
  careSheetTitle: {flex: 1, fontFamily: 'Quicksand-Bold', fontSize: 21, color: '#191638'},
  careSheetClose: {width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F0FF', alignItems: 'center', justifyContent: 'center'},
  careSheetBody: {paddingHorizontal: 20, paddingBottom: 16},
  careSheetPetButton: {backgroundColor: '#F4F0FF', borderColor: '#F4F0FF', minHeight: 64, borderRadius: 16, marginBottom: 4},
  careSheetPetImage: {width: 42, height: 42, borderRadius: 21, marginRight: 12},
  careSheetPetHint: {fontFamily: 'Quicksand-Regular', fontSize: 11, color: '#918BA5', marginTop: 2},
  careSheetLabel: {fontFamily: 'Quicksand-Bold', fontSize: 13, color: '#302A59', marginTop: 16, marginBottom: 9},
  careSheetInput: {borderWidth: 1, borderColor: '#DFD8ED', borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, fontFamily: 'Quicksand-SemiBold', fontSize: 14, color: '#191638', backgroundColor: '#FFFFFF'},
  careSheetCategories: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 17},
  careSheetCategory: {width: '31.5%', minHeight: 44, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E8E2F3', backgroundColor: '#FBFAFE'},
  careSheetCategoryActive: {backgroundColor: '#F0E9FF', borderColor: '#7954EF'},
  careSheetCategoryText: {fontFamily: 'Quicksand-Bold', fontSize: 11, color: '#575171'},
  careSheetSchedule: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F0FF', borderWidth: 1, borderColor: '#E6DDF9', borderRadius: 15, marginBottom: 5},
  careSheetScheduleItem: {flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 15, gap: 7},
  careSheetScheduleDivider: {width: 1, height: 34, backgroundColor: '#DFD5F3'},
  careSheetSmallLabel: {fontFamily: 'Quicksand-Regular', fontSize: 11, color: '#918BA5', marginBottom: 3},
  careSheetScheduleValue: {fontFamily: 'Quicksand-Bold', fontSize: 12, color: '#191638'},
  careSheetRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderWidth: 1, borderColor: '#E4DEEE', borderRadius: 14, paddingHorizontal: 12, marginTop: 9},
  careSheetRowText: {flex: 1, fontFamily: 'Quicksand-SemiBold', fontSize: 13, color: '#302A59'},
  careSheetSwatches: {flexDirection: 'row', gap: 5},
  careSheetSwatch: {width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  careSheetSwatchSelected: {borderWidth: 2, borderColor: '#7954EF'},
  careSheetFooter: {paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 20, borderTopWidth: 1, borderTopColor: '#F1EDF8', backgroundColor: '#FFFFFF'},
  careSheetSave: {minHeight: 50, backgroundColor: '#7954EF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9},
  careSheetSaveText: {fontFamily: 'Quicksand-Bold', fontSize: 15, color: '#FFFFFF'},
  careSheetTimeCard: {backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingVertical: 24, paddingBottom: 32},
  careSheetTimeColumns: {flexDirection: 'row', gap: 16, paddingHorizontal: 24, marginBottom: 18},
  careSheetTimeColumn: {flex: 1},
  careSheetTimeOption: {height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12},
  careSheetTimeValue: {fontFamily: 'Quicksand-Bold', fontSize: 20, color: '#575171'},

  formCloseButton: {
    position: 'absolute', top: 12, right: 12, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F3FA', alignItems: 'center', justifyContent: 'center',
  },

  dateInputRow: {position: 'relative'},
  dateInputField: {paddingRight: 58},
  dateInputIcon: {
    position: 'absolute', right: 8, top: 5, width: 40, height: 40,
    borderRadius: 20, backgroundColor: '#F0ECFF',
    alignItems: 'center', justifyContent: 'center',
  },
  datePickerCard: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  datePickerHeading: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20},
  datePickerIconBadge: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: '#F0ECFF',
    alignItems: 'center', justifyContent: 'center',
  },
  datePickerTitle: {fontFamily: 'Quicksand-Bold', fontSize: 19, color: '#17143F'},
  datePickerSubtitle: {fontFamily: 'Quicksand-Regular', fontSize: 11, color: '#817B9E', marginTop: 4},
  datePickerClose: {width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F3FA', alignItems: 'center', justifyContent: 'center'},
  datePickerCloseText: {fontSize: 25, color: '#817B9E'},
  datePickerMonthRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10},
  datePickerArrow: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  datePickerMonthTitle: {fontFamily: 'Quicksand-Bold', fontSize: 16, color: '#302A59', textTransform: 'capitalize'},
  datePickerGrid: {flexDirection: 'row', flexWrap: 'wrap'},
  datePickerCell: {width: '14.285714%', height: 44, alignItems: 'center', justifyContent: 'center'},
  datePickerWeekday: {fontFamily: 'Quicksand-SemiBold', fontSize: 10, color: '#918B9F'},
  datePickerDay: {width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  datePickerDaySelected: {backgroundColor: '#7256E8'},
  datePickerDayText: {fontFamily: 'Quicksand-Bold', fontSize: 13, color: '#302A59'},
  datePickerTodayText: {color: '#7256E8'},
  datePickerDaySelectedText: {color: '#FFFFFF'},
  datePickerSelectedDate: {fontFamily: 'Quicksand-SemiBold', fontSize: 12, color: '#817B9E', textAlign: 'center', marginTop: 14},

  actionMenuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 20,
  },
  actionMenu: {
    position: 'absolute',
    width: 160,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE9F6',
    shadowColor: '#302A59',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 8,
  },
  actionMenuItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    borderRadius: 10,
  },
  actionMenuItemPressed: {backgroundColor: '#F7F4FD'},
  actionMenuDivider: {height: 1, marginHorizontal: 12, backgroundColor: '#F1EDF7'},
  actionMenuEditText: {fontFamily: 'Quicksand-Bold', fontSize: 13, color: '#7256E8'},
  actionMenuDeleteText: {fontFamily: 'Quicksand-Bold', fontSize: 13, color: '#E45B72'},

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
    fontFamily: 'Quicksand-Bold',
    fontSize: 26,
    color: '#111827',
    marginBottom: 8,
  },

  heroSubtitle: {
    fontFamily: 'Quicksand-Regular',
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
    fontFamily: 'Quicksand-Bold',
    fontSize: 24,
    color: '#8B5CF6',
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
    fontFamily: 'Quicksand-Bold',
    fontSize: 24,
    color: '#8B5CF6',
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
    fontFamily: 'Quicksand-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },

  dayHeaderDate: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 20,
    color: '#111827',
  },

  dayChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },

  dayChipText: {
    fontFamily: 'Quicksand-Bold',
    color: '#6366F1',
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
    fontFamily: 'Quicksand-Bold',
    fontSize: 13,
  },

  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  completeButton: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },

  completeButtonDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },

  completeButtonPressed: {
    opacity: 0.8,
    transform: [{scale: 0.97}],
  },

  completeButtonText: {
    fontFamily: 'Quicksand-Bold',
    color: '#7C3AED',
    fontSize: 12,
  },

  completeButtonTextDone: {
    fontFamily: 'Quicksand-Regular',
    color: '#059669',
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
    fontFamily: 'Quicksand-Bold',
    color: '#DC2626',
    fontSize: 12,
  },

  eventPetName: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 14,
    color: '#6366F1',
    marginBottom: 6,
  },

  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },

  eventTypeText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  completedText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#059669',
  },

  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  eventTimeIcon: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 13,
    marginRight: 5,
  },

  eventTime: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 13,
    color: '#8B5CF6',
  },

  eventNote: {
    fontFamily: 'Quicksand-Regular',
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
    fontFamily: 'Quicksand-Regular',
    fontSize: 30,
    marginBottom: 10,
  },

  emptyTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 17,
    color: '#111827',
    marginBottom: 8,
  },

  emptyText: {
    fontFamily: 'Quicksand-Regular',
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
    fontFamily: 'Quicksand-Regular',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },

  modalTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 22,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },

  modalSubtitle: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },

  input: {
    fontFamily: 'Quicksand-Regular',
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

  typePickerLabel: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 10,
    marginTop: 2,
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  typeOption: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  typeOptionActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },

  typeOptionPressed: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },

  typeOptionText: {
    fontFamily: 'Quicksand-Bold',
    color: '#64748B',
    fontSize: 12,
  },

  typeOptionTextActive: {
    fontFamily: 'Quicksand-Regular',
    color: '#7C3AED',
  },

  /* TIME PICKER */

  timePickerLabel: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
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
    fontFamily: 'Quicksand-Bold',
    color: '#7C3AED',
    fontSize: 20,
    lineHeight: 22,
  },

  timeInput: {
    fontFamily: 'Quicksand-Bold',
    minWidth: 64,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    marginVertical: 7,

    fontSize: 22,
    color: '#111827',
    textAlign: 'center',
    paddingVertical: 0,
  },

  timeValue: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 22,
    color: '#111827',
  },

  timeColon: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 27,
    color: '#8B5CF6',
    marginHorizontal: 8,
    marginBottom: 18,
  },

  timeUnit: {
    fontFamily: 'Quicksand-SemiBold',
    marginTop: 5,
    fontSize: 11,
    color: '#94A3B8',
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
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 12,
    color: '#6B7280',
  },

  selectedTimePreviewValue: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 15,
    color: '#7C3AED',
  },

  colorPickerLabel: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
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
    fontFamily: 'Quicksand-Bold',
    color: '#111827',
    fontSize: 16,
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
    fontFamily: 'Quicksand-Bold',
    color: '#4B5563',
    fontSize: 15,
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
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
    fontSize: 15,
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
    fontFamily: 'Quicksand-Regular',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 10,
  },

  deleteTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 22,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },

  deleteText: {
    fontFamily: 'Quicksand-Regular',
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
    fontFamily: 'Quicksand-Bold',
    color: '#4B5563',
    fontSize: 15,
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
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
    fontSize: 15,
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
    fontFamily: 'Quicksand-Bold',
    fontSize: 21,
    color: '#11163A',
    textAlign: 'center',
    marginBottom: 8,
  },

  errorModalText: {
    fontFamily: 'Quicksand-Regular',
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
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
    fontSize: 15,
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
    fontFamily: 'Quicksand-Bold',
    fontSize: 13,
    color: '#8B5CF6',
    marginBottom: 2,
  },

  successToastText: {
    fontFamily: 'Quicksand-SemiBold',
    color: '#374151',
    fontSize: 13,
    lineHeight: 18,
  },

  petPickerLabel: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 10,
  },

  petDropdownContainer: {
    position: 'relative',
    zIndex: 20,
    marginBottom: 14,
  },

  petSelectButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  petSelectButtonOpen: {
    borderColor: '#C4B5FD',
    backgroundColor: '#FAF9FF',
  },

  petSelectImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },

  petSelectIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  petSelectText: {
    fontFamily: 'Quicksand-Bold',
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },

  petPlaceholderText: {
    fontFamily: 'Quicksand-SemiBold',
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
  },

  petArrow: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 22,
    color: '#7C3AED',
    marginLeft: 8,
  },

  petDropdownList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  petDropdownItem: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  petDropdownItemSelected: {
    backgroundColor: '#FAF9FF',
  },

  petDropdownImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 11,
  },

  petDropdownText: {
    fontFamily: 'Quicksand-SemiBold',
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },

  petDropdownTextSelected: {
    fontFamily: 'Quicksand-Bold',
    color: '#7C3AED',
  },

  petCheck: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 18,
    color: '#7C3AED',
    marginLeft: 8,
  },

  noPetsText: {
    fontFamily: 'Quicksand-Regular',
    padding: 16,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },


  plannerContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 34,
    backgroundColor: '#FAF9FF',
  },

  referenceHeader: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FCFBFF',
  },

  referenceBack: {
    width: 32,
    height: 34,
    justifyContent: 'center',
    marginRight: 6,
  },

  referenceBackText: {
    fontFamily: 'Quicksand-Light',
    fontSize: 34,
    lineHeight: 34,
    color: '#17143F',
    marginTop: -5,
  },

  referenceHeaderCopy: {
    flex: 1,
    paddingTop: 1,
  },

  referenceHeaderTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 23,
    lineHeight: 27,
    color: '#17143F',
  },

  referenceSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  referenceHeaderSubtitle: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#817B9E',
  },

  referenceNewButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: '#F0ECFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  referenceNewPlus: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 21,
    lineHeight: 22,
    color: '#7256E8',
    marginRight: 6,
  },

  referenceNewText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#7256E8',
  },

  headerDivider: {
    height: 1,
    backgroundColor: '#F0EDF8',
  },

  buttonPressed: {
    opacity: 0.76,
    transform: [{scale: 0.98}],
  },

  calendarArea: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FAF9FF',
  },

  calendarBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  monthRow: {
    position: 'relative',
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarBackButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0ECFF',
    marginRight: 6,
  },

  calendarBackText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 29,
    lineHeight: 31,
    color: '#7256E8',
    marginTop: -5,
  },

  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  monthActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },

  monthArrowButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  monthArrow: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 29,
    lineHeight: 31,
    color: '#7256E8',
    marginTop: -5,
  },

  monthTitle: {
    fontFamily: 'Quicksand-Bold',
    minWidth: 108,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
    color: '#17143F',
    textTransform: 'capitalize',
    marginHorizontal: 4,
  },

  todayButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EFEBFF',
  },

  todayButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 11,
    color: '#7256E8',
  },

  compactNewButton: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 17,
    backgroundColor: '#7256E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  compactNewPlus: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 18,
    lineHeight: 19,
    color: '#FFFFFF',
    marginRight: 4,
  },

  compactNewText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },

  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },

  weekDay: {
    flex: 1,
    height: 82,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F0F8',
  },

  weekDayActive: {
    backgroundColor: '#DDD2FF',
    borderColor: '#D8CBFF',
  },

  weekDayName: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 10,
    lineHeight: 13,
    color: '#777294',
    marginBottom: 5,
  },

  weekDayNameActive: {
    fontFamily: 'Quicksand-Regular',
    color: '#514A72',
  },

  weekDayNumber: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 18,
    lineHeight: 22,
    color: '#17143F',
  },

  weekDayNumberActive: {
    fontFamily: 'Quicksand-Regular',
    color: '#17143F',
  },

  dayDots: {
    height: 8,
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  dayDotPlaceholder: {
    width: 6,
    height: 6,
  },

  monthCalendar: {
    marginTop: 14,
    paddingTop: 12,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: '#F0EDF8',
  },

  monthWeekHeader: {
    flexDirection: 'row',
    marginBottom: 7,
  },

  monthWeekHeaderText: {
    fontFamily: 'Quicksand-Bold',
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
    color: '#817B9E',
  },

  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  monthDayCell: {
    width: '14.2857%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginVertical: 2,
  },

  monthDayCellActive: {
    backgroundColor: '#7256E8',
  },

  monthDayCellToday: {
    backgroundColor: '#F0ECFF',
  },

  monthDayNumber: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#302A59',
  },

  monthDayNumberMuted: {
    fontFamily: 'Quicksand-SemiBold',
    color: '#C3BED2',
  },

  monthDayNumberActive: {
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },

  monthDayDots: {
    height: 6,
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },

  monthDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  monthExpandWrap: {
    alignItems: 'center',
    marginTop: 14,
  },

  monthExpandButton: {
    minWidth: 122,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#F0ECFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  monthExpandIcon: {
    fontFamily: 'Quicksand-Bold',
    color: '#7256E8',
    fontSize: 18,
    marginTop: -4,
  },

  monthExpandIconOpen: {
    transform: [{rotate: '180deg'}],
    marginTop: 4,
  },

  monthExpandText: {
    fontFamily: 'Quicksand-Bold',
    color: '#7256E8',
    fontSize: 12,
  },

  agendaPanel: {
    marginHorizontal: 14,
    marginTop: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#F2EFF8',
    marginBottom: 14,
  },

  agendaHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
    paddingHorizontal: 1,
  },

  agendaHeadingText: {
    flex: 1,
    paddingRight: 8,
  },

  selectedDateText: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 13,
    lineHeight: 17,
    color: '#817B9E',
    textTransform: 'capitalize',
    marginBottom: 3,
  },

  agendaTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 23,
    lineHeight: 28,
    color: '#17143F',
  },

  recordCountBadge: {
    backgroundColor: '#F0ECFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 2,
  },

  recordCountText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 10,
    color: '#7256E8',
  },

  careCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE9F2',
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 94,
  },

  careAccent: {
    width: 5,
  },

  careCardContent: {
    flex: 1,
    paddingVertical: 11,
    paddingLeft: 10,
    paddingRight: 10,
  },

  careMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
  },

  carePetImage: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#F3EFFF',
    marginRight: 10,
  },

  careTextBlock: {
    flex: 1,
    minWidth: 0,
  },

  carePetName: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    lineHeight: 18,
    color: '#17143F',
    marginBottom: 4,
  },

  eventNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  eventTypeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  careEventTitle: {
    fontFamily: 'Quicksand-Bold',
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#302A59',
  },

  careMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  careTime: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 11,
    color: '#817B9E',
  },

  cardRight: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusDone: {
    backgroundColor: '#DDF7EE',
  },

  statusPending: {
    backgroundColor: '#EEE8FF',
  },

  statusText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 9,
  },

  statusDoneText: {
    fontFamily: 'Quicksand-Regular',
    color: '#229474',
  },

  statusPendingText: {
    fontFamily: 'Quicksand-Regular',
    color: '#7256E8',
  },

  careActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  moreCircle: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 5,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  completeCheckText: {
    color: '#16A34A',
    fontSize: 18,
  },

  moreCircleText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    color: '#77718F',
  },

  moreDots: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 15,
    letterSpacing: 1,
    color: '#292347',
    marginTop: -5,
  },

  careNote: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 11,
    color: '#918B9F',
    lineHeight: 16,
    marginTop: 8,
    marginLeft: 71,
  },

  addCareButton: {
    height: 46,
    borderRadius: 17,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
    flexDirection: 'row',
    gap: 7,
  },

  addCarePlus: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 21,
    color: '#7256E8',
  },

  addCareButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 13,
    color: '#7256E8',
  },

  plannerEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },

  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3EFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  emptyIcon: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 21,
    color: '#9275DF',
  },

  plannerEmptyTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 13,
    color: '#302B42',
    marginBottom: 5,
  },

  plannerEmptyText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#9690A2',
    textAlign: 'center',
  },

  upcomingSection: {
    marginHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 12,
    paddingTop: 15,
    paddingBottom: 11,
    borderWidth: 1,
    borderColor: '#F2EFF8',
    marginBottom: 10,
  },

  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },

  upcomingTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 20,
    lineHeight: 24,
    color: '#17143F',
  },

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0ECFF',
    paddingLeft: 13,
    paddingRight: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  seeAllText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 10,
    color: '#7256E8',
  },

  seeAllArrow: {
    fontFamily: 'Quicksand-Bold',
    marginLeft: 5,
    fontSize: 20,
    lineHeight: 19,
    color: '#7256E8',
  },

  upcomingList: {
    borderWidth: 1,
    borderColor: '#F0EDF5',
    borderRadius: 20,
    overflow: 'hidden',
  },

  upcomingCard: {
    minHeight: 72,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF5',
  },

  upcomingCardLast: {
    borderBottomWidth: 0,
  },

  upcomingIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  upcomingText: {
    flex: 1,
    paddingVertical: 12,
  },

  upcomingDate: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 12,
    color: '#8A84A2',
    textTransform: 'capitalize',
    marginBottom: 2,
  },

  upcomingEventTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    lineHeight: 20,
    color: '#17143F',
    marginBottom: 2,
  },

  upcomingPet: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 13,
    color: '#817B9E',
  },

  upcomingArrow: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 30,
    color: '#817B9E',
    marginLeft: 8,
  },

});
