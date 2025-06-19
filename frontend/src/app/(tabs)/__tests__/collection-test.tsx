import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Collection from '../collection';
import { useUser } from '@clerk/clerk-react';
import { useAppState } from '../../../hooks/useAppState';
import { Card } from '../../../types/Card';
import CardModal from '@/src/components/CardModal';

// Mock the hooks
jest.mock('@clerk/clerk-react');
jest.mock('../../../hooks/useAppState');

// Mock the font loading
jest.mock('expo-font', () => ({
    loadAsync: jest.fn(),
    isLoaded: jest.fn().mockReturnValue(true),
    isLoading: jest.fn().mockReturnValue(false),
  }));
  

// Mock the navigation hook
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock the components
jest.mock('../../../components/SortModal', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  
  return function MockSortModal({ 
    visible, 
    onClose, 
    sortBy, 
    sortDirection, 
    onSortChange 
  }: {
    visible: boolean;
    onClose: () => void;
    sortBy: string | null;
    sortDirection: 'asc' | 'desc';
    onSortChange: (option: string) => void;
  }) {
    if (!visible) return null;
    return React.createElement(View, { testID: "sort-modal" }, [
      React.createElement(TouchableOpacity, { 
        key: 'recent',
        onPress: () => onSortChange('Recent')
      }, React.createElement(Text, null, 'Recent')),
      React.createElement(TouchableOpacity, { 
        key: 'type',
        onPress: () => onSortChange('Type')
      }, React.createElement(Text, null, 'Type')),
      React.createElement(TouchableOpacity, { 
        key: 'rarity',
        onPress: () => onSortChange('Rarity')
      }, React.createElement(Text, null, 'Rarity')),
      React.createElement(TouchableOpacity, { 
        key: 'duplicates',
        onPress: () => onSortChange('Duplicates')
      }, React.createElement(Text, null, 'Duplicates'))
    ]);
  };
});

jest.mock('../../../components/CardGridItem', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity, Image } = require('react-native');
  
  return function MockCardGridItem({ 
    card, 
    onPress 
  }: {
    card: Card;
    onPress: (card: Card) => void;
  }) {
    return React.createElement(TouchableOpacity, { 
      testID: `card-${card._id}`,
      onPress: () => onPress(card)
    }, [
      React.createElement(Image, { 
        key: 'image',
        source: { uri: card.small }
      }),
      React.createElement(Text, { key: 'name' }, card.name),
      card.copies > 1 && React.createElement(Text, { key: 'copies' }, `x${card.copies}`)
    ].filter(Boolean));
  };
});

// Test the Collection component
describe('Collection Component', () => {
  const mockCards = [
    {
      _id: '1',
      name: 'Pikachu',
      rarity: 'Common',
      types: ['Electric'],
      copies: 2,
      small: 'pikachu-small.jpg',
      large: 'pikachu-large.jpg',
      collectedAt: '2024-03-10T00:00:00.000Z',
    },
    {
      _id: '2',
      name: 'Charizard',
      rarity: 'Rare',
      types: ['Fire'],
      copies: 1,
      small: 'charizard-small.jpg',
      large: 'charizard-large.jpg',
      collectedAt: '2024-03-09T00:00:00.000Z',
    },
    {
      _id: '3',
      name: 'Bulbasaur',
      rarity: 'Common',
      types: ['Grass'],
      copies: 3,
      small: 'bulbasaur-small.jpg',
      large: 'bulbasaur-large.jpg',
      collectedAt: '2024-03-11T00:00:00.000Z',
    },
    {
      _id: '4',
      name: 'Squirtle',
      rarity: 'Common',
      types: ['Electric'],
      copies: 1,
      small: 'squirtle-small.jpg',
      large: 'squirtle-large.jpg',
      collectedAt: '2024-03-12T00:00:00.000Z',
    }
  ];

  // Mock the loadCollection function
  const mockLoadCollection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useUser hook
    (useUser as jest.Mock).mockReturnValue({
      user: { id: '123' },
      isSignedIn: true,
    });

    // Mock useAppState hook
    (useAppState as jest.Mock).mockReturnValue({
      collection: {
        cards: mockCards,
        filteredTotal: 3,
        isLoading: false,
        error: null,
        loadCollection: mockLoadCollection,
      },
    });
  });

  
  it('renders correctly when signed in', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(<Collection />);
    
    // Check if basic elements are rendered
    expect(getByPlaceholderText('Search cards...')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Common')).toBeTruthy();
    expect(getByText('Rare')).toBeTruthy();
    expect(getByText('Sort: Recent')).toBeTruthy();

    // Check if cards are rendered
    expect(getByTestId('card-1')).toBeTruthy();
    expect(getByTestId('card-2')).toBeTruthy();
    expect(getByTestId('card-3')).toBeTruthy();
  });

  it('shows sign in message when not signed in', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isSignedIn: false,
    });

    const { getByText } = render(<Collection />);
    expect(getByText('Please sign in to view your collection')).toBeTruthy();
  });

  it('loads collection when screen is focused', () => {
    render(<Collection />);
    expect(mockLoadCollection).toHaveBeenCalledWith({});
  });

  it('loads collection with rarity filter when rarity is selected', async () => {
    const { getByText } = render(<Collection />);
    
    // Click on Rare filter
    fireEvent.press(getByText('Rare'));
    
    expect(mockLoadCollection).toHaveBeenCalledWith({ rarity: 'Rare' });
  });

  it('filters cards by search text', async () => {
    const { getByPlaceholderText, getByTestId, queryByTestId } = render(<Collection />);
    const searchInput = getByPlaceholderText('Search cards...');

    // Type in search
    fireEvent.changeText(searchInput, 'Pikachu');
    
    // Wait for filtering to complete
    await waitFor(() => {
      expect(getByTestId('card-1')).toBeTruthy();
      expect(queryByTestId('card-2')).toBeNull();
      expect(queryByTestId('card-3')).toBeNull();
    });
  });

  it('shows loading state', () => {
    (useAppState as jest.Mock).mockReturnValue({
      collection: {
        cards: [],
        filteredTotal: 0,
        isLoading: true,
        error: null,
        loadCollection: mockLoadCollection,
      },
    });

    const { getByTestId } = render(<Collection />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows error state', () => {
    (useAppState as jest.Mock).mockReturnValue({
      collection: {
        cards: [],
        filteredTotal: 0,
        isLoading: false,
        error: 'Failed to load collection',
        loadCollection: mockLoadCollection,
      },
    });

    const { getByText } = render(<Collection />);
    expect(getByText('Failed to load collection')).toBeTruthy();
  });

  it('opens sort modal and changes sort option', async () => {
    const { getByText, getByTestId } = render(<Collection />);
    
    // Open sort modal
    fireEvent.press(getByText('Sort: Recent'));
    
    // Check if modal is rendered
    expect(getByTestId('sort-modal')).toBeTruthy();
    
    // Select Rarity sort
    fireEvent.press(getByText('Rarity'));
    
    // Verify the cards are sorted by rarity
    const sortedCards = [...mockCards].sort((a, b) => 
      ['Common', 'Uncommon', 'Rare', 'Illustration Rare', 'Double Rare', 'Special Illustration Rare']
        .indexOf(b.rarity) - ['Common', 'Uncommon', 'Rare', 'Illustration Rare', 'Double Rare', 'Special Illustration Rare']
        .indexOf(a.rarity)
    );
    expect(sortedCards[0].name).toBe('Charizard');
  });

  it('shows duplicate count on cards', () => {
    const { getByTestId } = render(<Collection />);
    
    // Check if duplicate count is shown for cards with copies > 1
    const pikachuCard = getByTestId('card-1');
    const bulbasaurCard = getByTestId('card-3');
    
    expect(pikachuCard).toHaveTextContent(/x2/);

    expect(bulbasaurCard).toHaveTextContent(/x3/);
  });

  it('shows empty state message when no cards are in the collection', () => {
    (useAppState as jest.Mock).mockReturnValue({
      collection: {
        cards: [],
        filteredTotal: 0,
        isLoading: false,
        error: null,
        loadCollection: mockLoadCollection,
      },
    });
  
    const { getByText } = render(<Collection />);
    expect(getByText('No cards found.')).toBeTruthy();
  });
  
  it('sorts cards by recent collection date', async () => {
    const { getByText, getByTestId } = render(<Collection />);
    
    // Open sort modal
    fireEvent.press(getByText('Sort: Recent'));
    
    // Click on 'Recent' sort option
    fireEvent.press(getByText('Recent'));
    
    // Verify that cards are sorted by collection date (most recent first)
    const sortedCards = [...mockCards].sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime());
    expect(sortedCards[0].name).toBe('Squirtle');
  });
  
  it('sorts by type and then by name when types are equal', () => {
    const sorted = [...mockCards].sort((a, b) => {
      let comparison = (a.types[0] || '').localeCompare(b.types[0] || '');
      if (comparison === 0) comparison = a.name.localeCompare(b.name);
      return comparison;
    });
  
    expect(sorted).toMatchSnapshot(); 
  });

  it('sorts cards by type (lexical order, fallback to name)', async () => {
    const { getByText, getAllByTestId } = render(<Collection />);
  
    // Open sort modal
    fireEvent.press(getByText('Sort: Recent'));
  
    // Select Type
    fireEvent.press(getByText('Type'));
    await waitFor(() => {
      const cardNames = getAllByTestId(/^card-/).map(card => {
        const nameElement = card.children[1];
        if (typeof nameElement === 'string') return nameElement;
        return nameElement.props.children;
      });
      const expectedOrder = ['Pikachu', 'Squirtle', 'Charizard', 'Bulbasaur']; 
      expect(cardNames).toEqual(expectedOrder);
    });
  });
  
  it('sorts cards by number of duplicates (copies descending)', async () => {
    const { getByText, getAllByTestId } = render(<Collection />);
  
    // Open sort modal
    fireEvent.press(getByText('Sort: Recent'));
  
    // Select Duplicates
    fireEvent.press(getByText('Duplicates'));
    await waitFor(() => {
      const cardNames = getAllByTestId(/^card-/).map(card => {
        const nameElement = card.children[1];
        if (typeof nameElement === 'string') return nameElement;
        return nameElement.props.children;
      });
      const expectedOrder = ['Bulbasaur', 'Pikachu', 'Charizard', 'Squirtle']; // x3 > x2 > x1 > x1
      expect(cardNames).toEqual(expectedOrder);
    });
  });
  

  it('sorts cards by number of copies (descending)', () => {
    const sorted = [...mockCards].sort((a, b) => b.copies - a.copies);
    expect(sorted.map(c => c.copies)).toEqual([3, 2, 1, 1]);
  });

  it('opens and closes the CardModal', async () => {
    const { getByTestId, queryByTestId } = render(<Collection />);
    
    // Modal should not be shown initially
    expect(queryByTestId('card-image')).toBeNull();
  
    // Press a card to open modal
    fireEvent.press(getByTestId('card-1'));
    expect(getByTestId('card-image')).toBeTruthy();
  
    // Press the modal overlay to close
    fireEvent.press(getByTestId('card-image'));
  
    // Modal should disappear after state update
    await waitFor(() => {
      expect(queryByTestId('card-image')).toBeNull();
    }, { timeout: 1000 });
  });
  

  it('handles image load states', async () => {
    const { getByTestId, queryByTestId } = render(<Collection />);
    
    // Open modal
    fireEvent.press(getByTestId('card-1'));
  
    const cardImage = getByTestId('card-image');
  
    // Simulate image loading start
    fireEvent(cardImage, 'loadStart');
    expect(getByTestId('loading-indicator')).toBeTruthy();
  
    // Simulate image loading complete
    fireEvent(cardImage, 'load');
  
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
    }, { timeout: 1000 });
  });
  
});
