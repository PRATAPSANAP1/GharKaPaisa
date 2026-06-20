import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Text } from 'react-native';

export default function LogoLoader({ text = "Loading..." }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animSequence = Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1, // smoothly rotate to 90 degrees
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0, // snap back to 0 degrees instantly
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.delay(400), // hold at 0 degrees before repeating
    ]);

    Animated.loop(animSequence).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg']
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/icon.png')}
        style={[styles.logo, { transform: [{ rotate: spin }] }]}
      />
      {text ? <Text style={styles.text}>{text}</Text> : null}
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
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  text: {
    marginTop: 24,
    fontSize: 15,
    fontWeight: '600',
    color: '#0d47a1',
    letterSpacing: 0.5,
  }
});
