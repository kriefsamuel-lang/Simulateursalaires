export const FONT_FAMILY = 'Rubik';

export function registerFonts(Font: { register: (args: { family: string; src: string }) => void }) {
  Font.register({
    family: 'Rubik',
    src: 'https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-4I-1UA.woff2',
  });
}
