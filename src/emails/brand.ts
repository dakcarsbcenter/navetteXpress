export const brand = {
  background: '#0A0A0F',
  card: '#12121A',
  panel: '#1A1A26',
  border: '#2A2A3A',
  textPrimary: '#F0EDE8',
  textSecondary: '#8A8799',
  textMuted: '#4A4759',
  gold: '#9B1B30',
  goldLight: '#C23B55',
  danger: '#ef4444',
};

export const fonts = {
  body: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  heading: "Georgia,'Times New Roman',serif",
  mono: "'Courier New',Courier,monospace",
};

export const shellStyles = {
  body: {
    margin: '0',
    padding: '0',
    backgroundColor: brand.background,
    WebkitTextSizeAdjust: '100%',
    msTextSizeAdjust: '100%',
    fontFamily: fonts.body,
  },
  container: {
    margin: '0 auto',
    width: '100%',
    maxWidth: '600px',
    backgroundColor: brand.card,
    borderRadius: '16px',
    border: `1px solid ${brand.border}`,
    overflow: 'hidden',
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: '26px',
    fontWeight: 'normal',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
    color: brand.textPrimary,
    margin: '0 0 10px',
    textAlign: 'center' as const,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: '15px',
    lineHeight: '26px',
    color: brand.textSecondary,
    margin: '0',
  },
  cta: {
    fontFamily: fonts.body,
    fontSize: '15px',
    fontWeight: '700',
    color: '#0A0A0F',
    textDecoration: 'none',
    display: 'inline-block',
    padding: '14px 36px',
    letterSpacing: '0.02em',
    backgroundColor: brand.gold,
    borderRadius: '10px',
  },
};