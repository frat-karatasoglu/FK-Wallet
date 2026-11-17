import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, inputField, inputFocused, inputLabel, spacing } from '../theme';

interface FormFieldProps extends TextInputProps {
  label: string;
}

export function FormField({ label, style, onFocus, onBlur, ...inputProps }: FormFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      <TextInput
        style={[styles.input, focused && inputFocused, style]}
        placeholderTextColor={colors.slate400}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
    gap: 6,
  },
  label: {
    ...inputLabel,
  },
  labelFocused: {
    color: colors.primary,
  },
  input: {
    ...inputField,
  },
});
