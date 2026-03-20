import { Outfit, Inter, Playfair_Display, Merriweather, Space_Grotesk } from 'next/font/google';

export const fontOutfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
export const fontInter = Inter({ subsets: ['latin'], variable: '--font-inter' });
export const fontPlayfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
export const fontMerriweather = Merriweather({ subsets: ['latin'], weight: ['300', '400', '700', '900'], variable: '--font-merriweather' });
export const fontSpaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const getFontClass = (fontName: string) => {
  switch (fontName) {
    case 'Outfit': return fontOutfit.className;
    case 'Inter': return fontInter.className;
    case 'Playfair Display': return fontPlayfair.className;
    case 'Merriweather': return fontMerriweather.className;
    case 'Space Grotesk': return fontSpaceGrotesk.className;
    default: return fontOutfit.className;
  }
};
