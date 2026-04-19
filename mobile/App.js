import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { api } from './src/api';
import { createIdentity, derivePasswordVerifier } from './src/crypto/identity';
import { decryptEnvelope, encryptEnvelope } from './src/crypto/e2ee';
import { clearSession, loadIdentity, loadSession, saveIdentity, saveSession } from './src/storage/secureStore';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#081019' },
  container: { flex: 1, padding: 16, gap: 12 },
  card: { backgroundColor: '#12202d', borderRadius: 16, padding: 16, marginBottom: 12 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#96acc2', marginBottom: 12 },
  input: { backgroundColor: '#091521', color: '#fff', padding: 12, borderRadius: 12, marginBottom: 10 },
  button: { backgroundColor: '#2cd1a1', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  secondaryButton: { backgroundColor: '#1d3044' },
  buttonText: { color: '#041119', fontWeight: '700' },
  buttonTextLight: { color: '#fff', fontWeight: '700' },
  messageCard: { backgroundColor: '#0d1721', padding: 12, borderRadius: 12, marginBottom: 8 },
  text: { color: '#fff' },
  muted: { color: '#96acc2' }
});

export default function App() {
  const [mode, setMode] = useState('login');
  const [session, setSessionState] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [form, setForm] = useState({ displayName: '', email: '', password: '', to: '', subject: '', body: '' });
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      const saved = await loadSession();
      if (saved) {
        setSessionState(saved);
      }
    })();
  }, []);

  async function register() {
    try {
      const newIdentity = await createIdentity('Expo Mobile');
      const passwordVerifier = await derivePasswordVerifier(form.email, form.password);
      const response = await api.register({
        email: form.email,
        displayName: form.displayName,
        passwordVerifier,
        deviceId: newIdentity.deviceId,
        deviceName: newIdentity.deviceName,
        publicEncryptionKey: newIdentity.publicEncryptionKey,
        publicSigningKey: newIdentity.publicSigningKey,
        fingerprint: newIdentity.fingerprint
      });
      await saveIdentity(form.email, newIdentity);
      await saveSession(response);
      setIdentity(newIdentity);
      setSessionState(response);
      Alert.alert('Sucesso', 'Conta criada com chaves privadas salvas apenas no dispositivo.');
      await refreshInbox(response.accessToken);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  async function login() {
    try {
      const passwordVerifier = await derivePasswordVerifier(form.email, form.password);
      const response = await api.login({ email: form.email, passwordVerifier });
      const localIdentity = await loadIdentity(form.email);
      if (!localIdentity) {
        throw new Error('Este dispositivo não possui a chave privada desta conta.');
      }
      await saveSession(response);
      setIdentity(localIdentity);
      setSessionState(response);
      await refreshInbox(response.accessToken);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  async function refreshInbox(accessToken = session?.accessToken) {
    if (!accessToken) return;
    try {
      const response = await api.inbox(accessToken);
      setMessages(response.items);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  async function sendMessage() {
    try {
      const keyDirectory = await api.keysByEmail(session.accessToken, form.to);
      const recipientKey = keyDirectory.keys[0];
      const envelope = encryptEnvelope({
        subject: form.subject,
        body: form.body,
        recipientKey,
        senderIdentity: identity
      });
      await api.sendMessage(session.accessToken, { to: form.to, envelope });
      setForm((prev) => ({ ...prev, to: '', subject: '', body: '' }));
      Alert.alert('Sucesso', 'Mensagem enviada com E2EE.');
      await refreshInbox();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  async function openMessage(item) {
    try {
      const response = await api.messageById(session.accessToken, item.id);
      const senderKeys = await api.keysByEmail(session.accessToken, response.item.sender_email);
      const senderKey = senderKeys.keys.find((key) => key.device_id === response.item.envelope.senderDeviceId) || senderKeys.keys[0];
      const plaintext = decryptEnvelope({
        envelope: response.item.envelope,
        privateEncryptionKey: identity.privateEncryptionKey,
        senderPublicSigningKey: senderKey.public_signing_key
      });
      setSelected({
        from: response.item.sender_name || response.item.sender_email,
        sentAt: new Date(response.item.sent_at).toLocaleString(),
        ...plaintext
      });
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  async function logout() {
    try {
      await api.logout({ refreshToken: session.refreshToken });
    } catch {
      // noop
    }
    await clearSession();
    setSessionState(null);
    setIdentity(null);
    setMessages([]);
    setSelected(null);
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>br-email</Text>
            <Text style={styles.subtitle}>Privacidade extrema com criptografia ponta a ponta e zero-knowledge.</Text>
            {mode === 'register' ? (
              <TextInput style={styles.input} placeholder="Nome" placeholderTextColor="#96acc2" value={form.displayName} onChangeText={(v) => setForm({ ...form, displayName: v })} />
            ) : null}
            <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#96acc2" autoCapitalize="none" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
            <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#96acc2" secureTextEntry value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} />
            <TouchableOpacity style={styles.button} onPress={mode === 'login' ? login : register}><Text style={styles.buttonText}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}><Text style={styles.buttonTextLight}>{mode === 'login' ? 'Ir para cadastro' : 'Ir para login'}</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Caixa de entrada</Text>
          <Text style={styles.subtitle}>{session.user.email}</Text>
          <TouchableOpacity style={styles.button} onPress={() => refreshInbox()}><Text style={styles.buttonText}>Atualizar</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={logout}><Text style={styles.buttonTextLight}>Sair</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={[styles.text, { fontWeight: '700', marginBottom: 8 }]}>Nova mensagem</Text>
          <TextInput style={styles.input} placeholder="Para" placeholderTextColor="#96acc2" autoCapitalize="none" value={form.to} onChangeText={(v) => setForm({ ...form, to: v })} />
          <TextInput style={styles.input} placeholder="Assunto" placeholderTextColor="#96acc2" value={form.subject} onChangeText={(v) => setForm({ ...form, subject: v })} />
          <TextInput style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]} multiline placeholder="Mensagem" placeholderTextColor="#96acc2" value={form.body} onChangeText={(v) => setForm({ ...form, body: v })} />
          <TouchableOpacity style={styles.button} onPress={sendMessage}><Text style={styles.buttonText}>Enviar com E2EE</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={[styles.text, { fontWeight: '700', marginBottom: 8 }]}>Mensagens</Text>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.messageCard} onPress={() => openMessage(item)}>
                <Text style={styles.text}>{item.sender_name || item.sender_email}</Text>
                <Text style={styles.muted}>{item.subject_hint}</Text>
                <Text style={styles.muted}>{new Date(item.sent_at).toLocaleString()}</Text>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>

        {selected ? (
          <View style={styles.card}>
            <Text style={styles.title}>{selected.subject}</Text>
            <Text style={styles.subtitle}>De {selected.from} • {selected.sentAt}</Text>
            <Text style={styles.text}>{selected.body}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
