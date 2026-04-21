import React, {useState} from 'react';
import {
  ScrollView,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  Alert,
  View,
} from 'react-native';
import {usePets} from '../data/PetContext';
import {Pet} from '../types/Pet';
import {addPetToFirestore} from '../services/firestore';

const PET_TYPES = ['Kedi', 'Köpek', 'Kuş', 'Balık', 'Küçük Hayvan', 'Diğer'];
const SMALL_PET_TYPES = ['Hamster', 'Tavşan', 'Kaplumbağa'];

export default function AddPetScreen() {
  const {addPet} = usePets();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [smallPetType, setSmallPetType] = useState('');
  const [customType, setCustomType] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [vaccines, setVaccines] = useState('');
  const [lastVetVisit, setLastVetVisit] = useState('');
  const [notes, setNotes] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const resetForm = () => {
    setName('');
    setType('');
    setSmallPetType('');
    setCustomType('');
    setAge('');
    setGender('');
    setWeight('');
    setVaccines('');
    setLastVetVisit('');
    setNotes('');
  };

  const getFinalType = () => {
    if (type === 'Küçük Hayvan') {
      return smallPetType.trim();
    }

    if (type === 'Diğer') {
      return customType.trim();
    }

    return type.trim();
  };

  const handleAdd = async () => {
    const finalType = getFinalType();

    if (!name.trim()) {
      Alert.alert('Hata', 'Pet adı girmeniz gerekiyor.');
      return;
    }

    if (!type.trim()) {
      Alert.alert('Hata', 'Pet türü seçmeniz gerekiyor.');
      return;
    }

    if (type === 'Küçük Hayvan' && !smallPetType.trim()) {
      Alert.alert('Hata', 'Küçük hayvan türünü seçmeniz gerekiyor.');
      return;
    }

    if (type === 'Diğer' && !customType.trim()) {
      Alert.alert('Hata', 'Lütfen hayvan türünü yazın.');
      return;
    }

    if (!age.trim() || isNaN(Number(age))) {
      Alert.alert('Hata', 'Geçerli bir yaş girin.');
      return;
    }

    try {
      const petData = {
        name: name.trim(),
        type: finalType,
        age: Number(age),
        gender: gender.trim(),
        weight: weight.trim(),
        vaccines: vaccines.trim(),
        lastVetVisit: lastVetVisit.trim(),
        notes: notes.trim(),
      };

      const firestoreId = await addPetToFirestore(petData);

      const newPet: Pet = {
        id: firestoreId,
        ...petData,
      };

      addPet(newPet);
      resetForm();

      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
      }, 2500);
    } catch (error) {
      console.log('Pet eklenirken hata:', error);
      Alert.alert('Hata', 'Pet Firestore’a kaydedilemedi.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🫧</Text>
          <Text style={styles.heroTitle}>Add New Pet</Text>
          <Text style={styles.heroSubtitle}>
            Yeni pet bilgilerini ekleyerek bakım takibini başlat.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>

          <Text style={styles.label}>Pet Adı</Text>
          <TextInput
            placeholder="Örn. Luna"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>Tür</Text>
          <View style={styles.optionRow}>
            {PET_TYPES.map(option => (
              <Pressable
                key={option}
                style={[
                  styles.optionButton,
                  type === option && styles.optionButtonActive,
                ]}
                onPress={() => {
                  setType(option);
                  setSmallPetType('');
                  setCustomType('');
                }}>
                <Text
                  style={[
                    styles.optionText,
                    type === option && styles.optionTextActive,
                  ]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          {type === 'Küçük Hayvan' ? (
            <>
              <Text style={styles.subLabel}>Küçük hayvan türü</Text>
              <View style={styles.subOptionRow}>
                {SMALL_PET_TYPES.map(option => (
                  <Pressable
                    key={option}
                    style={[
                      styles.subOptionButton,
                      smallPetType === option && styles.subOptionButtonActive,
                    ]}
                    onPress={() => setSmallPetType(option)}>
                    <Text
                      style={[
                        styles.subOptionText,
                        smallPetType === option &&
                        styles.subOptionTextActive,
                      ]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {type === 'Diğer' ? (
            <>
              <Text style={styles.subLabel}>Türü yaz</Text>
              <TextInput
                placeholder="Örn. İguana"
                placeholderTextColor="#9CA3AF"
                value={customType}
                onChangeText={setCustomType}
                style={styles.input}
              />
            </>
          ) : null}

          <Text style={styles.label}>Yaş</Text>
          <View style={styles.stepperContainer}>
            <Pressable
              style={styles.stepperButton}
              onPress={() => {
                const currentAge = Number(age) || 0;
                if (currentAge > 0) {
                  setAge(String(currentAge - 1));
                }
              }}>
              <Text style={styles.stepperButtonText}>−</Text>
            </Pressable>

            <TextInput
              value={age}
              onChangeText={text => {
                const numeric = text.replace(/[^0-9]/g, '');
                setAge(numeric);
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              style={styles.stepperInput}
            />

            <Pressable
              style={styles.stepperButton}
              onPress={() => {
                const currentAge = Number(age) || 0;
                setAge(String(currentAge + 1));
              }}>
              <Text style={styles.stepperButtonText}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Cinsiyet</Text>
          <View style={styles.optionRow}>
            {['Dişi', 'Erkek'].map(option => (
              <Pressable
                key={option}
                style={[
                  styles.optionButton,
                  gender === option && styles.optionButtonActive,
                ]}
                onPress={() => setGender(option)}>
                <Text
                  style={[
                    styles.optionText,
                    gender === option && styles.optionTextActive,
                  ]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sağlık Bilgileri</Text>

          <Text style={styles.label}>Kilo</Text>
          <TextInput
            placeholder="Örn. 4 kg"
            placeholderTextColor="#9CA3AF"
            value={weight}
            onChangeText={setWeight}
            style={styles.input}
          />

          <Text style={styles.label}>Aşılar</Text>
          <TextInput
            placeholder="Örn. Karma, kuduz"
            placeholderTextColor="#9CA3AF"
            value={vaccines}
            onChangeText={setVaccines}
            style={styles.input}
          />

          <Text style={styles.label}>Son Veteriner Ziyareti</Text>
          <TextInput
            placeholder="Örn. 12 Mayıs 2026"
            placeholderTextColor="#9CA3AF"
            value={lastVetVisit}
            onChangeText={setLastVetVisit}
            style={styles.input}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ek Notlar</Text>

          <Text style={styles.label}>Notlar</Text>
          <TextInput
            placeholder="Petinle ilgili ekstra bilgileri buraya ekleyebilirsin..."
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.notesInput]}
            multiline
          />
        </View>

        <Pressable style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>Pet Ekle</Text>
        </Pressable>
      </ScrollView>

      {toastVisible ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Pet başarıyla eklendi 🐾</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: '#FCE7F3',
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  heroEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 4,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#818CF8',
    marginBottom: 8,
    marginTop: -2,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#A5B4FC',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
  },
  optionButtonActive: {
    backgroundColor: '#A5B4FC',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  subOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  subOptionButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
  },
  subOptionButtonActive: {
    backgroundColor: '#6366F1',
  },
  subOptionText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  subOptionTextActive: {
    color: '#FFFFFF',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
  },
  stepperInput: {
    flex: 1,
    height: 48,
    marginHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: '#A5B4FC',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});