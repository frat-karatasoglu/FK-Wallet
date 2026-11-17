import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

/**
 * Telefonun yazı boyutu ayarı çok büyükken (ör. Samsung "Yazı tipi boyutu" en
 * üstte) yazılar kartlara ve kutulara sığmayıp taşıyordu. Büyütmeye izin
 * veriyoruz ama en fazla 1.2 kat; erişilebilirlik korunur, düzen bozulmaz.
 */
export const MAX_FONT_SCALE = 1.2;

export function Text({ maxFontSizeMultiplier = MAX_FONT_SCALE, ...props }: TextProps & { ref?: React.Ref<RNText> }) {
  return <RNText maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
}

export function TextInput({
  maxFontSizeMultiplier = MAX_FONT_SCALE,
  ...props
}: TextInputProps & { ref?: React.Ref<RNTextInput> }) {
  return <RNTextInput maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
}
