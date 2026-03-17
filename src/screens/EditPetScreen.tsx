import React, {useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {usePets} from '../data/PetContext';

type EditPetRouteProp = RouteProp<RootStackParamList, 'EditPet'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditPet'>;

type Props = {
  route: EditPetRouteProp;
};

export default function EditPetScreen({route}: Props) {
  const {pet} = route.params;
  const {updatePet} = usePets();
  const navigation = useNavigation<NavigationProp>();

  const [name, setName] = useState(pet.name);
  const [type, setType] = useState(pet.type);
  const [age, setAge] = useState(String(pet.age));
  const [gender, setGender] = useState(pet.gender || '');
  const [weight, setWeight] = useState(pet.weight || '');
  const [vaccines, setVaccines] = useState(pet.vaccines || '');
  const [lastVetVisit, setLastVetVisit] = useState(pet.lastVetVisit || '');
  const [notes, setNotes] = useState(pet.notes || '');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Pet adı girmeniz gerekiyor.');
      return;
    }

    if (!type.trim()) {
      Alert.alert('Hata', 'Pet türü girmeniz gerekiyor.');
      return;
    }

    if (!age.trim() || isNaN(Number(age))) {
      Alert.alert('Hata', 'Geçerli bir yaş girin.');
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
      lastVetVisit: lastVetVisit.trim(),
      notes: notes.trim(),
    });

    Alert.alert('Başarılı', 'Pet bilgileri güncellendi.');
    navigation.goBack();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>🩷</Text>
        <Text style={styles.heroTitle}>Edit Pet</Text>
        <Text style={styles.heroSubtitle}>
          Pet bilgilerini düzenleyerek bakım detaylarını güncel tut.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Temel Bilgiler</Text>

        <Text style={styles.label}>Pet Adı</Text>
        <TextInput
          style={styles.input}
          placeholder="Pet adı"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Tür</Text>
        <TextInput
          style={styles.input}
          placeholder="Tür"
          placeholderTextColor="#9CA3AF"
          value={type}
          onChangeText={setType}
        />

        <Text style={styles.label}>Yaş</Text>
        <TextInput
          style={styles.input}
          placeholder="Yaş"
          placeholderTextColor="#9CA3AF"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Cinsiyet</Text>
        <TextInput
          style={styles.input}
          placeholder="Cinsiyet"
          placeholderTextColor="#9CA3AF"
          value={gender}
          onChangeText={setGender}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Sağlık Bilgileri</Text>

        <Text style={styles.label}>Kilo</Text>
        <TextInput
          style={styles.input}
          placeholder="Kilo"
          placeholderTextColor="#9CA3AF"
          value={weight}
          onChangeText={setWeight}
        />

        <Text style={styles.label}>Aşılar</Text>
        <TextInput
          style={styles.input}
          placeholder="Aşılar"
          placeholderTextColor="#9CA3AF"
          value={vaccines}
          onChangeText={setVaccines}
        />

        <Text style={styles.label}>Son veteriner ziyareti</Text>
        <TextInput
          style={styles.input}
          placeholder="Son veteriner ziyareti"
          placeholderTextColor="#9CA3AF"
          value={lastVetVisit}
          onChangeText={setLastVetVisit}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Ek Notlar</Text>

        <Text style={styles.label}>Notlar</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Notlar"
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Değişiklikleri Kaydet</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#F8FAFC',
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
});