import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

type PetType = 'Kedi' | 'Köpek' | 'Kuş' | 'Diğer' | '';
type ProblemType =
  | 'İştahsızlık'
  | 'Kusma'
  | 'Halsizlik'
  | 'Aşı / Bakım'
  | 'Beslenme'
  | 'Diğer'
  | '';
type DurationType =
  | 'Bugün başladı'
  | '1-2 gündür'
  | '1 haftadır'
  | 'Uzun süredir'
  | '';
type UrgencyType = 'Evet' | 'Hayır' | 'Emin değilim' | '';

const OptionButton = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionButtonText,
          selected && styles.optionButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const AssistantScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();

  const [petType, setPetType] = useState<PetType>('');
  const [problemType, setProblemType] = useState<ProblemType>('');
  const [duration, setDuration] = useState<DurationType>('');
  const [urgency, setUrgency] = useState<UrgencyType>('');
  const [showSummary, setShowSummary] = useState(false);

  const canContinueStep2 = petType !== '';
  const canContinueStep3 = problemType !== '';
  const canContinueStep4 = duration !== '';
  const canShowSummary =
    petType !== '' && problemType !== '' && duration !== '' && urgency !== '';

  const summaryText = useMemo(() => {
    if (!canShowSummary) return '';

    return `${petType} için "${problemType}" problemi seçildi. Sorun süresi: ${duration}. Aciliyet durumu: ${urgency}.`;
  }, [petType, problemType, duration, urgency, canShowSummary]);

  const resetForm = () => {
    setPetType('');
    setProblemType('');
    setDuration('');
    setUrgency('');
    setShowSummary(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PetCare Assistant</Text>
          <Text style={styles.headerSubtitle}>
            Birkaç adımda evcil hayvanındaki durumu öğrenelim
          </Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>● Online</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarHeight + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.stepTitle}>
              1. Hangi hayvan için yardım istiyorsun?
            </Text>

            <View style={styles.optionsWrap}>
              <OptionButton
                label="Kedi"
                selected={petType === 'Kedi'}
                onPress={() => {
                  setPetType('Kedi');
                  setShowSummary(false);
                }}
              />
              <OptionButton
                label="Köpek"
                selected={petType === 'Köpek'}
                onPress={() => {
                  setPetType('Köpek');
                  setShowSummary(false);
                }}
              />
              <OptionButton
                label="Kuş"
                selected={petType === 'Kuş'}
                onPress={() => {
                  setPetType('Kuş');
                  setShowSummary(false);
                }}
              />
              <OptionButton
                label="Diğer"
                selected={petType === 'Diğer'}
                onPress={() => {
                  setPetType('Diğer');
                  setShowSummary(false);
                }}
              />
            </View>
          </View>

          {canContinueStep2 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>
                2. Sorun türü hangisine daha yakın?
              </Text>

              <View style={styles.optionsWrap}>
                <OptionButton
                  label="İştahsızlık"
                  selected={problemType === 'İştahsızlık'}
                  onPress={() => {
                    setProblemType('İştahsızlık');
                    setShowSummary(false);
                  }}
                />
                <OptionButton
                  label="Kusma"
                  selected={problemType === 'Kusma'}
                  onPress={() => {
                    setProblemType('Kusma');
                    setShowSummary(false);
                  }}
                />
                <OptionButton
                  label="Halsizlik"
                  selected={problemType === 'Halsizlik'}
                  onPress={() => {
                    setProblemType('Halsizlik');
                    setShowSummary(false);
                  }}
                />
                <OptionButton
                  label="Aşı / Bakım"
                  selected={problemType === 'Aşı / Bakım'}
                  onPress={() => {
                    setProblemType('Aşı / Bakım');
                    setShowSummary(false);
                  }}
                />
                <OptionButton
                  label="Beslenme"
                  selected={problemType === 'Beslenme'}
                  onPress={() => {
                    setProblemType('Beslenme');
                    setShowSummary(false);
                  }}
                />
                <OptionButton
                  label="Diğer"
                  selected={problemType === 'Diğer'}
                  onPress={() => {
                    setProblemType('Diğer');
                    setShowSummary(false);
                  }}
                />
              </View>
            </View>
          )}

          {canContinueStep3 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>
                3. Bu durum ne kadar süredir var?
              </Text>

              <View style={styles.optionsWrap}>
                <OptionButton
                  label="Bugün başladı"
                  selected={duration === 'Bugün başladı'}
                  onPress={() => {
                    setDuration('Bugün başladı');
                    setShowSummary(false);
                  }}
                />
                <OptionButton
                  label="1-2 gündür"
                  selected={duration === '1-2 gündür'}
                  onPress={() => {
                    setDuration('1-2 gündür');
                    setShowSummary(false);
                  }}
                />
                <OptionButton
                  label="1 haftadır"
                  selected={duration === '1 haftadır'}
                  onPress={() => {
                    setDuration('1 haftadır');
                    setShowSummary(false);
                  }}
                />
                <OptionButton
                  label="Uzun süredir"
                  selected={duration === 'Uzun süredir'}
                  onPress={() => {
                    setDuration('Uzun süredir');
                    setShowSummary(false);
                  }}
                />
              </View>
            </View>
          )}

          {canContinueStep4 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>
                4. Acil bir durum olduğunu düşünüyor musun?
              </Text>

              <View style={styles.optionsWrap}>
                <OptionButton
                  label="Evet"
                  selected={urgency === 'Evet'}
                  onPress={() => {
                    setUrgency('Evet');
                    setShowSummary(false);
                  }}
                />
                <OptionButton
                  label="Hayır"
                  selected={urgency === 'Hayır'}
                  onPress={() => {
                    setUrgency('Hayır');
                    setShowSummary(false);
                  }}
                />
                <OptionButton
                  label="Emin değilim"
                  selected={urgency === 'Emin değilim'}
                  onPress={() => {
                    setUrgency('Emin değilim');
                    setShowSummary(false);
                  }}
                />
              </View>
            </View>
          )}

          {canShowSummary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Durum Özeti</Text>
              <Text style={styles.summaryText}>{summaryText}</Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setShowSummary(true)}
              >
                <Text style={styles.primaryButtonText}>
                  Değerlendirme Oluştur
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetForm}
              >
                <Text style={styles.secondaryButtonText}>Baştan Başla</Text>
              </TouchableOpacity>
            </View>
          )}

          {showSummary && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Ön Değerlendirme</Text>
              <Text style={styles.resultText}>
                Seçtiğin bilgilere göre bu ekran, bir sonraki adımda backend’e
                istek atıp AI değerlendirmesi oluşturacak. Şimdilik burada
                seçimlerin başarıyla toplandı.
              </Text>

              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>
                  Backend bağlantısına hazır
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AssistantScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F7FB',
  },
  header: {
    marginTop: 18,
    marginHorizontal: 16,
    padding: 18,
    backgroundColor: '#EAE3F8',
    borderRadius: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#202332',
  },
  headerSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#73788C',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#D8F1E1',
    borderRadius: 999,
  },
  statusBadgeText: {
    color: '#328A5B',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECECF3',
    marginBottom: 14,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#202332',
    marginBottom: 14,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#F4F2FB',
    borderWidth: 1,
    borderColor: '#E4E1F3',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  optionButtonSelected: {
    backgroundColor: '#C9D3FF',
    borderColor: '#B6C2FF',
  },
  optionButtonText: {
    color: '#485064',
    fontSize: 14,
    fontWeight: '700',
  },
  optionButtonTextSelected: {
    color: '#202332',
  },
  summaryCard: {
    backgroundColor: '#FFFDFE',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECECF3',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202332',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5E6475',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#AEB9FF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: '#F8E6EE',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#D74F7A',
    fontWeight: '800',
    fontSize: 15,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECECF3',
    marginBottom: 14,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202332',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5E6475',
  },
  resultBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: '#D8F1E1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  resultBadgeText: {
    color: '#2F8A59',
    fontWeight: '800',
    fontSize: 12,
  },
});