// Shared stage background handling for the studio and the output window.
export const BG_COLORS = {
  badge: '',
  gradient: 'linear-gradient(120deg, #e64dbb 0%, #d667d3 45%, #8530e0 100%)',
  green: '#00ff00', blue: '#0047bb', magenta: '#ff00ff',
  dark: '#14101f', transparent: 'transparent',
};

export function applyStageBackground(stage, avatar, bg, customColor) {
  avatar.setBackground(bg);
  stage.style.background = bg === 'custom' ? customColor : (BG_COLORS[bg] ?? '');
  stage.dataset.bg = bg;
  document.body.dataset.transparent = bg === 'transparent' ? 'true' : 'false';
}
