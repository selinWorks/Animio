import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import {Calendar} from 'react-native-calendars';

type CareEventType = 'Vaccination' | 'Vet Visit' | 'Medication' | 'Grooming';

type CareEvent = {
  id: string;
  title: string;
  date: string;
  type: CareEventType;
  petName: string;
  note?: string;
};

const mockEvents: CareEvent[] = [
  {
    id: '1',
    title: 'Annual Vaccination',
    date: '2026-03-18',
    type: 'Vaccination',
    petName: 'Luna',
    note: 'Bring vaccination card.',
  },
  {
    id: '2',
    title: 'Vet Check',
    date: '2026-03-18',
    type: 'Vet Visit',
    petName: 'Max',
    note: 'General health control.',
  },
  {
    id: '3',
    title: 'Medication Reminder',
    date: '2026-03-20',
    type: 'Medication',
    petName: 'Luna',
    note: 'After breakfast.',
  },
  {
    id: '4',
    title: 'Bath & Grooming',
    date: '2026-03-24',
    type: 'Grooming',
    petName: 'Charlie',
    note: 'Nail trimming included.',
  },
];

function getTypeStyle(type: CareEventType) {
  switch (type) {
    case 'Vaccination':
      return {
        bg: '#FCE7F3',
        text: '#DB2777',
        badge: '💉 Vaccination',
      };
    case 'Vet Visit':
      return {
        bg: '#DBEAFE',
        text: '#2563EB',
        badge: '🩺 Vet Visit',
      };
    case 'Medication':
      return {
        bg: '#EDE9FE',
        text: '#7C3AED',
        badge: '💊 Medication',
      };
    case 'Grooming':
      return {
        bg: '#D1FAE5',
        text: '#059669',
        badge: '🫧 Grooming',
      };
    default:
      return {
        bg: '#F3F4F6',
        text: '#374151',
        badge: type,
      };
  }
}

export default function CalendarScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const eventsForSelectedDay = mockEvents.filter(
    event => event.date === selectedDate,
  );

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    mockEvents.forEach(event => {
      marked[event.date] = {
        ...(marked[event.date] || {}),
        marked: true,
        dotColor: '#A78BFA',
      };
    });

    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: '#A78BFA',
      marked: mockEvents.some(event => event.date === selectedDate),
      dotColor: '#FFFFFF',
    };

    return marked;
  }, [selectedDate]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>🗓️</Text>
        <Text style={styles.heroTitle}>Care Calendar</Text>
        <Text style={styles.heroSubtitle}>
          Aşıları, veteriner randevularını ve bakım görevlerini tek yerden takip et.
        </Text>
      </View>

      <View style={styles.calendarCard}>
        <Calendar
          current={today}
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          enableSwipeMonths
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

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#DB2777'}]} />
            <Text style={styles.legendText}>Vaccination</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#2563EB'}]} />
            <Text style={styles.legendText}>Vet</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#7C3AED'}]} />
            <Text style={styles.legendText}>Medication</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#059669'}]} />
            <Text style={styles.legendText}>Grooming</Text>
          </View>
        </View>
      </View>

      <View style={styles.dayHeaderRow}>
        <View>
          <Text style={styles.dayHeaderTitle}>Selected Day</Text>
          <Text style={styles.dayHeaderDate}>{selectedDate}</Text>
        </View>

        <Pressable style={styles.dayChip}>
          <Text style={styles.dayChipText}>
            {eventsForSelectedDay.length} task
          </Text>
        </Pressable>
      </View>

      {eventsForSelectedDay.length > 0 ? (
        eventsForSelectedDay.map(event => {
          const typeStyle = getTypeStyle(event.type);

          return (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventTopRow}>
                <View
                  style={[
                    styles.typeBadge,
                    {backgroundColor: typeStyle.bg},
                  ]}>
                  <Text
                    style={[
                      styles.typeBadgeText,
                      {color: typeStyle.text},
                    ]}>
                    {typeStyle.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.eventTitle}>{event.title}</Text>

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
          <Text style={styles.emptyTitle}>Bu gün için görev yok</Text>
          <Text style={styles.emptyText}>
            Seçilen tarihte aşı, ilaç ya da veteriner randevusu görünmüyor.
          </Text>
        </View>
      )}

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>PetCare Tip</Text>
        <Text style={styles.tipText}>
          Yakında bu takvime bildirimler, pet bazlı görevler ve yeni bakım planları
          ekleyebilirsin.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
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
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
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
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
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
  tipCard: {
    backgroundColor: '#FCE7F3',
    borderRadius: 20,
    padding: 18,
    marginTop: 4,
    elevation: 2,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
  },
});