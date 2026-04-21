import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
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

type StatusConfig = {
  label: string;
  shortLabel: string;
  backgroundColor: string;
  textColor: string;
  ringColor: string;
  cardTint: string;
};

function getPetEmoji(type: string) {
  const lowerType = (type || '').toLowerCase().trim();

  if (lowerType.includes('kedi')) return '🐱';
  if (lowerType.includes('köpek') || lowerType.includes('kopek')) return '🐶';
  if (lowerType.includes('kuş') || lowerType.includes('kus')) return '🐦';
  if (lowerType.includes('balık') || lowerType.includes('balik')) return '🐠';
  if (lowerType.includes('hamster')) return '🐹';
  if (lowerType.includes('tavşan') || lowerType.includes('tavsan')) return '🐰';
  if (lowerType.includes('kaplumbağa') || lowerType.includes('kaplumbaga')) {
    return '🐢';
  }

  return '🐾';
}

function getPetAvatarColor(type: string) {
  const lowerType = (type || '').toLowerCase().trim();

  if (lowerType.includes('kedi')) return '#FCE7F3';
  if (lowerType.includes('köpek') || lowerType.includes('kopek')) return '#DBEAFE';
  if (lowerType.includes('kuş') || lowerType.includes('kus')) return '#FEF3C7';
  if (lowerType.includes('balık') || lowerType.includes('balik')) return '#DCFCE7';
  if (lowerType.includes('hamster')) return '#FDE68A';
  if (lowerType.includes('tavşan') || lowerType.includes('tavsan')) return '#EDE9FE';
  if (lowerType.includes('kaplumbağa') || lowerType.includes('kaplumbaga')) {
    return '#D1FAE5';
  }

  return '#EEF2FF';
}

function getStatusConfig(pet: Pet): StatusConfig {
  const hasWeight = !!pet.weight;
  const hasVetVisit = !!pet.lastVetVisit;
  const hasVaccines = !!pet.vaccines;

  if (hasWeight && hasVetVisit && hasVaccines) {
    return {
      label: 'Her şey yolunda',
      shortLabel: 'İyi durumda',
      backgroundColor: '#DCFCE7',
      textColor: '#166534',
      ringColor: '#22C55E',
      cardTint: '#F8FEFA',
    };
  }

  if ((hasVaccines && !hasWeight) || (hasVetVisit && !hasWeight)) {
    return {
      label: 'Biraz ilgi istiyor',
      shortLabel: 'Takip gerekli',
      backgroundColor: '#FEF3C7',
      textColor: '#92400E',
      ringColor: '#F59E0B',
      cardTint: '#FFFCF5',
    };
  }

  return {
    label: 'Bilgi eksik',
    shortLabel: 'Eksik bilgi',
    backgroundColor: '#FEE2E2',
    textColor: '#B91C1C',
    ringColor: '#EF4444',
    cardTint: '#FFF8F8',
  };
}

function getInsightText(pet: Pet) {
  if (pet.lastVetVisit) {
    return `Son veteriner ziyareti ${pet.lastVetVisit} tarihinde kaydedildi.`;
  }

  if (pet.vaccines) {
    return 'Aşı kayıtları mevcut, bakım takibi aktif görünüyor.';
  }

  if (!pet.weight) {
    return 'Kilo bilgisi henüz eklenmemiş, profil biraz daha tamamlanabilir.';
  }

  return 'Bakım detayları güncellenirse profil daha güçlü görünür.';
}

function getSummaryText(pets: Pet[]) {
  if (pets.length === 0) {
    return 'İlk dostunu eklediğinde bakım ve sağlık takibini tek yerde düzenli şekilde yönetebilirsin.';
  }

  let healthyCount = 0;
  let needsAttentionCount = 0;

  pets.forEach(pet => {
    const status = getStatusConfig(pet);
    if (status.shortLabel === 'İyi durumda') {
      healthyCount += 1;
    } else {
      needsAttentionCount += 1;
    }
  });

  if (healthyCount === pets.length) {
    return 'Harika görünüyor. Tüm dostların düzenli şekilde takip ediliyor.';
  }

  if (healthyCount === 0) {
    return 'Bazı profiller biraz daha ilgi bekliyor. Küçük güncellemelerle görünüm çok daha güçlü hale gelir.';
  }

  return `${healthyCount} dost iyi durumda, ${needsAttentionCount} dost için küçük güncellemeler faydalı olabilir.`;
}

function getHeaderInfoText(pets: Pet[]) {
  if (pets.length === 0) {
    return 'Bakım takibi burada başlar';
  }

  const completeProfiles = pets.filter(pet => {
    const status = getStatusConfig(pet);
    return status.shortLabel === 'İyi durumda';
  }).length;

  if (completeProfiles === pets.length) {
    return 'Tüm profiller güncel';
  }

  return `${completeProfiles}/${pets.length} profil güçlü görünüyor`;
}

function renderInfoChip(label: string, filled = false) {
  return (
    <View
      style={[
        styles.infoChip,
        filled ? styles.infoChipFilled : styles.infoChipDefault,
      ]}>
      <Text
        style={[
          styles.infoChipText,
          filled ? styles.infoChipTextFilled : styles.infoChipTextDefault,
        ]}>
        {label}
      </Text>
    </View>
  );
}

type PetCardProps = {
  item: Pet;
  index: number;
  onPress: () => void;
};

function PetCard({item, index, onPress}: PetCardProps) {
  const status = getStatusConfig(item);

  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceTranslate = useRef(new Animated.Value(26)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 380,
        delay: 120 + index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entranceTranslate, {
        toValue: 0,
        duration: 420,
        delay: 120 + index * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(ringScale, {
        toValue: 1,
        delay: 200 + index * 80,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entranceOpacity, entranceTranslate, ringScale, index]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.985,
      friction: 8,
      tension: 170,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 8,
      tension: 170,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: entranceOpacity,
        transform: [{translateY: entranceTranslate}, {scale: pressScale}],
      }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, {backgroundColor: status.cardTint}]}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardTopLeft}>
            <Animated.View
              style={[
                styles.avatarRing,
                {
                  borderColor: status.ringColor,
                  transform: [{scale: ringScale}],
                },
              ]}>
              <View
                style={[
                  styles.avatar,
                  {backgroundColor: getPetAvatarColor(item.type)},
                ]}>
                <Text style={styles.avatarText}>{getPetEmoji(item.type)}</Text>
              </View>
            </Animated.View>

            <View style={styles.mainInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.typeText}>
                {item.type} • {item.age} yaş
              </Text>
              <Text style={styles.miniInsight}>{status.shortLabel}</Text>
            </View>
          </View>

          <View style={styles.cardTopRight}>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: status.backgroundColor},
              ]}>
              <Text style={[styles.statusText, {color: status.textColor}]}>
                {status.label}
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </View>
        </View>

        <View style={styles.chipsRow}>
          {renderInfoChip(item.gender ? item.gender : 'Cinsiyet eklenmemiş', true)}
          {renderInfoChip(item.weight ? item.weight : 'Kilo bilgisi yok')}
          {renderInfoChip(item.vaccines ? 'Aşı takibi aktif' : 'Aşı bilgisi eksik')}
        </View>

        <View style={styles.insightBox}>
          <Text style={styles.insightLabel}>Bugünün özeti</Text>
          <Text style={styles.insightText}>{getInsightText(item)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function PetsScreen() {
  const {pets} = usePets();
  const navigation = useNavigation<NavigationProp>();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerOpacity, headerTranslate]);

  const summaryText = getSummaryText(pets);
  const headerInfoText = getHeaderInfoText(pets);
  const topPreviewPets = pets.slice(0, 3);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.headerBox,
          {
            opacity: headerOpacity,
            transform: [{translateY: headerTranslate}],
          },
        ]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Dostlarım</Text>
          </View>

          <View style={styles.headerCountWrap}>
            <Text style={styles.headerCountNumber}>{pets.length}</Text>
            <Text style={styles.headerCountLabel}>kayıtlı dost</Text>
          </View>
        </View>

        <Text style={styles.headerTitle}>Dostlarının bugünkü görünümü</Text>
        <Text style={styles.headerSubtitle}>{summaryText}</Text>

        <View style={styles.headerBottomRow}>
          <View style={styles.avatarPreviewRow}>
            {topPreviewPets.length > 0 ? (
              topPreviewPets.map((pet, index) => {
                const status = getStatusConfig(pet);

                return (
                  <View
                    key={pet.id}
                    style={[
                      styles.previewAvatarWrap,
                      {
                        marginLeft: index === 0 ? 0 : -10,
                        borderColor: status.ringColor,
                      },
                    ]}>
                    <Text style={styles.previewAvatarText}>
                      {getPetEmoji(pet.type)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.previewAvatarWrapEmpty}>
                <Text style={styles.previewAvatarText}>🐾</Text>
              </View>
            )}
          </View>

          <View style={styles.headerInfoPill}>
            <Text style={styles.headerInfoPillText}>{headerInfoText}</Text>
          </View>
        </View>
      </Animated.View>

      {pets.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyEmojiWrap}>
            <Text style={styles.emptyEmoji}>🐾</Text>
          </View>

          <Text style={styles.emptyTitle}>Henüz dost eklenmedi</Text>

          <Text style={styles.emptyText}>
            İlk dostunu eklediğinde bakım bilgileri, sağlık notları ve günlük
            takip akışı tek yerde toplanır.
          </Text>

          <View style={styles.emptyTipsRow}>
            <View style={styles.emptyTipChip}>
              <Text style={styles.emptyTipText}>🩺 Vet takibi</Text>
            </View>

            <View style={styles.emptyTipChip}>
              <Text style={styles.emptyTipText}>💉 Aşı düzeni</Text>
            </View>

            <View style={styles.emptyTipChip}>
              <Text style={styles.emptyTipText}>📌 Günlük bakım</Text>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={item => item.id}
          renderItem={({item, index}) => (
            <PetCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('PetDetail', {pet: item})}
            />
          )}
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
    backgroundColor: '#F7F8FC',
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  headerBox: {
    backgroundColor: '#FCFBFF',
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#ECE7F8',
    shadowColor: '#140F2D',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBadge: {
    backgroundColor: '#F2EDFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: 12,
    color: '#6D5BD0',
    fontWeight: '800',
  },
  headerCountWrap: {
    alignItems: 'flex-end',
  },
  headerCountNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 24,
  },
  headerCountLabel: {
    fontSize: 12,
    color: '#8A8FA3',
    fontWeight: '700',
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#667085',
    lineHeight: 22,
    fontWeight: '500',
  },
  headerBottomRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarWrapEmpty: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    fontSize: 20,
  },
  headerInfoPill: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF3',
  },
  headerInfoPillText: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },

  list: {
    paddingBottom: 90,
  },

  card: {
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECEEF3',
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  cardTopRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 56,
  },

  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 26,
  },

  mainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  typeText: {
    fontSize: 14,
    color: '#667085',
    fontWeight: '600',
  },
  miniInsight: {
    marginTop: 6,
    fontSize: 12,
    color: '#7B8193',
    fontWeight: '700',
  },

  statusBadge: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chevron: {
    fontSize: 24,
    color: '#B2B8C5',
    fontWeight: '400',
    marginTop: 8,
    marginRight: 2,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    marginBottom: 14,
  },
  infoChip: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoChipFilled: {
    backgroundColor: '#EEF2FF',
  },
  infoChipDefault: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoChipTextFilled: {
    color: '#5B5BD6',
  },
  infoChipTextDefault: {
    color: '#475467',
  },

  insightBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  insightLabel: {
    fontSize: 11,
    color: '#98A2B3',
    fontWeight: '700',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  insightText: {
    fontSize: 13,
    color: '#344054',
    fontWeight: '600',
    lineHeight: 20,
  },

  emptyBox: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 34,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF3',
    shadowColor: '#101828',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  emptyEmojiWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F2EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
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
  },
  emptyTipChip: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EDF0F5',
  },
  emptyTipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
});