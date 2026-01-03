import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView, Dimensions, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { registerRootComponent } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Mic, Send, Image as ImageIcon, Video, Brain, Settings, Cpu, ChevronRight } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// --- NEBULA ENGINE ---
const askNebula = async (prompt, apiKey) => {
  try {
    const response = await fetch("https://inference.nebulablock.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ 
        model: "claude-3-opus", 
        messages: [{ role: "user", content: prompt }] 
      }),
    });
    const data = await response.json();
    return data.choices[0]?.message?.content || "No response received.";
  } catch (e) {
    return "ERROR: Engine failed to connect. Check your API key.";
  }
};

function App() {
  const [apiKey, setApiKey] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  // Animation for the pulsing orb
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isThinking ? interpolate(pulse.value, [0, 1], [1, 1.2]) : 1 }],
    opacity: interpolate(pulse.value, [0, 1], [0.8, 1]),
  }));

  const handleSend = async () => {
    if (!input) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsThinking(true);

    const aiRes = await askNebula(userMsg, apiKey);
    setMessages(prev => [...prev, { role: 'assistant', content: aiRes }]);
    setIsThinking(false);
  };

  // --- SCREEN 1: THE SETUP (Paste Key Here) ---
  if (!isSetup) {
    return (
      <LinearGradient colors={['#050510', '#1A1A3D']} style={styles.setupContainer}>
        <Cpu color="#4285F4" size={60} />
        <Text style={styles.setupTitle}>NEBULA EDGE</Text>
        <Text style={styles.setupSub}>Enter your Claude API Key</Text>
        <TextInput 
          secureTextEntry 
          style={styles.setupInput} 
          placeholder="sk-ant-..." 
          placeholderTextColor="#444"
          value={apiKey}
          onChangeText={setApiKey}
        />
        <TouchableOpacity 
          style={styles.beginBtn} 
          onPress={() => apiKey ? setIsSetup(true) : Alert.alert("Required", "Please enter an API key")}
        >
          <Text style={styles.beginText}>INITIALIZE AI</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // --- SCREEN 2: THE MAIN AI INTERFACE ---
  return (
    <LinearGradient colors={['#050510', '#0B0B1E', '#1A1A3D']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsSetup(false)}><Settings color="#fff" size={24} /></TouchableOpacity>
          <Text style={styles.logo}>NEBULA</Text>
          <View style={styles.statusDot} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {messages.length === 0 ? (
            <View style={styles.welcomeView}>
              <Animated.View style={[styles.orb, orbStyle]}>
                <LinearGradient colors={['#4285F4', '#9B72CB', '#D96570']} style={StyleSheet.absoluteFill} />
              </Animated.View>
              <Text style={styles.greeting}>Hello, Hosam</Text>
              <View style={styles.grid}>
                <FeatureCard icon={<ImageIcon color="#9B72CB" />} label="Create Image" />
                <FeatureCard icon={<Video color="#4285F4" />} label="Create Video" />
                <FeatureCard icon={<Brain color="#D96570" />} label="Brainstorm" />
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
          <BlurView intensity={20} tint="dark" style={styles.inputArea}>
            <TextInput 
              style={styles.input} 
              placeholder="How can I help you today?" 
              placeholderTextColor="#888" 
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
              <Mic color="#fff" size={22} />
            </TouchableOpacity>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const FeatureCard = ({ icon, label }) => (
  <View style={styles.card}>
    <View style={styles.iconCircle}>{icon}</View>
    <Text style={styles.cardLabel}>{label}</Text>
    <ChevronRight color="#444" size={16} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  setupContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  setupTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 20, letterSpacing: 4 },
  setupSub: { color: '#666', marginBottom: 30 },
  setupInput: { width: '100%', backgroundColor: '#111', borderRadius: 15, padding: 20, color: '#fff', borderWidth: 1, borderColor: '#333' },
  beginBtn: { marginTop: 20, backgroundColor: '#4285F4', paddingVertical: 18, paddingHorizontal: 50, borderRadius: 35 },
  beginText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  logo: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 5 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00FF41' },
  scrollContent: { padding: 20, paddingBottom: 120 },
  welcomeView: { alignItems: 'center', marginTop: 30 },
  orb: { width: 140, height: 140, borderRadius: 70, overflow: 'hidden', elevation: 20 },
  greeting: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginVertical: 30 },
  grid: { width: '100%' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardLabel: { color: '#fff', flex: 1, fontSize: 16 },
  msgBox: { padding: 18, borderRadius: 22, marginBottom: 15, maxWidth: '85%' },
  userMsg: { alignSelf: 'flex-end', backgroundColor: '#4285F4' },
  aiMsg: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderBottomLeftRadius: 0 },
  msgText: { color: '#fff', fontSize: 16, lineHeight: 24 },
  inputArea: { flexDirection: 'row', padding: 15, margin: 20, borderRadius: 30, alignItems: 'center', position: 'absolute', bottom: 10, width: width - 40, overflow: 'hidden' },
  input: { flex: 1, color: '#fff', paddingHorizontal: 15, height: 45 },
  sendBtn: { backgroundColor: '#4285F4', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
});

registerRootComponent(App);
