import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Page from '../sign-in';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as Font from 'expo-font';

interface LinkProps {
  children: React.ReactNode;
  testID?: string;
}

// Mocks
jest.mock('@clerk/clerk-expo');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  Link: ({ children, testID }: LinkProps) => children,
}));
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

describe('Sign In Component', () => {
  const mockRouter = {
    replace: jest.fn(),
  };

  const mockSignIn = {
    create: jest.fn(),
    isLoaded: true,
  };

  const mockSetActive = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSignIn as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      setActive: mockSetActive,
      isLoaded: true,
    });
    (Font.isLoaded as jest.Mock).mockReturnValue(true);
  });

  it('renders sign in form correctly', async () => {
    const { getByTestId, getByText } = render(<Page />);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('continue-button')).toBeTruthy();
    expect(getByText('Don\'t have an account?')).toBeTruthy();
    expect(getByText('Sign up')).toBeTruthy();
  });

  it('handles successful sign in', async () => {
    const mockSessionId = 'test-session-id';
    mockSignIn.create.mockResolvedValueOnce({
      status: 'complete',
      createdSessionId: mockSessionId,
    });

    const { getByTestId } = render(<Page />);
    
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    
    await act(async () => {
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
    });

    await act(async () => {
      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);
    });

    await waitFor(() => {
      expect(mockSignIn.create).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        password: 'password123',
      });
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    expect(mockSetActive).toHaveBeenCalledWith({ session: mockSessionId });
    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
  });

  it('handles sign in errors', async () => {
    const mockError = {
      errors: [{
        code: 'form_identifier_not_found',
        message: 'User not found',
        longMessage: 'We couldn\'t find an account with that email. Try signing up.',
      }],
    };

    mockSignIn.create.mockRejectedValueOnce(mockError);

    const { getByTestId, findByText } = render(<Page />);
    
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    
    await act(async () => {
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
    });

    await act(async () => {
      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);
    });

    const errorMessage = await findByText('* We couldn\'t find an account with that email. Try signing up.');
    expect(errorMessage).toBeTruthy();
  });

  it('handles invalid email format', async () => {
    const mockError = {
      errors: [{
        code: 'form_param_format_invalid',
        message: 'Invalid email format',
        longMessage: 'That doesn\'t look like a valid email address.',
        meta: { paramName: 'identifier' },
      }],
    };

    mockSignIn.create.mockRejectedValueOnce(mockError);

    const { getByTestId, findByText } = render(<Page />);
    
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    
    await act(async () => {
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
    });

    await act(async () => {
      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);
    });

    const errorMessage = await findByText('* That doesn\'t look like a valid email address.');
    expect(errorMessage).toBeTruthy();
  });

  it('handles incorrect password', async () => {
    const mockError = {
      errors: [{
        code: 'form_password_incorrect',
        message: 'Incorrect password',
        longMessage: 'Incorrect Password.',
      }],
    };

    mockSignIn.create.mockRejectedValueOnce(mockError);

    const { getByTestId, findByText } = render(<Page />);
    
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    
    await act(async () => {
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
    });

    await act(async () => {
      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);
    });

    const errorMessage = await findByText('* Incorrect Password.');
    expect(errorMessage).toBeTruthy();
  });
}); 