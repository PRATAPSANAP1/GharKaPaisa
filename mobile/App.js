import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import WorkingHoursNotice from './components/WorkingHoursNotice';

import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import PartnerDashboardScreen from './screens/PartnerDashboardScreen';
import PartnerKycScreen from './screens/PartnerKycScreen';
import SuperAdminDashboardScreen from './screens/SuperAdminDashboardScreen';
import ProductsScreen from './screens/ProductsScreen';
import ApplicationsScreen from './screens/ApplicationsScreen';
import TeamManagementScreen from './screens/TeamManagementScreen';
import WalletScreen from './screens/WalletScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function MainNavigator() {
  const { workingHoursNotice, closeWorkingHoursNotice } = useAuth();

  return (
    <>
      <NavigationContainer>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
            contentStyle: { backgroundColor: '#F8FAFC' }
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Dashboard" component={PartnerDashboardScreen} />
          <Stack.Screen name="PartnerDashboard" component={PartnerDashboardScreen} />
          <Stack.Screen name="PartnerKyc" component={PartnerKycScreen} />
          <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboardScreen} />
          <Stack.Screen name="Products" component={ProductsScreen} />
          <Stack.Screen name="Applications" component={ApplicationsScreen} />
          <Stack.Screen name="TeamManagement" component={TeamManagementScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Global Working Hours Restriction Modal */}
      <WorkingHoursNotice
        visible={workingHoursNotice?.isRestricted}
        noticeMessage={workingHoursNotice?.message}
        onClose={closeWorkingHoursNotice}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}
