"use strict";

import { useState, useEffect, useMemo } from 'react';
import { normalizeMarkdownStyle } from "../normalizeMarkdownStyle.web.js";
import { zeroTrailingMargins, parseErrorFallbackStyle, buildStyles } from "./styles.js";
import { parseMarkdown } from "./parseMarkdown.js";
import { RenderNode } from "./renderers/index.js";
import { indexTaskItems, markInlineImages } from "./utils.js";
import { loadKaTeX } from "./katex.js";
import { ENRM_TEXT_CLASS, ENRM_SELECTION_BG_VAR } from "./globalStyles.js";
import { jsx as _jsx } from "react/jsx-runtime";
export const EnrichedMarkdownText = ({
  markdown,
  markdownStyle = {},
  md4cFlags = {},
  onLinkPress,
  onLinkLongPress,
  onTaskListItemPress,
  enableTaskListItemToggle = true,
  allowTrailingMargin = false,
  containerStyle,
  selectable = true,
  dir,
  selectionColor,
  ...rest
}) => {
  const normalizedStyle = useMemo(() => normalizeMarkdownStyle(markdownStyle), [markdownStyle]);
  const [ast, setAst] = useState(null);
  const [katex, setKatex] = useState(null);
  const [parseError, setParseError] = useState(false);
  const {
    underline = false,
    latexMath = true,
    superscript = false,
    subscript = false,
    highlight = false,
    hardSoftBreaks = false
  } = md4cFlags;
  useEffect(() => {
    let cancelled = false;
    const katexPromise = latexMath ? loadKaTeX() : Promise.resolve(null);
    Promise.all([parseMarkdown(markdown, {
      underline,
      latexMath,
      superscript,
      subscript,
      highlight,
      hardSoftBreaks
    }), katexPromise]).then(([result, katexInstance]) => {
      if (!cancelled) {
        indexTaskItems(result);
        markInlineImages(result);
        setParseError(false);
        setKatex(katexInstance);
        setAst(result);
      }
    }).catch(error => {
      if (!cancelled) {
        if (__DEV__) {
          console.error('[EnrichedMarkdownText] Parse failed:', error);
        }
        setParseError(true);
        setAst(null);
        setKatex(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [markdown, underline, latexMath, superscript, subscript, highlight, hardSoftBreaks]);
  const callbacks = useMemo(() => ({
    onLinkPress,
    onLinkLongPress,
    onTaskListItemPress
  }), [onLinkPress, onLinkLongPress, onTaskListItemPress]);
  const capabilities = useMemo(() => ({
    katex,
    enableTaskListItemToggle
  }), [katex, enableTaskListItemToggle]);
  const lastChildStyle = useMemo(() => allowTrailingMargin ? normalizedStyle : zeroTrailingMargins(normalizedStyle), [normalizedStyle, allowTrailingMargin]);
  const styles = useMemo(() => buildStyles(normalizedStyle), [normalizedStyle]);
  const lastChildStyles = useMemo(() => buildStyles(lastChildStyle), [lastChildStyle]);
  const wrapperStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    ...containerStyle,
    ...(selectable ? undefined : {
      userSelect: 'none'
    }),
    ...(selectionColor ? {
      [ENRM_SELECTION_BG_VAR]: selectionColor
    } : null)
  }), [containerStyle, selectable, selectionColor]);
  if (parseError) {
    return /*#__PURE__*/_jsx("div", {
      className: ENRM_TEXT_CLASS,
      style: wrapperStyle,
      dir: dir,
      ...rest,
      children: /*#__PURE__*/_jsx("pre", {
        style: parseErrorFallbackStyle,
        children: markdown
      })
    });
  }
  if (!ast) return null;
  const children = ast.children ?? [];
  const lastIdx = children.length - 1;
  return /*#__PURE__*/_jsx("div", {
    className: ENRM_TEXT_CLASS,
    style: wrapperStyle,
    dir: dir,
    ...rest,
    children: children.map((child, index) => /*#__PURE__*/_jsx(RenderNode, {
      node: child,
      style: index === lastIdx ? lastChildStyle : normalizedStyle,
      styles: index === lastIdx ? lastChildStyles : styles,
      callbacks: callbacks,
      capabilities: capabilities
    }, `${child.type}-${index}`))
  });
};
export default EnrichedMarkdownText;
//# sourceMappingURL=EnrichedMarkdownText.js.map