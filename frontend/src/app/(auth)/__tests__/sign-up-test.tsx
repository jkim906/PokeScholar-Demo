import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Page from '../sign-up';
import { useSignUp } from '@clerk/clerk-expo';
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

describe('Sign Up Component', () => {
  const mockRouter = {
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockSignUp = {
    create: jest.fn(),
    prepareEmailAddressVerification: jest.fn(),
    attemptEmailAddressVerification: jest.fn(),
    isLoaded: true,
  };

  const mockSetActive = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSignUp as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      setActive: mockSetActive,
      isLoaded: true,
    });
    (Font.isLoaded as jest.Mock).mockReturnValue(true);
  });

  it('renders sign up form correctly', async () => {
    const { getByTestId, getByText } = render(<Page />);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('continue-button')).toBeTruthy();
    expect(getByText('Already have an account?')).toBeTruthy();
    expect(getByText('Sign in')).toBeTruthy();
  });

  it('handles successful sign up', async () => {
    mockSignUp.create.mockResolvedValueOnce({
      status: 'needs_email_verification',
    });

    mockSignUp.prepareEmailAddressVerification.mockResolvedValueOnce({
      status: 'complete',
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
      expect(mockSignUp.create).toHaveBeenCalledWith({
        emailAddress: 'test@example.com',
        password: 'password123',
        username: '',
      });
    });

    await waitFor(() => {
      expect(mockSignUp.prepareEmailAddressVerification).toHaveBeenCalledWith({
        strategy: 'email_code',
      });
    });

    // Verify that setActive is not called during initial sign-up
    expect(mockSetActive).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('handles email verification', async () => {
    mockSignUp.create.mockResolvedValueOnce({
      status: 'needs_email_verification',
    });

    mockSignUp.prepareEmailAddressVerification.mockResolvedValueOnce({
      status: 'complete',
    });

    mockSignUp.attemptEmailAddressVerification.mockResolvedValueOnce({
      status: 'complete',
      createdSessionId: 'test-session-id',
    });

    const { getByTestId, getByText } = render(<Page />);
    
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
      expect(mockSignUp.prepareEmailAddressVerification).toHaveBeenCalled();
    });

    const verificationCode = '123456';
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        const input = getByTestId(`verification-input-${i}`);
        fireEvent.changeText(input, verificationCode[i]);
      });
    }

    await act(async () => {
      const verifyButton = getByText('Verify Email');
      fireEvent.press(verifyButton);
    });

    await waitFor(() => {
      expect(mockSignUp.attemptEmailAddressVerification).toHaveBeenCalledWith({
        code: verificationCode,
      });
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    expect(mockSetActive).toHaveBeenCalledWith({ session: 'test-session-id' });
    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
  });

  it('handles sign up errors', async () => {
    const mockError = {
      errors: [{
        code: 'form_identifier_exists',
        message: 'Email already exists',
        longMessage: 'An account with this email already exists.',
      }],
    };

    mockSignUp.create.mockRejectedValueOnce(mockError);

    const { getByTestId, findByText } = render(<Page />);
    
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    
    await act(async () => {
      fireEvent.changeText(emailInput, 'existing@example.com');
      fireEvent.changeText(passwordInput, 'password123');
    });

    await act(async () => {
      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);
    });

    const errorMessage = await findByText('* An account with this email already exists.');
    expect(errorMessage).toBeTruthy();
  });

  it('handles verification errors', async () => {
    mockSignUp.create.mockResolvedValueOnce({
      status: 'needs_email_verification',
    });

    mockSignUp.prepareEmailAddressVerification.mockResolvedValueOnce({
      status: 'complete',
    });

    const mockError = {
      errors: [{
        code: 'form_code_incorrect',
        message: 'Invalid verification code',
        longMessage: 'The verification code is incorrect.',
      }],
    };

    mockSignUp.attemptEmailAddressVerification.mockRejectedValueOnce(mockError);

    const { getByTestId, getByText, findByText } = render(<Page />);
    
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
      expect(mockSignUp.prepareEmailAddressVerification).toHaveBeenCalled();
    });

    const verificationCode = '123456';
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        const input = getByTestId(`verification-input-${i}`);
        fireEvent.changeText(input, verificationCode[i]);
      });
    }

    await act(async () => {
      const verifyButton = getByText('Verify Email');
      fireEvent.press(verifyButton);
    });

    const errorMessage = await findByText('* The verification code is incorrect.');
    expect(errorMessage).toBeTruthy();
  });

  it('handles back button navigation', async () => {
    const { getByTestId } = render(<Page />);
    
    await act(async () => {
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);
    });

    expect(mockRouter.back).toHaveBeenCalled();
  });
}); 