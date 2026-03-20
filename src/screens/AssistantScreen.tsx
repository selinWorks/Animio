import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';

type PetType = 'Kedi' | 'Köpek' | 'Kuş' | 'Diğer' | '';
type ProblemType =
  | 'İştahsızlık'
  | 'Kusma'
  | 'Halsizlik'
  | 'Aşı / Bakım'
  | 'Beslenme'
  | 'Diğer'
  | '';
type DurationType = 'bugun' | '1-2_gundur' | '1_hafta' | 'uzun' | '';
type UrgencyType = 'Evet' | 'Hayır' | 'Emin değilim' | '';

type RiskResult = {
  riskScore: number;
  riskLevel: string;
  action: string;
};

type OptionButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const OptionButton = ({label, selected, onPress}: OptionButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
      onPress={onPress}>
      <Text
        style={[
          styles.optionButtonText,
          selected && styles.optionButtonTextSelected,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const durationLabelMap: Record<DurationType, string> = {
  '': '',
  bugun: 'Bugün başladı',
  '1-2_gundur': '1-2 gündür',
  '1_hafta': '1 haftadır',
  uzun: 'Uzun süredir',
};

const AssistantScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();

  const [petType, setPetType] = useState<PetType>('');
  const [problemType, setProblemType] = useState<ProblemType>('');
  const [duration, setDuration] = useState<DurationType>('');
  const [urgency, setUrgency] = useState<UrgencyType>('');
  const [result, setResult] = useState<RiskResult | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const canContinueStep2 = petType !== '';
  const canContinueStep3 = problemType !== '';
  const canContinueStep4 = duration !== '';
  const canShowSummary =
    petType !== '' &&
    problemType !== '' &&
    duration !== '' &&
    urgency !== '';

  const summaryText = useMemo(() => {
    if (!canShowSummary) {
      return '';
    }

    return `${petType} için "${problemType}" problemi seçildi.\n\nSüre: ${
      durationLabelMap[duration]
    }\nAciliyet: ${urgency}`;
  }, [canShowSummary, petType, problemType, duration, urgency]);

  const getRiskStyles = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'Düşük':
        return {
          card: styles.resultCardLow,
          badge: styles.resultBadgeLow,
          badgeText: styles.resultBadgeTextLow,
          title: styles.resultTitleLow,
        };
      case 'Orta':
        return {
          card: styles.resultCardMedium,
          badge: styles.resultBadgeMedium,
          badgeText: styles.resultBadgeTextMedium,
          title: styles.resultTitleMedium,
        };
      case 'Yüksek':
        return {
          card: styles.resultCardHigh,
          badge: styles.resultBadgeHigh,
          badgeText: styles.resultBadgeTextHigh,
          title: styles.resultTitleHigh,
        };
      case 'Acil':
        return {
          card: styles.resultCardUrgent,
          badge: styles.resultBadgeUrgent,
          badgeText: styles.resultBadgeTextUrgent,
          title: styles.resultTitleUrgent,
        };
      default:
        return {
          card: styles.resultCard,
          badge: styles.resultBadge,
          badgeText: styles.resultBadgeText,
          title: styles.resultTitle,
        };
    }
  };

  const fetchRisk = async () => {
    try {
      setLoading(true);
      setResult(null);
      setAiMessage('');

      const response = await fetch('http://10.0.2.2:5000/assistant/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petType,
          problemType,
          duration,
          urgency,
        }),
      });

      const data = await response.json();

      setResult(data.risk);
      setAiMessage(data.aiMessage || '');
    } catch (error) {
      console.log('API HATA:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPetType('');
    setProblemType('');
    setDuration('');
    setUrgency('');
    setResult(null);
    setAiMessage('');
    setLoading(false);
  };

  const riskStyles = getRiskStyles(result?.riskLevel);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PetCare Assistant</Text>
          <Text style={styles.headerSubtitle}>
            Evcil hayvanını analiz edelim 🐾
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: tabBarHeight + 24},
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.stepTitle}>1. Hayvan türü</Text>
            <View style={styles.optionsWrap}>
              {['Kedi', 'Köpek', 'Kuş', 'Diğer'].map(item => (
                <OptionButton
                  key={item}
                  label={item}
                  selected={petType === item}
                  onPress={() => {
                    setPetType(item as PetType);
                    setResult(null);
                    setAiMessage('');
                  }}
                />
              ))}
            </View>
          </View>

          {canContinueStep2 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>2. Problem</Text>
              <View style={styles.optionsWrap}>
                {[
                  'İştahsızlık',
                  'Kusma',
                  'Halsizlik',
                  'Aşı / Bakım',
                  'Beslenme',
                  'Diğer',
                ].map(item => (
                  <OptionButton
                    key={item}
                    label={item}
                    selected={problemType === item}
                    onPress={() => {
                      setProblemType(item as ProblemType);
                      setResult(null);
                      setAiMessage('');
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {canContinueStep3 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>3. Süre</Text>
              <View style={styles.optionsWrap}>
                <OptionButton
                  label="Bugün başladı"
                  selected={duration === 'bugun'}
                  onPress={() => {
                    setDuration('bugun');
                    setResult(null);
                    setAiMessage('');
                  }}
                />
                <OptionButton
                  label="1-2 gündür"
                  selected={duration === '1-2_gundur'}
                  onPress={() => {
                    setDuration('1-2_gundur');
                    setResult(null);
                    setAiMessage('');
                  }}
                />
                <OptionButton
                  label="1 haftadır"
                  selected={duration === '1_hafta'}
                  onPress={() => {
                    setDuration('1_hafta');
                    setResult(null);
                    setAiMessage('');
                  }}
                />
                <OptionButton
                  label="Uzun süredir"
                  selected={duration === 'uzun'}
                  onPress={() => {
                    setDuration('uzun');
                    setResult(null);
                    setAiMessage('');
                  }}
                />
              </View>
            </View>
          )}

          {canContinueStep4 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>4. Aciliyet</Text>
              <View style={styles.optionsWrap}>
                {['Evet', 'Hayır', 'Emin değilim'].map(item => (
                  <OptionButton
                    key={item}
                    label={item}
                    selected={urgency === item}
                    onPress={() => {
                      setUrgency(item as UrgencyType);
                      setResult(null);
                      setAiMessage('');
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {canShowSummary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Durum Özeti</Text>
              <Text style={styles.summaryText}>{summaryText}</Text>

              <TouchableOpacity style={styles.primaryButton} onPress={fetchRisk}>
                <Text style={styles.primaryButtonText}>
                  AI Değerlendirme Al
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetForm}>
                <Text style={styles.secondaryButtonText}>Baştan Başla</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Analiz hazırlanıyor...</Text>
              <Text style={styles.resultText}>
                Seçimlerin değerlendiriliyor.
              </Text>
            </View>
          )}

          {!loading && result && (
            <View style={[styles.resultCard, riskStyles.card]}>
              <Text style={[styles.resultTitle, riskStyles.title]}>
                Risk: {result.riskLevel}
              </Text>

              <Text style={styles.resultText}>Skor: {result.riskScore}</Text>
              <Text style={styles.resultText}>{result.action}</Text>

              <View style={[styles.resultBadge, riskStyles.badge]}>
                <Text style={[styles.resultBadgeText, riskStyles.badgeText]}>
                  AI katkılı risk analizi hazır
                </Text>
              </View>

              {aiMessage ? (
                <View style={styles.aiBox}>
                  <Text style={styles.aiTitle}>AI Yorumu</Text>
                  <Text style={styles.aiText}>{aiMessage}</Text>
                </View>
              ) : null}

              <Text style={styles.disclaimerText}>
                Bu sonuç yalnızca ön değerlendirmedir. Veteriner hekim
                muayenesinin yerini tutmaz.
              </Text>
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
  resultCardLow: {
    borderColor: '#D8F1E1',
    backgroundColor: '#F6FFF9',
  },
  resultCardMedium: {
    borderColor: '#F4D9A6',
    backgroundColor: '#FFF9EE',
  },
  resultCardHigh: {
    borderColor: '#F3C2B8',
    backgroundColor: '#FFF6F4',
  },
  resultCardUrgent: {
    borderColor: '#E7A6A6',
    backgroundColor: '#FFF1F1',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202332',
    marginBottom: 10,
  },
  resultTitleLow: {
    color: '#2F8A59',
  },
  resultTitleMedium: {
    color: '#9A6A00',
  },
  resultTitleHigh: {
    color: '#B94A32',
  },
  resultTitleUrgent: {
    color: '#B42318',
  },
  resultText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5E6475',
  },
  resultBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  resultBadgeLow: {
    backgroundColor: '#D8F1E1',
  },
  resultBadgeMedium: {
    backgroundColor: '#FCE7B2',
  },
  resultBadgeHigh: {
    backgroundColor: '#F8D4CC',
  },
  resultBadgeUrgent: {
    backgroundColor: '#F3C7C7',
  },
  resultBadgeText: {
    fontWeight: '800',
    fontSize: 12,
  },
  resultBadgeTextLow: {
    color: '#2F8A59',
  },
  resultBadgeTextMedium: {
    color: '#9A6A00',
  },
  resultBadgeTextHigh: {
    color: '#B94A32',
  },
  resultBadgeTextUrgent: {
    color: '#B42318',
  },
  aiBox: {
    marginTop: 16,
    backgroundColor: '#F4F0FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7DFFF',
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B4E9D',
    marginBottom: 8,
  },
  aiText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#5E6475',
  },
  disclaimerText: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: '#8A8FA1',
  },
});