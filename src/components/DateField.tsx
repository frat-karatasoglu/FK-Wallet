import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { colors, radius, spacing, typography } from '../theme';
import { formatDate } from '../lib/format';

interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  allowFuture?: boolean;
}

function toInputString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DateField({ label, value, onChange, allowFuture = false }: DateFieldProps) {
  const [isPickerVisible, setIsPickerVisible] = useState(Platform.OS === 'ios');
  const [webDraft, setWebDraft] = useState(toInputString(value));

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') setIsPickerVisible(false);
    if (event.type !== 'dismissed' && selectedDate) onChange(selectedDate);
  }

  // Web'de native picker yok; YYYY-AA-GG olarak yazılıp parse ediliyor.
  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        <Text style={typography.caption}>{label}</Text>
        <TextInput
          style={styles.input}
          value={webDraft}
          onChangeText={(text) => {
            setWebDraft(text);
            const parsed = new Date(text);
            if (!Number.isNaN(parsed.getTime())) onChange(parsed);
          }}
          placeholder="YYYY-AA-GG"
          placeholderTextColor={colors.slate400}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={typography.caption}>{label}</Text>
      {Platform.OS === 'android' ? (
        <Pressable style={styles.input} onPress={() => setIsPickerVisible(true)}>
          <Text style={styles.buttonText}>{formatDate(value)}</Text>
        </Pressable>
      ) : null}
      {isPickerVisible ? (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
          maximumDate={allowFuture ? undefined : new Date()}
          themeVariant="light"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.slate800,
    backgroundColor: colors.slate50,
  },
  buttonText: {
    fontSize: 15,
    color: colors.slate800,
  },
});
