import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/src/components/ScaledText';
import { Ionicons } from '@expo/vector-icons';

import { colors, inputField, inputFocused, inputLabel, spacing } from '../theme';
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
    if (isSaving) return;
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
        <TextInput
          style={[styles.input, inputFocused]}
          value={draft}
          onChangeText={(nextValue) => setDraft(formatMoneyInput(nextValue))}
          onSubmitEditing={handleSave}
          keyboardType="decimal-pad"
          returnKeyType="done"
          autoFocus
          selectTextOnFocus
          placeholder="0"
          placeholderTextColor={colors.slate400}
        />
        <View style={styles.actions}>
          <Pressable
            onPress={() => setIsEditing(false)}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Vazgeç"
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={22} color={colors.slate600} />
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Kaydet"
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={22} color={colors.white} />
                <Text style={styles.saveText} numberOfLines={1}>Kaydet</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
      onPress={startEditing}
      accessibilityRole="button"
      accessibilityLabel={`${label} düzenle`}
    >
      <View style={styles.labelRow}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <View style={styles.editBadge}>
          <Ionicons name="pencil" size={13} color={colors.primary} />
        </View>
      </View>
      {value != null ? (
        <Text
          style={[styles.value, emphasis && styles.valueEmphasis, { fontSize: valueFontSize(formatCurrency(value), emphasis) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatCurrency(value)}
        </Text>
      ) : (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}
    </Pressable>
  );
}

// Uzun tutarlar "50.000,0..." diye kesilmesin: karakter sayısına göre küçült.
function valueFontSize(text: string, emphasis: boolean) {
  const base = emphasis ? 20 : 18;
  if (text.length > 16) return base - 5;
  if (text.length > 13) return base - 3;
  return base;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    ...inputLabel,
    flexShrink: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  value: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate800,
  },
  valueEmphasis: {
    fontSize: 20,
    color: colors.navy,
  },
  placeholder: {
    marginTop: 2,
    fontSize: 15,
    color: colors.slate400,
    fontStyle: 'italic',
  },
  editBadge: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    ...inputField,
    marginTop: spacing.sm,
    fontSize: 20,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.income,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.income,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
