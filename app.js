import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView, Dimensions, KeyboardAvoidingView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Send, Image as ImageIcon, Video, Brain, Settings, X, Cpu } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// --- 1. NEBULA ENGINE (API LOGIC) ---
const askNebula = async (prompt, apiKey) => {
  try {
    const response = await fetch("https://inference.nebulablock.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "claude-3-opus", messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    return data.choices[0]?.message?.content || "No response from Nebula.";
  } catch (e) { return "CONNECTION_ERROR: Check API key."; }
};

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showConsole, setShowConsole] = useState(false);

  // --- 2. ANIMATION LOGIC (THE ORB) ---
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isThinking ? interpolate(pulse.value, [0, 1], [1, 1.2]) : 1 }],
    opacity: interpolate(pulse.value, [0, 1], [0.7, 1]),
    shadowRadius: interpolate(pulse.value, [0, 1], [10, 30]),
  }));

  const handleSend = async () => {
    if (!input || !apiKey) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsThinking(true);

    const aiRes = await askNebula(userMsg, apiKey);
    setMessages(prev => [...prev, { role: 'assistant', content: aiRes }]);
    setIsThinking(false);
  };

  // --- 3. UI COMPONENTS ---
  if (!isSetup) {
    return (
      <LinearGradient colors={['#050510', '#1A1A3D']} style={styles.setupContainer}>
        <Cpu color="#4285F4" size={60} strokeWidth={1} />
        <Text style={styles.setupTitle}>NEBULA EDGE SETUP</Text>
        <Text style={styles.setupSub}>Paste your Claude API Key to begin</Text>
        <TextInput 
          secureTextEntry 
          style={styles.setupInput} 
          placeholder="sk-ant-..." 
          placeholderTextColor="#444"
          onChangeText={setApiKey}
        />
        <TouchableOpacity style={styles.beginBtn} onPress={() => setIsSetup(true)}>
          <Text style={styles.beginText}>INITIALIZE KERNEL</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#050510', '#0B0B1E', '#1A1A3D']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowConsole(!showConsole)}>
            <Settings color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.logo}>NEBULA</Text>
          <View style={styles.statusDot} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {messages.length === 0 ? (
            <View style={styles.welcomeView}>
              <Animated.View style={[styles.orb, orbStyle]}>
                <LinearGradient colors={['#4285F4', '#9B72CB', '#D96570']} style={StyleSheet.absoluteFill} />
              </Animated.View>
              <Text style={styles.greeting}>Hello, Explorer</Text>
              <View style={styles.grid}>
                <FeatureCard icon={<ImageIcon color="#9B72CB" />} label="Image" />
                <FeatureCard icon={<Video color="#4285F4" />} label="Video" />
                <FeatureCard icon={<Brain color="#D96570" />} label="Think" />
              </View>
            </View>
          ) : (
            messages.map((m, i) => (
              <View key={i} style={[styles.msgBox, m.role === 'user' ? styles.userMsg : styles.aiMsg]}>
                <Text style={styles.msgText}>{m.content}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} 
              placeholder="Ask anything..." 
              placeholderTextColor="#666" 
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
              <Send color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const FeatureCard = ({ icon, label }) => (
  <View style={styles.card}>
    {icon}
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  setupContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  setupTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 20, letterSpacing: 3 },
  setupSub: { color: '#666', marginBottom: 30 },
  setupInput: { width: '100%', backgroundColor: '#111', borderRadius: 12, padding: 20, color: '#fff', borderWidth: 1, borderColor: '#333' },
  beginBtn: { marginTop: 20, backgroundColor: '#4285F4', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  beginText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  logo: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 5 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00FF41' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  welcomeView: { alignItems: 'center', marginTop: 40 },
  orb: { width: 150, height: 150, borderRadius: 75, overflow: 'hidden', shadowColor: '#9B72CB', shadowOpacity: 1, elevation: 20 },
  greeting: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 40 },
  grid: { flexDirection: 'row', gap: 15 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 20, alignItems: 'center', width: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardLabel: { color: '#fff', marginTop: 10, fontSize: 12 },
  msgBox: { padding: 15, borderRadius: 20, marginBottom: 15, maxWidth: '85%' },
  userMsg: { alignSelf: 'flex-end', backgroundColor: '#4285F4' },
  aiMsg: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)' },
  msgText: { color: '#fff', lineHeight: 22 },
  inputWrapper: { flexDirection: 'row', padding: 15, backgroundColor: '#0B0B1E', borderTopWidth: 1, borderColor: '#333' },
  input: { flex: 1, color: '#fff', backgroundColor: '#1A1A3D', borderRadius: 25, paddingHorizontal: 20, height: 50 },
  sendBtn: { backgroundColor: '#9B72CB', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});
