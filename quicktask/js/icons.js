/* Minimal line-icon set — single stroke, currentColor, 24x24 viewBox. */
const QT_ICONS = {
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V20h5v-6h2v6h5v-9.5"/>',
  services: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><path d="M12 7.6v.1"/>',
  tasks: '<path d="M9 6h10"/><path d="M9 12h10"/><path d="M9 18h10"/><path d="m5 6 .8.8L7.5 5"/><path d="m5 12 .8.8L7.5 11"/><path d="m5 18 .8.8L7.5 17"/>',
  wallet: '<rect x="3.5" y="6.5" width="17" height="12" rx="2.5"/><path d="M3.5 10h17"/><circle cx="16.5" cy="14.5" r="1.2"/>',
  messages: '<path d="M4 5.5h16v10H9l-3.5 3v-3H4z"/>',
  profile: '<circle cx="12" cy="8.3" r="3.3"/><path d="M5.5 19.5c1.4-3.4 4-4.8 6.5-4.8s5.1 1.4 6.5 4.8"/>',
  requests: '<path d="M12 4v9"/><path d="m8 9.5 4 4 4-4"/><path d="M5 17.5h14"/>',
  earnings: '<path d="M4 18V9.5L12 5l8 4.5V18"/><path d="M9 18v-5h6v5"/>',
  dashboard: '<path d="M4 13.5 10 5l4 5.5 6-7"/><path d="M4 19h16"/>',
  users: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c1-3 3-4.5 5.5-4.5s4.5 1.5 5.5 4.5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.8 14.6c1.9.4 3.2 1.7 3.9 4.4"/>',
  payments: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M3.5 9.5h17"/><path d="M7 14.5h4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m19 19-4-4"/>',
  logout: '<path d="M9 5H5.5A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19H9"/><path d="M13 12h8"/><path d="m17.5 8 3.5 4-3.5 4"/>',
  chevRight: '<path d="m9 5 7 7-7 7"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>',
  paperclip: '<path d="M8 12.5V7a4 4 0 0 1 8 0v8a2.5 2.5 0 0 1-5 0V8.5"/>',
  paypal: '<path d="M7 6h6.5a3.5 3.5 0 0 1 0 7H10l-1 5H6.5L9 6Z"/><path d="M11.5 9.5H16a3.5 3.5 0 0 1 0 7h-3l-.7 3.5"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5v9"/><path d="M14.5 9.7c0-1-1-1.7-2.5-1.7s-2.5.7-2.5 1.8c0 2.4 5 1 5 3.4 0 1.1-1.1 1.8-2.5 1.8s-2.5-.7-2.5-1.7"/>',
  crypto: '<path d="M12 3.5 5 12l7 8.5 7-8.5-7-8.5Z"/><path d="M5 12h14"/>',
  card: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M3.5 9.5h17"/>',
  reset: '<path d="M19 12a7 7 0 1 1-2-4.9"/><path d="M19 4v4.5h-4.5"/>',
};
function qtIcon(name, size){
  size = size || 18;
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${QT_ICONS[name]||""}</svg>`;
}
