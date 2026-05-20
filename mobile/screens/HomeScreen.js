import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, SafeAreaView, StatusBar, Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Navbar */}
      <View style={styles.navbar}>
        <Image source={require('../assets/icon.png')} style={styles.logo} />
        <Text style={styles.navTitle}>GharKaPaisa</Text>
        <View style={styles.navRight} />
      </View>

      {/* Divider */}
      <View style={styles.shadow} />

      {/* Body */}
      <View style={styles.body}>
        <Image source={require('../assets/icon.png')} style={styles.centerLogo} />
        <Text style={styles.welcome}>Welcome to GharKaPaisa</Text>
        <Text style={styles.subtitle}>Please select your login type</Text>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  navTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0d47a1',
  },
  navRight: {
    width: 60,
  },
  shadow: {
    height: 2,
    backgroundColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerLogo: {
    width: 100,
    height: 100,
    borderRadius: 16,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 36,
    textAlign: 'center',
  },
  btn: {
    width: width - 48,
    backgroundColor: '#0d47a1',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 14,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
