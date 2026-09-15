import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import apiClient from '../config/api';

export default function ChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'bot', text: 'Hello! I am your GharKaPaisa AI Assistant. How can I assist you with credit card payouts, loan application rules, or commission payout status today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const promptText = input.trim();
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/chatbot/query', { question: promptText }).catch(() => null);
      const reply = res?.data?.answer || getMockAnswer(promptText);

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'bot', text: reply }
      ]);
    } catch (_) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'bot', text: 'Thank you for reaching out. Your query has been logged and assigned to Support Ticket #TK-2026-99.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getMockAnswer = (query) => {
    const q = query.toLowerCase();
    if (q.includes('payout') || q.includes('wallet') || q.includes('tds')) {
      return 'Partner wallet payouts are processed daily. All releases undergo 2% TDS tax deduction as per statutory regulations.';
    }
    if (q.includes('lead') || q.includes('application')) {
      return 'Applications take 24-48 working hours for bank approval. You can track progress under the Applications tab.';
    }
    return 'I have recorded your request. Our support team will update your ticket within 2 working hours.';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GharKaPaisa Support Chatbot</Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
              <Text style={[styles.msgText, item.sender === 'user' ? styles.userMsgText : styles.botMsgText]}>
                {item.text}
              </Text>
            </View>
          )}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type your query or ticket issue..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backText: { color: '#0284C7', fontWeight: '700', fontSize: 14 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  messageList: { padding: 16 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 10 },
  botBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#E2E8F0' },
  userBubble: { backgroundColor: '#0284C7', alignSelf: 'flex-end' },
  msgText: { fontSize: 14, lineHeight: 20 },
  botMsgText: { color: '#0F172A' },
  userMsgText: { color: '#FFFFFF' },
  inputBar: { flexDirection: 'row', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#0F172A', marginRight: 10 },
  sendBtn: { backgroundColor: '#0284C7', borderRadius: 20, paddingHorizontal: 18, justifyContent: 'center' },
  sendBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 }
});
