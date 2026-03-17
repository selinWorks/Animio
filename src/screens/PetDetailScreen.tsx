import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {usePets} from '../data/PetContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PetDetail'>;
type PetDetailRouteProp = RouteProp<RootStackParamList, 'PetDetail'>;

type PetDetailScreenProps = {
  route: PetDetailRouteProp;
};

export default function PetDetailScreen({route}: PetDetailScreenProps) {
  const {pet} = route.params;
  const navigation = useNavigation<NavigationProp>();
  const {removePet} = usePets();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const getPetEmoji = (type: string) => {
    const lowerType = type.toLowerCase();

    if (lowerType.includes('kedi')) {
      return '🐱';
    }
    if (lowerType.includes('köpek') || lowerType.includes('kopek')) {
      return '🐶';
    }
    if (lowerType.includes('kuş') || lowerType.includes('kus')) {
      return '🐦';
    }
    if (lowerType.includes('balık') || lowerType.includes('balik')) {
      return '🐠';
    }

    return '🐾';
  };

  const handleDelete = () => {
    removePet(pet.id);
    setDeleteModalVisible(false);
    navigation.goBack();
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getPetEmoji(pet.type)}</Text>
          </View>

          <Text style={styles.title}>{pet.name}</Text>
          <Text style={styles.subtitle}>{pet.type}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{pet.age} yaş</Text>
            </View>

            <View style={styles.metaBadgeSecondary}>
              <Text style={styles.metaBadgeSecondaryText}>
                {pet.gender || 'Cinsiyet yok'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Tür</Text>
            <Text style={styles.value}>{pet.type}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Yaş</Text>
            <Text style={styles.value}>{pet.age}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Cinsiyet</Text>
            <Text style={styles.value}>{pet.gender || 'Belirtilmedi'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Kilo</Text>
            <Text style={styles.value}>{pet.weight || 'Belirtilmedi'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sağlık Bilgileri</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Aşılar</Text>
            <Text style={styles.value}>{pet.vaccines || 'Belirtilmedi'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Son Veteriner Ziyareti</Text>
            <Text style={styles.value}>{pet.lastVetVisit || 'Belirtilmedi'}</Text>
          </View>
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Notlar</Text>
          <Text style={styles.notesValue}>{pet.notes || 'Not yok'}</Text>
        </View>

        <Pressable
          style={styles.editButton}
          onPress={() => navigation.navigate('EditPet', {pet})}>
          <Text style={styles.editButtonText}>Pet'i Düzenle</Text>
        </Pressable>

        <Pressable
          style={styles.deleteButton}
          onPress={() => setDeleteModalVisible(true)}>
          <Text style={styles.deleteButtonText}>Pet'i Sil</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🩷</Text>
            <Text style={styles.modalTitle}>Peti Sil</Text>
            <Text style={styles.modalText}>
              {pet.name} adlı peti silmek istediğine emin misin?
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </Pressable>

              <Pressable style={styles.confirmButton} onPress={handleDelete}>
                <Text style={styles.confirmButtonText}>Sil</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#F8FAFC',
  },
  heroCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 34,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 14,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaBadge: {
    backgroundColor: '#C7D2FE',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  metaBadgeSecondary: {
    backgroundColor: '#FCE7F3',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  metaBadgeText: {
    color: '#4338CA',
    fontSize: 13,
    fontWeight: '700',
  },
  metaBadgeSecondaryText: {
    color: '#BE185D',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    elevation: 2,
    marginBottom: 16,
  },
  notesCard: {
    backgroundColor: '#FCE7F3',
    borderRadius: 20,
    padding: 18,
    elevation: 2,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    marginTop: 10,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    lineHeight: 22,
  },
  notesValue: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 23,
  },
  editButton: {
    backgroundColor: '#A5B4FC',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FECACA',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  deleteButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 6,
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '700',
  },
});