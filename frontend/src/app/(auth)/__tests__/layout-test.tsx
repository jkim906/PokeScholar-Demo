import React from 'react';
import { render } from '@testing-library/react-native';
import AuthRoutesLayout from '../_layout';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

interface ClerkProviderProps {
  children: React.ReactNode;
}

// Mock React Native components
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
}));

// Mock URL polyfill
jest.mock('react-native-url-polyfill', () => ({
  setupURLPolyfill: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
  ClerkProvider: ({ children }: ClerkProviderProps) => children,
}));

// Mock expo-router
jest.mock('expo-router', () => {
  const mockRedirect = jest.fn();
  const mockStack = jest.fn();

  return {
    Redirect: mockRedirect,
    Stack: mockStack,
    __esModule: true,
  };
});

describe('Auth Routes Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Stack when user is not signed in', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isSignedIn: false,
    });

    render(<AuthRoutesLayout />);
    
    expect(Stack).toHaveBeenCalledWith(
      expect.objectContaining({
        screenOptions: { headerShown: false },
      }),
      expect.any(Object)
    );
    expect(Redirect).not.toHaveBeenCalled();
  });

  it('redirects to home when user is signed in', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isSignedIn: true,
    });

    render(<AuthRoutesLayout />);
    
    expect(Redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        href: '/home',
      }),
      expect.any(Object)
    );
    expect(Stack).not.toHaveBeenCalled();
  });
}); 