import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'outline';
  style?: ViewStyle;
}

export function PrimaryButton({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        variant === 'outline' && styles.outline,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.navy : colors.white} />
      ) : (
        <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.navy,
  },
  danger: {
    backgroundColor: colors.overdue,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: colors.navy,
  },
});
