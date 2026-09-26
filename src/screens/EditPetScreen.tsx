import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  Modal,
  StatusBar,
  Platform,
  Image,
} from 'react-native';

import {RouteProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

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
  CircleAlert,
  CheckCircle2,
  Trash2,
  ImagePlus,
  Activity,
  Stethoscope,
  Pill,
  ShieldAlert,
  ChevronRight,
  Clock3,
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

type PopupButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'cancel' | 'destructive';
};

type PopupIconType =
  | 'success'
  | 'error'
  | 'delete'
  | 'photo'
  | 'info';

type MenuKey = 'general' | 'health' | 'vaccines' | 'appointments';

type PetTypeOption = {
  key: string;
  label: string;
  color: string;
  iconColor: string;
  icon: React.ReactNode;
};

function getPetAge(pet: {
  birthYear?: number;
  age?: number;
}) {
  if (pet.birthYear) {
    return Math.max(
      new Date().getFullYear() - pet.birthYear,
      0,
    );
  }

  return pet.age ?? 0;
}

export default function EditPetScreen({route}: Props) {
  const routePet = route.params?.pet;

  const {pets, updatePet, removePet} = usePets();

  const navigation = useNavigation<NavigationProp>();

  // Route ile gelen pet sadece başlangıç referansı. Asıl güncel veri PetContext'ten gelir.
  // Böylece WeightHistory ekranında kilo değiştiğinde EditPet'e dönünce eski değer kalmaz.
  const contextPet = routePet
    ? pets.find(item => item.id === routePet.id)
    : undefined;

  const pet = contextPet ?? routePet;

  const [activeMenu, setActiveMenu] =
    useState<MenuKey>('general');

  const [name, setName] = useState(pet?.name || '');
  const [type, setType] = useState(pet?.type || '');
  const currentYear = new Date().getFullYear();
  const [age, setAge] = useState(String(pet ? getPetAge(pet) : 0));
  const [gender, setGender] = useState(pet?.gender || '');
  const [weight, setWeight] = useState(pet?.weight || '');
  const [vaccines] = useState(pet?.vaccines || '');
  const [lastVetVisit] = useState(pet?.lastVetVisit || '');
  const [notes, setNotes] = useState(pet?.notes || '');

  const healthPet = (pet ?? {}) as NonNullable<typeof pet> & {
    medications?: string;
    allergies?: string;
  };
const [medications, setMedications] = useState(
    healthPet.medications || '',
  );
  const [allergies, setAllergies] = useState(
    healthPet.allergies || '',
  );
const healthHistory = [    {
      id: 'vet',
      date: lastVetVisit || '18 Nisan 2026',
      title: 'Veteriner kontrolü',
      detail: 'Rutin sağlık kontrolü tamamlandı.',
      color: '#EAF4FF',
      accent: '#4F8EDB',
    },
    {
      id: 'vaccine',
      date: '02 Ocak 2026',
      title: 'Karma aşı',
      detail: 'Karma aşı kaydı oluşturuldu.',
      color: '#FFF0F4',
      accent: '#D26983',
    },
  ];

  const initialPhotoUri =
    ((pet ?? {}) as NonNullable<typeof pet> & {photoUri?: string}).photoUri || '';
  const [photoUri, setPhotoUri] = useState(initialPhotoUri);

  // WeightHistory ekranında yapılan değişiklik PetContext'e düştüğünde
  // EditPet içindeki lokal kilo state'ini de güncelle.
  useEffect(() => {
    if (pet?.weight !== undefined) {
      setWeight(String(pet.weight));
    }
  }, [pet?.weight]);

  /*
   * CUSTOM POPUP
   */

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupButtons, setPopupButtons] = useState<PopupButton[]>([]);
  const [popupIconType, setPopupIconType] = useState<PopupIconType>('info');

  const getPopupIconType = (title: string): PopupIconType => {
    const value = title.toLocaleLowerCase('tr-TR');

    if (value.includes('başarılı')) return 'success';
    if (value.includes('sil') || value.includes('profili')) return 'delete';
    if (value.includes('fotoğraf') || value.includes('kamera')) return 'photo';
    if (value.includes('hata') || value.includes('seçilemedi') || value.includes('açılamadı')) return 'error';

    return 'info';
  };

  const showPopup = (
    title: string,
    message?: string,
    buttons?: PopupButton[],
  ) => {
    setPopupTitle(title);
    setPopupMessage(message || '');
    setPopupButtons(buttons || [{text: 'Tamam'}]);
    setPopupIconType(getPopupIconType(title));
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
  };

  const handlePopupButtonPress = async (button: PopupButton) => {
    setPopupVisible(false);

    if (button.onPress) {
      await button.onPress();
    }
  };

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
   * CURRENT WEIGHT (Health > Weight History tarafından yönetilir)
   */

  const currentWeight = Number(
    String(weight)
      .replace(',', '.')
      .replace(/[^\d.]/g, ''),
  );

  const safeWeight = Number.isNaN(currentWeight)
    ? 0
    : currentWeight;


  /*
   * PHOTO
   */

  const openGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showPopup(
          'Fotoğraf seçilemedi',
          result.errorMessage ||
            'Galeriden fotoğraf seçilirken bir sorun oluştu.',
        );
        return;
      }

      const uri = result.assets?.[0]?.uri;

      if (uri) {
        setPhotoUri(uri);
      }
    } catch (error) {
      console.log('Galeri hatası:', error);
      showPopup(
        'Hata',
        'Galeriden fotoğraf seçilirken bir sorun oluştu.',
      );
    }
  };

  const openCamera = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        saveToPhotos: true,
        quality: 0.9,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showPopup(
          'Kamera açılamadı',
          result.errorMessage ||
            'Kamera açılırken bir sorun oluştu.',
        );
        return;
      }

      const uri = result.assets?.[0]?.uri;

      if (uri) {
        setPhotoUri(uri);
      }
    } catch (error) {
      console.log('Kamera hatası:', error);
      showPopup(
        'Hata',
        'Kamera açılırken bir sorun oluştu.',
      );
    }
  };

  const handlePhotoPress = () => {
    showPopup(
      'Pet Fotoğrafı',
      'Fotoğrafı nasıl eklemek istersin?',
      [
        {
          text: 'Fotoğraf Çek',
          onPress: openCamera,
        },
        {
          text: 'Galeriden Seç',
          onPress: openGallery,
        },
        ...(photoUri
          ? [
              {
                text: 'Fotoğrafı Kaldır',
                style: 'destructive' as const,
                onPress: () => setPhotoUri(''),
              },
            ]
          : []),
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
      ],
    );
  };

  /*
   * SAVE
   */

  const handleSave = async () => {
    if (!name.trim()) {
      showPopup(
        'Hata',
        'Pet adı girmeniz gerekiyor.',
      );

      return;
    }

    if (!type.trim()) {
      showPopup(
        'Hata',
        'Pet türü girmeniz gerekiyor.',
      );

      return;
    }

    if (
      !age.trim() ||
      isNaN(Number(age))
    ) {
      showPopup(
        'Hata',
        'Geçerli bir yaş girin.',
      );

      return;
    }

    try {
      await updatePet({
        ...pet,
        name: name.trim(),
        type: type.trim(),
        birthYear: Math.max(
          currentYear - Number(age),
          1900,
        ),

        // Eski kayıtlarla geçiş döneminde uyumluluk için.
        // Ekranlarda esas kaynak birthYear'dır.
        age: Number(age),

        gender: gender.trim(),
        weight: weight.trim(),
        vaccines: vaccines.trim(),
        lastVetVisit: lastVetVisit.trim(),
        notes: notes.trim(),
        medications: medications.trim(),
        allergies: allergies.trim(),
        photoUri,
      } as Parameters<typeof updatePet>[0]);

      showPopup(
        'Başarılı',
        'Pet bilgileri güncellendi.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.log('Pet güncelleme hatası:', error);

      showPopup(
        'Hata',
        'Pet bilgileri güncellenirken bir sorun oluştu.',
      );
    }
  };

  const handleDelete = () => {
    showPopup(
      'Profili Sil',
      `${pet.name} profilini silmek istediğine emin misin?`,
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePet(pet.id);

              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'MainTabs',
                    params: {
                      screen: 'Pets',
                    },
                  },
                ],
              });
            } catch (error) {
              console.log('Pet silme hatası:', error);

              showPopup(
                'Hata',
                'Pet silinirken bir sorun oluştu.',
              );
            }
          },
        },
      ],
    );
  };

  /*
   * LEFT MENU
   */

  const handleMenuPress = (
    menu: MenuKey,
  ) => {
    setActiveMenu(menu);
  };

  if (!pet) {
    return (
      <View style={[styles.screen, {alignItems: 'center', justifyContent: 'center'}]}>
        <Text style={{color: '#737D98', fontSize: 14, fontWeight: '700'}}>
          Pet bilgisi bulunamadı.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{marginTop: 14, paddingHorizontal: 18, paddingVertical: 10}}>
          <Text style={{color: '#8067E8', fontSize: 14, fontWeight: '800'}}>
            Geri Dön
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Modal
        visible={popupVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closePopup}>
        <View style={styles.popupOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closePopup}
          />

          <View style={styles.popupCard}>
            <View
              style={[
                styles.popupIconCircle,
                popupIconType === 'success' && styles.popupIconSuccess,
                popupIconType === 'error' && styles.popupIconError,
                popupIconType === 'delete' && styles.popupIconDelete,
                popupIconType === 'photo' && styles.popupIconPhoto,
                popupIconType === 'info' && styles.popupIconInfo,
              ]}>
              {popupIconType === 'success' && (
                <CheckCircle2 size={38} color="#6F5BCB" strokeWidth={2.2} />
              )}
              {popupIconType === 'error' && (
                <CircleAlert size={38} color="#D66A82" strokeWidth={2.2} />
              )}
              {popupIconType === 'delete' && (
                <Trash2 size={37} color="#D66A82" strokeWidth={2.1} />
              )}
              {popupIconType === 'photo' && (
                <ImagePlus size={37} color="#6F5BCB" strokeWidth={2.1} />
              )}
              {popupIconType === 'info' && (
                <CircleAlert size={38} color="#8067E8" strokeWidth={2.1} />
              )}
            </View>

            <Text style={styles.popupTitle}>{popupTitle}</Text>

            {!!popupMessage && (
              <Text style={styles.popupMessage}>{popupMessage}</Text>
            )}

            <View style={styles.popupButtons}>
              {popupButtons.map((button, index) => (
                <Pressable
                  key={`${button.text}-${index}`}
                  onPress={() => handlePopupButtonPress(button)}
                  style={({pressed}) => [
                    styles.popupButton,
                    button.style === 'cancel' && styles.popupCancelButton,
                    button.style === 'destructive' && styles.popupDeleteButton,
                    !button.style && styles.popupPrimaryButton,
                    pressed && styles.popupButtonPressed,
                  ]}>
                  <Text
                    style={[
                      styles.popupButtonText,
                      button.style === 'cancel' && styles.popupCancelText,
                      button.style === 'destructive' && styles.popupDeleteText,
                    ]}>
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

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
<ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }>

        {/* EDIT PROFILE HERO */}

        <View style={styles.editHero}>
          <View style={styles.editHeroTopRow}>
            <Pressable
              style={({pressed}) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={() => navigation.goBack()}>
              <ArrowLeft size={25} color="#172554" strokeWidth={2.4} />
            </Pressable>

            <Text style={styles.editHeroTitle}>Profili Düzenle</Text>

          </View>

          <View style={styles.heroProfileArea}>

            <View style={styles.heroPhotoWrapper}>
              <Pressable
                onPress={handlePhotoPress}
                style={({pressed}) => [
                  styles.heroPhoto,
                  pressed && styles.photoPressed,
                ]}>
                {photoUri ? (
                  <Image
                    source={{uri: photoUri}}
                    style={styles.heroPhotoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Cat size={68} color="#7A6B9C" strokeWidth={1.6} />
                )}
              </Pressable>

              <Pressable
                onPress={handlePhotoPress}
                hitSlop={8}
                style={({pressed}) => [
                  styles.heroCameraButton,
                  pressed && styles.cameraButtonPressed,
                ]}>
                <Camera size={21} color="#FFFFFF" strokeWidth={2.4} />
              </Pressable>
            </View>

            <Text style={styles.heroPetName}>{name || 'Pet'}</Text>

            <Text style={styles.heroPetMeta}>
              {selectedType}  |  {currentAge} yaş
              {safeWeight > 0 ? `  |  ${safeWeight} kg` : ''}
            </Text>

          </View>
        </View>

        {/* TOP NAVIGATION */}

        <View style={styles.topMenu}>
          <SideMenuButton
            active={activeMenu === 'general'}
            label="Genel"
            icon={
              <Cat
                size={21}
                color={activeMenu === 'general' ? '#8067E8' : '#7481A4'}
                strokeWidth={2.1}
              />
            }
            onPress={() => handleMenuPress('general')}
          />

          <SideMenuButton
            active={activeMenu === 'health'}
            label="Sağlık"
            icon={
              <Heart
                size={21}
                color={activeMenu === 'health' ? '#8067E8' : '#7481A4'}
                strokeWidth={2.1}
              />
            }
            onPress={() => handleMenuPress('health')}
          />

          <SideMenuButton
            active={activeMenu === 'vaccines'}
            label="Aşılar"
            icon={
              <Syringe
                size={21}
                color={activeMenu === 'vaccines' ? '#8067E8' : '#7481A4'}
                strokeWidth={2}
              />
            }
            onPress={() => handleMenuPress('vaccines')}
          />

          <SideMenuButton
            active={activeMenu === 'appointments'}
            label="Randevular"
            icon={
              <CalendarDays
                size={21}
                color={activeMenu === 'appointments' ? '#8067E8' : '#7481A4'}
                strokeWidth={2}
              />
            }
            onPress={() => handleMenuPress('appointments')}
          />
        </View>

        {/* WORKSPACE */}

        <View style={styles.workspace}>
          {activeMenu === 'general' && (
            <>

          <View style={styles.rightContent}>

            {/* BASIC INFO */}

            <View
              style={styles.mainCard}>

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

                  <View style={styles.ageStepper}>
                    <Pressable
                      onPress={decreaseAge}
                      style={({pressed}) => [
                        styles.ageStepperButton,
                        pressed && styles.ageStepperButtonPressed,
                      ]}>
                      <Minus
                        size={21}
                        color="#6F61C9"
                        strokeWidth={2.5}
                      />
                    </Pressable>

                    <View style={styles.ageInputArea}>
                      <TextInput
                        value={age}
                        onChangeText={value => {
                          const numericValue = value.replace(/[^0-9]/g, '');
                          setAge(numericValue);
                        }}
                        onBlur={() => {
                          if (!age.trim()) {
                            setAge('0');
                            return;
                          }

                          const numericAge = Math.min(
                            Math.max(Number(age), 0),
                            99,
                          );

                          setAge(String(numericAge));
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        selectTextOnFocus
                        style={styles.ageInput}
                        placeholder="0"
                        placeholderTextColor="#A7A0C8"
                      />
                      <Text style={styles.ageUnit}>yaş</Text>
                    </View>

                    <Pressable
                      onPress={increaseAge}
                      style={({pressed}) => [
                        styles.ageStepperButton,
                        pressed && styles.ageStepperButtonPressed,
                      ]}>
                      <Plus
                        size={21}
                        color="#6F61C9"
                        strokeWidth={2.5}
                      />
                    </Pressable>
                  </View>

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

            </>
          )}

          {activeMenu === 'health' && (
            <View style={styles.healthContent}>

              {/* QUICK INFO */}
              <Text style={styles.healthBlockTitle}>Hızlı Bilgiler</Text>

              <View style={styles.quickHealthRow}>
                <View style={[styles.quickHealthCard, styles.quickWeightCard]}>
                  <View style={styles.quickCardTop}>
                    <View style={[styles.quickIconBox, styles.quickWeightIcon]}>
                      <Weight size={20} color="#8067E8" strokeWidth={2.2} />
                    </View>
                    <Text style={styles.quickCardLabel}>Güncel Kilo</Text>
                  </View>

                  <View style={styles.quickValueRow}>
                    <Text style={styles.quickWeightValue}>
                      {safeWeight > 0 ? safeWeight : '—'}
                    </Text>
                    <Text style={styles.quickWeightUnit}>kg</Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      pet &&
                      navigation.navigate('WeightHistory', {
                        pet,
                      })
                    }
                    style={({pressed}) => [
                      styles.quickLink,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.quickWeightLinkText}>
                      Geçmişi Gör
                    </Text>

                    <ChevronRight
                      size={15}
                      color="#8067E8"
                      strokeWidth={2.5}
                    />
                  </Pressable>
                </View>

                <View style={[styles.quickHealthCard, styles.quickVetCard]}>
                  <View style={styles.quickCardTop}>
                    <View style={[styles.quickIconBox, styles.quickVetIcon]}>
                      <Stethoscope size={20} color="#4F8EDB" strokeWidth={2.1} />
                    </View>
                    <Text style={styles.quickCardLabel}>Son Kontrol</Text>
                  </View>

                  <Text
                    numberOfLines={2}
                    style={styles.quickVetValue}>
                    {lastVetVisit || 'Henüz eklenmedi'}
                  </Text>

                  <Pressable
                    onPress={() =>
                      showPopup(
                        'Veteriner Geçmişi',
                        'Geçmiş veteriner kontrollerini listeleyen ekranı bu alana bağlayacağız.',
                      )
                    }
                    style={({pressed}) => [
                      styles.quickLink,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.quickVetLinkText}>Kontrolleri Gör</Text>
                    <ChevronRight size={15} color="#4F8EDB" strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>

              {/* TREATMENTS */}
              <View style={[styles.healthDashboardCard, styles.treatmentCard]}>
                <View style={styles.dashboardCardHeader}>
                  <View style={[styles.dashboardIcon, styles.treatmentIcon]}>
                    <Pill size={22} color="#C87845" strokeWidth={2.2} />
                  </View>
                  <View style={styles.dashboardHeaderText}>
                    <Text style={styles.dashboardTitle}>
                      Aktif Tedaviler & İlaçlar
                    </Text>
                    <Text style={styles.dashboardSubtitle}>
                      İlaç adı, doz ve kullanım sıklığı
                    </Text>
                  </View>
                </View>

                <TextInput
                  value={medications}
                  onChangeText={setMedications}
                  multiline
                  placeholder="Örn. Vetmedin 5 mg • Sabah / Akşam"
                  placeholderTextColor="#A78976"
                  style={[styles.dashboardTextArea, styles.treatmentInput]}
                />

                <Pressable
                  onPress={() =>
                    showPopup(
                      'İlaç / Tedavi',
                      'İlaçları ayrı kayıtlar halinde ekleme akışını bu karta bağlayacağız.',
                    )
                  }
                  style={({pressed}) => [
                    styles.addTreatmentButton,
                    pressed && styles.pressed,
                  ]}>
                  <Plus size={18} color="#C87845" strokeWidth={2.4} />
                  <Text style={styles.addTreatmentText}>İlaç / Tedavi Ekle</Text>
                </Pressable>
              </View>

              {/* ALLERGIES */}
              <View style={[styles.healthDashboardCard, styles.allergyCard]}>
                <View style={styles.dashboardCardHeader}>
                  <View style={[styles.dashboardIcon, styles.allergyDashboardIcon]}>
                    <ShieldAlert size={22} color="#D26983" strokeWidth={2.1} />
                  </View>
                  <View style={styles.dashboardHeaderText}>
                    <Text style={styles.dashboardTitle}>
                      Alerjiler & Hassasiyetler
                    </Text>
                    <Text style={styles.dashboardSubtitle}>
                      Mama, ilaç veya bilinen diğer hassasiyetler
                    </Text>
                  </View>
                </View>

                <TextInput
                  value={allergies}
                  onChangeText={setAllergies}
                  multiline
                  placeholder="Örn. Tavuklu mamaya karşı hassasiyet"
                  placeholderTextColor="#A7838D"
                  style={[styles.dashboardTextArea, styles.allergyInput]}
                />
              </View>

              {/* HISTORY */}
              <View style={[styles.healthDashboardCard, styles.historyCard]}>
                <View style={styles.dashboardCardHeader}>
                  <View style={[styles.dashboardIcon, styles.historyIcon]}>
                    <Clock3 size={22} color="#B98A35" strokeWidth={2.1} />
                  </View>
                  <View style={styles.dashboardHeaderText}>
                    <Text style={styles.dashboardTitle}>Sağlık Geçmişi</Text>
                    <Text style={styles.dashboardSubtitle}>
                      Kontroller, gözlemler ve sağlık kayıtları
                    </Text>
                  </View>
                </View>

                <View style={styles.timeline}>
                  {healthHistory.map((item, index) => (
                    <View key={item.id} style={styles.timelineRow}>
                      <View style={styles.timelineRail}>
                        <View
                          style={[
                            styles.timelineDot,
                            {backgroundColor: item.accent},
                          ]}
                        />
                        {index !== healthHistory.length - 1 && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>

                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineDate}>{item.date}</Text>
                        <View
                          style={[
                            styles.timelineCard,
                            {backgroundColor: item.color},
                          ]}>
                          <Text style={styles.timelineTitle}>{item.title}</Text>
                          <Text style={styles.timelineDetail}>{item.detail}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() =>
                    showPopup(
                      'Sağlık Geçmişi',
                      'Tüm geçmiş kayıtlarını kronolojik listeleyen ekranı bu butona bağlayacağız.',
                    )
                  }
                  style={({pressed}) => [
                    styles.historyButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.historyButtonText}>Tüm Geçmişi Gör</Text>
                  <ChevronRight size={17} color="#B98A35" strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>
          )}

          {activeMenu === 'vaccines' && (
            <View style={styles.emptyTabCard}>
              <Syringe size={30} color="#8067E8" strokeWidth={2} />
              <Text style={styles.emptyTabTitle}>Aşılar</Text>
              <Text style={styles.emptyTabText}>
                Aşı yönetimi bu sekmede yer alacak.
              </Text>
            </View>
          )}

          {activeMenu === 'appointments' && (
            <View style={styles.emptyTabCard}>
              <CalendarDays size={30} color="#8067E8" strokeWidth={2} />
              <Text style={styles.emptyTabTitle}>Randevular</Text>
              <Text style={styles.emptyTabText}>
                Veteriner randevuları bu sekmede yer alacak.
              </Text>
            </View>
          )}

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
            {activeMenu === 'health'
              ? 'Sağlık Bilgilerini Kaydet'
              : 'Değişiklikleri Kaydet'}
          </Text>

        </Pressable>

        <Pressable
          onPress={handleDelete}
          style={({pressed}) => [
            styles.deleteButton,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.deleteButtonText}>
            Profili Sil
          </Text>
        </Pressable>

        {/* BOTTOM DECORATION */}
        <View
          pointerEvents="none"
          style={styles.bottomDecoration}>
          <View style={styles.bottomDecorationLeft} />
          <View style={styles.bottomDecorationRight} />
        </View>

      </ScrollView>
      </View>
    </>
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

      {icon}

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

    paddingBottom: 0,
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


  bottomDecoration: {
    height: 56,
    marginTop: -2,
    overflow: 'hidden',
    position: 'relative',
  },

  bottomDecorationLeft: {
    position: 'absolute',
    width: 250,
    height: 150,
    borderRadius: 120,
    backgroundColor: '#E9F1FF',
    top: 0,
    left: -70,
    opacity: 0.75,
  },

  bottomDecorationRight: {
    position: 'absolute',
    width: 230,
    height: 160,
    borderRadius: 120,
    backgroundColor: '#FBE6F3',
    top: 0,
    right: -80,
    opacity: 0.8,
  },

  /*
   * EDIT PROFILE HERO
   */

  editHero: {
    paddingHorizontal: 18,
    paddingTop: 35,
    paddingBottom: 8,
    position: 'relative',
  },

  editHeroTopRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63A8',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 3,
  },

  editHeroTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#152349',
    letterSpacing: -0.45,
  },

  headerSaveButton: {
    position: 'absolute',
    right: 0,
    minWidth: 102,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: '#8264EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7766D0',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  headerSaveText: {
    marginLeft: 7,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  heroProfileArea: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },

  heroPhotoWrapper: {
    width: 132,
    height: 132,
    position: 'relative',
    zIndex: 4,
  },

  heroPhoto: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#F3EDF9',
    borderWidth: 7,
    borderColor: '#D9CCFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#776AA6',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },

  heroPhotoImage: {
    width: '100%',
    height: '100%',
  },

  heroCameraButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    right: -4,
    bottom: 1,
    backgroundColor: '#7E5DEA',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  heroPetName: {
    marginTop: 13,
    color: '#132144',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  heroPetMeta: {
    marginTop: 3,
    color: '#7180A2',
    fontSize: 13.5,
    fontWeight: '600',
  },

  changePhotoButton: {
    marginTop: 13,
    height: 42,
    paddingHorizontal: 20,
    borderRadius: 21,
    backgroundColor: '#F0ECFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  changePhotoText: {
    marginLeft: 8,
    color: '#8067E8',
    fontSize: 14,
    fontWeight: '700',
  },

  heroDecorLeft: {
    position: 'absolute',
    left: 68,
    top: 42,
    transform: [{rotate: '-18deg'}],
    opacity: 0.75,
  },

  heroDecorMark: {
    color: '#7F70D8',
    fontSize: 24,
    fontWeight: '700',
  },


  photoPressed: {
    opacity: 0.88,
  },

  cameraButtonPressed: {
    opacity: 0.82,
    transform: [{scale: 0.94}],
  },

  /*
   * TOP NAVIGATION + WORKSPACE
   */

  topMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 6,
    marginBottom: 18,
    padding: 6,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ECE9F8',
    shadowColor: '#716A9A',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },

  workspace: {
    paddingHorizontal: 18,
    marginTop: 0,
  },

  sideMenuButton: {
    flex: 1,
    height: 50,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },

  sideMenuButtonActive: {
    backgroundColor: '#F0ECFF',
    borderWidth: 1,
    borderColor: '#DDD5FA',
    shadowColor: '#8777CE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },


  sideMenuLabel: {
    color: '#7481A4',
    marginLeft: 5,
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },

  sideMenuLabelActive: {
    color: '#6C5DBD',
    fontWeight: '800',
  },

  sideMenu: {
    display: 'none',
  },

  sideMenuTopGlow: {
    display: 'none',
  },

  menuConnector: {
    display: 'none',
  },

  sideMenuBottomDot: {
    display: 'none',
  },

  rightContent: {
    width: '100%',
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

    paddingRight: 0,
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

  ageSection: {
    marginTop: 4,
  },

  genderSection: {
    marginTop: 16,
  },

  ageStepper: {
    height: 62,
    width: '100%',
    borderRadius: 19,
    backgroundColor: '#F4F1FF',
    borderWidth: 1,
    borderColor: '#E6DFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
  },

  ageStepperButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E3F8',
    shadowColor: '#7766D0',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 1,
  },

  ageStepperButtonPressed: {
    opacity: 0.72,
    transform: [{scale: 0.96}],
  },

  ageInputArea: {
    flex: 1,
    height: 48,
    marginHorizontal: 8,
    borderRadius: 15,
    backgroundColor: '#ECE7FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D9CFFF',
  },

  ageInput: {
    minWidth: 36,
    maxWidth: 64,
    height: 48,
    paddingVertical: 0,
    paddingHorizontal: 3,
    color: '#372A78',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },

  ageUnit: {
    marginLeft: 2,
    color: '#786BAA',
    fontSize: 12,
    fontWeight: '700',
  },

  genderRow: {
    flexDirection: 'row',
    width: '100%',
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
    backgroundColor: '#CFEAFF',
    borderColor: '#3594DC',
    borderWidth: 2,
    shadowColor: '#3594DC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
  },

  femaleButton: {
    flex: 1,

    backgroundColor: '#FFE7EC',

    borderWidth: 1.3,

    borderColor: '#F7CBD5',
  },

  femaleSelected: {
      backgroundColor: '#FFD6E0',
      borderColor: '#D96B89',
      borderWidth: 2,
      shadowColor: '#D96B89',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.18,
      shadowRadius: 7,
      elevation: 3,
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
   * HEALTH TAB
   */

  healthContent: {
    width: '100%',
  },

  healthBlockTitle: {
    marginLeft: 3,
    marginBottom: 10,
    color: '#172348',
    fontSize: 16,
    fontWeight: '800',
  },

  quickHealthRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  quickHealthCard: {
    flex: 1,
    minHeight: 160,
    borderRadius: 23,
    padding: 14,
    borderWidth: 1,
  },

  quickWeightCard: {
    backgroundColor: '#F0ECFF',
    borderColor: '#E0D7FF',
  },

  quickVetCard: {
    backgroundColor: '#EAF4FF',
    borderColor: '#D4E7FB',
  },

  quickCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  quickIconBox: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  quickWeightIcon: {
    backgroundColor: '#E2DAFF',
  },

  quickVetIcon: {
    backgroundColor: '#D8EBFF',
  },

  quickCardLabel: {
    flex: 1,
    color: '#253455',
    fontSize: 11.5,
    fontWeight: '800',
  },

  quickValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 17,
  },

  quickWeightValue: {
    color: '#4C3C9B',
    fontSize: 28,
    fontWeight: '800',
  },

  quickWeightUnit: {
    marginLeft: 4,
    color: '#7568A8',
    fontSize: 12,
    fontWeight: '700',
  },

  quickVetValue: {
    minHeight: 43,
    marginTop: 16,
    color: '#345C8D',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },

  quickLink: {
    marginTop: 'auto',
    paddingTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  quickWeightLinkText: {
    color: '#8067E8',
    fontSize: 11,
    fontWeight: '800',
  },

  quickVetLinkText: {
    color: '#4F8EDB',
    fontSize: 11,
    fontWeight: '800',
  },

  healthDashboardCard: {
    borderRadius: 25,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#6973A0',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  treatmentCard: {
    backgroundColor: '#FFF1E7',
    borderColor: '#F5DDCC',
  },

  allergyCard: {
    backgroundColor: '#FFF0F4',
    borderColor: '#F3D8DF',
  },

  historyCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F2E6C7',
  },

  dashboardCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  dashboardIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  treatmentIcon: {
    backgroundColor: '#FFE3CF',
  },

  allergyDashboardIcon: {
    backgroundColor: '#FFDEE6',
  },

  historyIcon: {
    backgroundColor: '#FFF0C9',
  },

  dashboardHeaderText: {
    flex: 1,
  },

  dashboardTitle: {
    color: '#172348',
    fontSize: 15,
    fontWeight: '800',
  },

  dashboardSubtitle: {
    marginTop: 3,
    color: '#7E8294',
    fontSize: 11.2,
    lineHeight: 16,
    fontWeight: '500',
  },

  dashboardTextArea: {
    minHeight: 88,
    borderRadius: 17,
    borderWidth: 1,
    color: '#4C5265',
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '500',
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },

  treatmentInput: {
    backgroundColor: '#FFF8F3',
    borderColor: '#F2D8C6',
  },

  allergyInput: {
    backgroundColor: '#FFF8FA',
    borderColor: '#F1D5DD',
  },

  addTreatmentButton: {
    height: 47,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1.3,
    borderStyle: 'dashed',
    borderColor: '#D99A70',
    backgroundColor: 'rgba(255,255,255,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addTreatmentText: {
    marginLeft: 7,
    color: '#B66A3D',
    fontSize: 12.5,
    fontWeight: '800',
  },

  timeline: {
    marginTop: 2,
  },

  timelineRow: {
    flexDirection: 'row',
    minHeight: 88,
  },

  timelineRail: {
    width: 22,
    alignItems: 'center',
  },

  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 7,
    zIndex: 2,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#DED7C4',
    marginTop: 2,
    marginBottom: -2,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 7,
    paddingBottom: 11,
  },

  timelineDate: {
    color: '#8B7A50',
    fontSize: 10.5,
    fontWeight: '800',
    marginBottom: 5,
  },

  timelineCard: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(160,140,100,0.10)',
  },

  timelineTitle: {
    color: '#30364B',
    fontSize: 12.5,
    fontWeight: '800',
  },

  timelineDetail: {
    marginTop: 3,
    color: '#737887',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },

  historyButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFF1C9',
    borderWidth: 1,
    borderColor: '#EAD79E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },

  historyButtonText: {
    color: '#9A742F',
    fontSize: 12.5,
    fontWeight: '800',
    marginRight: 4,
  },

  emptyTabCard: {
    minHeight: 190,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#ECE9F8',
  },

  emptyTabTitle: {
    marginTop: 12,
    color: '#172348',
    fontSize: 18,
    fontWeight: '800',
  },

  emptyTabText: {
    marginTop: 6,
    color: '#7D89A6',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
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

  deleteButton: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  deleteButtonText: {
    color: '#D65C72',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },

  /*
   * CUSTOM POPUPS
   */

  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 22, 50, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  popupCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FAF9FF',
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E4F7',
    shadowColor: '#312A78',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 20,
  },

  popupIconCircle: {
    width: 82,
    height: 82,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
    borderWidth: 1,
  },

  popupIconSuccess: {
    backgroundColor: '#F0EBFF',
    borderColor: '#DED4FA',
  },

  popupIconError: {
    backgroundColor: '#FFF0F3',
    borderColor: '#F6D4DC',
  },

  popupIconDelete: {
    backgroundColor: '#FFF0F3',
    borderColor: '#F4D0D9',
  },

  popupIconPhoto: {
    backgroundColor: '#EEF1FF',
    borderColor: '#D8DDF8',
  },

  popupIconInfo: {
    backgroundColor: '#F0EBFF',
    borderColor: '#DED4FA',
  },

  popupTitle: {
    color: '#11163A',
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'Quicksand-Bold',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  popupMessage: {
    color: '#737D98',
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: 'Quicksand-Medium',
    textAlign: 'center',
    paddingHorizontal: 5,
    marginBottom: 20,
  },

  popupButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 9,
  },

  popupButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  popupPrimaryButton: {
    backgroundColor: '#927CE8',
    borderWidth: 1,
    borderColor: '#856DE0',
    shadowColor: '#7257FF',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  popupCancelButton: {
    backgroundColor: '#EDE9FA',
    borderWidth: 1,
    borderColor: '#DDD6F1',
  },

  popupDeleteButton: {
    backgroundColor: '#D96F86',
    borderWidth: 1,
    borderColor: '#CC6179',
  },

  popupButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },

  popupCancelText: {
    color: '#6F6490',
  },

  popupDeleteText: {
    color: '#FFFFFF',
  },

  popupButtonPressed: {
    opacity: 0.82,
    transform: [{scale: 0.98}],
  },

});



