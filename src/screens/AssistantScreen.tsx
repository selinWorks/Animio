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
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {
  Bird,
  Bone,
  CalendarDays,
  Cat,
  Clock3,
  Dog,
  Info,
  Menu,
  MoreHorizontal,
  PawPrint,
  Rabbit,
  Siren,
  Stethoscope,
  Syringe,
  Trash2,
  Utensils,
  X,
  ArrowRight,
  Frown,
  Moon,
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
const hospitalErrorIcon = require('../assets/popup-icons/warning.png');
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

type FollowUpAnswers = {
  vomitingFrequency?: string;
  vomitAppearance?: string;
  canKeepWater?: string;
  abdominalPain?: string;

  foodIntake?: string;
  waterIntake?: string;
  weightLoss?: string;

  energyLevel?: string;
  canWalkNormally?: string;

  foodChange?: string;
  unusualFood?: string;
  foreignBodyRisk?: string;

  // Aşı / Bakım
  careType?: string;
  careTiming?: string;
  careProblem?: string;

  // Diğer
  otherDetails?: string;
};

type DurationType =
  | 'bugun'
  | '1-2_gundur'
  | '1_hafta'
  | 'uzun'
  | '';

type UrgencyType =
  | 'Evet'
  | 'Hayır'
  | 'Emin değilim'
  | '';

type RiskResult = {
  riskScore: number;
  riskLevel: string;
  action: string;
};

type AssistantChat = {
  id?: string;
  petType: PetType;

  problemTypes?: ProblemType[];

  // Eski kayıtlarla uyumluluk
  problemType?: ProblemType;

  duration: DurationType;
  urgency: UrgencyType;

  followUpAnswers?: FollowUpAnswers;

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

/* =========================================================
   FOLLOW UP OPTIONS
   ========================================================= */

const FOLLOW_UP_OPTIONS = {
  vomitingFrequency: [
    '1 kez',
    '2-3 kez',
    '4+ kez',
    'Sayısını bilmiyorum',
  ],

  vomitAppearance: [
    'Mama / yiyecek',
    'Sarı-yeşil sıvı',
    'Beyaz köpük',
    'Kan',
    'Koyu / kahve telvesi gibi',
    'Yabancı madde',
    'Emin değilim',
  ],

  canKeepWater: [
    'Evet',
    'Hayır',
    'Emin değilim',
  ],

  abdominalPain: [
    'Evet',
    'Hayır',
    'Emin değilim',
  ],

  foreignBodyRisk: [
    'Hayır',
    'Evet',
    'Emin değilim',
  ],

  foodIntake: [
    'Normalinin %75+ kadarı',
    '%50-75',
    '%25-50',
    'Neredeyse hiç',
    'Hiç yemedi',
  ],

  waterIntake: [
    'Normal',
    'Azaldı',
    'Arttı',
    'Hiç içmiyor',
    'Emin değilim',
  ],

  weightLoss: [
    'Evet',
    'Hayır',
    'Emin değilim',
  ],

  energyLevel: [
    'Normal',
    'Biraz azaldı',
    'Belirgin şekilde azaldı',
    'Çok halsiz',
  ],

  canWalkNormally: [
    'Evet',
    'Hayır',
    'Emin değilim',
  ],

  foodChange: [
    'Hayır',
    'Yeni mamaya geçildi',
    'Mama miktarı değişti',
    'Yeni ödül/yiyecek verildi',
    'Emin değilim',
  ],

  unusualFood: [
    'Hayır',
    'Evet',
    'Emin değilim',
  ],

  careType: [
    'Aşı',
    'İç parazit',
    'Dış parazit',
    'Genel kontrol',
    'Tırnak / tüy / kulak bakımı',
    'Diş bakımı',
    'Diğer',
    'Emin değilim',
  ],

  careTiming: [
    'Bugün',
    'Son birkaç gün içinde',
    '1-4 hafta önce',
    '1 aydan daha uzun süre önce',
    'Henüz yapılmadı',
    'Emin değilim',
  ],

  careProblem: [
    'Hayır',
    'Hafif bir değişiklik var',
    'Belirgin bir değişiklik var',
    'Emin değilim',
  ],

} as const;

const DURATIONS: {key: DurationType; label: string}[] = [
  {
    key: 'bugun',
    label: 'Bugün başladı',
  },
  {
    key: '1-2_gundur',
    label: '1-2 gündür',
  },
  {
    key: '1_hafta',
    label: '1 haftadır',
  },
  {
    key: 'uzun',
    label: 'Uzun süredir',
  },
];

const URGENCIES: UrgencyType[] = [
  'Evet',
  'Hayır',
  'Emin değilim',
];

/* =========================================================
   SCREEN
   ========================================================= */

const AssistantScreen = () => {
  const tabBarHeight = 80;
  const {user} = useAuth();

  const [petType, setPetType] =
    useState<PetType>('Köpek');

  const [problemTypes, setProblemTypes] =
    useState<ProblemType[]>(['İştahsızlık']);

  const [followUpAnswers, setFollowUpAnswers] =
    useState<FollowUpAnswers>({});

  const [duration, setDuration] =
    useState<DurationType>('1-2_gundur');

  const [urgency, setUrgency] =
    useState<UrgencyType>('Hayır');

  const [result, setResult] =
    useState<RiskResult | null>(null);

  const [aiMessage, setAiMessage] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [historyVisible, setHistoryVisible] =
    useState(false);

  const [chatHistory, setChatHistory] =
    useState<AssistantChat[]>([]);

  const drawerAnimation =
    useRef(new Animated.Value(0)).current;

  const [validationModalVisible, setValidationModalVisible] =
    useState(false);

  const [connectionErrorVisible, setConnectionErrorVisible] =
    useState(false);

  const [deleteConfirmVisible, setDeleteConfirmVisible] =
    useState(false);

  const [deleteChatId, setDeleteChatId] =
    useState<string | undefined>(undefined);

  const scrollViewRef =
    useRef<ScrollView>(null);

  const canShowSummary =
    petType !== '' &&
    problemTypes.length > 0 &&
    duration !== '' &&
    urgency !== '';

  const hasFollowUpQuestions =
    problemTypes.includes('Kusma') ||
    problemTypes.includes('İştahsızlık') ||
    problemTypes.includes('Beslenme') ||
    problemTypes.includes('Halsizlik') ||
    problemTypes.includes('Aşı / Bakım') ||
    problemTypes.includes('Diğer');

  /* =======================================================
     FIRESTORE
     ======================================================= */

  const loadChatHistory = async () => {
    try {
      if (!user?.uid) {
        console.log('CHAT: UID YOK');
        return;
      }

      const chats =
        await getAssistantChatsFromFirestore(
          user.uid,
        );

      setChatHistory(chats);

      console.log(
        'CHAT: kayıt sayısı',
        chats.length,
      );
    } catch (error) {
      console.log(
        'CHAT: HATA',
        error,
      );
    }
  };

  useEffect(() => {
    console.log(
      '🟣 AssistantScreen useEffect ÇALIŞTI',
      user?.uid,
    );

    // =====================================================
    // YENİ KULLANICI / YENİ OTURUM
    // AI FORMUNU TEMİZ BAŞLAT
    // =====================================================

    setPetType('');
    setProblemTypes([]);
    setFollowUpAnswers({});
    setDuration('');
    setUrgency('');
    setResult(null);
    setAiMessage('');
    setLoading(false);

    // Modal durumlarını da kapat
    setValidationModalVisible(false);
    setConnectionErrorVisible(false);
    setDeleteConfirmVisible(false);
    setDeleteChatId(undefined);

    // Geçmiş sohbetleri yükle
    loadChatHistory();
  }, [user?.uid]);


  /* =======================================================
     AI REQUEST
     ======================================================= */

  const fetchRisk = async () => {
    if (!canShowSummary) {
      setValidationModalVisible(true);
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setAiMessage('');

      // -------------------------------------------------------
      // SADECE SEÇİLİ SEMPTOMlarla İLGİLİ TAKİP CEVAPLARINI AL
      // -------------------------------------------------------

      const activeFollowUpAnswers: FollowUpAnswers = {};

      // KUSMA
      if (problemTypes.includes('Kusma')) {
        if (followUpAnswers.vomitingFrequency) {
          activeFollowUpAnswers.vomitingFrequency =
            followUpAnswers.vomitingFrequency;
        }

        if (followUpAnswers.vomitAppearance) {
          activeFollowUpAnswers.vomitAppearance =
            followUpAnswers.vomitAppearance;
        }

        if (followUpAnswers.canKeepWater) {
          activeFollowUpAnswers.canKeepWater =
            followUpAnswers.canKeepWater;
        }

        if (followUpAnswers.abdominalPain) {
          activeFollowUpAnswers.abdominalPain =
            followUpAnswers.abdominalPain;
        }

        if (followUpAnswers.foreignBodyRisk) {
          activeFollowUpAnswers.foreignBodyRisk =
            followUpAnswers.foreignBodyRisk;
        }
      }

      // İŞTAHSIZLIK / BESLENME
      if (
        problemTypes.includes('İştahsızlık') ||
        problemTypes.includes('Beslenme')
      ) {
        if (followUpAnswers.foodIntake) {
          activeFollowUpAnswers.foodIntake =
            followUpAnswers.foodIntake;
        }

        if (followUpAnswers.waterIntake) {
          activeFollowUpAnswers.waterIntake =
            followUpAnswers.waterIntake;
        }

        if (followUpAnswers.weightLoss) {
          activeFollowUpAnswers.weightLoss =
            followUpAnswers.weightLoss;
        }
      }

      // HALSİZLİK
      if (problemTypes.includes('Halsizlik')) {
        if (followUpAnswers.energyLevel) {
          activeFollowUpAnswers.energyLevel =
            followUpAnswers.energyLevel;
        }

        if (followUpAnswers.canWalkNormally) {
          activeFollowUpAnswers.canWalkNormally =
            followUpAnswers.canWalkNormally;
        }
      }

      // AŞI / BAKIM
      if (problemTypes.includes('Aşı / Bakım')) {
        if (followUpAnswers.careType) {
          activeFollowUpAnswers.careType =
            followUpAnswers.careType;
        }

        if (followUpAnswers.careTiming) {
          activeFollowUpAnswers.careTiming =
            followUpAnswers.careTiming;
        }

        if (followUpAnswers.careProblem) {
          activeFollowUpAnswers.careProblem =
            followUpAnswers.careProblem;
        }
      }

      // DİĞER
      if (problemTypes.includes('Diğer')) {
        if (
          followUpAnswers.otherDetails &&
          followUpAnswers.otherDetails.trim()
        ) {
          activeFollowUpAnswers.otherDetails =
            followUpAnswers.otherDetails.trim();
        }
      }

      // BESLENME DEĞİŞİKLİĞİ
      if (problemTypes.includes('Beslenme')) {
        if (followUpAnswers.foodChange) {
          activeFollowUpAnswers.foodChange =
            followUpAnswers.foodChange;
        }

        if (followUpAnswers.unusualFood) {
          activeFollowUpAnswers.unusualFood =
            followUpAnswers.unusualFood;
        }

        if (followUpAnswers.foreignBodyRisk) {
          activeFollowUpAnswers.foreignBodyRisk =
            followUpAnswers.foreignBodyRisk;
        }
      }

      // -------------------------------------------------------
      // DEBUG
      // İstersen test sırasında terminalde görebilirsin.
      // -------------------------------------------------------

      console.log(
        'AKTİF SEMPTOMLAR:',
        problemTypes,
      );

      console.log(
        'AIYE GÖNDERİLEN TAKİP CEVAPLARI:',
        activeFollowUpAnswers,
      );

      // -------------------------------------------------------
      // API İSTEĞİ
      // -------------------------------------------------------

      const response = await fetch(
        'http://10.0.2.2:5000/assistant/evaluate',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            petType,

            // Çoklu semptom sistemi
            problemTypes,

            // Eski backend kayıtları için
            problemType: problemTypes.join(', '),

            duration,
            urgency,

            // SADECE AKTİF SEMPTOM CEVAPLARI
            followUpAnswers: activeFollowUpAnswers,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'AI analiz isteği başarısız oldu.',
        );
      }

      // -------------------------------------------------------
      // SONUÇLARI EKRANA YAZ
      // -------------------------------------------------------

      setResult(data.risk);
      setAiMessage(data.aiMessage || '');

      // -------------------------------------------------------
      // FIRESTORE
      // -------------------------------------------------------

      if (user?.uid && data.risk) {
        await addAssistantChatToFirestore(
          {
            petType,

            problemTypes,

            problemType:
              problemTypes[0] || '',

            duration,
            urgency,

            // API'ye gönderdiğimiz temizlenmiş cevapları kaydet
            followUpAnswers:
              activeFollowUpAnswers,

            result: data.risk,

            aiMessage:
              data.aiMessage || '',
          },
          user.uid,
          user.email || '',
        );

        await loadChatHistory();
      }
    } catch (error: any) {
      console.log(
        'API HATA:',
        error,
      );

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
    setProblemTypes([]);
    setFollowUpAnswers({});
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
      Animated.spring(
        drawerAnimation,
        {
          toValue: 1,
          damping: 22,
          stiffness: 155,
          mass: 0.8,
          useNativeDriver: false,
        },
      ).start();
    });
  };

  const closeHistory = () => {
    Animated.timing(
      drawerAnimation,
      {
        toValue: 0,
        duration: 240,
        useNativeDriver: false,
      },
    ).start(({finished}) => {
      if (finished) {
        setHistoryVisible(false);
      }
    });
  };

  const morphWidth =
    drawerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [54, 340],
    });

  const morphHeight =
    drawerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [54, 650],
    });

  const morphBorderRadius =
    drawerAnimation.interpolate({
      inputRange: [0, 0.45, 1],
      outputRange: [27, 32, 30],
    });

  const morphTop =
    drawerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [65, 65],
    });

  const morphLeft =
    drawerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 10],
    });

  const backdropOpacity =
    drawerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

  const morphPanelOpacity =
    drawerAnimation.interpolate({
      inputRange: [0, 0.12, 1],
      outputRange: [0, 1, 1],
      extrapolate: 'clamp',
    });

  const panelContentOpacity =
    drawerAnimation.interpolate({
      inputRange: [0, 0.55, 1],
      outputRange: [0, 0, 1],
    });

  const panelContentTranslateY =
    drawerAnimation.interpolate({
      inputRange: [0, 0.55, 1],
      outputRange: [12, 12, 0],
    });

  /* =======================================================
     HISTORY
     ======================================================= */

  const openChatFromHistory = (
    chat: AssistantChat,
  ) => {
    setPetType(chat.petType);

    if (
      chat.problemTypes &&
      chat.problemTypes.length > 0
    ) {
      setProblemTypes(
        chat.problemTypes,
      );
    } else if (chat.problemType) {
      setProblemTypes([
        chat.problemType,
      ]);
    } else {
      setProblemTypes([]);
    }

    setFollowUpAnswers(
      chat.followUpAnswers || {},
    );

    setDuration(chat.duration);
    setUrgency(chat.urgency);
    setResult(chat.result);
    setAiMessage(
      chat.aiMessage || '',
    );
    setLoading(false);

    closeHistory();
  };

  const deleteChatFromHistory = async (
    chatId?: string,
  ) => {
    try {
      if (!chatId) {
        return;
      }

      await deleteAssistantChatFromFirestore(
        chatId,
      );

      await loadChatHistory();
    } catch (error) {
      console.log(
        'Sohbet silinemedi:',
        error,
      );

      Alert.alert(
        'Hata',
        'Sohbet silinemedi.',
      );
    }
  };

  const handleConfirmDeleteChat = async () => {
    if (!deleteChatId) {
      return;
    }

    setDeleteConfirmVisible(false);

    await deleteChatFromHistory(deleteChatId);

    setDeleteChatId(undefined);
  };

  const confirmDeleteChat = (chatId?: string) => {
    if (!chatId) {
      return;
    }

    setDeleteChatId(chatId);
    setDeleteConfirmVisible(true);
  };

  /* =======================================================
     PET ICON
     ======================================================= */

  const renderPetIcon = (
    type: PetType,
  ) => {
    const color =
      petType === type
        ? '#B78328'
        : '#626D89';

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
     FOLLOW UP QUESTION
     ======================================================= */

  const FollowUpQuestion = ({
    title,
    subtitle,
    answerKey,
    options,
  }: {
    title: string;
    subtitle?: string;
    answerKey: keyof FollowUpAnswers;
    options: readonly string[];
  }) => {
    const selectedValue =
      followUpAnswers[answerKey];

    return (
      <View
        style={
          styles.followUpQuestionCard
        }>

        <Text
          style={
            styles.followUpQuestionTitle
          }>
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={
              styles.followUpQuestionSubtitle
            }>
            {subtitle}
          </Text>
        ) : null}

        <View
          style={
            styles.followUpOptions
          }>

          {options.map(option => {
            const selected =
              selectedValue === option;

            return (
              <TouchableOpacity
                key={option}
                activeOpacity={0.8}
                style={[
                  styles.followUpOption,
                  selected &&
                    styles.followUpOptionSelected,
                ]}
                onPress={() => {
                  setFollowUpAnswers(
                    prev => ({
                      ...prev,
                      [answerKey]:
                        option,
                    }),
                  );

                  setResult(null);
                  setAiMessage('');
                }}>

                <Text
                  style={[
                    styles.followUpOptionText,
                    selected &&
                      styles.followUpOptionTextSelected,
                  ]}>
                  {option}
                </Text>

              </TouchableOpacity>
            );
          })}

        </View>
      </View>
    );
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
            style={
              styles.heroBackground
            }>

            <View
              style={styles.heroGlowOne}
            />

            <View
              style={styles.heroGlowTwo}
            />

            <View
              style={styles.heroWaveLeft}
            />

            <View
              style={styles.heroWaveRight}
            />

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
                paddingBottom:
                  tabBarHeight + 24,
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

              <View
                style={
                  styles.heroTitleArea
                }>

                <View
                  style={
                    styles.titleRow
                  }>

                  <Text
                    style={
                      styles.heroTitle
                    }>
                    PetCare
                  </Text>

                  <Text
                    style={
                      styles.heroTitleAI
                    }>
                    {' '}AI
                  </Text>

                </View>

                <Text
                  style={
                    styles.heroSubtitle
                  }>
                  Sevimli dostun için
                </Text>

                <View
                  style={
                    styles.subtitleRow
                  }>

                  <Text
                    style={
                      styles.heroSubtitle
                    }>
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

            <View
              style={styles.mainCard}>

              <View
                style={
                  styles.sectionHeading
                }>

                <View
                  style={
                    styles.sectionHeadingIcon
                  }>

                  <PawPrint
                    size={25}
                    color="#B78328"
                    strokeWidth={2.4}
                  />

                </View>

                <View
                  style={
                    styles.sectionHeadingTexts
                  }>

                  <Text
                    style={
                      styles.sectionTitle
                    }>
                    Evcil Hayvan Türü
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }>
                    Danışacağın dostunu seç
                  </Text>

                </View>

              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.petRow
                }>

                {PETS.map(item => {
                  const selected =
                    petType === item;

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
                        selected &&
                          styles.petItemSelected,
                      ]}>

                      <View
                        style={
                          styles.petIconArea
                        }>
                        {renderPetIcon(
                          item,
                        )}
                      </View>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.petText,
                          selected &&
                            styles.petTextSelected,
                          item ===
                            'Küçük Hayvan' &&
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

            <View
              style={styles.mainCard}>

              <View
                style={
                  styles.sectionHeading
                }>

                <View
                  style={
                    styles.sectionHeadingIcon
                  }>

                  <Stethoscope
                    size={27}
                    color="#68BDAA"
                    strokeWidth={2.5}
                  />

                </View>

                <View
                  style={
                    styles.sectionHeadingTexts
                  }>

                  <Text
                    style={
                      styles.sectionTitle
                    }>
                    Semptom Etiketleri
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }>
                    Gözlemlediğin belirtileri seç
                    (birden fazla olabilir)
                  </Text>

                </View>

              </View>

              <View
                style={
                  styles.symptomGrid
                }>

                {SYMPTOMS.map(item => {
                  const selected =
                    problemTypes.includes(
                      item,
                    );

                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.85}
                      onPress={() => {
                        const nextProblemTypes = problemTypes.includes(item)
                          ? problemTypes.filter(symptom => symptom !== item)
                          : [...problemTypes, item];

                        setProblemTypes(nextProblemTypes);

                        setFollowUpAnswers(current => {
                          const cleaned = {...current};

                          // Kusma artık seçili değilse kusma sorularını temizle
                          if (!nextProblemTypes.includes('Kusma')) {
                            delete cleaned.vomitingFrequency;
                            delete cleaned.vomitAppearance;
                            delete cleaned.canKeepWater;
                            delete cleaned.abdominalPain;
                          }

                          // İştahsızlık ve Beslenme artık seçili değilse
                          // iştah/sıvı sorularını temizle
                          if (
                            !nextProblemTypes.includes('İştahsızlık') &&
                            !nextProblemTypes.includes('Beslenme')
                          ) {
                            delete cleaned.foodIntake;
                            delete cleaned.waterIntake;
                            delete cleaned.weightLoss;
                          }

                          // Halsizlik artık seçili değilse
                          if (!nextProblemTypes.includes('Halsizlik')) {
                            delete cleaned.energyLevel;
                            delete cleaned.canWalkNormally;
                          }

                          // Beslenme artık seçili değilse beslenme değişikliği
                          // sorularını temizle
                          if (!nextProblemTypes.includes('Beslenme')) {
                            delete cleaned.foodChange;
                            delete cleaned.unusualFood;
                          }
                          if (!nextProblemTypes.includes('Aşı / Bakım')) {
                            delete cleaned.careType;
                            delete cleaned.careTiming;
                            delete cleaned.careProblem;
                          }

                          if (!nextProblemTypes.includes('Diğer')) {
                            delete cleaned.otherDetails;
                          }

                          // Yabancı cisim sorusu sadece Kusma veya Beslenme
                          // seçiliyken geçerli
                          if (
                            !nextProblemTypes.includes('Kusma') &&
                            !nextProblemTypes.includes('Beslenme')
                          ) {
                            delete cleaned.foreignBodyRisk;
                          }

                          return cleaned;
                        });

                        // Yeni seçim yapıldığında eski AI sonucunu kaldır
                        setResult(null);
                        setAiMessage('');
                      }}
                      style={
                        styles.symptomCell
                      }>

                      {selected ? (
                        <View
                          style={
                            styles.symptomSelected
                          }>

                          <Text
                            style={
                              styles.symptomTextSelected
                            }>
                            {item}
                          </Text>

                        </View>
                      ) : (
                        <View
                          style={
                            styles.symptomDefault
                          }>

                          <Text
                            style={
                              styles.symptomText
                            }>
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
                DYNAMIC FOLLOW-UP QUESTIONS
                ================================================= */}

            {hasFollowUpQuestions && (
              <View
                style={
                  styles.followUpSection
                }>

                <View
                  style={
                    styles.followUpSectionHeader
                  }>

                  <Text
                    style={
                      styles.followUpSectionTitle
                    }>
                    Birkaç ek bilgi
                  </Text>

                  <Text
                    style={
                      styles.followUpSectionSubtitle
                    }>
                    Seçtiğin belirtilere göre
                    sana birkaç kısa soru
                    soracağız.
                  </Text>

                </View>

                {/* =================================================
                    KUSMA
                    ================================================= */}

                {problemTypes.includes(
                  'Kusma',
                ) && (
                  <>

                    <View
                      style={
                        styles.followUpGroupTitle
                      }>

                      <Frown
                        size={19}
                        color="#7257FF"
                        strokeWidth={2.3}
                      />

                      <Text
                        style={
                          styles.followUpGroupTitleText
                        }>
                        Kusma
                      </Text>

                    </View>

                    <FollowUpQuestion
                      title="Son 24 saatte kaç kez kustu?"
                      answerKey="vomitingFrequency"
                      options={
                        FOLLOW_UP_OPTIONS
                          .vomitingFrequency
                      }
                    />

                    <FollowUpQuestion
                      title="Kusmuğun görünümü nasıldı?"
                      subtitle="En yakın seçeneği seç."
                      answerKey="vomitAppearance"
                      options={
                        FOLLOW_UP_OPTIONS
                          .vomitAppearance
                      }
                    />

                    <FollowUpQuestion
                      title="Su içtiğinde suyunu tutabiliyor mu?"
                      subtitle="Suyu içtikten kısa süre sonra tekrar kusuyor mu?"
                      answerKey="canKeepWater"
                      options={
                        FOLLOW_UP_OPTIONS
                          .canKeepWater
                      }
                    />

                    <FollowUpQuestion
                      title="Karın bölgesinde ağrı veya belirgin şişlik var mı?"
                      answerKey="abdominalPain"
                      options={
                        FOLLOW_UP_OPTIONS
                          .abdominalPain
                      }
                    />

                    <FollowUpQuestion
                      title="Yabancı bir cisim yutmuş olma ihtimali var mı?"
                      subtitle="Oyuncak parçası, kemik, ip, plastik vb."
                      answerKey="foreignBodyRisk"
                      options={
                        FOLLOW_UP_OPTIONS
                          .foreignBodyRisk
                      }
                    />

                  </>
                )}

                {/* =================================================
                    İŞTAHSIZLIK / BESLENME
                    ================================================= */}

                {(problemTypes.includes(
                  'İştahsızlık',
                ) ||
                  problemTypes.includes(
                    'Beslenme',
                  )) && (
                  <>

                    <View
                      style={
                        styles.followUpGroupTitle
                      }>

                      <Utensils
                        size={19}
                        color="#68BDAA"
                        strokeWidth={2.3}
                      />

                      <Text
                        style={
                          styles.followUpGroupTitleText
                        }>
                        Beslenme ve iştah
                      </Text>

                    </View>

                    <FollowUpQuestion
                      title="Bugün normaline göre ne kadar yemek yedi?"
                      subtitle="Yaklaşık miktarı seç."
                      answerKey="foodIntake"
                      options={
                        FOLLOW_UP_OPTIONS
                          .foodIntake
                      }
                    />

                    <FollowUpQuestion
                      title="Su tüketiminde bir değişiklik oldu mu?"
                      answerKey="waterIntake"
                      options={
                        FOLLOW_UP_OPTIONS
                          .waterIntake
                      }
                    />

                    <FollowUpQuestion
                      title="Son günlerde kilo kaybı fark ettin mi?"
                      answerKey="weightLoss"
                      options={
                        FOLLOW_UP_OPTIONS
                          .weightLoss
                      }
                    />

                  </>
                )}

                {problemTypes.includes('Aşı / Bakım') && (
                  <>
                    <View style={styles.followUpGroupTitle}>
                      <Syringe
                        size={19}
                        color="#7257FF"
                        strokeWidth={2.3}
                      />

                      <Text style={styles.followUpGroupTitleText}>
                        Aşı ve bakım
                      </Text>
                    </View>

                    <FollowUpQuestion
                      title="Aşı veya bakım işlemi neyle ilgili?"
                      answerKey="careType"
                      options={FOLLOW_UP_OPTIONS.careType}
                    />

                    <FollowUpQuestion
                      title="İşlem ne zaman yapıldı veya yapılacak?"
                      answerKey="careTiming"
                      options={FOLLOW_UP_OPTIONS.careTiming}
                    />

                    <FollowUpQuestion
                      title="Şu anda bu işlemle ilişkili fark ettiğin bir sorun var mı?"
                      subtitle="Örneğin davranış, iştah veya genel durumda belirgin bir değişiklik."
                      answerKey="careProblem"
                      options={FOLLOW_UP_OPTIONS.careProblem}
                    />
                  </>
                )}



                {/* =================================================
                    BESLENME DEĞİŞİKLİĞİ
                    ================================================= */}

                {problemTypes.includes(
                  'Beslenme',
                ) && (
                  <>

                    <View
                      style={
                        styles.followUpGroupTitle
                      }>

                      <Bone
                        size={19}
                        color="#D19A55"
                        strokeWidth={2.3}
                      />

                      <Text
                        style={
                          styles.followUpGroupTitleText
                        }>
                        Beslenme değişikliği
                      </Text>

                    </View>

                    <FollowUpQuestion
                      title="Yakın zamanda mama veya beslenme düzeni değişti mi?"
                      answerKey="foodChange"
                      options={
                        FOLLOW_UP_OPTIONS
                          .foodChange
                      }
                    />

                    <FollowUpQuestion
                      title="Normalde yemediği bir yiyecek veya ödül verildi mi?"
                      answerKey="unusualFood"
                      options={
                        FOLLOW_UP_OPTIONS
                          .unusualFood
                      }
                    />

                  </>
                )}

                {/* =================================================
                    HALSİZLİK
                    ================================================= */}

                {problemTypes.includes(
                  'Halsizlik',
                ) && (
                  <>

                    <View
                      style={
                        styles.followUpGroupTitle
                      }>

                      <Moon
                        size={19}
                        color="#7D6BE8"
                        strokeWidth={2.3}
                      />

                      <Text
                        style={
                          styles.followUpGroupTitleText
                        }>
                        Genel durum
                      </Text>

                    </View>

                    <FollowUpQuestion
                      title="Enerji seviyesi nasıl?"
                      subtitle="Normal davranışına göre değerlendir."
                      answerKey="energyLevel"
                      options={
                        FOLLOW_UP_OPTIONS
                          .energyLevel
                      }
                    />

                    <FollowUpQuestion
                      title="Normal şekilde yürüyebiliyor mu?"
                      answerKey="canWalkNormally"
                      options={
                        FOLLOW_UP_OPTIONS
                          .canWalkNormally
                      }
                    />

                  </>
                )}

                {/* =================================================
                    DİĞER
                    ================================================= */}

                {problemTypes.includes('Diğer') && (
                      <>
                        <View style={styles.followUpGroupTitle}>
                          <MoreHorizontal
                            size={19}
                            color="#8A7BEA"
                            strokeWidth={2.3}
                          />

                          <Text style={styles.followUpGroupTitleText}>
                            Diğer durum
                          </Text>
                        </View>

                        <View style={styles.followUpQuestionCard}>
                          <Text style={styles.followUpQuestionTitle}>
                            Ne fark ettin?
                          </Text>

                          <Text style={styles.followUpQuestionSubtitle}>
                            Evcil hayvanında gözlemlediğin durumu kendi cümlelerinle
                            kısaca yaz.
                          </Text>

                          <TextInput
                            value={followUpAnswers.otherDetails || ''}
                            onChangeText={text => {
                              setFollowUpAnswers(prev => ({
                                ...prev,
                                otherDetails: text,
                              }));

                              setResult(null);
                              setAiMessage('');
                            }}
                            placeholder="Gözlemlediğin durumu yaz..."
                            placeholderTextColor="#9AA3B8"
                            multiline
                            textAlignVertical="top"
                            maxLength={500}
                            style={styles.otherDetailsInput}
                          />

                          <Text style={styles.characterCount}>
                            {(followUpAnswers.otherDetails || '').length}/500
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                )}

            {/* =================================================
                DURATION + URGENCY
                ================================================= */}

            <View
              style={
                styles.doubleCardRow
              }>

              {/* DURATION */}

              <View
                style={[
                  styles.smallCard,
                  styles.durationCard,
                ]}>

                <View
                  style={
                    styles.smallCardHeader
                  }>

                  <CalendarDays
                    size={23}
                    color={COLORS.purple}
                    strokeWidth={2.5}
                  />

                  <View
                    style={
                      styles.smallHeaderTextBox
                    }>

                    <Text
                      style={
                        styles.smallCardTitle
                      }>
                      Süre
                    </Text>

                    <Text
                      style={
                        styles.smallCardSubtitle
                      }>
                      Ne zamandır devam ediyor?
                    </Text>

                  </View>

                </View>

                <View
                  style={
                    styles.durationGrid
                  }>

                  {DURATIONS.map(item => {
                    const selected =
                      duration ===
                      item.key;

                    return (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.85}
                        onPress={() => {
                          setDuration(
                            item.key,
                          );
                          setResult(null);
                          setAiMessage('');
                        }}
                        style={[
                          styles.durationOption,
                          selected &&
                            styles.durationOptionSelected,
                        ]}>

                        <Text
                          numberOfLines={2}
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

              <View
                style={[
                  styles.smallCard,
                  styles.urgencyCard,
                ]}>

                <View
                  style={
                    styles.smallCardHeader
                  }>

                  <Siren
                    size={24}
                    color={COLORS.red}
                    strokeWidth={2.4}
                  />

                  <View
                    style={
                      styles.smallHeaderTextBox
                    }>

                    <Text
                      style={
                        styles.smallCardTitle
                      }>
                      Aciliyet
                    </Text>

                    <Text
                      style={
                        styles.smallCardSubtitle
                      }>
                      Acil bir durum olduğunu
                      düşünüyor musun?
                    </Text>

                  </View>

                </View>

                <View
                  style={
                    styles.urgencyGrid
                  }>

                  {URGENCIES.map(item => {
                    const selected =
                      urgency === item;

                    return (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.85}
                        onPress={() => {
                          setUrgency(
                            item,
                          );
                          setResult(null);
                          setAiMessage('');
                        }}
                        style={[
                          styles.urgencyOption,
                          item ===
                            'Emin değilim' &&
                            styles.urgencyWide,
                        ]}>

                        {selected ? (
                          <LinearGradient
                            colors={[
                              '#F6B89F',
                              '#EE9F86',
                            ]}
                            start={{
                              x: 0,
                              y: 0,
                            }}
                            end={{
                              x: 1,
                              y: 1,
                            }}
                            style={[
                              styles.urgencyGradient,
                              item ===
                                'Emin değilim' &&
                                styles.urgencyWide,
                            ]}>

                            <Text
                              style={
                                styles.urgencySelectedText
                              }>
                              {item}
                            </Text>

                          </LinearGradient>
                        ) : (
                          <View
                            style={[
                              styles.urgencyDefault,
                              item ===
                                'Emin değilim' &&
                                styles.urgencyWide,
                            ]}>

                            <Text
                              numberOfLines={1}
                              style={
                                styles.urgencyText
                              }>
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

            <View
              style={
                styles.summaryCard
              }>

              <View
                style={
                  styles.summaryHeader
                }>

                <View
                  style={
                    styles.summaryHeaderLeft
                  }>

                  <View>
                    <Text
                      style={
                        styles.summaryTitle
                      }>
                      Analiz Özeti
                    </Text>

                    <Text
                      style={
                        styles.summarySubtitle
                      }>
                      Seçimlerine göre hazırlanan özet
                    </Text>
                  </View>

                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={
                    styles.editButton
                  }
                  onPress={
                    resetForm
                  }>

                  <Text
                    style={
                      styles.editText
                    }>
                    Sıfırla
                  </Text>

                </TouchableOpacity>

              </View>

              <View
                style={
                  styles.summaryInner
                }>

                <View
                  style={
                    styles.summaryDetails
                  }>

                  <View
                    style={
                      styles.summaryLine
                    }>

                    <Text
                      style={
                        styles.summaryLabel
                      }>
                      Evcil Hayvan Türü:
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={
                        styles.summaryValue
                      }>
                      {petType ||
                        'Seçilmedi'}
                    </Text>

                  </View>

                  <View
                    style={
                      styles.summaryLine
                    }>

                    <Text
                      style={
                        styles.summaryLabel
                      }>
                      Semptom:
                    </Text>

                    <Text
                      numberOfLines={2}
                      style={
                        styles.summaryValue
                      }>
                      {problemTypes.length >
                      0
                        ? problemTypes.join(
                            ', ',
                          )
                        : 'Seçilmedi'}
                    </Text>

                  </View>

                  <View
                    style={
                      styles.summaryLine
                    }>

                    <Text
                      style={
                        styles.summaryLabel
                      }>
                      Süre:
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={
                        styles.summaryValue
                      }>
                      {duration
                        ? durationLabelMap[
                            duration
                          ]
                        : 'Seçilmedi'}
                    </Text>

                  </View>

                  <View
                    style={
                      styles.summaryLine
                    }>

                    <Text
                      style={
                        styles.summaryLabel
                      }>
                      Aciliyet:
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={
                        styles.summaryValue
                      }>
                      {urgency ||
                        'Seçilmedi'}
                    </Text>

                  </View>

                </View>

                <Image
                  source={aiAssistant}
                  resizeMode="contain"
                  style={
                    styles.robotImage
                  }
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
              style={
                styles.aiButtonOuter
              }>

              <LinearGradient
                colors={[
                  '#9A83F5',
                  '#8770ED',
                  '#7662E2',
                ]}
                locations={[
                  0,
                  0.5,
                  1,
                ]}
                start={{
                  x: 0,
                  y: 0.5,
                }}
                end={{
                  x: 1,
                  y: 0.5,
                }}
                style={
                  styles.aiButton
                }>

                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <View
                      style={
                        styles.aiButtonCenter
                      }>

                      <Text
                        style={
                          styles.aiButtonText
                        }>
                        AI Ön Değerlendirme
                      </Text>

                    </View>

                    <View
                      style={
                        styles.arrowCircle
                      }>

                      <ArrowRight
                        size={21}
                        color={
                          COLORS.purpleDark
                        }
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

            <View
              style={
                styles.disclaimerRow
              }>

              <Info
                size={15}
                color="#5045F3"
                strokeWidth={2.3}
              />

              <Text
                style={
                  styles.disclaimerText
                }>
                Bu bir ön değerlendirmedir,
                kesin tanı için veteriner
                hekiminize danışınız.
              </Text>

            </View>

            {/* =================================================
                RESULT
                ================================================= */}

            {loading && (
              <View
                style={
                  styles.loadingCard
                }>

                <ActivityIndicator
                  size="large"
                  color={
                    COLORS.purple
                  }
                />

                <Text
                  style={
                    styles.loadingTitle
                  }>
                  Analiz hazırlanıyor...
                </Text>

                <Text
                  style={
                    styles.loadingText
                  }>
                  Seçimlerin ve verdiğin ek
                  bilgiler değerlendiriliyor.
                </Text>

              </View>
            )}

            {!loading &&
              result && (
                <View
                  style={
                    styles.resultCard
                  }>

                  <View
                    style={
                      styles.resultHeader
                    }>

                    <View
                      style={
                        styles.riskBadge
                      }>

                      <Text
                        style={
                          styles.riskBadgeText
                        }>
                        {result.riskLevel}{' '}
                        Risk Seviyesi
                      </Text>

                    </View>

                    <Text
                      style={
                        styles.score
                      }>
                      Skor:{' '}
                      {result.riskScore}
                      /100
                    </Text>

                  </View>

                  <Text
                    style={
                      styles.resultTitle
                    }>
                    Önerilen Eylem
                  </Text>

                  <Text
                    style={
                      styles.resultAction
                    }>
                    {result.action}
                  </Text>

                  {!!aiMessage && (
                    <View
                      style={
                        styles.aiMessageBox
                      }>

                      <Text
                        style={
                          styles.aiMessageTitle
                        }>
                        PetCare AI Yorumu
                      </Text>

                      <Text
                        style={
                          styles.aiMessage
                        }>
                        {aiMessage}
                      </Text>

                    </View>
                  )}

                  <Text
                    style={
                      styles.resultDisclaimer
                    }>
                    Bu sonuç yalnızca yapay
                    zeka ön değerlendirmesidir.
                    Veteriner hekim muayenesinin
                    yerini tutmaz.
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
            onRequestClose={
              closeHistory
            }>

            <View
              style={
                styles.morphOverlay
              }>

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.morphBackdropVisual,
                  {
                    opacity:
                      backdropOpacity,
                  },
                ]}
              />

              <Pressable
                style={
                  StyleSheet.absoluteFillObject
                }
                onPress={
                  closeHistory
                }
              />

              <Animated.View
                style={[
                  styles.morphPanel,
                  {
                    top: morphTop,
                    left: morphLeft,
                    width: morphWidth,
                    height: morphHeight,
                    borderRadius:
                      morphBorderRadius,
                    opacity:
                      morphPanelOpacity,
                  },
                ]}>

                <Animated.View
                  style={[
                    styles.morphPanelContent,
                    {
                      opacity:
                        panelContentOpacity,
                      transform: [
                        {
                          translateY:
                            panelContentTranslateY,
                        },
                      ],
                    },
                  ]}>

                  <View
                    style={
                      styles.drawerHeader
                    }>

                    <View>
                      <Text
                        style={styles.drawerTitle}>
                        Geçmiş Analizler
                      </Text>

                      <Text
                        style={styles.drawerSubtitle}>
                        Önceki değerlendirmelerin
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={
                        styles.drawerClose
                      }
                      activeOpacity={0.8}
                      onPress={
                        closeHistory
                      }>

                      <X
                        size={20}
                        color={
                          COLORS.navy
                        }
                      />

                    </TouchableOpacity>

                  </View>

                  {chatHistory.length ===
                  0 ? (
                    <View
                      style={
                        styles.emptyHistory
                      }>

                      <Clock3
                        size={28}
                        color="#9AA3B7"
                      />

                      <Text
                        style={
                          styles.emptyHistoryText
                        }>
                        Henüz kaydedilmiş
                        bir değerlendirme
                        yok.
                      </Text>

                    </View>
                  ) : (
                    <ScrollView
                      style={
                        styles.morphHistoryScroll
                      }
                      showsVerticalScrollIndicator={
                        false
                      }>

                      {chatHistory.map(
                        chat => (
                          <Pressable
                            key={
                              chat.id
                            }
                            style={
                              styles.historyItem
                            }
                            onPress={() =>
                              openChatFromHistory(
                                chat,
                              )
                            }>

                            <View
                              style={
                                styles.historyTextArea
                              }>

                              <Text
                                style={
                                  styles.historyTitle
                                }>

                                {chat.petType}{' '}
                                •{' '}

                                {chat
                                  .problemTypes
                                  ?.length
                                  ? chat.problemTypes.join(
                                      ', ',
                                    )
                                  : chat.problemType ||
                                    'Belirtilmedi'}

                              </Text>

                              <Text
                                style={
                                  styles.historySub
                                }>

                                {chat
                                  .result
                                  ?.riskLevel ||
                                  '-'}{' '}
                                Risk • Skor{' '}
                                {chat
                                  .result
                                  ?.riskScore ??
                                  '-'}

                              </Text>

                            </View>

                            <Pressable
                              hitSlop={10}
                              style={styles.deleteButton}
                              onPress={event => {
                                event.stopPropagation();
                                confirmDeleteChat(chat.id);
                              }}>

                              <Trash2
                                size={17}
                                color="#EF4444"
                              />

                            </Pressable>

                          </Pressable>
                        ),
                      )}

                    </ScrollView>
                  )}

                </Animated.View>

              </Animated.View>

            </View>

          </Modal>

          <Modal
            visible={deleteConfirmVisible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() =>
              setDeleteConfirmVisible(false)
            }>

            <View style={styles.deleteModalOverlay}>

              <View style={styles.deleteModalCard}>

                {/* İKON */}
                <View style={styles.deleteIconCircle}>

                  <Image
                    source={require('../assets/popup-icons/delete-warning.png')}
                    style={styles.deleteWarningImage}
                    resizeMode="contain"
                  />

                </View>

                {/* BAŞLIK */}
                <Text style={styles.deleteModalTitle}>
                  Sohbeti silmek istediğine emin misin?
                </Text>

                {/* AÇIKLAMA */}
                <Text style={styles.deleteModalDescription}>
                  Bu sohbet geçmişinden kaldırılacak ve
                  bu işlem geri alınamaz.
                </Text>

                {/* BUTONLAR */}
                <View style={styles.deleteModalButtons}>

                  <Pressable
                    style={styles.deleteCancelButton}
                    onPress={() =>
                      setDeleteConfirmVisible(false)
                    }>

                    <Text style={styles.deleteCancelText}>
                      Vazgeç
                    </Text>

                  </Pressable>

                  <Pressable
                    style={styles.deleteConfirmButton}
                    onPress={
                      handleConfirmDeleteChat
                    }>

                    <Text style={styles.deleteConfirmText}>
                      Sil
                    </Text>

                  </Pressable>

                </View>

              </View>

            </View>

          </Modal>

        </View>

      </SafeAreaView>

      {/* =================================================
          VALIDATION MODAL
          ================================================= */}

      <Modal
        visible={
          validationModalVisible
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setValidationModalVisible(
            false,
          )
        }>

        <View
          style={
            styles.modalOverlay
          }>

          <Pressable
            style={
              StyleSheet.absoluteFillObject
            }
            onPress={() =>
              setValidationModalVisible(
                false,
              )
            }
          />

          <View
            style={
              styles.modalContent
            }>

            <View
              style={{
                alignItems: 'center',
                marginBottom: 15,
                marginTop: -10,
              }}>

              <Image
                source={
                  petcareWarningGroup
                }
                style={{
                  width: 160,
                  height: 130,
                  resizeMode:
                    'contain',
                }}
              />

            </View>

            <Text
              style={
                styles.modalTitle
              }>
              Dikkat!
            </Text>

            <Text
              style={
                styles.modalMessage
              }>
              Evcil hayvan türü, semptom,
              süre ve aciliyet bilgilerini
              doldurman gerekiyor.
            </Text>

            <TouchableOpacity
              style={[
                styles.modalButton,
                {
                  width: '80%',
                  alignSelf: 'center',
                  marginTop: 15,
                  backgroundColor:
                    '#9B86FF',
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {

                setValidationModalVisible(
                  false,
                );

                scrollViewRef.current?.scrollTo(
                  {
                    y: 0,
                    animated: true,
                  },
                );

              }}>

              <Text
                style={
                  styles.modalButtonText
                }>
                Doldur
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

      {/* =================================================
          CONNECTION ERROR MODAL
          ================================================= */}

      <Modal
        visible={
          connectionErrorVisible
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setConnectionErrorVisible(
            false,
          )
        }>

        <View
          style={
            styles.modalOverlay
          }>

          <Pressable
            style={
              StyleSheet.absoluteFillObject
            }
            onPress={() =>
              setConnectionErrorVisible(
                false,
              )
            }
          />

          <View
            style={
              styles.modalContent
            }>

            <View
              style={{
                alignItems: 'center',
                marginBottom: 15,
                marginTop: -10,
              }}>

              <Image
                source={
                  hospitalErrorIcon
                }
                style={{
                  width: 120,
                  height: 120,
                  resizeMode:
                    'contain',
                }}
              />

            </View>

            <Text
              style={
                styles.modalTitle
              }>
              Bağlantı Hatası
            </Text>

            <Text
              style={
                styles.modalMessage
              }>
              AI analizine şu anda
              ulaşılamıyor. Lütfen
              bağlantınızı kontrol edip
              tekrar deneyin.
            </Text>

            <TouchableOpacity
              style={[
                styles.modalButton,
                {
                  width: '80%',
                  alignSelf: 'center',
                  marginTop: 15,
                  backgroundColor:
                    '#9B86FF',
                },
              ]}
              activeOpacity={0.8}
              onPress={() =>
                setConnectionErrorVisible(
                  false,
                )
              }>

              <Text
                style={
                  styles.modalButtonText
                }>
                Tamam
              </Text>

            </TouchableOpacity>

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
    backgroundColor:
      COLORS.background2,
  },

  screen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
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
    backgroundColor:
      'rgba(164, 143, 255, 0.13)',
  },

  heroGlowTwo: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    left: 70,
    top: -170,
    backgroundColor:
      'rgba(255,255,255,0.95)',
  },

  heroWaveLeft: {
    position: 'absolute',
    width: 390,
    height: 210,
    borderRadius: 190,
    backgroundColor: '#E6E1FF',
    left: -205,
    bottom: -118,
    transform: [
      {
        rotate: '10deg',
      },
    ],
  },

  heroWaveRight: {
    position: 'absolute',
    width: 620,
    height: 300,
    borderRadius: 310,
    backgroundColor: '#E9E4FF',
    right: -305,
    bottom: -132,
    transform: [
      {
        rotate: '-22deg',
      },
    ],
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
    borderColor:
      'rgba(226,226,244,0.8)',

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
     FOLLOW UP
     ======================================================= */

  followUpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,

    padding: 14,

    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#E8E7F3',

    elevation: 3,

    shadowColor: '#7667C7',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.07,
    shadowRadius: 13,
  },

  followUpSectionHeader: {
    marginBottom: 14,
  },

  followUpSectionTitle: {
    color: COLORS.navy,
    fontSize: 17,
    fontFamily: 'Quicksand-Bold',
  },

  followUpSectionSubtitle: {
    color: '#77829D',
    fontSize: 11.5,
    fontFamily: 'Quicksand-Medium',
    marginTop: 3,
    lineHeight: 17,
  },

  followUpGroupTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,

    marginTop: 6,
    marginBottom: 8,
    paddingTop: 7,

    borderTopWidth: 1,
    borderTopColor: '#F0EFF7',
  },

  followUpGroupTitleText: {
    color: COLORS.navy,
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },

  followUpQuestionCard: {
    backgroundColor: '#F9F8FF',
    borderRadius: 18,

    padding: 12,

    marginBottom: 9,

    borderWidth: 1,
    borderColor: '#ECEAF7',
  },

  followUpQuestionTitle: {
    color: '#1B2344',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Quicksand-Bold',
  },

  followUpQuestionSubtitle: {
    color: '#7C86A0',
    fontSize: 10.5,
    lineHeight: 15,
    fontFamily: 'Quicksand-Medium',
    marginTop: 2,
  },

  otherDetailsInput: {
    minHeight: 120,
    marginTop: 10,

    paddingHorizontal: 12,
    paddingVertical: 12,

    borderRadius: 14,

    borderWidth: 1,
    borderColor: '#E1E5EF',

    backgroundColor: '#FFFFFF',

    color: COLORS.navy,

    fontSize: 12,
    lineHeight: 18,

    fontFamily: 'Quicksand-Medium',
  },

  characterCount: {
    marginTop: 5,

    color: '#8A94AA',

    fontSize: 10,

    fontFamily: 'Quicksand-Medium',

    textAlign: 'right',
  },

  followUpOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    marginTop: 9,

    marginHorizontal: -3,

    rowGap: 6,
  },

  followUpOption: {
    minWidth: '47%',
    flexGrow: 1,

    minHeight: 39,

    paddingHorizontal: 9,

    borderRadius: 13,

    borderWidth: 1,
    borderColor: '#E1E3ED',

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    marginHorizontal: 3,
  },

  followUpOptionSelected: {
    backgroundColor: '#EEEAFE',
    borderColor: '#8C7AF1',
  },

  followUpOptionText: {
    color: '#536079',
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'center',
    fontFamily: 'Quicksand-SemiBold',
  },

  followUpOptionTextSelected: {
    color: '#5141F4',
    fontFamily: 'Quicksand-Bold',
  },

  otherInfoBox: {
    backgroundColor: '#F8F7FF',
    borderRadius: 17,
    padding: 13,
    marginTop: 8,
  },

  otherInfoTitle: {
    color: COLORS.navy,
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
  },

  otherInfoText: {
    color: '#75809C',
    fontSize: 10.5,
    lineHeight: 16,
    fontFamily: 'Quicksand-Medium',
    marginTop: 4,
  },

  deleteModalOverlay: {
    flex: 1,

    backgroundColor:
      'rgba(20, 22, 50, 0.45)',

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 28,
  },

  deleteModalCard: {
    width: '100%',

    maxWidth: 360,

    backgroundColor: '#FAF9FF',

    borderRadius: 28,

    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,

    alignItems: 'center',

    shadowColor: '#312A78',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,

    elevation: 20,
  },

  deleteIconCircle: {
    width: 92,
    height: 92,

    borderRadius: 30,

    backgroundColor: '#F1ECFF',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 18,
  },

  deleteWarningImage: {
    width: 92,
    height: 92,
  },

  deleteModalButtons: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',
  },

  deleteCancelButton: {
    width: '48%',
    height: 50,

    borderRadius: 17,

    backgroundColor: '#EDE7FF',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: '#DDD4FA',
  },

  deleteCancelText: {
    color: '#6D5BA8',

    fontSize: 13,

    fontFamily: 'Quicksand-Bold',
  },

  deleteModalTitle: {
    color: COLORS.navy,
    fontSize: 19,
    fontFamily: 'Quicksand-Bold',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 8,
  },

  deleteModalDescription: {
    color: '#7A849C',
    fontSize: 12,
    fontFamily: 'Quicksand-Regular',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    marginBottom: 22,
  },

  deleteCancelText: {
    color: '#6D5BA8',
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },

  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },

  deleteConfirmButton: {
    width: '48%',
    height: 50,

    borderRadius: 17,

    backgroundColor: '#B9A7F5',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: '#AA96EF',
  },

  deleteConfirmText: {
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
    borderColor:
      'rgba(255,255,255,0.75)',
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
    backgroundColor:
      'rgba(20, 22, 50, 0.42)',
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

  /* =======================================================
     MODALS
     ======================================================= */

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:
      'rgba(20, 22, 50, 0.5)',
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
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,

    elevation: 10,
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
    backgroundColor:
      COLORS.purpleDark,
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor:
      COLORS.purpleDark,

    shadowOffset: {
      width: 0,
      height: 4,
    },

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