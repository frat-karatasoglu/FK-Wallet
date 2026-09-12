import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../theme';
import { formatCurrency } from '../lib/format';
import { formatMoneyInput, moneyValueToInput, parseMoneyInput } from '../lib/moneyInput';

interface InlineMoneyEditorProps {
  label: string;
  value: number | null;
  placeholder?: string;
  onSave: (value: number) => Promise<unknown>;
  emphasis?: boolean;
}

export function InlineMoneyEditor({
  label,
  value,
  placeholder = 'Gir',
  onSave,
  emphasis = false,
}: InlineMoneyEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function startEditing() {
    setDraft(moneyValueToInput(value));
    setIsEditing(true);
  }

  async function handleSave() {
    const parsed = parseMoneyInput(draft);
    if (draft.trim() === '' || Number.isNaN(parsed) || parsed < 0) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    await onSave(parsed);
    setIsSaving(false);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.editRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={(nextValue) => setDraft(formatMoneyInput(nextValue))}
            keyboardType="decimal-pad"
            autoFocus
            placeholder="0"
            placeholderTextColor={colors.slate400}
          />
          {isSaving ? (
            <ActivityIndicator color={colors.navy} style={styles.actionIcon} />
          ) : (
            <>
              <Pressable onPress={handleSave} hitSlop={8} style={styles.actionIcon}>
                <Ionicons name="checkmark-circle" size={26} color={colors.income} />
              </Pressable>
              <Pressable onPress={() => setIsEditing(false)} hitSlop={8} style={styles.actionIcon}>
                <Ionicons name="close-circle" size={26} color={colors.slate400} />
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <Pressable style={styles.wrapper} onPress={startEditing}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.displayRow}>
        {value != null ? (
          <Text style={[styles.value, emphasis && styles.valueEmphasis]}>
            {formatCurrency(value)}
          </Text>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
        <Ionicons name="pencil" size={14} color={colors.slate400} style={styles.pencil} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: colors.slate500,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate800,
  },
  valueEmphasis: {
    fontSize: 20,
    color: colors.navy,
  },
  placeholder: {
    fontSize: 15,
    color: colors.slate400,
    fontStyle: 'italic',
  },
  pencil: {
    marginTop: 2,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 15,
    color: colors.slate800,
    backgroundColor: colors.white,
  },
  actionIcon: {
    marginLeft: spacing.xs,
  },
});
