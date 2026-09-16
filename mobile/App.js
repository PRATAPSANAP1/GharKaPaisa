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
import EmployeeDashboardScreen from './screens/EmployeeDashboardScreen';
import CustomerTrackingScreen from './screens/CustomerTrackingScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import AuditLogsScreen from './screens/AuditLogsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ContactScreen from './screens/ContactScreen';
import CareersScreen from './screens/CareersScreen';
import PolicyScreen from './screens/PolicyScreen';
import CategoryProductsScreen from './screens/CategoryProductsScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import PartnerResourcesScreen from './screens/PartnerResourcesScreen';
import EmployeeToolsScreen from './screens/EmployeeToolsScreen';
import HrDashboardScreen from './screens/HrDashboardScreen';

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
          <Stack.Screen name="Contact" component={ContactScreen} />
          <Stack.Screen name="Careers" component={CareersScreen} />
          <Stack.Screen name="Policy" component={PolicyScreen} />
          <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="PartnerResources" component={PartnerResourcesScreen} />
          <Stack.Screen name="EmployeeTools" component={EmployeeToolsScreen} />
          <Stack.Screen name="HrDashboard" component={HrDashboardScreen} />
          <Stack.Screen name="Dashboard" component={PartnerDashboardScreen} />
          <Stack.Screen name="PartnerDashboard" component={PartnerDashboardScreen} />
          <Stack.Screen name="PartnerKyc" component={PartnerKycScreen} />
          <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboardScreen} />
          <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboardScreen} />
          <Stack.Screen name="CustomerTracking" component={CustomerTrackingScreen} />
          <Stack.Screen name="Chatbot" component={ChatbotScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
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
