import React, {useMemo, useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';

import {RouteProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {
  ArrowLeft,
  Cat,
  Dog,
  Bird,
  Rabbit,
  Ellipsis,
  Heart,
  Syringe,
  CalendarDays,
  UserRound,
  Camera,
  Minus,
  Plus,
  Mars,
  Venus,
  Weight,
  FileText,
  Pencil,
  Check,
} from 'lucide-react-native';

import {RootStackParamList} from '../navigation/AppNavigator';
import {usePets} from '../data/PetContext';

type EditPetRouteProp = RouteProp<RootStackParamList, 'EditPet'>;

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditPet'
>;

type Props = {
  route: EditPetRouteProp;
};

type MenuKey = 'general' | 'health' | 'vaccines' | 'appointments';

type PetTypeOption = {
  key: string;
  label: string;
  color: string;
  iconColor: string;
  icon: React.ReactNode;
};

export default function EditPetScreen({route}: Props) {
  const {pet} = route.params;

  const {updatePet} = usePets();

  const navigation = useNavigation<NavigationProp>();

  const [activeMenu, setActiveMenu] =
    useState<MenuKey>('general');

  const [name, setName] = useState(pet.name);
  const [type, setType] = useState(pet.type);
  const [age, setAge] = useState(String(pet.age));
  const [gender, setGender] = useState(pet.gender || '');
  const [weight, setWeight] = useState(pet.weight || '');
  const [vaccines] = useState(pet.vaccines || '');
  const [lastVetVisit] = useState(pet.lastVetVisit || '');
  const [notes, setNotes] = useState(pet.notes || '');

  /*
   * PET TYPE
   */

  const normalizedType = (value: string) => {
    const v = value
      .trim()
      .toLocaleLowerCase('tr-TR');

    if (v === 'kedi') {
      return 'Kedi';
    }

    if (v === 'köpek' || v === 'kopek') {
      return 'Köpek';
    }

    if (v === 'kuş' || v === 'kus') {
      return 'Kuş';
    }

    if (v === 'tavşan' || v === 'tavsan') {
      return 'Tavşan';
    }

    if (v === 'hamster') {
      return 'Hamster';
    }

    return 'Diğer';
  };

  const selectedType = normalizedType(type);

  const petTypes: PetTypeOption[] = useMemo(
    () => [
      {
        key: 'Kedi',
        label: 'Kedi',
        color: '#F0EBFF',
        iconColor: '#8267E8',
        icon: (
          <Cat
            size={25}
            strokeWidth={2.1}
          />
        ),
      },

      {
        key: 'Köpek',
        label: 'Köpek',
        color: '#E9F4FF',
        iconColor: '#4D79A9',
        icon: (
          <Dog
            size={25}
            strokeWidth={2.1}
          />
        ),
      },

      {
        key: 'Kuş',
        label: 'Kuş',
        color: '#FFF3D9',
        iconColor: '#B98526',
        icon: (
          <Bird
            size={25}
            strokeWidth={2.1}
          />
        ),
      },

      {
        key: 'Tavşan',
        label: 'Tavşan',
        color: '#E7F7F2',
        iconColor: '#558B89',
        icon: (
          <Rabbit
            size={25}
            strokeWidth={2.1}
          />
        ),
      },

      {
        key: 'Hamster',
        label: 'Hamster',
        color: '#FFEBDD',
        iconColor: '#C36B42',
        icon: (
          <Cat
            size={24}
            strokeWidth={2.1}
          />
        ),
      },

      {
        key: 'Diğer',
        label: 'Diğer',
        color: '#FCE8F1',
        iconColor: '#B75C7D',
        icon: (
          <Ellipsis
            size={27}
            strokeWidth={2.5}
          />
        ),
      },
    ],
    [],
  );

  /*
   * AGE
   */

  const currentAge = Number(age) || 0;

  const decreaseAge = () => {
    setAge(
      String(
        Math.max(currentAge - 1, 0),
      ),
    );
  };

  const increaseAge = () => {
    setAge(
      String(currentAge + 1),
    );
  };

  /*
   * WEIGHT
   */

  const currentWeight = Number(
    String(weight)
      .replace(',', '.')
      .replace(/[^\d.]/g, ''),
  );

  const safeWeight = Number.isNaN(currentWeight)
    ? 0
    : currentWeight;

  const weightPercent = Math.min(
    Math.max(safeWeight / 20, 0),
    1,
  );

  /*
   * SAVE
   */

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(
        'Hata',
        'Pet adı girmeniz gerekiyor.',
      );

      return;
    }

    if (!type.trim()) {
      Alert.alert(
        'Hata',
        'Pet türü girmeniz gerekiyor.',
      );

      return;
    }

    if (
      !age.trim() ||
      isNaN(Number(age))
    ) {
      Alert.alert(
        'Hata',
        'Geçerli bir yaş girin.',
      );

      return;
    }

    updatePet({
      ...pet,

      name: name.trim(),

      type: type.trim(),

      age: Number(age),

      gender: gender.trim(),

      weight: weight.trim(),

      vaccines: vaccines.trim(),

      lastVetVisit:
        lastVetVisit.trim(),

      notes: notes.trim(),
    });

    Alert.alert(
      'Başarılı',
      'Pet bilgileri güncellendi.',
    );

    navigation.goBack();
  };

  /*
   * LEFT MENU
   */

  const handleMenuPress = (
    menu: MenuKey,
  ) => {
    setActiveMenu(menu);
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          styles.screen.backgroundColor
        }
      />

      {/* BACKGROUND */}

      <View
        style={
          styles.backgroundBlobLeft
        }
      />

      <View
        style={
          styles.backgroundBlobRight
        }
      />

      <View
        style={
          styles.backgroundBlobBottomLeft
        }
      />

      <View
        style={
          styles.backgroundBlobBottomRight
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }>

        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            style={({pressed}) => [
              styles.backButton,

              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              navigation.goBack()
            }>

            <ArrowLeft
              size={25}
              color="#172554"
              strokeWidth={2.4}
            />
          </Pressable>

          <View
            style={
              styles.headerCenter
            }>

            <View
              style={
                styles.titleRow
              }>

              <Text
                style={
                  styles.headerTitle
                }>
                {name}’i Düzenliyorsun
              </Text>

              <Text
                style={
                  styles.headerHeart
                }>
                ♥
              </Text>

            </View>

            <Text
              style={
                styles.headerSubtitle
              }>
              Küçük detaylar, büyük
              mutluluklar.
            </Text>

          </View>

          <View
            style={
              styles.headerRightSpace
            }
          />
        </View>

        {/* HEADER DECORATION */}

        <View
          style={
            styles.headerDecorations
          }>

          <Text
            style={styles.sparkle}>
            ✦
          </Text>

          <View
            style={
              styles.decorDot
            }
          />

          <Text
            style={[
              styles.sparkle,
              styles.sparkleRight,
            ]}>
            ✦
          </Text>

        </View>

        {/* WORKSPACE */}

        <View
          style={styles.workspace}>

          {/* ===================== */}
          {/* NEW LEFT NAVIGATION */}
          {/* ===================== */}

          <View
            style={styles.sideMenu}>

            <View
              style={
                styles.sideMenuTopGlow
              }
            />

            <SideMenuButton
              active={
                activeMenu ===
                'general'
              }
              label="Genel"
              icon={
                <Cat
                  size={24}
                  color={
                    activeMenu ===
                    'general'
                      ? '#FFFFFF'
                      : '#7481A4'
                  }
                  strokeWidth={2.1}
                />
              }
              onPress={() =>
                handleMenuPress(
                  'general',
                )
              }
            />

            <View
              style={
                styles.menuConnector
              }
            />

            <SideMenuButton
              active={
                activeMenu ===
                'health'
              }
              label="Sağlık"
              icon={
                <Heart
                  size={25}
                  color={
                    activeMenu ===
                    'health'
                      ? '#FFFFFF'
                      : '#7481A4'
                  }
                  strokeWidth={2.1}
                />
              }
              onPress={() =>
                handleMenuPress(
                  'health',
                )
              }
            />

            <View
              style={
                styles.menuConnector
              }
            />

            <SideMenuButton
              active={
                activeMenu ===
                'vaccines'
              }
              label="Aşılar"
              icon={
                <Syringe
                  size={24}
                  color={
                    activeMenu ===
                    'vaccines'
                      ? '#FFFFFF'
                      : '#7481A4'
                  }
                  strokeWidth={2}
                />
              }
              onPress={() =>
                handleMenuPress(
                  'vaccines',
                )
              }
            />

            <View
              style={
                styles.menuConnector
              }
            />

            <SideMenuButton
              active={
                activeMenu ===
                'appointments'
              }
              label="Randevular"
              icon={
                <CalendarDays
                  size={24}
                  color={
                    activeMenu ===
                    'appointments'
                      ? '#FFFFFF'
                      : '#7481A4'
                  }
                  strokeWidth={2}
                />
              }
              onPress={() =>
                handleMenuPress(
                  'appointments',
                )
              }
            />

            <View
              style={
                styles.sideMenuBottomDot
              }
            />

          </View>

          {/* RIGHT CONTENT */}

          <View
            style={
              styles.rightContent
            }>

            {/* BASIC INFO */}

            <View
              style={styles.mainCard}>

              {/* CARD HEADER */}

              <View
                style={
                  styles.cardHeader
                }>

                <View
                  style={
                    styles.cardHeaderLeft
                  }>

                  <View
                    style={
                      styles.cardHeaderIcon
                    }>

                    <Cat
                      size={26}
                      color="#8167E8"
                      strokeWidth={2.2}
                    />

                  </View>

                  <View>

                    <Text
                      style={
                        styles.cardTitle
                      }>
                      Temel Bilgiler
                    </Text>

                    <Text
                      style={
                        styles.cardSubtitle
                      }>
                      Patinin temel
                      bilgilerini güncelle.
                    </Text>

                  </View>

                </View>

                {/* PHOTO */}

                <View
                  style={
                    styles.petPhotoWrapper
                  }>

                  <View
                    style={
                      styles.petPhoto
                    }>

                    <Cat
                      size={43}
                      color="#7A6B9C"
                      strokeWidth={1.7}
                    />

                  </View>

                  <Pressable
                    style={
                      styles.cameraButton
                    }>

                    <Camera
                      size={18}
                      color="#FFFFFF"
                      strokeWidth={2.4}
                    />

                  </Pressable>

                </View>

              </View>

              {/* NAME */}

              <Text
                style={
                  styles.fieldLabel
                }>
                Pet Adı
              </Text>

              <View
                style={
                  styles.nameInputContainer
                }>

                <View
                  style={
                    styles.inputIconBox
                  }>

                  <UserRound
                    size={22}
                    color="#66769B"
                    strokeWidth={2}
                  />

                </View>

                <TextInput
                  value={name}
                  onChangeText={
                    setName
                  }
                  placeholder="Pet adı"
                  placeholderTextColor="#9AA5BE"
                  style={
                    styles.nameInput
                  }
                />

              </View>

              {/* TYPE */}

              <Text
                style={
                  styles.fieldLabel
                }>
                Tür
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.typeList
                }>

                {petTypes.map(
                  item => {
                    const selected =
                      selectedType ===
                      item.key;

                    return (
                      <Pressable
                        key={
                          item.key
                        }
                        onPress={() =>
                          setType(
                            item.key,
                          )
                        }
                        style={[
                          styles.typeCard,

                          {
                            backgroundColor:
                              item.color,
                          },

                          selected &&
                            styles.typeCardSelected,
                        ]}>

                        {selected && (
                          <View
                            style={
                              styles.selectedBadge
                            }>

                            <Check
                              size={11}
                              color="#FFFFFF"
                              strokeWidth={
                                3
                              }
                            />

                          </View>
                        )}

                        {React.cloneElement(
                          item.icon as React.ReactElement<any>,
                          {
                            color:
                              item.iconColor,
                          },
                        )}

                        <Text
                          style={[
                            styles.typeLabel,

                            {
                              color:
                                item.iconColor,
                            },

                            selected &&
                              styles.typeLabelSelected,
                          ]}>
                          {item.label}
                        </Text>

                      </Pressable>
                    );
                  },
                )}

              </ScrollView>

              {/* PAGINATION */}

              <View
                style={
                  styles.pagination
                }>

                <View
                  style={[
                    styles.paginationDot,
                    styles.paginationActive,
                  ]}
                />

                <View
                  style={
                    styles.paginationDot
                  }
                />

                <View
                  style={
                    styles.paginationDot
                  }
                />

                <View
                  style={
                    styles.paginationDot
                  }
                />

              </View>

              {/* AGE / GENDER */}

              <View
                style={
                  styles.doubleColumn
                }>

                {/* AGE */}

                <View
                  style={
                    styles.ageSection
                  }>

                  <Text
                    style={
                      styles.fieldLabel
                    }>
                    Yaş
                  </Text>

                  <View
                    style={
                      styles.ageControls
                    }>

                    <View
                      style={
                        styles.ageCalendar
                      }>

                      <CalendarDays
                        size={20}
                        color="#66769B"
                        strokeWidth={2}
                      />

                    </View>

                    <Pressable
                      style={
                        styles.ageButton
                      }
                      onPress={
                        decreaseAge
                      }>

                      <Minus
                        size={20}
                        color="#14234A"
                        strokeWidth={
                          2.4
                        }
                      />

                    </Pressable>

                    <View
                      style={
                        styles.ageValueBox
                      }>

                      <Text
                        style={
                          styles.ageValue
                        }>
                        {age}
                      </Text>

                    </View>

                    <Pressable
                      style={
                        styles.ageButton
                      }
                      onPress={
                        increaseAge
                      }>

                      <Plus
                        size={20}
                        color="#14234A"
                        strokeWidth={
                          2.4
                        }
                      />

                    </Pressable>

                  </View>

                  <Text
                    style={
                      styles.yearText
                    }>
                    yıl
                  </Text>

                </View>

                {/* GENDER */}

                <View
                  style={
                    styles.genderSection
                  }>

                  <Text
                    style={
                      styles.fieldLabel
                    }>
                    Cinsiyet
                  </Text>

                  <View
                    style={
                      styles.genderRow
                    }>

                    <Pressable
                      onPress={() =>
                        setGender(
                          'Erkek',
                        )
                      }
                      style={[
                        styles.genderButton,
                        styles.maleButton,

                        gender ===
                          'Erkek' &&
                          styles.maleSelected,
                      ]}>

                      <Mars
                        size={22}
                        color="#3594DC"
                        strokeWidth={
                          2.5
                        }
                      />

                      <Text
                        style={
                          styles.maleText
                        }>
                        Erkek
                      </Text>

                      {gender ===
                        'Erkek' && (
                        <View
                          style={
                            styles.genderCheck
                          }>

                          <Check
                            size={10}
                            color="#FFFFFF"
                            strokeWidth={
                              3
                            }
                          />

                        </View>
                      )}

                    </Pressable>

                    <Pressable
                      onPress={() =>
                        setGender(
                          'Dişi',
                        )
                      }
                      style={[
                        styles.genderButton,
                        styles.femaleButton,

                        gender ===
                          'Dişi' &&
                          styles.femaleSelected,
                      ]}>

                      <Venus
                        size={22}
                        color="#C25872"
                        strokeWidth={
                          2.5
                        }
                      />

                      <Text
                        style={
                          styles.femaleText
                        }>
                        Dişi
                      </Text>

                      {gender ===
                        'Dişi' && (
                        <View
                          style={[
                            styles.genderCheck,
                            styles.femaleCheck,
                          ]}>

                          <Check
                            size={10}
                            color="#FFFFFF"
                            strokeWidth={
                              3
                            }
                          />

                        </View>
                      )}

                    </Pressable>

                  </View>

                </View>

              </View>

              {/* WEIGHT */}

              <Text
                style={[
                  styles.fieldLabel,
                  styles.weightLabel,
                ]}>
                Kilo
              </Text>

              <View
                style={
                  styles.weightRow
                }>

                <View
                  style={
                    styles.weightIcon
                  }>

                  <Weight
                    size={20}
                    color="#66769B"
                    strokeWidth={2}
                  />

                </View>

                <View
                  style={
                    styles.weightContent
                  }>

                  <View
                    style={[
                      styles.weightBubble,

                      {
                        left: `${Math.min(
                          Math.max(
                            weightPercent *
                              100,
                            4,
                          ),
                          88,
                        )}%`,
                      },
                    ]}>

                    <Text
                      style={
                        styles.weightBubbleText
                      }>
                      {safeWeight || 0}{' '}
                      kg
                    </Text>

                  </View>

                  <View
                    style={
                      styles.slider
                    }>

                    <View
                      style={[
                        styles.sliderProgress,

                        {
                          width: `${
                            weightPercent *
                            100
                          }%`,
                        },
                      ]}
                    />

                    <View
                      style={[
                        styles.sliderThumb,

                        {
                          left: `${
                            weightPercent *
                            100
                          }%`,
                        },
                      ]}
                    />

                  </View>

                  <View
                    style={
                      styles.sliderTicks
                    }>

                    {Array.from({
                      length: 10,
                    }).map(
                      (_, index) => (
                        <View
                          key={
                            index
                          }
                          style={
                            styles.sliderTick
                          }
                        />
                      ),
                    )}

                  </View>

                  <View
                    style={
                      styles.weightRange
                    }>

                    <Text
                      style={
                        styles.weightRangeText
                      }>
                      0 kg
                    </Text>

                    <Text
                      style={
                        styles.weightRangeText
                      }>
                      20 kg
                    </Text>

                  </View>

                </View>

              </View>

            </View>

            {/* ABOUT */}

            <View
              style={
                styles.aboutCard
              }>

              <View
                style={
                  styles.aboutHeader
                }>

                <View
                  style={
                    styles.aboutIcon
                  }>

                  <FileText
                    size={23}
                    color="#8067E8"
                    strokeWidth={2.2}
                  />

                </View>

                <Text
                  style={
                    styles.aboutTitle
                  }>
                  Hakkında
                </Text>

              </View>

              <Text
                style={
                  styles.aboutSubtitle
                }>
                Patin hakkında eklemek
                istediğin kısa bilgiler
                var mı?
              </Text>

              <View
                style={
                  styles.notesContainer
                }>

                <TextInput
                  value={notes}
                  onChangeText={
                    setNotes
                  }
                  multiline
                  placeholder="Örn. Meraklı, oyuncu ve çok sevgi dolu."
                  placeholderTextColor="#8A98B5"
                  style={
                    styles.notesInput
                  }
                />

                <Pencil
                  size={20}
                  color="#6C7CA2"
                  strokeWidth={2}
                  style={
                    styles.notesPencil
                  }
                />

              </View>

            </View>

          </View>

        </View>

        {/* SAVE */}

        <Pressable
          onPress={handleSave}
          style={({pressed}) => [
            styles.saveButton,

            pressed &&
              styles.saveButtonPressed,
          ]}>

          <Check
            size={25}
            color="#FFFFFF"
            strokeWidth={2.5}
          />

          <Text
            style={
              styles.saveButtonText
            }>
            Değişiklikleri Kaydet
          </Text>

        </Pressable>

        <View
          style={
            styles.bottomSpace
          }
        />

      </ScrollView>
    </View>
  );
}

/*
 * SIDE MENU BUTTON
 */

type SideMenuButtonProps = {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
};

function SideMenuButton({
  active,
  label,
  icon,
  onPress,
}: SideMenuButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.sideMenuButton,

        active &&
          styles.sideMenuButtonActive,

        pressed &&
          styles.pressed,
      ]}>

      {active && (
        <View
          style={
            styles.activeMenuIndicator
          }
        />
      )}

      <View
        style={[
          styles.sideMenuIconBox,

          active &&
            styles.sideMenuIconBoxActive,
        ]}>

        {icon}

      </View>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.sideMenuLabel,

          active &&
            styles.sideMenuLabelActive,
        ]}>
        {label}
      </Text>

    </Pressable>
  );
}

/*
 * STYLES
 */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },

  scrollContent: {
    paddingTop:
      Platform.OS === 'android'
        ? 20
        : 12,

    paddingBottom: 30,

    minHeight: '100%',
  },

  /*
   * BACKGROUND
   */

  backgroundBlobLeft: {
    position: 'absolute',

    width: 190,
    height: 220,

    borderRadius: 100,

    backgroundColor: '#F6EAFB',

    top: 120,
    left: -120,

    opacity: 0.8,

    transform: [
      {
        rotate: '-18deg',
      },
    ],
  },

  backgroundBlobRight: {
    position: 'absolute',

    width: 170,
    height: 210,

    borderRadius: 100,

    backgroundColor: '#EAE9FF',

    top: 70,
    right: -110,

    opacity: 0.8,

    transform: [
      {
        rotate: '22deg',
      },
    ],
  },

  backgroundBlobBottomLeft: {
    position: 'absolute',

    width: 250,
    height: 160,

    borderRadius: 120,

    backgroundColor: '#E9F1FF',

    bottom: -90,
    left: -70,

    opacity: 0.75,
  },

  backgroundBlobBottomRight: {
    position: 'absolute',

    width: 230,
    height: 170,

    borderRadius: 120,

    backgroundColor: '#FBE6F3',

    bottom: -100,
    right: -80,

    opacity: 0.8,
  },

  /*
   * HEADER
   */

  header: {
    minHeight: 150,

    paddingHorizontal: 18,

    position: 'relative',

    justifyContent: 'center',
  },

  backButton: {
    position: 'absolute',

    left: 18,
    top: 18,

    width: 52,
    height: 52,

    borderRadius: 26,

    backgroundColor: '#FFFFFF',

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#6C63A8',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.12,

    shadowRadius: 10,

    elevation: 5,
  },

  headerCenter: {
    alignItems: 'center',

    paddingHorizontal: 62,

    marginTop: 12,
  },

  titleRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 25,

    fontWeight: '800',

    color: '#152349',

    letterSpacing: -0.5,
  },

  headerHeart: {
    marginLeft: 8,

    fontSize: 29,

    color: '#8C72E8',
  },

  headerSubtitle: {
    marginTop: 6,

    fontSize: 13.5,

    fontWeight: '500',

    color: '#7080A3',
  },

  headerRightSpace: {
    width: 50,
  },

  headerDecorations: {
    position: 'absolute',

    top: 135,

    left: 0,
    right: 0,

    height: 70,
  },

  sparkle: {
    position: 'absolute',

    left: 84,

    top: 3,

    color: '#A88DEA',

    fontSize: 22,
  },

  sparkleRight: {
    left: undefined,

    right: 70,

    top: 10,

    color: '#C29BE7',
  },

  decorDot: {
    position: 'absolute',

    width: 9,
    height: 9,

    borderRadius: 5,

    backgroundColor: '#D7E3FF',

    left: 110,

    top: 38,
  },

  /*
   * WORKSPACE
   */

  workspace: {
    flexDirection: 'row',

    paddingHorizontal: 14,

    marginTop: 12,

    alignItems: 'flex-start',
  },

  /*
   * NEW SIDE NAVIGATION
   */

  sideMenu: {
    width: 96,

    marginRight: 12,

    paddingHorizontal: 7,

    paddingTop: 11,

    paddingBottom: 15,

    backgroundColor:
      'rgba(255,255,255,0.90)',

    borderRadius: 31,

    borderWidth: 1,

    borderColor: '#ECE9F8',

    position: 'relative',

    overflow: 'visible',

    shadowColor: '#716A9A',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.11,

    shadowRadius: 17,

    elevation: 4,
  },

  /*
   * SUBTLE DECORATION AT TOP
   */

  sideMenuTopGlow: {
    position: 'absolute',

    top: 11,

    alignSelf: 'center',

    width: 35,
    height: 6,

    borderRadius: 10,

    backgroundColor: '#EEEAFE',
  },

  /*
   * BUTTON
   */

  sideMenuButton: {
    height: 94,

    borderRadius: 23,

    justifyContent: 'center',

    alignItems: 'center',

    position: 'relative',

    backgroundColor:
      'transparent',

    zIndex: 2,
  },

  sideMenuButtonActive: {
    backgroundColor: '#F0ECFF',

    borderWidth: 1,

    borderColor: '#DDD5FA',

    shadowColor: '#8777CE',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.13,

    shadowRadius: 9,

    elevation: 3,
  },

  /*
   * ACTIVE LEFT MARK
   */

  activeMenuIndicator: {
    position: 'absolute',

    left: -10,

    top: 25,

    width: 4,

    height: 44,

    borderRadius: 4,

    backgroundColor: '#8E7CE5',

    shadowColor: '#8E7CE5',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.3,

    shadowRadius: 4,

    elevation: 2,
  },

  /*
   * ICON BOX
   */

  sideMenuIconBox: {
    width: 45,

    height: 45,

    borderRadius: 16,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F5F6FB',

    borderWidth: 1,

    borderColor: '#EEF0F7',
  },

  sideMenuIconBoxActive: {
    backgroundColor: '#9382E8',

    borderColor: '#9382E8',

    shadowColor: '#7969C8',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.22,

    shadowRadius: 7,

    elevation: 4,
  },

  /*
   * LABEL
   */

  sideMenuLabel: {
    color: '#7481A4',

    fontSize: 11,

    fontWeight: '600',

    marginTop: 7,

    textAlign: 'center',

    width: '100%',
  },

  sideMenuLabelActive: {
    color: '#6C5DBD',

    fontWeight: '800',
  },

  /*
   * CONNECTING LINE
   */

  menuConnector: {
    alignSelf: 'center',

    width: 1,

    height: 10,

    backgroundColor: '#E6E4F2',
  },

  /*
   * BOTTOM DECORATIVE DOT
   */

  sideMenuBottomDot: {
    alignSelf: 'center',

    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: '#D9D4F2',

    marginTop: 7,
  },

  /*
   * RIGHT CONTENT
   */

  rightContent: {
    flex: 1,
  },

  /*
   * MAIN CARD
   */

  mainCard: {
    backgroundColor:
      'rgba(255,255,255,0.94)',

    borderRadius: 28,

    paddingHorizontal: 16,

    paddingTop: 18,

    paddingBottom: 20,

    shadowColor: '#6973A0',

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.08,

    shadowRadius: 14,

    elevation: 3,
  },

  cardHeader: {
    minHeight: 92,

    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent:
      'space-between',
  },

  cardHeaderLeft: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    flex: 1,

    paddingRight: 82,
  },

  cardHeaderIcon: {
    width: 40,

    height: 40,

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: 7,
  },

  cardTitle: {
    fontSize: 19,

    fontWeight: '800',

    color: '#132144',

    marginTop: 1,
  },

  cardSubtitle: {
    color: '#7583A3',

    fontSize: 12,

    marginTop: 4,

    lineHeight: 17,
  },

  /*
   * PHOTO
   */

  petPhotoWrapper: {
    position: 'absolute',

    top: -7,

    right: 0,
  },

  petPhoto: {
    width: 82,

    height: 82,

    borderRadius: 20,

    backgroundColor: '#F3EDF9',

    borderWidth: 4,

    borderColor: '#FFFFFF',

    justifyContent: 'center',

    alignItems: 'center',

    shadowColor: '#776AA6',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.16,

    shadowRadius: 8,

    elevation: 4,
  },

  cameraButton: {
    position: 'absolute',

    width: 37,

    height: 37,

    borderRadius: 13,

    right: -5,

    bottom: -5,

    backgroundColor: '#8D77E9',

    borderWidth: 3,

    borderColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',
  },

  /*
   * FIELD
   */

  fieldLabel: {
    fontSize: 13,

    fontWeight: '800',

    color: '#182344',

    marginBottom: 9,
  },

  nameInputContainer: {
    height: 54,

    borderRadius: 15,

    flexDirection: 'row',

    backgroundColor: '#F5F7FC',

    marginBottom: 17,

    overflow: 'hidden',
  },

  inputIconBox: {
    width: 48,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F1F4FA',
  },

  nameInput: {
    flex: 1,

    color: '#182344',

    fontSize: 15,

    fontWeight: '600',

    paddingHorizontal: 13,
  },

  /*
   * TYPE
   */

  typeList: {
    paddingRight: 12,

    paddingBottom: 5,
  },

  typeCard: {
    width: 73,

    height: 85,

    borderRadius: 17,

    marginRight: 8,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1.5,

    borderColor: 'transparent',

    position: 'relative',
  },

  typeCardSelected: {
    borderColor: '#947CE8',
  },

  typeLabel: {
    marginTop: 7,

    fontSize: 12,

    fontWeight: '600',
  },

  typeLabelSelected: {
    fontWeight: '800',
  },

  selectedBadge: {
    position: 'absolute',

    width: 23,

    height: 23,

    borderRadius: 12,

    backgroundColor: '#9381E9',

    top: -7,

    right: -6,

    alignItems: 'center',

    justifyContent: 'center',
  },

  /*
   * PAGINATION
   */

  pagination: {
    height: 18,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 3,
  },

  paginationDot: {
    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: '#DEDDF2',

    marginHorizontal: 3,
  },

  paginationActive: {
    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: '#9784E6',
  },

  /*
   * AGE + GENDER
   */

  doubleColumn: {
    flexDirection: 'row',

    marginTop: 4,
  },

  ageSection: {
    flex: 1.08,

    paddingRight: 10,
  },

  genderSection: {
    flex: 1,
  },

  ageControls: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  ageCalendar: {
    width: 43,

    height: 52,

    backgroundColor: '#F3F6FB',

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 5,
  },

  ageButton: {
    width: 42,

    height: 52,

    borderRadius: 14,

    backgroundColor: '#F3F6FB',

    alignItems: 'center',

    justifyContent: 'center',

    marginHorizontal: 2,
  },

  ageValueBox: {
    width: 43,

    height: 52,

    borderRadius: 14,

    backgroundColor: '#F3F6FB',

    alignItems: 'center',

    justifyContent: 'center',

    marginHorizontal: 2,
  },

  ageValue: {
    color: '#14234A',

    fontSize: 17,

    fontWeight: '700',
  },

  yearText: {
    fontSize: 12,

    color: '#7482A0',

    textAlign: 'center',

    marginTop: 5,
  },

  genderRow: {
    flexDirection: 'row',
  },

  genderButton: {
    height: 52,

    borderRadius: 15,

    alignItems: 'center',

    justifyContent: 'center',

    flexDirection: 'row',

    position: 'relative',
  },

  maleButton: {
    flex: 1.15,

    backgroundColor: '#E7F4FF',

    borderWidth: 1.3,

    borderColor: '#B8DCF8',

    marginRight: 6,
  },

  maleSelected: {
    backgroundColor: '#DCEFFF',

    borderColor: '#72B7EA',
  },

  femaleButton: {
    flex: 1,

    backgroundColor: '#FFE7EC',

    borderWidth: 1.3,

    borderColor: '#F7CBD5',
  },

  femaleSelected: {
    backgroundColor: '#FFDEE6',

    borderColor: '#E99AAF',
  },

  maleText: {
    marginLeft: 5,

    color: '#3187CB',

    fontSize: 12,

    fontWeight: '800',
  },

  femaleText: {
    marginLeft: 5,

    color: '#B7536D',

    fontSize: 12,

    fontWeight: '800',
  },

  genderCheck: {
    position: 'absolute',

    right: -5,

    top: -7,

    width: 22,

    height: 22,

    borderRadius: 11,

    backgroundColor: '#5AAAE4',

    alignItems: 'center',

    justifyContent: 'center',
  },

  femaleCheck: {
    backgroundColor: '#E28BA2',
  },

  /*
   * WEIGHT
   */

  weightLabel: {
    marginTop: 17,
  },

  weightRow: {
    flexDirection: 'row',

    alignItems: 'flex-start',
  },

  weightIcon: {
    width: 43,

    height: 43,

    borderRadius: 13,

    backgroundColor: '#F2F5FA',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 8,
  },

  weightContent: {
    flex: 1,

    paddingTop: 16,

    position: 'relative',
  },

  weightBubble: {
    position: 'absolute',

    top: -22,

    minWidth: 48,

    paddingHorizontal: 8,

    height: 30,

    borderRadius: 10,

    backgroundColor: '#F3F5FB',

    justifyContent: 'center',

    alignItems: 'center',

    transform: [
      {
        translateX: -22,
      },
    ],
  },

  weightBubbleText: {
    color: '#14234A',

    fontSize: 12,

    fontWeight: '800',
  },

  slider: {
    height: 5,

    borderRadius: 5,

    backgroundColor: '#ECEBF8',

    position: 'relative',
  },

  sliderProgress: {
    position: 'absolute',

    height: 5,

    borderRadius: 5,

    backgroundColor: '#9180E6',

    left: 0,
  },

  sliderThumb: {
    position: 'absolute',

    width: 23,

    height: 23,

    borderRadius: 12,

    backgroundColor: '#8E7AE5',

    borderWidth: 3,

    borderColor: '#FFFFFF',

    top: -9,

    marginLeft: -11,

    shadowColor: '#7163C3',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.25,

    shadowRadius: 4,

    elevation: 4,
  },

  sliderTicks: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    paddingHorizontal: 2,

    marginTop: 11,
  },

  sliderTick: {
    width: 1.5,

    height: 6,

    backgroundColor: '#D7DCF0',
  },

  weightRange: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    marginTop: 5,
  },

  weightRangeText: {
    fontSize: 11,

    color: '#7080A2',

    fontWeight: '600',
  },

  /*
   * ABOUT
   */

  aboutCard: {
    backgroundColor:
      'rgba(255,255,255,0.94)',

    borderRadius: 27,

    padding: 17,

    marginTop: 12,

    shadowColor: '#6973A0',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.07,

    shadowRadius: 12,

    elevation: 3,
  },

  aboutHeader: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  aboutIcon: {
    width: 39,

    height: 39,

    borderRadius: 13,

    alignItems: 'center',

    justifyContent: 'center',
  },

  aboutTitle: {
    fontSize: 17,

    color: '#152349',

    fontWeight: '800',

    marginLeft: 5,
  },

  aboutSubtitle: {
    fontSize: 11.5,

    color: '#7785A3',

    marginTop: 3,

    marginBottom: 10,

    marginLeft: 4,
  },

  notesContainer: {
    minHeight: 103,

    backgroundColor: '#F5F7FC',

    borderRadius: 17,

    position: 'relative',
  },

  notesInput: {
    minHeight: 103,

    color: '#5E6D91',

    fontSize: 13,

    lineHeight: 20,

    textAlignVertical: 'top',

    paddingHorizontal: 14,

    paddingTop: 13,

    paddingRight: 43,
  },

  notesPencil: {
    position: 'absolute',

    right: 15,

    bottom: 15,
  },

  /*
   * SAVE BUTTON
   */

  saveButton: {
    height: 65,

    borderRadius: 32,

    marginHorizontal: 44,

    marginTop: 25,

    backgroundColor: '#8E7CE5',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: '#7766D0',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.23,

    shadowRadius: 12,

    elevation: 7,
  },

  saveButtonPressed: {
    opacity: 0.88,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  saveButtonText: {
    color: '#FFFFFF',

    fontSize: 17,

    fontWeight: '600',

    marginLeft: 12,
  },

  pressed: {
    opacity: 0.75,
  },

  bottomSpace: {
    height: 30,
  },
});