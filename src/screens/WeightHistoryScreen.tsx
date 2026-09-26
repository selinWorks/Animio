import React, {useMemo, useState} from 'react';
import Svg, {Path} from 'react-native-svg';

import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Info,
  Pencil,
  Plus,
  Trash2,
  Weight,
  X,
} from 'lucide-react-native';

import {
  RouteProp,
  useNavigation,
} from '@react-navigation/native';

import {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {RootStackParamList} from '../navigation/AppNavigator';
import {usePets} from '../data/PetContext';
import {WeightRecord} from '../types/Pet';


/* =========================================================
   TYPES
========================================================= */

type WeightHistoryRouteProp = RouteProp<
  RootStackParamList,
  'WeightHistory'
>;

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'WeightHistory'
>;

type Props = {
  route: WeightHistoryRouteProp;
};

type FilterType =
  | 'all'
  | '1month'
  | '3months'
  | '1year';

type ChartPoint = {
  x: number;
  y: number;
  record: WeightRecord;
};

type PopupType =
  | 'error'
  | 'warning'
  | 'weight'
  | 'date'
  | 'success'
  | 'delete'
  | 'info';

type PopupButton = {
  text: string;
  variant: 'primary' | 'secondary' | 'danger';
  onPress?: () => void | Promise<void>;
};


const createSmoothPath = (
  points: ChartPoint[],
) => {
  if (points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path =
    `M ${points[0].x} ${points[0].y}`;

  for (
    let i = 0;
    i < points.length - 1;
    i++
  ) {
    const current = points[i];
    const next = points[i + 1];
    const middleX =
      (current.x + next.x) / 2;

    path +=
      ` C ${middleX} ${current.y},` +
      ` ${middleX} ${next.y},` +
      ` ${next.x} ${next.y}`;
  }

  return path;
};


/* =========================================================
   CONSTANTS
========================================================= */

const PURPLE = '#8067E8';
const DARK_PURPLE = '#4B3A91';

const FILTERS: {
  key: FilterType;
  label: string;
}[] = [
  {
    key: 'all',
    label: 'Tümü',
  },
  {
    key: '1month',
    label: '1 Ay',
  },
  {
    key: '3months',
    label: '3 Ay',
  },
  {
    key: '1year',
    label: '1 Yıl',
  },
];


/* =========================================================
   HELPERS
========================================================= */

const getTodayText = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    now.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};


const dateToInput = (date: string) => {
  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return '';
  }

  const year =
    parsed.getFullYear();

  const month = String(
    parsed.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    parsed.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};


const inputToISO = (
  value: string,
) => {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value.trim(),
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const date =
    new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0,
    );

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
};


const formatDate = (
  date: string,
) => {
  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return date;
  }

  return parsed.toLocaleDateString(
    'tr-TR',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  );
};


const formatShortDate = (
  date: string,
) => {
  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return '';
  }

  return parsed.toLocaleDateString(
    'tr-TR',
    {
      day: 'numeric',
      month: 'short',
    },
  );
};


const formatWeight = (
  value: number,
) => {
  if (
    Number.isInteger(value)
  ) {
    return String(value);
  }

  return value
    .toFixed(2)
    .replace(/0+$/, '')
    .replace(/\.$/, '')
    .replace('.', ',');
};


const sortAscending = (
  records: WeightRecord[],
) => {
  return [...records].sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime(),
  );
};


const getFilteredRecords = (
  records: WeightRecord[],
  filter: FilterType,
) => {
  if (filter === 'all') {
    return records;
  }

  const cutoff =
    new Date();

  cutoff.setHours(
    0,
    0,
    0,
    0,
  );

  if (
    filter === '1month'
  ) {
    cutoff.setMonth(
      cutoff.getMonth() - 1,
    );
  }

  if (
    filter === '3months'
  ) {
    cutoff.setMonth(
      cutoff.getMonth() - 3,
    );
  }

  if (
    filter === '1year'
  ) {
    cutoff.setFullYear(
      cutoff.getFullYear() - 1,
    );
  }

  return records.filter(
    item =>
      new Date(
        item.date,
      ).getTime() >=
      cutoff.getTime(),
  );
};


/* =========================================================
   SCREEN
========================================================= */

export default function WeightHistoryScreen({
  route,
}: Props) {
  const routePet =
    route.params.pet;

  const navigation =
    useNavigation<NavigationProp>();

  const {
    pets,
    updatePet,
  } = usePets();


  /* ---------------------------------------------------------
     LIVE PET
  --------------------------------------------------------- */

  const pet =
    pets.find(
      item =>
        item.id === routePet.id,
    ) ?? routePet;


  /* ---------------------------------------------------------
     STATE
  --------------------------------------------------------- */

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<FilterType>('all');

  const [
    modalVisible,
    setModalVisible,
  ] = useState(false);

  const [
    editingRecord,
    setEditingRecord,
  ] =
    useState<WeightRecord | null>(
      null,
    );

  const [
    weightInput,
    setWeightInput,
  ] = useState('');

  const [
    dateInput,
    setDateInput,
  ] = useState(
    getTodayText(),
  );
  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    popupVisible,
    setPopupVisible,
  ] = useState(false);

  const [
    popupTitle,
    setPopupTitle,
  ] = useState('');

  const [
    popupMessage,
    setPopupMessage,
  ] = useState('');

  const [
    popupType,
    setPopupType,
  ] = useState<PopupType>('info');

  const [
    popupButtons,
    setPopupButtons,
  ] = useState<PopupButton[]>([
    {
      text: 'Tamam',
      variant: 'primary',
    },
  ]);

  const [
    chartWidth,
    setChartWidth,
  ] = useState(0);


  /* ---------------------------------------------------------
     RECORDS
  --------------------------------------------------------- */

  const allRecords = useMemo(() => {
    const history = Array.isArray(
      pet.weightHistory,
    )
      ? pet.weightHistory
      : [];

    if (history.length > 0) {
      return sortAscending(history);
    }

    const parsedWeight = Number(
      String(pet.weight ?? '')
        .replace(',', '.')
        .replace(/[^\d.]/g, ''),
    );

    if (
      !Number.isFinite(parsedWeight) ||
      parsedWeight <= 0
    ) {
      return [];
    }

    return [
      {
        id: `initial-weight-${pet.id}`,
        weight: Number(
          parsedWeight.toFixed(2),
        ),
        date:
          pet.updatedAt?.toDate?.()?.toISOString?.() ??
          pet.createdAt?.toDate?.()?.toISOString?.() ??
          new Date().toISOString(),
      },
    ];
  }, [
    pet.id,
    pet.weight,
    pet.weightHistory,
    pet.updatedAt,
    pet.createdAt,
  ]);


  const filteredRecords =
    useMemo(() => {
      return getFilteredRecords(
        allRecords,
        activeFilter,
      );
    }, [
      allRecords,
      activeFilter,
    ]);


  const listRecords =
    useMemo(() => {
      return [
        ...filteredRecords,
      ].reverse();
    }, [
      filteredRecords,
    ]);


  /* ---------------------------------------------------------
     CURRENT WEIGHT
  --------------------------------------------------------- */

  const latestRecord =
    allRecords.length > 0
      ? allRecords[
          allRecords.length - 1
        ]
      : null;


  const currentWeight =
    latestRecord
      ? latestRecord.weight
      : Number(
          String(
            pet.weight ?? '',
          ).replace(',', '.'),
        );


  const hasCurrentWeight =
    Number.isFinite(
      currentWeight,
    ) &&
    currentWeight > 0;


  /* ---------------------------------------------------------
     MODAL
  --------------------------------------------------------- */

  const openAddModal = () => {
    setEditingRecord(null);

    setWeightInput(
      hasCurrentWeight
        ? String(
            currentWeight,
          )
        : '',
    );

    setDateInput(
      getTodayText(),
    );
setModalVisible(true);
  };


  const openEditModal = (
    record: WeightRecord,
  ) => {
    setEditingRecord(
      record,
    );

    setWeightInput(
      String(record.weight),
    );

    setDateInput(
      dateToInput(
        record.date,
      ),
    );
setModalVisible(true);
  };


  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalVisible(false);

    setEditingRecord(null);
  };


  const showPopup = (
    title: string,
    message: string,
    type: PopupType = 'info',
    buttons: PopupButton[] = [
      {
        text: 'Tamam',
        variant: 'primary',
      },
    ],
  ) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setPopupButtons(buttons);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
  };

  const handlePopupButtonPress = async (
    button: PopupButton,
  ) => {
    setPopupVisible(false);

    if (button.onPress) {
      await button.onPress();
    }
  };

  const renderPopupIcon = () => {
    if (popupType === 'weight') {
      return (
        <Weight
          size={28}
          color="#8067E8"
          strokeWidth={2.2}
        />
      );
    }

    if (popupType === 'date') {
      return (
        <CalendarDays
          size={28}
          color="#8067E8"
          strokeWidth={2.2}
        />
      );
    }

    if (popupType === 'success') {
      return (
        <CheckCircle2
          size={28}
          color="#5C9D78"
          strokeWidth={2.3}
        />
      );
    }

    if (popupType === 'delete') {
      return (
        <Trash2
          size={28}
          color="#D96B73"
          strokeWidth={2.2}
        />
      );
    }

    if (popupType === 'warning') {
      return (
        <AlertTriangle
          size={28}
          color="#C58A32"
          strokeWidth={2.2}
        />
      );
    }

    if (popupType === 'error') {
      return (
        <AlertTriangle
          size={28}
          color="#D96B73"
          strokeWidth={2.2}
        />
      );
    }

    return (
      <Info
        size={28}
        color="#8067E8"
        strokeWidth={2.2}
      />
    );
  };

  const getPopupIconStyle = () => {
    switch (popupType) {
      case 'success':
        return styles.popupIconSuccess;
      case 'weight':
      case 'date':
      case 'info':
        return styles.popupIconInfo;
      case 'delete':
      case 'error':
        return styles.popupIconDanger;
      case 'warning':
        return styles.popupIconWarning;
      default:
        return styles.popupIconInfo;
    }
  };

  /* ---------------------------------------------------------
     SAVE RECORD
  --------------------------------------------------------- */

  const saveRecord =
    async () => {
      const parsedWeight =
        Number(
          weightInput
            .trim()
            .replace(',', '.'),
        );

      if (
        !Number.isFinite(
          parsedWeight,
        ) ||
        parsedWeight <= 0
      ) {
        showPopup(
          'Geçersiz kilo',
          'Lütfen geçerli bir kilo değeri gir.',
          'weight',
        );

        return;
      }


      if (
        parsedWeight > 200
      ) {
        showPopup(
          'Kilo değerini kontrol et',
          'Girilen kilo değeri 200 kg üzerinde görünüyor.',
          'warning',
        );

        return;
      }


      const isoDate =
        inputToISO(
          dateInput,
        );

      if (!isoDate) {
        showPopup(
          'Geçersiz tarih',
          'Tarihi YYYY-AA-GG biçiminde gir. Örneğin: 2026-09-23',
          'date',
        );

        return;
      }
      const record:
        WeightRecord = {
        id:
          editingRecord?.id ??
          `weight-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        weight:
          Number(
            parsedWeight.toFixed(
              2,
            ),
          ),

        date:
          isoDate,
      };


      let nextRecords:
        WeightRecord[];


      if (editingRecord) {
        nextRecords =
          allRecords.map(
            item =>
              item.id ===
              editingRecord.id
                ? record
                : item,
          );
      } else {
        nextRecords = [
          ...allRecords,
          record,
        ];
      }


      nextRecords =
        sortAscending(
          nextRecords,
        );


      const newestRecord =
        nextRecords[
          nextRecords.length - 1
        ];


      try {
        setSaving(true);

        await updatePet({
          ...pet,

          weightHistory:
            nextRecords,

          weight:
            String(
              newestRecord.weight,
            ),
        });

        setModalVisible(
          false,
        );

        setEditingRecord(
          null,
        );

        setWeightInput('');
} catch (error) {
        console.error(
          'KİLO KAYIT HATASI:',
          error,
        );

        showPopup(
          'Kayıt başarısız',
          'Kilo kaydı güncellenirken bir sorun oluştu.',
          'error',
        );
      } finally {
        setSaving(false);
      }
    };


  /* ---------------------------------------------------------
     DELETE RECORD
  --------------------------------------------------------- */

  const deleteRecord = (
    record: WeightRecord,
  ) => {
    showPopup(
      'Kilo kaydını sil',
      `${formatWeight(
        record.weight,
      )} kg olan bu kayıt silinsin mi?`,
      'delete',
      [
        {
          text: 'Vazgeç',
          variant: 'secondary',
        },
        {
          text: 'Sil',
          variant: 'danger',
          onPress: async () => {
            const nextRecords =
              sortAscending(
                allRecords.filter(
                  item =>
                    item.id !==
                    record.id,
                ),
              );

            const newestRecord =
              nextRecords.length > 0
                ? nextRecords[
                    nextRecords.length - 1
                  ]
                : null;

            try {
              await updatePet({
                ...pet,
                weightHistory:
                  nextRecords,
                weight:
                  newestRecord
                    ? String(
                        newestRecord.weight,
                      )
                    : '',
              });
            } catch (error) {
              console.log(
                'Kilo kaydı silinemedi:',
                error,
              );

              showPopup(
                'Silinemedi',
                'Kilo kaydı silinirken bir sorun oluştu.',
                'error',
              );
            }
          },
        },
      ],
    );
  };

  /* ---------------------------------------------------------
     CHART
  --------------------------------------------------------- */

  const chartHeight = 165;

  const chartPaddingX = 16;

  const chartPaddingY = 18;


  const chartPoints:
    ChartPoint[] =
    useMemo(() => {
      if (
        filteredRecords.length ===
          0 ||
        chartWidth <= 0
      ) {
        return [];
      }


      const weights =
        filteredRecords.map(
          item =>
            item.weight,
        );


      let minWeight =
        Math.min(...weights);

      let maxWeight =
        Math.max(...weights);


      if (
        minWeight ===
        maxWeight
      ) {
        minWeight -= 0.5;

        maxWeight += 0.5;
      }


      const usableWidth =
        chartWidth -
        chartPaddingX * 2;

      const usableHeight =
        chartHeight -
        chartPaddingY * 2;


      return filteredRecords.map(
        (record, index) => {
          const x =
            filteredRecords.length ===
            1
              ? chartWidth / 2
              : chartPaddingX +
                (index /
                  (filteredRecords.length -
                    1)) *
                  usableWidth;


          const normalized =
            (record.weight -
              minWeight) /
            (maxWeight -
              minWeight);


          const y =
            chartPaddingY +
            usableHeight -
            normalized *
              usableHeight;


          return {
            x,
            y,
            record,
          };
        },
      );
    }, [
      filteredRecords,
      chartWidth,
    ]);


  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F9F8FF"
      />

      <View
        pointerEvents="none"
        style={
          styles.backgroundBlob
        }
      />


      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.scrollContent
        }>

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <Pressable
            onPress={() =>
              navigation.goBack()
            }
            style={({
              pressed,
            }) => [
              styles.backButton,
              pressed &&
                styles.pressed,
            ]}>

            <ArrowLeft
              size={23}
              color="#172348"
              strokeWidth={2.4}
            />
          </Pressable>


          <View
            style={
              styles.headerText
            }>

            <Text
              style={styles.title}>
              Kilo Geçmişi
            </Text>

            <Text
              style={
                styles.subtitle
              }>
              {pet.name}
            </Text>

          </View>

        </View>


        {/* =================================================
            CURRENT WEIGHT
        ================================================= */}

        <View
          style={
            styles.currentCard
          }>

          <View
            style={
              styles.currentIcon
            }>

            <Weight
              size={25}
              color={PURPLE}
              strokeWidth={2.2}
            />

          </View>


          <View
            style={
              styles.currentContent
            }>

            <Text
              style={
                styles.currentLabel
              }>
              GÜNCEL KİLO
            </Text>


            <View
              style={
                styles.currentValueRow
              }>

              <Text
                style={
                  styles.currentValue
                }>
                {hasCurrentWeight
                  ? formatWeight(
                      currentWeight,
                    )
                  : '—'}
              </Text>

              {hasCurrentWeight && (
                <Text
                  style={
                    styles.currentUnit
                  }>
                  kg
                </Text>
              )}

            </View>


            <Text
              style={
                styles.currentDescription
              }>
              {pet.name} için
              kaydedilen son kilo
              değeri
            </Text>

          </View>


          <View
            pointerEvents="none"
            style={
              styles.decorativeWeight
            }>

            <Image
              source={require('../assets/images/weight/weight-kettlebell.png')}
              style={styles.kettlebellImage}
              resizeMode="contain"
            />

          </View>
        </View>


        {/* =================================================
            FILTERS
        ================================================= */}

        <View
          style={
            styles.filters
          }>

          {FILTERS.map(
            filter => {
              const active =
                activeFilter ===
                filter.key;

              return (
                <Pressable
                  key={
                    filter.key
                  }
                  onPress={() =>
                    setActiveFilter(
                      filter.key,
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.filterButton,

                    active &&
                      styles.filterButtonActive,

                    pressed &&
                      styles.filterPressed,
                  ]}>

                  <Text
                    style={[
                      styles.filterText,

                      active &&
                        styles.filterTextActive,
                    ]}>
                    {
                      filter.label
                    }
                  </Text>

                </Pressable>
              );
            },
          )}

        </View>


        {/* =================================================
            GRAPH
        ================================================= */}

        <View
          style={
            styles.graphCard
          }>

          <View
            style={
              styles.graphHeader
            }>

            <View>
              <Text
                style={
                  styles.cardTitle
                }>
                Kilo Değişimi
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }>
                Zaman içindeki
                değişim
              </Text>
            </View>


            <View
              style={
                styles.graphBadge
              }>

              <Text
                style={
                  styles.graphBadgeText
                }>
                kg
              </Text>

            </View>
          </View>


          {filteredRecords.length === 0 ? (
            <View style={styles.graphEmpty}>
              {[0, 1, 2, 3].map(item => (
                <View key={`empty-h-${item}`} style={[styles.horizontalGrid, {top: 18 + item * 37}]} />
              ))}
              {[0, 1, 2, 3, 4].map(item => (
                <View key={`empty-v-${item}`} style={[styles.verticalGrid, {left: `${item * 25}%`}]} />
              ))}

              <View style={styles.graphPreparingBadge}>
                <Text style={styles.graphPreparingText}>Grafik hazırlanıyor</Text>
              </View>
            </View>
          ) : (
            <>
              <View
                style={
                  styles.chartContainer
                }
                onLayout={event =>
                  setChartWidth(
                    event.nativeEvent
                      .layout.width,
                  )
                }>

                {/* GRID */}

                {[0, 1, 2, 3].map(
                  item => (
                    <View
                      key={`h-${item}`}
                      style={[
                        styles.horizontalGrid,

                        {
                          top:
                            15 +
                            item *
                              42,
                        },
                      ]}
                    />
                  ),
                )}


                {[0, 1, 2, 3, 4].map(
                  item => (
                    <View
                      key={`v-${item}`}
                      style={[
                        styles.verticalGrid,

                        {
                          left: `${
                            item *
                            25
                          }%`,
                        },
                      ]}
                    />
                  ),
                )}


                {/* SMOOTH LINE */}

                {chartWidth > 0 &&
                  chartPoints.length > 1 && (
                    <Svg
                      pointerEvents="none"
                      width={chartWidth}
                      height={chartHeight}
                      style={
                        StyleSheet.absoluteFill
                      }>

                      <Path
                        d={createSmoothPath(
                          chartPoints,
                        )}
                        fill="none"
                        stroke={PURPLE}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                    </Svg>
                  )}


                {/* DOTS */}

                {chartPoints.map(
                  point => (
                    <View
                      key={
                        point.record.id
                      }
                      style={[
                        styles.chartDotOuter,

                        {
                          left:
                            point.x -
                            6,

                          top:
                            point.y -
                            6,
                        },
                      ]}>

                      <View
                        style={
                          styles.chartDot
                        }
                      />

                    </View>
                  ),
                )}

              </View>


              <View
                style={
                  styles.chartDates
                }>

                <Text
                  style={
                    styles.chartDateText
                  }>
                  {formatShortDate(
                    filteredRecords[0]
                      .date,
                  )}
                </Text>

                <Text
                  style={
                    styles.chartDateText
                  }>
                  {formatShortDate(
                    filteredRecords[
                      filteredRecords.length -
                        1
                    ].date,
                  )}
                </Text>

              </View>
            </>
          )}


        </View>


        {/* =================================================
            HISTORY
        ================================================= */}

        <View
          style={
            styles.historyCard
          }>

          <View
            style={
              styles.historyHeader
            }>

            <View>
              <Text
                style={
                  styles.cardTitle
                }>
                Kilo Kayıtları
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }>
                Geçmiş ölçümler
              </Text>
            </View>


            {filteredRecords.length >
              0 && (
              <View
                style={
                  styles.countBadge
                }>

                <Text
                  style={
                    styles.countBadgeText
                  }>
                  {
                    filteredRecords.length
                  }
                </Text>

              </View>
            )}

          </View>


          {listRecords.length ===
          0 ? (
            <View
              style={
                styles.emptyHistory
              }>

              <View style={styles.emptyScaleWrapper}>
                <Image
                  source={require('../assets/images/weight/weight-empty-scale.png')}
                  style={styles.emptyScaleImage}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }>
                Henüz Kayıt Yok
              </Text>

              <Text
                style={
                  styles.emptyText
                }>
                {activeFilter ===
                'all'
                  ? `${pet.name} için ilk kilo kaydını ekleyerek değişimi takip etmeye başlayabilirsin.`
                  : 'Bu tarih aralığında kilo kaydı bulunmuyor.'}
              </Text>

            </View>
          ) : (
            <View
              style={
                styles.recordsContainer
              }>

              {listRecords.map(
                (
                  record,
                  index,
                ) => (
                  <View
                    key={
                      record.id
                    }
                    style={[
                      styles.recordRow,

                      index !==
                        listRecords.length -
                          1 &&
                        styles.recordRowBorder,
                    ]}>

                    <View
                      style={
                        styles.recordWeightIcon
                      }>

                      <Weight
                        size={18}
                        color={PURPLE}
                        strokeWidth={2}
                      />

                    </View>


                    <View
                      style={
                        styles.recordContent
                      }>

                      <View
                        style={
                          styles.recordTop
                        }>

                        <View
                          style={
                            styles.recordWeightRow
                          }>

                          <Text
                            style={
                              styles.recordWeight
                            }>
                            {formatWeight(
                              record.weight,
                            )}
                          </Text>

                          <Text
                            style={
                              styles.recordUnit
                            }>
                            kg
                          </Text>

                        </View>


                        <View
                          style={
                            styles.recordDateRow
                          }>

                          <CalendarDays
                            size={13}
                            color="#9AA0B3"
                            strokeWidth={2}
                          />

                          <Text
                            style={
                              styles.recordDate
                            }>
                            {formatDate(
                              record.date,
                            )}
                          </Text>

                        </View>

                      </View>


                      <View
                        style={
                          styles.recordActions
                        }>

                        <Pressable
                          onPress={() =>
                            openEditModal(
                              record,
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.editAction,

                            pressed &&
                              styles.pressed,
                          ]}>

                          <Pencil
                            size={14}
                            color="#6F5BD3"
                            strokeWidth={2.2}
                          />

                          <Text
                            style={
                              styles.editActionText
                            }>
                            Düzenle
                          </Text>

                        </Pressable>


                        <Pressable
                          onPress={() =>
                            deleteRecord(
                              record,
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.deleteAction,

                            pressed &&
                              styles.pressed,
                          ]}>

                          <Trash2
                            size={14}
                            color="#D96B73"
                            strokeWidth={2.1}
                          />

                          <Text
                            style={
                              styles.deleteActionText
                            }>
                            Sil
                          </Text>

                        </Pressable>

                      </View>

                    </View>
                  </View>
                ),
              )}

            </View>
          )}

          <Pressable
            onPress={openAddModal}
            style={({pressed}) => [styles.addButton, pressed && styles.addButtonPressed]}>
            <Plus size={20} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={styles.addButtonText}>Yeni Kilo Ekle</Text>
          </Pressable>

        </View>

      </ScrollView>


      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={
          closeModal
        }>

        <KeyboardAvoidingView
          style={
            styles.modalOverlay
          }
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }>

          <Pressable
            style={
              StyleSheet.absoluteFill
            }
            onPress={
              closeModal
            }
          />


          <View
            style={
              styles.modalCard
            }>

            <View
              style={
                styles.modalHeader
              }>

              <View>
                <Text
                  style={
                    styles.modalTitle
                  }>
                  {editingRecord
                    ? 'Kilo Kaydını Düzenle'
                    : 'Yeni Kilo Ekle'}
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }>
                  {pet.name} için
                  ölçüm bilgileri
                </Text>
              </View>


              <Pressable
                onPress={
                  closeModal
                }
                style={({
                  pressed,
                }) => [
                  styles.modalClose,

                  pressed &&
                    styles.pressed,
                ]}>

                <X
                  size={20}
                  color="#5E6478"
                  strokeWidth={2.2}
                />

              </Pressable>
            </View>


            {/* WEIGHT */}

            <Text
              style={
                styles.inputLabel
              }>
              Kilo
            </Text>

            <View
              style={
                styles.weightInputWrapper
              }>

              <Weight
                size={19}
                color={PURPLE}
                strokeWidth={2}
              />

              <TextInput
                value={
                  weightInput
                }
                onChangeText={
                  setWeightInput
                }
                placeholder="Örn. 4,8"
                placeholderTextColor="#B0B4C3"
                keyboardType="decimal-pad"
                style={
                  styles.weightInput
                }
              />

              <Text
                style={
                  styles.inputUnit
                }>
                kg
              </Text>

            </View>


            {/* DATE */}

            <Text
              style={
                styles.inputLabel
              }>
              Tarih
            </Text>

            <View
              style={
                styles.normalInputWrapper
              }>

              <CalendarDays
                size={18}
                color="#8A79DD"
                strokeWidth={2}
              />

              <TextInput
                value={
                  dateInput
                }
                onChangeText={
                  setDateInput
                }
                placeholder="YYYY-AA-GG"
                placeholderTextColor="#B0B4C3"
                style={
                  styles.normalInput
                }
                autoCapitalize="none"
              />

            </View>


            <Text
              style={
                styles.inputHint
              }>
              Örnek: 2026-09-23
            </Text>

            {/* MODAL ACTIONS */}

            <View
              style={
                styles.modalActions
              }>

              <Pressable
                disabled={saving}
                onPress={
                  closeModal
                }
                style={({
                  pressed,
                }) => [
                  styles.cancelButton,

                  pressed &&
                    styles.pressed,
                ]}>

                <Text
                  style={
                    styles.cancelButtonText
                  }>
                  Vazgeç
                </Text>

              </Pressable>


              <Pressable
                disabled={saving}
                onPress={
                  saveRecord
                }
                style={({
                  pressed,
                }) => [
                  styles.saveButton,

                  pressed &&
                    styles.addButtonPressed,

                  saving &&
                    styles.disabledButton,
                ]}>

                <Check
                  size={18}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                />

                <Text
                  style={
                    styles.saveButtonText
                  }>
                  {saving
                    ? 'Kaydediliyor...'
                    : editingRecord
                    ? 'Güncelle'
                    : 'Kaydet'}
                </Text>

              </Pressable>

            </View>

          </View>

        </KeyboardAvoidingView>
      </Modal>

      {/* ===================================================
          CUSTOM POPUPS
      =================================================== */}
      <Modal
        visible={popupVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closePopup}>
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <View
              style={[
                styles.popupIcon,
                getPopupIconStyle(),
              ]}>
              {renderPopupIcon()}
            </View>

            <Text style={styles.popupTitle}>
              {popupTitle}
            </Text>

            <Text style={styles.popupMessage}>
              {popupMessage}
            </Text>

            <View style={styles.popupActions}>
              {popupButtons.map(
                (button, index) => (
                  <Pressable
                    key={`${button.text}-${index}`}
                    onPress={() =>
                      handlePopupButtonPress(
                        button,
                      )
                    }
                    style={({pressed}) => [
                      styles.popupButton,
                      button.variant ===
                        'secondary' &&
                        styles.popupButtonSecondary,
                      button.variant ===
                        'danger' &&
                        styles.popupButtonDanger,
                      pressed &&
                        styles.popupButtonPressed,
                    ]}>
                    {button.variant === 'danger' && (
                      <Trash2
                        size={17}
                        color="#FFFFFF"
                        strokeWidth={2.2}
                      />
                    )}

                    <Text
                      style={[
                        styles.popupButtonText,
                        button.variant ===
                          'secondary' &&
                          styles.popupButtonTextSecondary,
                      ]}>
                      {button.text}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({

    screen: {
      flex: 1,
      backgroundColor:
        '#F9F8FF',
    },


    backgroundBlob: {
      position:
        'absolute',

      width: 270,
      height: 270,

      borderRadius: 135,

      backgroundColor:
        '#EEE9FF',

      top: -135,
      right: -115,

      opacity: 0.9,
    },


    scrollContent: {
      paddingTop: 60,
      paddingHorizontal: 14,
      paddingBottom: 32,
    },


    /* HEADER */

    header: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },


    backButton: {
      width: 40,
      height: 40,
      borderRadius: 24,

      backgroundColor:
        '#FFFFFF',

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        '#EFEDF6',

      shadowColor:
        '#6C63A8',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.1,
      shadowRadius: 9,

      elevation: 3,
    },


    headerText: {
      flex: 1,

      paddingHorizontal: 14,
    },


    title: {
      color: '#172348',

      fontSize: 21,

      fontFamily:
        'Quicksand-Bold',
    },


    subtitle: {
      marginTop: 1,

      color: '#8A90A3',

      fontSize: 11.5,

      fontFamily:
        'Quicksand-Medium',
    },


    headerAddButton: {
      width: 44,
      height: 44,
      borderRadius: 22,

      backgroundColor:
        PURPLE,

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowColor:
        PURPLE,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.23,
      shadowRadius: 9,

      elevation: 5,
    },


    /* CURRENT WEIGHT */

    currentCard: {
      height: 112,

      borderRadius: 22,

      backgroundColor:
        '#F0ECFF',

      borderWidth: 1,

      borderColor:
        '#DDD4FF',

      padding: 14,

      flexDirection:
        'row',

      overflow: 'hidden',

      shadowColor:
        '#7766D0',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.08,

      shadowRadius: 11,

      elevation: 2,
    },


    currentIcon: {
      width: 42,
      height: 42,

      borderRadius: 14,

      backgroundColor:
        '#E1DAFF',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 11,

      zIndex: 2,
    },


    currentContent: {
      flex: 1,

      zIndex: 2,
    },


    currentLabel: {
      color: '#7968C8',

      fontSize: 10,

      fontFamily:
        'Quicksand-Bold',

      letterSpacing: 0.8,
    },


    currentValueRow: {
      flexDirection:
        'row',

      alignItems:
        'baseline',

      marginTop: 1,
    },


    currentValue: {
      color:
        DARK_PURPLE,

      fontSize: 38,

      fontFamily:
        'Quicksand-Bold',
    },


    currentUnit: {
      marginLeft: 4,

      color: '#7467A5',

      fontSize: 13,

      fontFamily:
        'Quicksand-Bold',

      marginBottom: 5,
    },


    currentDescription: {
      maxWidth: 180,

      color: '#8177A4',

      fontSize: 9.5,

      lineHeight: 13,

      fontFamily:
        'Quicksand-Medium',

      marginTop: 0,
    },


    decorativeWeight: {
      position:
        'absolute',

      right: 2,
      bottom: -8,

      width: 110,
      height: 110,

      alignItems:
        'center',

      justifyContent:
        'center',

      zIndex: 1,
    },


    kettlebellImage: {
      width: 110,
      height: 110,
    },


    /* FILTER */

    filters: {
      flexDirection:
        'row',

      marginTop: 10,
      marginBottom: 10,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 18,

      padding: 4,

      borderWidth: 1,

      borderColor:
        '#ECE9F7',

      shadowColor:
        '#77709A',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.04,

      shadowRadius: 7,

      elevation: 1,
    },


    filterButton: {
      flex: 1,

      height: 34,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    filterButtonActive: {
      backgroundColor:
        '#EDE8FF',
    },


    filterText: {
      color: '#9299AC',

      fontSize: 10.5,

      fontFamily:
        'Quicksand-SemiBold',
    },


    filterTextActive: {
      color: '#6652C6',

      fontFamily:
        'Quicksand-Bold',
    },


    filterPressed: {
      opacity: 0.75,
    },


    /* GRAPH */

    graphCard: {
      borderRadius: 22,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#ECE9F7',

      padding: 14,

      shadowColor:
        '#6973A0',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.06,

      shadowRadius: 11,

      elevation: 2,
    },


    graphHeader: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',
    },


    cardTitle: {
      color: '#172348',

      fontSize: 15.5,

      fontFamily:
        'Quicksand-Bold',
    },


    cardSubtitle: {
      color: '#9299AC',

      fontSize: 10.5,

      fontFamily:
        'Quicksand-Medium',

      marginTop: 2,
    },


    graphBadge: {
      minWidth: 39,

      height: 28,

      paddingHorizontal: 9,

      borderRadius: 11,

      backgroundColor:
        '#F0ECFF',

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    graphBadgeText: {
      color: PURPLE,

      fontSize: 10.5,

      fontFamily:
        'Quicksand-Bold',
    },


    graphEmpty: {
      height: 150,

      position: 'relative',

      overflow: 'hidden',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal: 30,
    },


    graphPreparingBadge: {
      position: 'absolute',
      alignSelf: 'center',
      top: 58,
      backgroundColor: 'rgba(255,255,255,0.94)',
      borderWidth: 1,
      borderColor: '#E8E2FF',
      paddingHorizontal: 13,
      height: 29,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#7565B5',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },

    graphPreparingText: {
      color: '#7867C9',
      fontSize: 9.5,
      fontFamily: 'Quicksand-Bold',
    },

    graphEmptyIcon: {
      width: 55,
      height: 55,

      borderRadius: 19,

      backgroundColor:
        '#F2EFFF',

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    graphEmptyTitle: {
      color: '#514978',

      fontSize: 12.5,

      fontFamily:
        'Quicksand-Bold',

      marginTop: 10,

      textAlign: 'center',
    },


    graphEmptyText: {
      color: '#9A9FB0',

      fontSize: 10.5,

      lineHeight: 16,

      fontFamily:
        'Quicksand-Medium',

      textAlign: 'center',

      marginTop: 4,
    },


    chartContainer: {
      position:
        'relative',

      height: 165,

      marginTop: 15,

      overflow: 'hidden',
    },


    horizontalGrid: {
      position:
        'absolute',

      left: 0,
      right: 0,

      height: 1,

      backgroundColor:
        '#F0EEF7',
    },


    verticalGrid: {
      position:
        'absolute',

      top: 0,
      bottom: 0,

      width: 1,

      backgroundColor:
        '#F3F1F8',
    },


    chartDotOuter: {
      position:
        'absolute',

      width: 12,
      height: 12,

      borderRadius: 6,

      backgroundColor:
        '#E3DCFF',

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    chartDot: {
      width: 6,
      height: 6,

      borderRadius: 3,

      backgroundColor:
        PURPLE,
    },


    chartDates: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      marginTop: 2,
    },


    chartDateText: {
      color: '#9BA0B0',

      fontSize: 9.5,

      fontFamily:
        'Quicksand-Medium',
    },

    /* HISTORY */

    historyCard: {
      marginTop: 13,

      borderRadius: 22,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#ECE9F7',

      padding: 14,

      shadowColor:
        '#6973A0',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.05,

      shadowRadius: 10,

      elevation: 2,
    },


    historyHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },


    countBadge: {
      minWidth: 30,
      height: 30,

      borderRadius: 12,

      paddingHorizontal: 8,

      backgroundColor:
        '#F0ECFF',

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    countBadgeText: {
      color: PURPLE,

      fontSize: 11,

      fontFamily:
        'Quicksand-Bold',
    },


    emptyHistory: {
      alignItems:
        'center',

      paddingTop: 18,

      paddingBottom: 12,

      paddingHorizontal: 24,
    },


    emptyScaleWrapper: {
      width: 108,
      height: 92,
      alignItems: 'center',
      justifyContent: 'center',
    },


    emptyScaleImage: {
      width: 108,
      height: 92,
    },


    emptyTitle: {
      marginTop: 12,

      color: '#343956',

      fontSize: 13.5,

      fontFamily:
        'Quicksand-Bold',
    },


    emptyText: {
      marginTop: 5,

      color: '#9299AC',

      fontSize: 10.5,

      lineHeight: 16,

      fontFamily:
        'Quicksand-Medium',

      textAlign: 'center',
    },


    recordsContainer: {
      marginTop: 10,
    },


    recordRow: {
      flexDirection:
        'row',

      paddingVertical: 14,
    },


    recordRowBorder: {
      borderBottomWidth: 1,

      borderBottomColor:
        '#F0EDF6',
    },


    recordWeightIcon: {
      width: 40,
      height: 40,

      borderRadius: 14,

      backgroundColor:
        '#F0ECFF',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 11,
    },


    recordContent: {
      flex: 1,
    },


    recordTop: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',
    },


    recordWeightRow: {
      flexDirection:
        'row',

      alignItems:
        'baseline',
    },


    recordWeight: {
      color: '#34345A',

      fontSize: 18,

      fontFamily:
        'Quicksand-Bold',
    },


    recordUnit: {
      color: '#898EA0',

      fontSize: 10,

      fontFamily:
        'Quicksand-Bold',

      marginLeft: 3,
    },


    recordDateRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 4,
    },


    recordDate: {
      color: '#9096A7',

      fontSize: 9.5,

      fontFamily:
        'Quicksand-Medium',
    },


    recordActions: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginTop: 9,

      gap: 8,
    },


    editAction: {
      height: 31,

      paddingHorizontal: 10,

      borderRadius: 11,

      backgroundColor:
        '#F0ECFF',

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
    },


    editActionText: {
      color: '#6F5BD3',

      fontSize: 9.5,

      fontFamily:
        'Quicksand-Bold',
    },


    deleteAction: {
      height: 31,

      paddingHorizontal: 10,

      borderRadius: 11,

      backgroundColor:
        '#FFF1F2',

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
    },


    deleteActionText: {
      color: '#D96B73',

      fontSize: 9.5,

      fontFamily:
        'Quicksand-Bold',
    },


    /* ADD */

    addButton: {
      height: 52,

      borderRadius: 50,

      marginTop: 16,

      backgroundColor:
        PURPLE,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowColor:
        '#7257D9',

      shadowOffset: {
        width: 0,
        height: 7,
      },

      shadowOpacity: 0.22,

      shadowRadius: 11,

      elevation: 6,
    },


    addButtonPressed: {
      opacity: 0.86,

      transform: [
        {
          scale: 0.985,
        },
      ],
    },


    addButtonText: {
      marginLeft: 7,

      color: '#FFFFFF',

      fontSize: 14,

      fontFamily:
        'Quicksand-Bold',
    },


    /* POPUPS */

    popupOverlay: {
      flex: 1,
      backgroundColor: 'rgba(28, 25, 48, 0.48)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },

    popupCard: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 28,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 18,
      alignItems: 'center',
      shadowColor: '#27203D',
      shadowOffset: {
        width: 0,
        height: 14,
      },
      shadowOpacity: 0.2,
      shadowRadius: 26,
      elevation: 16,
    },

    popupIcon: {
      width: 64,
      height: 64,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },

    popupIconInfo: {
      backgroundColor: '#EEE9FF',
    },

    popupIconWarning: {
      backgroundColor: '#FFF3DA',
    },

    popupIconDanger: {
      backgroundColor: '#FFF0F1',
    },

    popupIconSuccess: {
      backgroundColor: '#EAF7EF',
    },

    popupTitle: {
      color: '#252844',
      fontSize: 18,
      fontFamily: 'Quicksand-Bold',
      textAlign: 'center',
    },

    popupMessage: {
      color: '#777D91',
      fontSize: 12.5,
      lineHeight: 19,
      fontFamily: 'Quicksand-Medium',
      textAlign: 'center',
      marginTop: 8,
      maxWidth: 305,
    },

    popupActions: {
      width: '100%',
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
    },

    popupButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: PURPLE,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 12,
    },

    popupButtonSecondary: {
      backgroundColor: '#F2F0F7',
    },

    popupButtonDanger: {
      backgroundColor: '#D96B73',
    },

    popupButtonText: {
      color: '#FFFFFF',
      fontSize: 12.5,
      fontFamily: 'Quicksand-Bold',
    },

    popupButtonTextSecondary: {
      color: '#6E7488',
    },

    popupButtonPressed: {
      opacity: 0.78,
      transform: [{scale: 0.985}],
    },

    /* MODAL */

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(30, 28, 55, 0.45)',

      justifyContent:
        'center',

      paddingHorizontal: 20,
    },


    modalCard: {
      width: '100%',

      maxWidth: 430,

      alignSelf:
        'center',

      borderRadius: 29,

      backgroundColor:
        '#FFFFFF',

      padding: 20,

      shadowColor:
        '#28203D',

      shadowOffset: {
        width: 0,
        height: 12,
      },

      shadowOpacity: 0.18,

      shadowRadius: 25,

      elevation: 14,
    },


    modalHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom: 20,
    },


    modalTitle: {
      color: '#222443',

      fontSize: 17,

      fontFamily:
        'Quicksand-Bold',
    },


    modalSubtitle: {
      color: '#9499AA',

      fontSize: 10.5,

      fontFamily:
        'Quicksand-Medium',

      marginTop: 2,
    },


    modalClose: {
      width: 38,
      height: 38,

      borderRadius: 14,

      backgroundColor:
        '#F4F2FA',

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    inputLabel: {
      color: '#454A62',

      fontSize: 11,

      fontFamily:
        'Quicksand-Bold',

      marginBottom: 7,
      marginTop: 4,
    },


    weightInputWrapper: {
      height: 54,

      borderRadius: 17,

      borderWidth: 1,

      borderColor:
        '#E4DFFC',

      backgroundColor:
        '#FAF9FF',

      paddingHorizontal: 14,

      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom: 14,
    },


    weightInput: {
      flex: 1,

      height: '100%',

      color: '#343650',

      fontSize: 15,

      fontFamily:
        'Quicksand-SemiBold',

      marginLeft: 10,
    },


    inputUnit: {
      color: '#8175B6',

      fontSize: 11,

      fontFamily:
        'Quicksand-Bold',
    },


    normalInputWrapper: {
      height: 54,

      borderRadius: 17,

      borderWidth: 1,

      borderColor:
        '#E7E3F4',

      backgroundColor:
        '#FAF9FD',

      paddingHorizontal: 14,

      flexDirection:
        'row',

      alignItems:
        'center',
    },


    normalInput: {
      flex: 1,

      height: '100%',

      color: '#42465A',

      fontSize: 13,

      fontFamily:
        'Quicksand-Medium',

      marginLeft: 9,
    },


    inputHint: {
      color: '#A0A5B4',

      fontSize: 9,

      fontFamily:
        'Quicksand-Medium',

      marginTop: 5,
      marginBottom: 11,
      marginLeft: 3,
    },


    modalActions: {
      flexDirection:
        'row',

      gap: 10,

      marginTop: 15,
    },


    cancelButton: {
      flex: 0.85,

      height: 51,

      borderRadius: 17,

      backgroundColor:
        '#F2F0F7',

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    cancelButtonText: {
      color: '#707589',

      fontSize: 12,

      fontFamily:
        'Quicksand-Bold',
    },


    saveButton: {
      flex: 1.3,

      height: 51,

      borderRadius: 17,

      backgroundColor:
        PURPLE,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 6,
    },


    saveButtonText: {
      color: '#FFFFFF',

      fontSize: 12,

      fontFamily:
        'Quicksand-Bold',
    },


    disabledButton: {
      opacity: 0.55,
    },


    pressed: {
      opacity: 0.72,
    },
  });



