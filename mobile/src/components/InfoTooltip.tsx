import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InfoTooltipProps {
  title: string;
  content: string | string[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  iconSize?: number;
  iconColor?: string;
}

export default function InfoTooltip({
  title,
  content,
  position = 'top-right',
  iconSize = 20,
  iconColor = '#007AFF',
}: InfoTooltipProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const contentArray = Array.isArray(content) ? content : [content];

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.iconContainer}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="information-circle-outline" size={iconSize} color={iconColor} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{title}</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#000000" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {contentArray.map((paragraph, index) => (
                    <Text key={index} style={styles.modalText}>
                      {paragraph}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    marginBottom: 16,
  },
});

