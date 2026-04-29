import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../data/AuthContext';
import {useNavigation} from '@react-navigation/native';

export default function LoginScreen() {
  const {login} = useAuth();
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);

      if (!email || !password) {
        setError('Lütfen tüm alanları doldur');
        return;
      }

      await login(email, password);
    } catch (e: any) {
      if (e.code === 'auth/invalid-email') {
        setError('Geçersiz email adresi');
      } else if (e.code === 'auth/user-not-found') {
        setError('Kullanıcı bulunamadı');
      } else if (e.code === 'auth/wrong-password') {
        setError('Şifre yanlış');
      } else {
        setError('Giriş yapılamadı');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giriş Yap</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Pressable
        style={({pressed}) => [
          styles.button,
          pressed && {opacity: 0.85},
        ]}
        onPress={handleLogin}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Giriş Yap</Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Hesabın yok mu? Kayıt ol</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
    color: '#18181B',
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  button: {
    backgroundColor: '#6D5CE7',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6D5CE7',
    fontWeight: '600',
  },

  // 🔥 YENİ
  errorBox: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
});