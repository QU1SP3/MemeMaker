export const icons = {
    alignCenter: svg(`
    <line x1="4" y1="8" x2="20" y2="8"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
    <line x1="4" y1="16" x2="20" y2="16"/>
  `),
    alignLeft: svg(`
    <line x1="4" y1="8" x2="20" y2="8"/>
    <line x1="4" y1="12" x2="15" y2="12"/>
    <line x1="4" y1="16" x2="20" y2="16"/>
  `),
    alignRight: svg(`
    <line x1="4" y1="8" x2="20" y2="8"/>
    <line x1="9" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="16" x2="20" y2="16"/>
  `),
    arrowDown: svg(`
    <line x1="12" y1="5" x2="12" y2="18"/>
    <polyline points="8,13 12,18 16,13"/>
  `),
    arrowUp: svg(`
    <line x1="12" y1="19" x2="12" y2="6"/>
    <polyline points="8,11 12,6 16,11"/>
  `),
    download: svg(`
    <line x1="12" y1="5" x2="12" y2="18"/>
    <polyline points="8,13 12,18 16,13"/>
    <line x1="5" y1="20" x2="19" y2="20"/>
  `),
    flip: svg(`
    <line x1="4" y1="5" x2="4" y2="19"/>
    <line x1="20" y1="5" x2="20" y2="19"/>
    <path d="M8 7 L15 12 L8 17 Z"/>
    <line x1="16" y1="7" x2="16" y2="17"/>
  `),
    lasso: svg(`
    <path d="M7 11 C7 8 9 6 12 6 C15 6 17 8 17 11 C17 14 15 15 12 15 C10 15 9 14 8 13"/>
    <path d="M8 13 L5 18"/>
    <path d="M5 18 L8 17"/>
  `),
    rotate: svg(`
    <path d="M18 5 L18 9 L13 9"/>
    <path d="M18 9 C16 6 14 5 11 5 C7 5 4 8 4 12 C4 16 7 19 11 19 C15 19 17 17 18 13"/>
  `),
    text: svg(`
    <line x1="5" y1="7" x2="19" y2="7"/>
    <line x1="12" y1="7" x2="12" y2="18"/>
    <line x1="9" y1="18" x2="15" y2="18"/>
  `),
    trash: svg(`
    <line x1="5" y1="7" x2="19" y2="7"/>
    <path d="M10 7 L10 6 C10 5 10.5 4.5 11.5 4.5 L12.5 4.5 C13.5 4.5 14 5 14 6 L14 7"/>
    <path d="M9 7 L9.8 19 L14.2 19 L15 7"/>
    <line x1="12" y1="11" x2="12" y2="17"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  `),
    uppercase: svg(`
    <path d="M4 19 L8 7 L12 19"/>
    <line x1="6" y1="15" x2="10" y2="15"/>
    <line x1="14" y1="19" x2="14" y2="7"/>
    <path d="M14 7 L17 7 C18.5 7 19.5 8 19.5 9.5 C19.5 11 18.5 12 17 12 L14 12"/>
    <path d="M17 12 C18.7 12 19.5 13.3 19.5 15 C19.5 16.7 18.7 18 17 18 L14 18"/>
  `),
};
function svg(content) {
    return `<svg 
    aria-hidden="true" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
    shape-rendering="crispEdges"
  >${content}</svg>`;
}
//# sourceMappingURL=icons.js.map