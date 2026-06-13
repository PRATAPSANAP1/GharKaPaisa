// AgentTheme.jsx — backward-compat re-export
// All components now import from ThemeContext directly.
// This file keeps old C/S imports working for any legacy usage.
import { LIGHT, makeS } from "./ThemeContext";

export const C = LIGHT;
export const S = makeS(LIGHT);
