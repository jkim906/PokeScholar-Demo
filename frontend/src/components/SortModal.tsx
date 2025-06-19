import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  sortBy: string | null;
  sortDirection: 'asc' | 'desc';
  onSortChange: (option: string) => void;
}

/**
 * SortModal Component
 * 
 * Displays a modal with sorting options for the card collection.
 * Features:
 * - Multiple sorting options (Type, Rarity, Recent, Duplicates)
 * - Visual indication of current sort option
 * - Sort direction indicators (ascending/descending)
 * - Easy to dismiss interface
 * 
 * @param {SortModalProps} props - Component props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {string | null} props.sortBy - Currently selected sort option
 * @param {'asc' | 'desc'} props.sortDirection - Current sort direction
 * @param {Function} props.onSortChange - Callback when sort option is changed
 */
const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  sortBy,
  sortDirection,
  onSortChange,
}) => {
  const sortOptions = [
    "Recent",
    "Type",
    "Rarity",
    "Duplicates"
  ];

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.sortModal}>
          <Text style={styles.sortTitle}>Sort By</Text>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => onSortChange(option)}
              style={[
                styles.sortOption,
                sortBy === option && styles.selectedSortOption
              ]}
            >
              <View style={styles.sortOptionContent}>
                <Ionicons 
                  name={
                    option === 'Type' ? 'color-palette' :
                    option === 'Rarity' ? 'star' :
                    option === 'Recent' ? 'time' :
                    'copy'
                  } 
                  size={20} 
                  color={sortBy === option ? '#007BFF' : '#666'} 
                  style={styles.optionIcon}
                />
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option && styles.selectedSortOptionText
                ]}>
                  {option}
                </Text>
                {sortBy === option && (
                  <Ionicons
                    name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color="#007BFF"
                    style={styles.directionIcon}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sortModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sortTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  sortOption: {
    paddingVertical: 12,
  },
  selectedSortOption: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  optionIcon: {
    marginRight: 12,
  },
  sortOptionText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  selectedSortOptionText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  directionIcon: {
    marginLeft: 8,
  },
});

export default SortModal; 