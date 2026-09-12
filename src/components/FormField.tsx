import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface FormFieldProps extends TextInputProps {
  label: string;
}

export function FormField({ label, style, ...inputProps }: FormFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={typography.caption}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.slate400}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
    gap: spacing.xs,
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
});
