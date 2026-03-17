import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
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

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export default function PetsScreen() {
  const {pets} = usePets();
  const navigation = useNavigation<NavigationProp>();

  const getCareSummary = (pet: Pet) => {
    const gender = pet.gender ? pet.gender : 'Cinsiyet yok';
    const weight = pet.weight ? pet.weight : 'Kilo yok';
    const vaccines = pet.vaccines ? 'Aşı kaydı var' : 'Aşı kaydı yok';
    const vetVisit = pet.lastVetVisit ? pet.lastVetVisit : 'Vet tarihi yok';

    return `${gender} • ${weight} • ${vaccines} • ${vetVisit}`;
  };

  const getPetEmoji = (type: string) => {
    const lowerType = type.toLowerCase();

    if (lowerType.includes('kedi')) {
      return '🐱';
    }
    if (lowerType.includes('köpek') || lowerType.includes('kopek')) {
      return '🐶';
    }
    if (lowerType.includes('kuş') || lowerType.includes('kus')) {
      return '🐦';
    }
    if (lowerType.includes('balık') || lowerType.includes('balik')) {
      return '🐠';
    }

    return '🐾';
  };

  const renderItem = ({item}: {item: Pet}) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('PetDetail', {pet: item})}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getPetEmoji(item.type)}</Text>
        </View>

        <View style={styles.mainInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.typeText}>
            {item.type} • {item.age} yaş
          </Text>
          <Text style={styles.metaText}>
            {item.gender ? item.gender : 'Cinsiyet yok'} •{' '}
            {item.weight ? item.weight : 'Kilo yok'}
          </Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Detay</Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryLabel}>Bakım Özeti</Text>
        <Text style={styles.summary}>{getCareSummary(item)}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>My Pets</Text>
        <Text style={styles.headerSubtitle}>
          Tüm petlerini buradan görüntüleyebilir ve detaylarına ulaşabilirsin.
        </Text>
      </View>

      {pets.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyEmojiWrap}>
            <Text style={styles.emptyEmoji}>🐾</Text>
          </View>

          <Text style={styles.emptyTitle}>Henüz pet eklenmedi</Text>

          <Text style={styles.emptyText}>
            İlk petini ekleyerek bakım bilgilerini, sağlık notlarını ve günlük
            takibini düzenli şekilde saklamaya başlayabilirsin.
          </Text>

          <View style={styles.emptyTipsRow}>
            <View style={styles.emptyTipChip}>
              <Text style={styles.emptyTipText}>🩺 Vet notları</Text>
            </View>

            <View style={styles.emptyTipChip}>
              <Text style={styles.emptyTipText}>💉 Aşı bilgileri</Text>
            </View>
          </View>

          <Pressable
            style={styles.emptyButton}
            onPress={() => navigation.navigate('AddPet')}>
            <Text style={styles.emptyButtonText}>+ İlk Peti Ekle</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  headerBox: {
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 16,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 24,
  },
  mainInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#818CF8',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FCE7F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BE185D',
  },
  summaryBox: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  summary: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    fontWeight: '500',
  },
  emptyBox: {
    marginTop: 26,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: 'center',
    elevation: 2,
  },
  emptyEmojiWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyEmoji: {
    fontSize: 34,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  emptyTipsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTipChip: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  emptyTipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  emptyButton: {
    backgroundColor: '#A5B4FC',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});