import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';

import {
  AlertTriangle,
  Bird,
  Bone,
  CalendarDays,
  Cat,
  Clock3,
  Dog,
  PawPrint,
  Info,
  Menu,
  MoreHorizontal,
  Pencil,
  Rabbit,
  RotateCcw,
  Siren,
  Stethoscope,
  Syringe,
  Tag,
  Trash2,
  Utensils,
  X,
  ArrowRight,
  Frown,
  Moon,
  Hospital,
} from 'lucide-react-native';

import {useAuth} from '../data/AuthContext';
import {
  addAssistantChatToFirestore,
  deleteAssistantChatFromFirestore,
  getAssistantChatsFromFirestore,
} from '../services/firestore';

/* =========================================================
   ASSETS
   ========================================================= */

const aiOrb = require('../assets/images/assistant/ai-orb.png');
const aiAssistant = require('../assets/images/assistant/ai-assistant.png');
const hospitalErrorIcon = require('../assets/popup-icons/hospital-icon.png');
const petcareWarningGroup = require('../assets/popup-icons/my-custom-icon.png');

/* =========================================================
   TYPES
   ========================================================= */

type PetType =
  | 'Kedi'
  | 'Köpek'
  | 'Kuş'
  | 'Balık'
  | 'Küçük Hayvan'
  | 'Diğer'
  | '';

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

type AssistantChat = {
  id?: string;
  petType: PetType;
  problemType: ProblemType;
  duration: DurationType;
  urgency: UrgencyType;
  result: RiskResult;
  aiMessage: string;
  title?: string;
  createdAt?: any;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const COLORS = {
  background: '#F3F2FF',
  background2: '#F8F7FF',

  white: '#FFFFFF',

  navy: '#11163A',
  text: '#17203F',
  secondary: '#687492',
  muted: '#8B95AC',

  purple: '#7257FF',
  purpleDark: '#5141F4',
  purpleLight: '#9B86FF',
  purplePale: '#F0EDFF',

  border: '#E5E8F2',
  chip: '#FAFBFF',

  red: '#FF405A',
};

const durationLabelMap: Record<DurationType, string> = {
  '': '',
  bugun: 'Bugün başladı',
  '1-2_gundur': '1-2 gündür',
  '1_hafta': '1 haftadır',
  uzun: 'Uzun süredir',
};

const PETS: PetType[] = [
  'Köpek',
  'Kedi',
  'Küçük Hayvan',
  'Kuş',
  'Diğer',
];

const SYMPTOMS: ProblemType[] = [
  'İştahsızlık',
  'Kusma',
  'Halsizlik',
  'Aşı / Bakım',
  'Beslenme',
  'Diğer',
];

const DURATIONS: {key: DurationType; label: string}[] = [
  {key: 'bugun', label: 'Bugün başladı'},
  {key: '1-2_gundur', label: '1-2 gündür'},
  {key: '1_hafta', label: '1 haftadır'},
  {key: 'uzun', label: 'Uzun süredir'},
];

const URGENCIES: UrgencyType[] = ['Evet', 'Hayır', 'Emin değilim'];

/* =========================================================
   SCREEN
   ========================================================= */

const AssistantScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const {user} = useAuth();

  const [petType, setPetType] = useState<PetType>('Köpek');
  const [problemType, setProblemType] =
    useState<ProblemType>('İştahsızlık');
  const [duration, setDuration] =
    useState<DurationType>('1-2_gundur');
  const [urgency, setUrgency] = useState<UrgencyType>('Hayır');

  const [result, setResult] = useState<RiskResult | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [historyVisible, setHistoryVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState<AssistantChat[]>([]);
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const [connectionErrorVisible, setConnectionErrorVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const canShowSummary =
    petType !== '' &&
    problemType !== '' &&
    duration !== '' &&
    urgency !== '';

  /* =======================================================
     FIRESTORE
     ======================================================= */

  const loadChatHistory = async () => {
    try {
      if (!user?.uid) {
        return;
      }

      const chats = await getAssistantChatsFromFirestore(user.uid);
      setChatHistory(chats);
    } catch (error) {
      console.log('Sohbet geçmişi yüklenemedi:', error);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, [user?.uid]);

  /* =======================================================
     AI REQUEST
     ======================================================= */

  const fetchRisk = async () => {
    if (!canShowSummary) {
          setConnectionErrorVisible(true);
          return;
        }

    try {
      setLoading(true);
      setResult(null);
      setAiMessage('');

      const response = await fetch(
        'http://10.0.2.2:5000/assistant/evaluate',
        {
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
        },
      );

      const data = await response.json();

      setResult(data.risk);
      setAiMessage(data.aiMessage || '');

      if (user?.uid && data.risk) {
              await addAssistantChatToFirestore(
                {
                  petType,
                  problemType,
                  duration,
                  urgency,
                  result: data.risk,
                  aiMessage: data.aiMessage || '',
                },
                user.uid,
                user.email || '',
              );

              await loadChatHistory();
            }
          } catch (error: any) {
                console.log('API HATA:', error);

                // Varsayılan uyarı yerine özel modalı açıyoruz:
                setConnectionErrorVisible(true);
          } finally {
            setLoading(false);
          }
        };

  /* =======================================================
     RESET
     ======================================================= */

  const resetForm = () => {
    setPetType('');
    setProblemType('');
    setDuration('');
    setUrgency('');
    setResult(null);
    setAiMessage('');
    setLoading(false);
  };

  /* =======================================================
     MORPHING HISTORY PANEL
     ======================================================= */

  const openHistory = () => {
    drawerAnimation.setValue(0);
    setHistoryVisible(true);

    requestAnimationFrame(() => {
      Animated.spring(drawerAnimation, {
        toValue: 1,
        damping: 22,
        stiffness: 155,
        mass: 0.8,
        useNativeDriver: false,
      }).start();
    });
  };

  const closeHistory = () => {
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 240,
      useNativeDriver: false,
    }).start(({finished}) => {
      if (finished) {
        setHistoryVisible(false);
      }
    });
  };

  const morphWidth = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [54, 340],
  });

  const morphHeight = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [54, 650],
  });

  const morphBorderRadius = drawerAnimation.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [27, 32, 30],
  });

  const morphTop = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [65, 65],
  });

  const morphLeft = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 10],
  });

  const backdropOpacity = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const morphPanelOpacity = drawerAnimation.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  const panelContentOpacity = drawerAnimation.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0, 0, 1],
  });

  const panelContentTranslateY = drawerAnimation.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [12, 12, 0],
  });

  /* =======================================================
     HISTORY
     ======================================================= */

  const openChatFromHistory = (chat: AssistantChat) => {
    setPetType(chat.petType);
    setProblemType(chat.problemType);
    setDuration(chat.duration);
    setUrgency(chat.urgency);
    setResult(chat.result);
    setAiMessage(chat.aiMessage || '');
    setLoading(false);
    closeHistory();
  };

  const deleteChatFromHistory = async (chatId?: string) => {
    try {
      if (!chatId) {
        return;
      }

      await deleteAssistantChatFromFirestore(chatId);
      await loadChatHistory();
    } catch (error) {
      console.log('Sohbet silinemedi:', error);
      Alert.alert('Hata', 'Sohbet silinemedi.');
    }
  };

  /* =======================================================
     PET ICON
     ======================================================= */

  const renderPetIcon = (type: PetType) => {
    const color =
      petType === type ? '#B78328' : '#626D89';

    switch (type) {
      case 'Köpek':
        return (
          <Dog
            size={31}
            color={color}
            strokeWidth={2.25}
          />
        );

      case 'Kedi':
        return (
          <Cat
            size={31}
            color={color}
            strokeWidth={2.25}
          />
        );

      case 'Kuş':
        return (
          <Bird
            size={31}
            color={color}
            strokeWidth={2.25}
          />
        );

      case 'Küçük Hayvan':
        return (
          <Rabbit
            size={31}
            color={color}
            strokeWidth={2.25}
          />
        );

      default:
        return (
          <MoreHorizontal
            size={31}
            color={color}
            strokeWidth={2.5}
          />
        );
    }
  };

  /* =======================================================
     SYMPTOM ICON
     ======================================================= */

  const renderSymptomIcon = (
    type: ProblemType,
    selected: boolean,
  ) => {
    const color = selected ? '#FFFFFF' : '#66728D';

    switch (type) {
      case 'İştahsızlık':
        return (
          <Utensils
            size={20}
            color={color}
            strokeWidth={2.3}
          />
        );

      case 'Kusma':
        return (
          <Frown
            size={20}
            color={color}
            strokeWidth={2.2}
          />
        );

      case 'Halsizlik':
        return (
          <Moon
            size={19}
            color={color}
            strokeWidth={2.2}
          />
        );

      case 'Aşı / Bakım':
        return (
          <Syringe
            size={20}
            color={color}
            strokeWidth={2.2}
          />
        );

      case 'Beslenme':
        return (
          <Bone
            size={20}
            color={color}
            strokeWidth={2.2}
          />
        );

      default:
        return (
          <MoreHorizontal
            size={21}
            color={color}
            strokeWidth={2.5}
          />
        );
    }
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
      <>
        <SafeAreaView
          style={styles.safeArea}
          edges={['top']}>

          <View style={styles.screen}>

            {/* =================================================
                HERO BACKGROUND
                ================================================= */}

            <View
              pointerEvents="none"
              style={styles.heroBackground}>

              <View style={styles.heroGlowOne} />
              <View style={styles.heroGlowTwo} />
              <View style={styles.heroWaveLeft} />
              <View style={styles.heroWaveRight} />

            </View>

            {/* =================================================
                SCROLL CONTENT
                ================================================= */}

            <ScrollView
              ref={scrollViewRef}
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingBottom: tabBarHeight + 24,
                },
              ]}>

              {/* =================================================
                  HERO
                  ================================================= */}

              <View style={styles.hero}>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.menuButton}
                  onPress={openHistory}>

                  <Menu
                    size={27}
                    color="#15174D"
                    strokeWidth={2.3}
                  />

                </TouchableOpacity>

                <View style={styles.heroTitleArea}>

                  <View style={styles.titleRow}>
                    <Text style={styles.heroTitle}>
                      PetCare
                    </Text>

                    <Text style={styles.heroTitleAI}>
                      {' '}AI
                    </Text>
                  </View>

                  <Text style={styles.heroSubtitle}>
                    Sevimli dostun için
                  </Text>

                  <View style={styles.subtitleRow}>
                    <Text style={styles.heroSubtitle}>
                      her zaman yanındayım
                    </Text>

                  </View>

                </View>

                <Image
                  source={aiOrb}
                  resizeMode="contain"
                  style={styles.orbImage}
                />

              </View>

              {/* =================================================
                  PET TYPE
                  ================================================= */}

              <View style={styles.mainCard}>

                <View style={styles.sectionHeading}>

                  <View style={styles.sectionHeadingIcon}>
                    <PawPrint
                      size={25}
                      color="#B78328"
                      strokeWidth={2.4}
                    />
                  </View>

                  <View style={styles.sectionHeadingTexts}>
                    <Text style={styles.sectionTitle}>
                      Evcil Hayvan Türü
                    </Text>

                    <Text style={styles.sectionSubtitle}>
                      Danışacağın dostunu seç
                    </Text>
                  </View>

                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.petRow}>

                  {PETS.map(item => {
                    const selected = petType === item;

                    return (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.86}
                        onPress={() => {
                          setPetType(item);
                          setResult(null);
                          setAiMessage('');
                        }}
                        style={[
                          styles.petItem,
                          selected && styles.petItemSelected,
                        ]}>

                        <View style={styles.petIconArea}>
                          {renderPetIcon(item)}
                        </View>

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.petText,
                            selected && styles.petTextSelected,
                            item === 'Küçük Hayvan' &&
                              styles.petTextSmall,
                          ]}>
                          {item}
                        </Text>

                      </TouchableOpacity>
                    );
                  })}

                </ScrollView>

              </View>

              {/* =================================================
                  SYMPTOMS
                  ================================================= */}

              <View style={styles.mainCard}>

                <View style={styles.sectionHeading}>

                  <View style={styles.sectionHeadingIcon}>
                    <Stethoscope
                      size={27}
                      color="#68BDAA"
                      strokeWidth={2.5}
                    />
                  </View>

                  <View style={styles.sectionHeadingTexts}>
                    <Text style={styles.sectionTitle}>
                      Semptom Etiketleri
                    </Text>

                    <Text style={styles.sectionSubtitle}>
                      Gözlemlediğin belirtileri seç (birden fazla olabilir)
                    </Text>
                  </View>

                </View>

                <View style={styles.symptomGrid}>

                  {SYMPTOMS.map(item => {
                    const selected = problemType === item;

                    return (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.85}
                        onPress={() => {
                          setProblemType(item);
                          setResult(null);
                          setAiMessage('');
                        }}
                        style={styles.symptomCell}>

                        {selected ? (
                          <View style={styles.symptomSelected}>

                            <Text style={styles.symptomTextSelected}>
                              {item}
                            </Text>

                          </View>
                        ) : (
                          <View style={styles.symptomDefault}>

                            <Text style={styles.symptomText}>
                              {item}
                            </Text>

                          </View>
                        )}

                      </TouchableOpacity>
                    );
                  })}

                </View>

              </View>

              {/* =================================================
                  DURATION + URGENCY
                  ================================================= */}

              <View style={styles.doubleCardRow}>

                {/* DURATION */}

                <View style={[styles.smallCard, styles.durationCard]}>

                  <View style={styles.smallCardHeader}>

                    <CalendarDays
                      size={23}
                      color={COLORS.purple}
                      strokeWidth={2.5}
                    />

                    <View style={styles.smallHeaderTextBox}>
                      <Text style={styles.smallCardTitle}>
                        Süre
                      </Text>

                      <Text style={styles.smallCardSubtitle}>
                        Ne zamandır devam ediyor?
                      </Text>
                    </View>

                  </View>

                  <View style={styles.durationGrid}>

                    {DURATIONS.map(item => {
                      const selected = duration === item.key;

                      return (
                        <TouchableOpacity
                          key={item.key}
                          activeOpacity={0.85}
                          onPress={() => {
                            setDuration(item.key);
                            setResult(null);
                            setAiMessage('');
                          }}
                          style={[
                            styles.durationOption,
                            selected &&
                              styles.durationOptionSelected,
                          ]}>

                          <Text
                            numberOfLines={1}
                            style={[
                              styles.durationOptionText,
                              selected &&
                                styles.durationOptionTextSelected,
                            ]}>
                            {item.label}
                          </Text>

                        </TouchableOpacity>
                      );
                    })}

                  </View>

                </View>

                {/* URGENCY */}

                <View style={[styles.smallCard, styles.urgencyCard]}>

                  <View style={styles.smallCardHeader}>

                    <Siren
                      size={24}
                      color={COLORS.red}
                      strokeWidth={2.4}
                    />

                    <View style={styles.smallHeaderTextBox}>
                      <Text
                        numberOfLines={1}
                        style={styles.smallCardTitle}>
                        Aciliyet
                      </Text>

                    </View>

                  </View>

                  <View style={styles.urgencyGrid}>

                    {URGENCIES.map(item => {
                      const selected = urgency === item;

                      return (
                        <TouchableOpacity
                          key={item}
                          activeOpacity={0.85}
                          onPress={() => {
                            setUrgency(item);
                            setResult(null);
                            setAiMessage('');
                          }}
                          style={[
                            styles.urgencyOption,
                            item === 'Emin değilim' &&
                              styles.urgencyWide,
                          ]}>

                          {selected ? (
                            <LinearGradient
                              colors={[
                                '#F6B89F',
                                '#EE9F86',
                              ]}
                              start={{x: 0, y: 0}}
                              end={{x: 1, y: 1}}
                              style={[
                                styles.urgencyGradient,
                                item === 'Emin değilim' &&
                                  styles.urgencyWide,
                              ]}>

                              <Text style={styles.urgencySelectedText}>
                                {item}
                              </Text>

                            </LinearGradient>
                          ) : (
                            <View
                              style={[
                                styles.urgencyDefault,
                                item === 'Emin değilim' &&
                                  styles.urgencyWide,
                              ]}>

                              <Text
                                numberOfLines={1}
                                style={styles.urgencyText}>
                                {item}
                              </Text>

                            </View>
                          )}

                        </TouchableOpacity>
                      );
                    })}

                  </View>

                </View>

              </View>

              {/* =================================================
                  SUMMARY
                  ================================================= */}

              <View style={styles.summaryCard}>

                <View style={styles.summaryHeader}>

                  <View style={styles.summaryHeaderLeft}>
                    <View>
                      <Text style={styles.summaryTitle}>
                        Analiz Özeti
                      </Text>

                      <Text style={styles.summarySubtitle}>
                        Seçimlerine göre hazırlanan özet
                      </Text>
                    </View>

                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.editButton}
                    onPress={resetForm}>


                    <Text style={styles.editText}>
                      Sıfırla
                    </Text>

                  </TouchableOpacity>

                </View>

                <View style={styles.summaryInner}>

                  <View style={styles.summaryDetails}>

                    <View style={styles.summaryLine}>

                      <Text style={styles.summaryLabel}>
                        Evcil Hayvan Türü:
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={styles.summaryValue}>
                        {petType || 'Seçilmedi'}
                      </Text>

                    </View>

                    <View style={styles.summaryLine}>

                      <Text style={styles.summaryLabel}>
                        Semptom:
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={styles.summaryValue}>
                        {problemType || 'Seçilmedi'}
                      </Text>

                    </View>

                    <View style={styles.summaryLine}>

                      <Text style={styles.summaryLabel}>
                        Süre:
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={styles.summaryValue}>
                        {duration
                          ? durationLabelMap[duration]
                          : 'Seçilmedi'}
                      </Text>

                    </View>

                    <View style={styles.summaryLine}>

                      <Text style={styles.summaryLabel}>
                        Aciliyet:
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={styles.summaryValue}>
                        {urgency || 'Seçilmedi'}
                      </Text>

                    </View>

                  </View>

                  <Image
                    source={aiAssistant}
                    resizeMode="contain"
                    style={styles.robotImage}
                  />

                </View>

              </View>

              {/* =================================================
                  AI BUTTON
                  ================================================= */}

              <TouchableOpacity
                activeOpacity={0.9}
                disabled={loading}
                onPress={fetchRisk}
                style={styles.aiButtonOuter}>

                <LinearGradient
                  colors={[
                    '#9A83F5',
                    '#8770ED',
                    '#7662E2',
                  ]}
                  locations={[0, 0.5, 1]}
                  start={{x: 0, y: 0.5}}
                  end={{x: 1, y: 0.5}}
                  style={styles.aiButton}>

                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <View style={styles.aiButtonCenter}>

                        <Text style={styles.aiButtonText}>
                          AI Tanı Başlat
                        </Text>

                      </View>

                      <View style={styles.arrowCircle}>
                        <ArrowRight
                          size={21}
                          color={COLORS.purpleDark}
                          strokeWidth={2.3}
                        />
                      </View>
                    </>
                  )}

                </LinearGradient>

              </TouchableOpacity>

              {/* =================================================
                  DISCLAIMER
                  ================================================= */}

              <View style={styles.disclaimerRow}>

                <Info
                  size={15}
                  color="#5045F3"
                  strokeWidth={2.3}
                />

                <Text style={styles.disclaimerText}>
                  Bu bir ön değerlendirmedir, kesin tanı için veteriner
                  hekiminize danışınız.
                </Text>

              </View>

              {/* =================================================
                  RESULT
                  ================================================= */}

              {loading && (
                <View style={styles.loadingCard}>

                  <ActivityIndicator
                    size="large"
                    color={COLORS.purple}
                  />

                  <Text style={styles.loadingTitle}>
                    Analiz hazırlanıyor...
                  </Text>

                  <Text style={styles.loadingText}>
                    Seçimlerin yapay zeka tarafından değerlendiriliyor.
                  </Text>

                </View>
              )}

              {!loading && result && (
                <View style={styles.resultCard}>

                  <View style={styles.resultHeader}>

                    <View style={styles.riskBadge}>
                      <Text style={styles.riskBadgeText}>
                        {result.riskLevel} Risk Seviyesi
                      </Text>
                    </View>

                    <Text style={styles.score}>
                      Skor: {result.riskScore}/100
                    </Text>

                  </View>

                  <Text style={styles.resultTitle}>
                    Önerilen Eylem
                  </Text>

                  <Text style={styles.resultAction}>
                    {result.action}
                  </Text>

                  {!!aiMessage && (
                    <View style={styles.aiMessageBox}>

                      <Text style={styles.aiMessageTitle}>
                        PetCare AI Yorumu
                      </Text>

                      <Text style={styles.aiMessage}>
                        {aiMessage}
                      </Text>

                    </View>
                  )}

                  <Text style={styles.resultDisclaimer}>
                    Bu sonuç yalnızca yapay zeka ön değerlendirmesidir.
                    Veteriner hekim muayenesinin yerini tutmaz.
                  </Text>

                </View>
              )}

            </ScrollView>

            {/* =================================================
                HISTORY DRAWER
                ================================================= */}

            <Modal
              visible={historyVisible}
              transparent
              animationType="none"
              statusBarTranslucent
              onRequestClose={closeHistory}>

              <View style={styles.morphOverlay}>

                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.morphBackdropVisual,
                    {opacity: backdropOpacity},
                  ]}
                />

                <Pressable
                  style={StyleSheet.absoluteFillObject}
                  onPress={closeHistory}
                />

                <Animated.View
                  style={[
                    styles.morphPanel,
                    {
                      top: morphTop,
                      left: morphLeft,
                      width: morphWidth,
                      height: morphHeight,
                      borderRadius: morphBorderRadius,
                      opacity: morphPanelOpacity,
                    },
                  ]}>

                  <Animated.View
                    style={[
                      styles.morphPanelContent,
                      {
                        opacity: panelContentOpacity,
                        transform: [{translateY: panelContentTranslateY}],
                      },
                    ]}>

                    <View style={styles.drawerHeader}>

                      <View>
                        <Text style={styles.drawerTitle}>
                          Geçmiş Analizler
                        </Text>

                        <Text style={styles.drawerSubtitle}>
                          Önceki değerlendirmelerin
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.drawerClose}
                        activeOpacity={0.8}
                        onPress={closeHistory}>

                        <X
                          size={20}
                          color={COLORS.navy}
                        />

                      </TouchableOpacity>

                    </View>

                    {chatHistory.length === 0 ? (
                      <View style={styles.emptyHistory}>

                        <Clock3
                          size={28}
                          color="#9AA3B7"
                        />

                        <Text style={styles.emptyHistoryText}>
                          Henüz kaydedilmiş bir değerlendirme yok.
                        </Text>

                      </View>
                    ) : (
                      <ScrollView
                        style={styles.morphHistoryScroll}
                        showsVerticalScrollIndicator={false}>

                        {chatHistory.map(chat => (
                          <Pressable
                            key={chat.id}
                            style={styles.historyItem}
                            onPress={() =>
                              openChatFromHistory(chat)
                            }>

                            <View style={styles.historyTextArea}>

                              <Text style={styles.historyTitle}>
                                {chat.petType} • {chat.problemType}
                              </Text>

                              <Text style={styles.historySub}>
                                {chat.result?.riskLevel || '-'} Risk • Skor{' '}
                                {chat.result?.riskScore ?? '-'}
                              </Text>

                            </View>

                            <Pressable
                              hitSlop={10}
                              style={styles.deleteButton}
                              onPress={() =>
                                deleteChatFromHistory(chat.id)
                              }>

                              <Trash2
                                size={17}
                                color="#EF4444"
                              />

                            </Pressable>

                          </Pressable>
                        ))}

                      </ScrollView>
                    )}

                  </Animated.View>

                </Animated.View>

              </View>

            </Modal>

          </View>

        </SafeAreaView>

        {/* =================================================
            CONNECTION ERROR MODAL (ÖZEL HATA POPUP - KLİNİK İKONU)
            ================================================= */}
        <Modal
          visible={connectionErrorVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setConnectionErrorVisible(false)}>

          <View style={styles.modalOverlay}>
                    <Pressable
                      style={StyleSheet.absoluteFillObject}
                      onPress={() => setIsValidationModalVisible(false)}
                    />

                    <View style={styles.modalContent}>

                      {/* --- YENİ GÜNCELLENEN İKON BÖLÜMÜ (Hayvan Grubu) --- */}
                      <View style={{ alignItems: 'center', marginBottom: 15, marginTop: -10 }}>
                        <Image
                          source={petcareWarningGroup}
                          style={{
                            width: 160,   // Görseline göre boyutlandır
                            height: 130,  // Görseline göre boyutlandır
                            resizeMode: 'contain',
                            // tintColor: '#991B27', // Kendi görselini kullanıyorsan bu satırı SİL
                          }}
                        />
                      </View>
                      {/* ------------------------------------------------- */}

                      <Text style={styles.modalTitle}>Dikkat!</Text>
                      <Text style={styles.modalMessage}>
                        Evcil hayvan türü ve semptom etiketleri eksik. Değerlendirmeyi başlatmak için lütfen bu alanları doldurun.
                      </Text>

                      {/* --- GÜNCELLENEN TEK BUTON ("Doldur") --- */}
                      <TouchableOpacity
                        style={[
                          styles.modalButton,
                          {
                            width: '80%',
                            alignSelf: 'center',
                            marginTop: 15,
                            backgroundColor: '#9B86FF' // İstediğin pastel mor
                          }
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          // 1. Pop-up'ı kapatıyoruz
                          setConnectionErrorVisible(false);

                          // 2. Sayfayı akıcı bir şekilde en üste kaydırıyoruz
                          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                        }}>
                        <Text style={styles.modalButtonText}>Doldur</Text>
                      </TouchableOpacity>
                      {/* ---------------------------------------- */}

                    </View>
                  </View>
        </Modal>
      </>
    );
};

export default AssistantScreen;

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background2,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
  },

  /* =======================================================
     HERO BACKGROUND
     ======================================================= */

  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 340,
    overflow: 'hidden',
    backgroundColor: '#F8F7FF',
  },

  heroGlowOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -120,
    right: -50,
    backgroundColor: 'rgba(164, 143, 255, 0.13)',
  },

  heroGlowTwo: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    left: 70,
    top: -170,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },

  heroWaveLeft: {
    position: 'absolute',
    width: 390,
    height: 210,
    borderRadius: 190,
    backgroundColor: '#E6E1FF',
    left: -205,
    bottom: -118,
    transform: [{rotate: '10deg'}],
  },

  heroWaveRight: {
    position: 'absolute',
    width: 620,
    height: 300,
    borderRadius: 310,
    backgroundColor: '#E9E4FF',
    right: -305,
    bottom: -132,
    transform: [{rotate: '-22deg'}],
  },

  /* =======================================================
     HERO
     ======================================================= */

  hero: {
    height: 220,
    position: 'relative',
  },

  menuButton: {
    position: 'absolute',
    top: 14,
    left: 0,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',

    elevation: 4,

    shadowColor: '#7165C8',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },

  heroTitleArea: {
    position: 'absolute',
    left: 3,
    top: 90,
    zIndex: 3,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  heroTitle: {
    color: '#11143F',
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -1.3,

    fontFamily: 'Quicksand-Bold',
  },
  heroTitleAI: {
    color: '#7658F7',
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -1.3,

    fontFamily: 'Quicksand-Bold',
  },
  heroSubtitle: {
    color: '#687491',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Quicksand-Medium',
  },

  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroHeart: {
    color: '#7356F4',
    fontSize: 18,
  },

  orbImage: {
    position: 'absolute',
    width: 255,
    height: 210,
    right: -20,
    top: 15,
  },

  /* =======================================================
     CARDS
     ======================================================= */

  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 15,
    marginBottom: 12,

    borderWidth: 1,
    borderColor: 'rgba(226,226,244,0.8)',

    elevation: 4,

    shadowColor: '#7B6CD9',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.09,
    shadowRadius: 16,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionHeadingIcon: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeadingTexts: {
    flex: 1,
    paddingLeft: 5,
  },

  sectionTitle: {
    color: COLORS.navy,
    fontSize: 17,
    fontFamily: 'Quicksand-Bold',
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: '#75809C',
    fontSize: 12,
    fontFamily: 'Quicksand-Medium',
    marginTop: 1,
  },

  /* =======================================================
     PETS
     ======================================================= */

  petRow: {
    paddingHorizontal: 1,
    paddingBottom: 1,
    gap: 8,
  },

  petItem: {
    width: 91,
    height: 88,
    borderRadius: 19,

    backgroundColor: '#FBFCFF',

    borderWidth: 1,
    borderColor: '#E6E9F2',

    alignItems: 'center',
    justifyContent: 'center',
  },

  petItemSelected: {
    backgroundColor: '#FFF8E7',
    borderWidth: 1.7,
    borderColor: '#EBCB78',

    elevation: 2,

    shadowColor: '#E8D39A',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },

  petIconArea: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  petText: {
    color: '#1E294B',
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
    marginTop: 4,
  },

  petTextSelected: {
    color: '#A97822',

    fontFamily: 'Quicksand-Regular',
  },
  petTextSmall: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 11,
  },

  /* =======================================================
     SYMPTOMS
     ======================================================= */

  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    rowGap: 8,
  },

  symptomCell: {
    width: '33.333%',
    paddingHorizontal: 4,
    height: 49,
  },

  symptomDefault: {
    flex: 1,
    borderRadius: 17,

    borderWidth: 1,
    borderColor: '#E2E6F0',

    backgroundColor: '#FAFBFE',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 9,
  },

  symptomSelected: {
    flex: 1,
    backgroundColor: '#9AD8C8',
    borderRadius: 17,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 9,

    elevation: 5,

    shadowColor: '#68BDAA',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },

  symptomText: {
    color: '#293553',
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },

  symptomTextSelected: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },

  /* =======================================================
     DURATION / URGENCY
     ======================================================= */

  doubleCardRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  smallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 13,

    borderWidth: 1,
    borderColor: '#EBECF5',

    elevation: 3,

    shadowColor: '#7667C7',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 13,
  },

  durationCard: {
    flex: 1.25,
  },

  urgencyCard: {
    flex: 0.9,
  },

  smallCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48,
  },

  smallHeaderTextBox: {
    flex: 1,
    paddingLeft: 7,
  },

  smallCardTitle: {
    color: COLORS.navy,
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    letterSpacing: -0.2,
  },

  smallCardSubtitle: {
    color: '#76809B',
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: 'Quicksand-Medium',
    marginTop: 2,
  },

  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
    rowGap: 7,
  },

  durationOption: {
    width: '50%',
    paddingHorizontal: 3,
    height: 43,

    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: 16,

    borderWidth: 1,
    borderColor: '#E2E6F0',

    backgroundColor: '#FBFCFF',
  },

  durationOptionSelected: {
    borderWidth: 1.5,
    borderColor: '#8FB8E8',
    backgroundColor: '#EDF5FF',

    shadowColor: '#A9C7EA',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.13,
    shadowRadius: 7,
  },

  durationOptionText: {
    color: '#263452',
    fontSize: 11.5,
    fontFamily: 'Quicksand-Bold',
  },

  durationOptionTextSelected: {
    fontFamily: 'Quicksand-Regular',
    color: '#3D28D9',
  },

  urgencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
    rowGap: 7,
  },

  urgencyOption: {
    width: '50%',
    height: 43,
    paddingHorizontal: 3,
  },

  urgencyWide: {
    width: '100%',
  },

  urgencyDefault: {
    flex: 1,
    borderRadius: 16,

    backgroundColor: '#FBFCFF',

    borderWidth: 1,
    borderColor: '#E2E6F0',

    alignItems: 'center',
    justifyContent: 'center',
  },

  urgencyGradient: {
    flex: 1,
    borderRadius: 16,

    alignItems: 'center',
    justifyContent: 'center',

    elevation: 4,

    shadowColor: '#7257FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.23,
    shadowRadius: 8,
  },

  urgencyText: {
    color: '#263452',
    fontSize: 11.5,
    fontFamily: 'Quicksand-Bold',
  },

  urgencySelectedText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: 'Quicksand-Bold',
  },

  /* =======================================================
     SUMMARY
     ======================================================= */

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,

    paddingHorizontal: 13,
    paddingTop: 14,
    paddingBottom: 12,

    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#EBECF5',

    elevation: 4,

    shadowColor: '#7667C7',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 9,
  },

  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryMagicIcon: {
    width: 37,
    height: 38,
    position: 'relative',
    marginRight: 5,
  },

  magicDiamondLarge: {
    position: 'absolute',
    left: 6,
    top: 9,

    width: 17,
    height: 17,

    backgroundColor: '#8B72FF',

    transform: [
      {rotate: '45deg'},
      {scaleX: 0.65},
    ],
  },

  magicDiamondSmall: {
    position: 'absolute',
    right: 4,
    top: 3,

    width: 8,
    height: 8,

    backgroundColor: '#9B86FF',

    transform: [
      {rotate: '45deg'},
      {scaleX: 0.65},
    ],
  },

  summaryTitle: {
    color: COLORS.navy,
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },

  summarySubtitle: {
    color: '#77829D',
    fontSize: 11,
    fontFamily: 'Quicksand-Medium',
    marginTop: 1,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    backgroundColor: '#F3F0FF',

    paddingHorizontal: 12,
    height: 35,

    borderRadius: 15,
  },

  editText: {
    color: '#4D36EA',
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
  },

  summaryInner: {
    height: 130,
    borderRadius: 18,

    backgroundColor: '#F8F8FF',

    overflow: 'visible',

    position: 'relative',

    paddingLeft: 13,
    paddingVertical: 11,
  },

  summaryDetails: {
    width: '72%',
    zIndex: 2,
  },

  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',

    minHeight: 27,

    gap: 7,
  },

  summaryLabel: {
    color: '#65708A',
    fontSize: 11.5,
    fontFamily: 'Quicksand-SemiBold',
  },

  summaryValue: {
    flex: 1,
    color: '#141A39',
    fontSize: 11.5,
    fontFamily: 'Quicksand-Bold',
  },

  robotImage: {
    position: 'absolute',

    width: 165,
    height: 155,

    right: -9,
    bottom: -17,

    zIndex: 5,
  },

  /* =======================================================
     AI BUTTON
     ======================================================= */

  aiButtonOuter: {
    height: 59,
    marginHorizontal: 2,
    marginBottom: 9,

    borderRadius: 30,

    elevation: 8,

    shadowColor: '#654BFA',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.29,
    shadowRadius: 15,
  },

  aiButton: {
    flex: 1,

    borderRadius: 30,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },

  aiButtonCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 12,
  },

  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Quicksand-Bold',
    letterSpacing: 0.7,
  },

  buttonDiamond: {
    width: 18,
    height: 18,

    alignItems: 'center',
    justifyContent: 'center',

    transform: [{rotate: '45deg'}],

    borderWidth: 1.8,
    borderColor: '#FFFFFF',
  },

  buttonDiamondInner: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor: '#FFFFFF',
  },

  arrowCircle: {
    position: 'absolute',

    right: 12,

    width: 39,
    height: 39,

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* =======================================================
     DISCLAIMER
     ======================================================= */

  disclaimerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    gap: 6,

    paddingHorizontal: 8,

    marginBottom: 15,
  },

  disclaimerText: {
    flexShrink: 1,

    color: '#78829A',
    fontSize: 10,
    fontFamily: 'Quicksand-Medium',
    textAlign: 'center',
  },

  /* =======================================================
     LOADING / RESULT
     ======================================================= */

  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,

    padding: 25,

    alignItems: 'center',

    marginBottom: 14,

    borderWidth: 1,
    borderColor: '#E9E8F5',
  },

  loadingTitle: {
    marginTop: 12,

    color: COLORS.navy,
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },

  loadingText: {
    fontFamily: 'Quicksand-Regular',
    marginTop: 5,

    color: COLORS.secondary,
    fontSize: 12,

    textAlign: 'center',
  },

  resultCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 25,

    padding: 17,

    marginBottom: 14,

    borderWidth: 1.3,
    borderColor: '#8269FF',

    elevation: 4,

    shadowColor: '#7257FF',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 14,
  },

  riskBadge: {
    backgroundColor: '#FFF1F3',

    borderRadius: 20,

    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  riskBadgeText: {
    color: '#E7475C',
    fontSize: 11,
    fontFamily: 'Quicksand-Bold',
  },

  score: {
    color: COLORS.navy,
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
  },

  resultTitle: {
    color: COLORS.navy,
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
    marginBottom: 5,
  },

  resultAction: {
    fontFamily: 'Quicksand-Regular',
    color: '#536079',
    fontSize: 13,
    lineHeight: 20,
  },

  aiMessageBox: {
    marginTop: 13,

    backgroundColor: '#F7F5FF',

    borderRadius: 17,

    padding: 13,
  },

  aiMessageTitle: {
    color: COLORS.purpleDark,
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    marginBottom: 6,
  },

  aiMessage: {
    fontFamily: 'Quicksand-Regular',
    color: '#46526D',
    fontSize: 12,
    lineHeight: 19,
  },

  resultDisclaimer: {
    fontFamily: 'Quicksand-Regular',
    marginTop: 13,

    color: '#8B94A8',
    fontSize: 10,
    lineHeight: 15,
  },

  /* =======================================================
     DRAWER
     ======================================================= */

  morphOverlay: {
    flex: 1,
    position: 'relative',
  },

  morphBackdropVisual: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 22, 50, 0.42)',
  },

  morphPanel: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#FAF9FF',

    shadowColor: '#312A78',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.22,
    shadowRadius: 26,

    elevation: 22,
  },

  morphPanelContent: {
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: 18,
    paddingBottom: 22,
  },

  morphHistoryScroll: {
    flex: 1,
  },

  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 22,
  },

  drawerTitle: {
    color: COLORS.navy,
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
  },

  drawerSubtitle: {
    fontFamily: 'Quicksand-Regular',
    color: '#7A849C',
    fontSize: 11,
    marginTop: 2,
  },

  drawerClose: {
    width: 38,
    height: 38,

    borderRadius: 14,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyHistory: {
    paddingVertical: 45,

    alignItems: 'center',

    gap: 12,
  },

  emptyHistoryText: {
    fontFamily: 'Quicksand-Regular',
    color: '#7A849C',
    fontSize: 13,

    textAlign: 'center',
  },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    padding: 14,

    marginBottom: 10,

    borderWidth: 1,
    borderColor: '#ECEAF5',
  },

  historyTextArea: {
    flex: 1,
  },

  historyTitle: {
    color: COLORS.navy,
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },

  historySub: {
    fontFamily: 'Quicksand-Regular',
    color: '#7A849C',
    fontSize: 11,
    marginTop: 4,
  },

  deleteButton: {
    width: 34,
    height: 34,

    borderRadius: 12,

    backgroundColor: '#FFF1F2',

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* --- CONNECTION ERROR MODAL STİLLERİ --- */
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(20, 22, 50, 0.5)',
      padding: 20,
    },
    modalContent: {
      backgroundColor: COLORS.white,
      borderRadius: 28,
      padding: 24,
      width: '100%',
      maxWidth: 350,
      alignItems: 'center',
      shadowColor: '#7257FF',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#FFF1F3',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: -10,
    },
    modalTitle: {
      fontFamily: 'Quicksand-Bold',
      fontSize: 22,
      color: COLORS.navy,
      marginBottom: 12,
      textAlign: 'center',
    },
    modalMessage: {
      fontFamily: 'Quicksand-Medium',
      fontSize: 15,
      color: COLORS.secondary,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 24,
      paddingHorizontal: 10,
    },
    modalButton: {
      backgroundColor: COLORS.purpleDark,
      width: '100%',
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: COLORS.purpleDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    modalButtonText: {
      fontFamily: 'Quicksand-Bold',
      fontSize: 18,
      color: COLORS.white,
    },
});
