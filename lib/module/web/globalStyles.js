"use strict";

import { injectStyleOnce } from "./injectStyle.js";
export const ENRM_TEXT_CLASS = 'enrm-text';
export const ENRM_SELECTION_BG_VAR = '--enrm-selection-bg';
const RULES = [['enrm-selection-style', `.${ENRM_TEXT_CLASS} ::selection { background-color: var(${ENRM_SELECTION_BG_VAR}); }`]];
for (const [id, css] of RULES) {
  injectStyleOnce(id, css);
}
//# sourceMappingURL=globalStyles.js.map