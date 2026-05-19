import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>GharKaPaisa</Text>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login', { role: 'Admin' })}>
        <Text style={styles.btnText}>Admin Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login', { role: 'Employee' })}>
        <Text style={styles.btnText}>Employee Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login', { role: 'Agent' })}>
        <Text style={styles.btnText}>Agent Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 40,
  },
  btn: {
    width: '100%',
    backgroundColor: '#0d47a1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 14,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
