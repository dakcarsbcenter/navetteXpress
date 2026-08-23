export const brand = {
  background: '#DCD8D1',
  card: '#F7F3EC',
  panel: '#EFE8D8',
  border: '#e2dacd',
  textPrimary: '#12100E',
  textSecondary: '#3d3a35',
  textMuted: '#6E6A63',
  gold: '#1F5245',
  goldLight: '#19433B',
  danger: '#B8493C',
};

export const fonts = {
  body: "Archivo,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  heading: "Archivo,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  mono: "'IBM Plex Mono','Courier New',Courier,monospace",
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
    borderRadius: '8px',
    border: `1px solid ${brand.border}`,
    overflow: 'hidden',
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: '26px',
    fontWeight: '700',
    lineHeight: '1.15',
    letterSpacing: '-0.03em',
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
    fontWeight: '600',
    color: '#FFFFFF',
    textDecoration: 'none',
    display: 'inline-block',
    padding: '14px 36px',
    letterSpacing: '0',
    backgroundColor: brand.gold,
    borderRadius: '4px',
  },
};
