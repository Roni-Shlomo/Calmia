import { Platform } from 'react-native';

export const API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:6001'
    : 'http://192.168.68.115:6001';