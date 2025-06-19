import React from 'react';
   import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
   import Home from '../home';
   import { useUser } from '@clerk/clerk-react';
   import { NavigationContainer } from '@react-navigation/native';
   import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
   import { completeSession } from '../../../api/sessionHandler';
   import { useAppState } from '../../../hooks/useAppState';

   // Mocking
   jest.mock('@clerk/clerk-react');
   jest.mock('../../../hooks/useAppState');

   jest.mock('expo-notifications', () => ({
     requestPermissionsAsync: jest.fn(),
   }));

   jest.mock('expo-font', () => ({
     loadAsync: jest.fn(),
     isLoaded: jest.fn().mockReturnValue(true),
     isLoading: jest.fn().mockReturnValue(false),
   }));

   jest.useFakeTimers(); // Mock timers

   // Setup tab navigator for test
   const Tab = createBottomTabNavigator();

   describe('Home Component', () => {

     const mockUser = {
         id: '123',
         firstName: 'John',
         lastName: 'Doe',
         email: 'john.doe@example.com',
         levelInfo: {
           level: 2,
           coins: 100,
           experience: 180,
           isLevelUp: false,
           nextLevelExperience: 200,
           levelUpCoins: 10,
         },
       };

     beforeEach(() => {
         jest.clearAllMocks();
         jest.clearAllTimers(); // Reset timers
         // Mock useUser hook
         (useUser as jest.Mock).mockReturnValue({
           user: mockUser,
           isSignedIn: true,
         });

         (useAppState as jest.Mock).mockReturnValue({
           refreshAllData: jest.fn(),
         });
     });

     it('renders the timer and START SESSION button correctly', () => {
       const { getByText } = render(
         <NavigationContainer>
           <Tab.Navigator>
             <Tab.Screen name="Home" component={Home} />
           </Tab.Navigator>
         </NavigationContainer>
       );

       expect(getByText('25:00')).toBeTruthy();
       expect(getByText(/START/i)).toBeTruthy();
     });

     it('shows cancel popup when cancel is pressed during session', async () => {
       const { getByText } = render(
         <NavigationContainer>
           <Tab.Navigator>
             <Tab.Screen name="Home" component={Home} />
           </Tab.Navigator>
         </NavigationContainer>
       );

       // Start the session
       await act(async () => {
         fireEvent.press(getByText(/START/i));
       });

       // Wait for session state to change and check the progress message
       await waitFor(() => {
         expect(getByText(/Session in progress/i)).toBeTruthy();
       });

       // Trigger cancel
       await act(async () => {
         fireEvent.press(getByText(/CANCEL/i));
       });

       // Check if the cancel popup appears
       expect(getByText(/Cancel Session\?/i)).toBeTruthy();

     });

     it('should start the countdown when session starts and stop when session completes', async () => {
         const { getByText, findByText } = render(
               <NavigationContainer>
                 <Tab.Navigator>
                   <Tab.Screen name="Home" component={Home} />
                 </Tab.Navigator>
               </NavigationContainer>
             );

           fireEvent.press(getByText(/START/i));
           expect(getByText('25:00')).toBeTruthy();

           // Advance 1 second and check for 24:59
           await act(async () => {
             jest.advanceTimersByTime(1000);
           });
           expect(await findByText(/24:59/)).toBeTruthy();

           // Fast forward to end of session
           await act(async () => {
             jest.advanceTimersByTime(25 * 60 * 1000); // 25 minutes
           });

           expect(await findByText('00:00')).toBeTruthy();

       });

     it('displays reward popup after timer ends', async () => {
         const { getByText, findByText } = render(
                   <NavigationContainer>
                     <Tab.Navigator>
                       <Tab.Screen name="Home" component={Home} />
                     </Tab.Navigator>
                   </NavigationContainer>
                 );
       fireEvent.press(getByText(/START/i));

       act(() => {
         jest.advanceTimersByTime(25 * 60 * 1000); // fast-forward timer
       });

       await waitFor(() => {
         expect(getByText(/SESSION COMPLETE/i)).toBeTruthy();
       });
     });

     it('resets timer when session is cancelled', async () => {
         const { getByText, queryByText } = render(
                       <NavigationContainer>
                         <Tab.Navigator>
                           <Tab.Screen name="Home" component={Home} />
                         </Tab.Navigator>
                       </NavigationContainer>
                     );
       fireEvent.press(getByText(/START/i));

       act(() => {
         jest.advanceTimersByTime(10000); // fast forward 10s
       });

       fireEvent.press(getByText(/cancel/i));
       fireEvent.press(getByText(/yes, cancel/i));

       expect(queryByText(/SESSION IN PROGRESS/i)).toBeNull();
       expect(getByText(/25:00/)).toBeTruthy();
     });

     it('shows cooldown after claiming reward', async () => {
       const { getByText, queryByText, getByTestId } = render(
                           <NavigationContainer>
                             <Tab.Navigator>
                               <Tab.Screen name="Home" component={Home} />
                             </Tab.Navigator>
                           </NavigationContainer>
                         );
       fireEvent.press(getByText(/START/i));

       act(() => {
         jest.advanceTimersByTime(25 * 60 * 1000);
       });

       await waitFor(() => {
         fireEvent.press(getByTestId("claimButton"));
       });

       expect(getByText(/cooldown/i)).toBeTruthy();
     });

//      it('shows level up UI after session completes with level up', async () => {
//              const { getByText, queryByText, getByTestId } = render(
//                                  <NavigationContainer>
//                                    <Tab.Navigator>
//                                      <Tab.Screen name="Home" component={Home} />
//                                    </Tab.Navigator>
//                                  </NavigationContainer>
//                                );
//
//          // Start session
//          fireEvent.press(getByText(/start session/i));
//
//          // Fast-forward 25 minutes
//          act(() => {
//            jest.advanceTimersByTime(25 * 60 * 1000);
//          });
//
//          // Claim reward
//          await waitFor(() => fireEvent.press(getByText(/claim reward/i)));
//
//         await waitFor(() => {
//               // You can check for a specific Animated component
//               const progressAnimView = getByTestId('progressBar');
//               const levelUpAnimView = getByTestId('levelUpText');
//
//               expect(progressAnimView).toBeTruthy();
//               expect(levelUpAnimView).toBeTruthy();
//
//             });

});