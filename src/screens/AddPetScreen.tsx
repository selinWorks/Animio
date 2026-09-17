import React, {useState} from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import {launchImageLibrary} from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  PawPrint,
  Cake,
  Scale,
  Syringe,
  Calendar,
  FileText,
  Sparkles,
} from 'lucide-react-native';

import {usePets} from '../data/PetContext';
import {addPetToFirestore} from '../services/firestore';

const PET_TYPES = [
  {
    name: 'Kedi',
    image: require('../assets/images/pets/cat-side-pose.png'),
    bgGradient: ['#E6E0FF', '#D6CBFF'],
    badgeColor: '#7C3AED',
  },
  {
    name: 'Köpek',
    image: require('../assets/images/pets/dog-open-eyes.png'),
    bgGradient: ['#FFE4E6', '#FECDD3'],
    badgeColor: '#FF7675',
  },
  {
    name: 'Kuş',
    image: require('../assets/images/pets/bird-soft.png'),
    bgGradient: ['#FEF3C7', '#FDE68A'],
    badgeColor: '#FDCB6E',
  },
  {
    name: 'Diğer',
    image: null,
    bgGradient: ['#D1FAE5', '#A7F3D0'],
    badgeColor: '#00B894',
  },
];

const GENDERS = [
  {label: 'Dişi'},
  {label: 'Erkek'},
];

export default function AddPetScreen({navigation}: any) {
  const {addPet} = usePets();

  const [step, setStep] = useState(1);
  const [photoUrl, setPhotoUrl] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Kedi');
  const [customType, setCustomType] = useState('');
  const [age, setAge] = useState('');
  const [ageUnit, setAgeUnit] = useState<'Yaş' | 'Yıl'>('Yıl');
  const [gender, setGender] = useState('Dişi');
  const [weight, setWeight] = useState('');
  const [vaccines, setVaccines] = useState('');
  const [lastVetVisit, setLastVetVisit] = useState('');
  const [notes, setNotes] = useState('');

  const choosePhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel || result.errorCode) return;
    const uri = result.assets?.[0]?.uri;
    if (uri) setPhotoUrl(uri);
  };

  const goNextFromStepOne = () => {
    if (!name.trim()) return Alert.alert('Eksik bilgi', 'Dostunun adını gir.');
    if (!type) return Alert.alert('Eksik bilgi', 'Bir tür seç.');
    if (type === 'Diğer' && !customType.trim()) return Alert.alert('Eksik bilgi', 'Türü yaz.');
    setStep(2);
  };

  const goNextFromStepTwo = () => {
    if (!age.trim() || isNaN(Number(age))) return Alert.alert('Eksik bilgi', 'Geçerli bir yaş gir.');
    if (!gender) return Alert.alert('Eksik bilgi', 'Cinsiyet seç.');
    setStep(3);
  };

  const resetForm = () => {
    setStep(1);
    setPhotoUrl('');
    setName('');
    setType('Kedi');
    setCustomType('');
    setAge('');
    setGender('Dişi');
    setWeight('');
    setVaccines('');
    setLastVetVisit('');
    setNotes('');
  };

  const handleSave = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) return Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');

    try {
      const finalType = type === 'Diğer' ? customType.trim() : type;
      const petData = {
        name: name.trim(),
        type: finalType,
        age: Number(age),
        gender,
        weight: weight.trim(),
        vaccines: vaccines.trim(),
        lastVetVisit: lastVetVisit.trim(),
        notes: notes.trim(),
        photoUrl,
      };

      const id = await addPetToFirestore(petData, currentUser.uid);
      addPet({id, ...petData});

      Alert.alert('Başarılı', 'Dostun başarıyla eklendi.', [
        {text: 'Tamam', onPress: resetForm},
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Pet Firestore’a kaydedilemedi.');
    }
  };

  return (
    <LinearGradient
      colors={['#F5EFFE', '#FAFAFF', '#F1E9FF']}
      style={styles.screen}>

      {/* Yıldız & Pati Parıltıları */}
      <View style={[styles.decorSparkle, {top: 80, left: 30}]}>
        <Sparkles size={18} color="#D8B4FE" />
      </View>
      <View style={[styles.decorSparkle, {top: 130, right: 28}]}>
        <PawPrint size={16} color="#E9D5FF" />
      </View>
      <View style={[styles.decorSparkle, {top: 220, right: 35}]}>
        <Sparkles size={22} color="#DDD6FE" />
      </View>
      <View style={[styles.decorSparkle, {top: 260, left: 24}]}>
        <PawPrint size={18} color="#E9D5FF" />
      </View>


      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => (step > 1 ? setStep(step - 1) : navigation?.goBack?.())}>
          <ArrowLeft size={22} color="#1E2022" />
        </Pressable>
        <Text style={styles.headerTitle}>Dost Ekle</Text>
        <Text style={styles.stepText}>{step} / 3</Text>
      </View>

      {/* Timeline İlerleme Çubuğu */}
      <View style={styles.timelineTrack}>
        <View style={styles.timelineBaseLine} />
        <View style={[styles.timelineActiveLine, {width: `${((step - 1) / 2) * 100}%`}]} />

        <View style={[styles.timelineDot, step >= 1 && styles.timelineDotActive]}>
          <View style={[styles.timelineDotInner, step >= 1 && styles.timelineDotInnerActive]} />
        </View>

        <View style={[styles.timelineDot, step >= 2 && styles.timelineDotActive]}>
          <View style={[styles.timelineDotInner, step >= 2 && styles.timelineDotInnerActive]} />
        </View>

        <View style={[styles.timelineDot, step >= 3 && styles.timelineDotActive]}>
          <View style={[styles.timelineDotInner, step >= 3 && styles.timelineDotInnerActive]} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <View style={styles.photoSection}>
              <View style={styles.photoGlowOuter}>
                <Pressable style={styles.dashedCircle} onPress={choosePhoto}>
                  {photoUrl ? (
                    <Image source={{uri: photoUrl}} style={styles.photo} />
                  ) : (
                    <PawPrint size={44} color="#6C5CE7" strokeWidth={1.5} />
                  )}
                  <LinearGradient
                    colors={['#6C5CE7', '#4F46E5']}
                    style={styles.cameraBadge}>
                    <Camera size={14} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              </View>
              <Text style={styles.photoTitle}>Fotoğraf ekle</Text>
            </View>

            <Text style={styles.label}>Dostunun adı</Text>
            <View style={styles.inputGlowBox}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Örn. Luna"
                placeholderTextColor="#A0A5B5"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Türünü seç</Text>
            <View style={styles.typeGrid}>
              {PET_TYPES.map(item => {
                const selected = type === item.name;
                return (
                  <Pressable
                    key={item.name}
                    onPress={() => setType(item.name)}
                    style={styles.typeCardWrapper}>
                    <LinearGradient
                      colors={item.bgGradient}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={[
                        styles.typeCard,
                        selected && styles.typeCardSelected,
                      ]}>
                      {item.image ? (
                        <Image source={item.image} style={styles.petCharacter} resizeMode="contain" />
                      ) : (
                        <PawPrint size={30} color="#2D3436" />
                      )}
                      <Text style={styles.typeText}>{item.name}</Text>

                      {selected ? (
                        <LinearGradient
                          colors={['#6C5CE7', '#4F46E5']}
                          style={styles.checkBadgeSelected}>
                          <Check size={11} color="#FFFFFF" strokeWidth={3} />
                        </LinearGradient>
                      ) : (
                        <View style={styles.checkBadgeUnselected} />
                      )}
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>

            {type === 'Diğer' && (
              <View style={[styles.inputGlowBox, styles.customTypeMargin]}>
                <TextInput
                  value={customType}
                  onChangeText={setCustomType}
                  placeholder="Türünü yaz"
                  placeholderTextColor="#A0A5B5"
                  style={styles.input}
                />
              </View>
            )}

            <Pressable style={styles.mainButtonTouch} onPress={goNextFromStepOne}>
              <LinearGradient
                colors={['#6C5CE7', '#4F46E5']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.mainButton}>
                <Text style={styles.mainButtonText}>Devam Et</Text>
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </Pressable>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>Dostunun bilgileri</Text>
            <Text style={styles.sectionSubtitle}>
              Birkaç temel bilgi daha ekleyelim.
            </Text>

            <View style={styles.previewCard}>
              <View style={styles.previewIconCircle}>
                <PawPrint size={22} color="#6C5CE7" />
              </View>
              <View>
                <Text style={styles.previewName}>{name || 'Luna'}</Text>
                <Text style={styles.previewType}>
                  {type === 'Diğer' ? customType || 'Kedi' : type}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Yaşı</Text>
            <View style={styles.ageInputContainer}>
              <Cake size={20} color="#6C5CE7" style={styles.ageIcon} />
              <TextInput
                value={age}
                onChangeText={text => setAge(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#A0A5B5"
                style={styles.ageInput}
              />
              <View style={styles.unitChipGroup}>
                <Pressable
                  onPress={() => setAgeUnit('Yaş')}
                  style={[styles.unitChip, ageUnit === 'Yaş' && styles.unitChipSelected]}>
                  <Text style={[styles.unitChipText, ageUnit === 'Yaş' && styles.unitChipTextSelected]}>
                    Yaş
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAgeUnit('Yıl')}
                  style={[styles.unitChip, ageUnit === 'Yıl' && styles.unitChipSelected]}>
                  <Text style={[styles.unitChipText, ageUnit === 'Yıl' && styles.unitChipTextSelected]}>
                    Yıl
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.label}>Cinsiyeti</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(item => {
                const selected = gender === item.label;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => setGender(item.label)}
                    style={[
                      styles.genderButton,
                      selected && styles.genderButtonSelected,
                    ]}>
                    <Text style={[styles.genderText, selected && styles.genderTextSelected]}>
                      {item.label}
                    </Text>
                    {selected && (
                      <View style={styles.genderCheckBadge}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.mainButtonTouch} onPress={goNextFromStepTwo}>
              <LinearGradient
                colors={['#6C5CE7', '#4F46E5']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.mainButton}>
                <Text style={styles.mainButtonText}>Devam Et</Text>
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </Pressable>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <Text style={styles.sectionTitle}>Sağlık bilgileri</Text>
            <Text style={styles.sectionSubtitle}>
              Dostunun sağlık bilgilerini kaydet.
            </Text>

            <Text style={styles.label}>Kilosu</Text>
            <View style={styles.iconInputRow}>
              <View style={[styles.iconCircle, {backgroundColor: '#FFE8DB'}]}>
                <Scale size={22} color="#FF7A00" />
              </View>
              <View style={styles.inputBoxWithBadge}>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Örn. 4"
                  placeholderTextColor="#A0A5B5"
                  keyboardType="numeric"
                  style={styles.innerInput}
                />
                <View style={styles.unitBadge}>
                  <Text style={styles.unitBadgeText}>kg</Text>
                </View>
              </View>
            </View>

            <Text style={styles.label}>Aşıları</Text>
            <View style={styles.iconInputRow}>
              <View style={[styles.iconCircle, {backgroundColor: '#FFE2E8'}]}>
                <Syringe size={22} color="#FF527B" />
              </View>
              <View style={styles.inputBox}>
                <TextInput
                  value={vaccines}
                  onChangeText={setVaccines}
                  placeholder="Örn. Karma, kuduz"
                  placeholderTextColor="#A0A5B5"
                  style={styles.innerInput}
                />
              </View>
            </View>

            <Text style={styles.label}>Son veteriner ziyareti</Text>
            <View style={styles.iconInputRow}>
              <View style={[styles.iconCircle, {backgroundColor: '#E0F2FE'}]}>
                <Calendar size={22} color="#0EA5E9" />
              </View>
              <View style={styles.inputBox}>
                <TextInput
                  value={lastVetVisit}
                  onChangeText={setLastVetVisit}
                  placeholder="Örn. 18 Nisan 2026"
                  placeholderTextColor="#A0A5B5"
                  style={styles.innerInput}
                />
              </View>
            </View>

            <Text style={styles.label}>Notlar</Text>
            <View style={styles.iconInputRowTop}>
              <View style={[styles.iconCircle, {backgroundColor: '#DCFCE7'}]}>
                <FileText size={22} color="#16A34A" />
              </View>
              <View style={[styles.inputBox, styles.notesInputBox]}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Eklemek istediğin notlar..."
                  placeholderTextColor="#A0A5B5"
                  multiline
                  style={styles.notesInnerInput}
                />
              </View>
            </View>

            <Pressable style={styles.mainButtonTouch} onPress={handleSave}>
              <LinearGradient
                colors={['#6C5CE7', '#4F46E5']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Dostu Kaydet</Text>
                <PawPrint size={20} color="#FFFFFF" strokeWidth={2.2} />
              </LinearGradient>
            </Pressable>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },
  decorSparkle: {
    position: 'absolute',
    zIndex: 1,
    opacity: 0.8,
  },
  header: {
    height: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1E2022',
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
  },
  stepText: {
    color: '#6C5CE7',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },
  timelineTrack: {
    height: 24,
    marginHorizontal: 24,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  timelineBaseLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#E2E5ED',
    borderRadius: 2,
  },
  timelineActiveLine: {
    position: 'absolute',
    left: 0,
    height: 3,
    backgroundColor: '#6C5CE7',
    borderRadius: 2,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E5ED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: '#C4B5FD',
    shadowColor: '#6C5CE7',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  timelineDotInnerActive: {
    backgroundColor: '#6C5CE7',
  },
  photoSection: {
    alignItems: 'center',
    marginVertical: 14,
  },
  photoGlowOuter: {
    padding: 6,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  dashedCircle: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    resizeMode: 'cover',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#6C5CE7',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  photoTitle: {
    color: '#2D3436',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    marginTop: 10,
  },
  label: {
    color: '#1E2022',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    marginTop: 14,
    marginBottom: 8,
  },
  inputGlowBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E5FF',
    shadowColor: '#6C5CE7',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    color: '#1E2022',
    fontSize: 15,
    fontFamily: 'Quicksand-Regular',
  },
  customTypeMargin: {
    marginTop: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  typeCardWrapper: {
    width: '48%',
    borderRadius: 22,
  },
  typeCard: {
    height: 82,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#6C5CE7',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  typeCardSelected: {
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  petCharacter: {
    width: 46,
    height: 46,
  },
  typeText: {
    color: '#2D3436',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    marginLeft: 8,
  },
  checkBadgeUnselected: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  checkBadgeSelected: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  mainButtonTouch: {
    marginTop: 26,
    borderRadius: 24,
    shadowColor: '#6C5CE7',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  mainButton: {
    width: '100%',
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  sectionTitle: {
    color: '#1E2022',
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    marginTop: 8,
  },
  sectionSubtitle: {
    color: '#858B9B',
    fontSize: 13,
    fontFamily: 'Quicksand-Regular',
    marginTop: 4,
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 8,
  },
  previewIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  previewName: {
    color: '#1E2022',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  previewType: {
    color: '#858B9B',
    fontSize: 13,
    fontFamily: 'Quicksand-Regular',
    marginTop: 2,
  },
  ageInputContainer: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E5ED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  ageIcon: {
    marginRight: 10,
  },
  ageInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#1E2022',
  },
  unitChipGroup: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F6',
    borderRadius: 14,
    padding: 3,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unitChipSelected: {
    backgroundColor: '#CBD2E1',
  },
  unitChipText: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    color: '#858B9B',
  },
  unitChipTextSelected: {
    color: '#1E2022',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    height: 54,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E5ED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  genderButtonSelected: {
    backgroundColor: '#EEF0FF',
    borderColor: '#6C5CE7',
  },
  genderText: {
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    color: '#2D3436',
  },
  genderTextSelected: {
    color: '#6C5CE7',
  },
  genderCheckBadge: {
    position: 'absolute',
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconInputRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    flex: 1,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  inputBoxWithBadge: {
    flex: 1,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 18,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  innerInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Quicksand-Regular',
    color: '#1E2022',
  },
  unitBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  unitBadgeText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
    color: '#475569',
  },
  notesInputBox: {
    height: 96,
    paddingTop: 12,
    paddingBottom: 12,
  },
  notesInnerInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Quicksand-Regular',
    color: '#1E2022',
    textAlignVertical: 'top',
  },
  saveButton: {
    width: '100%',
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Quicksand-Bold',
  },
});