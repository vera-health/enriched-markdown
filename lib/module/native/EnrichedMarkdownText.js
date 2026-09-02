"use strict";

import { useMemo, useCallback, useRef, useEffect } from 'react';
import EnrichedMarkdownTextNativeComponent from '../EnrichedMarkdownTextNativeComponent';
import EnrichedMarkdownNativeComponent from '../EnrichedMarkdownNativeComponent';
import { normalizeMarkdownStyle } from '../normalizeMarkdownStyle';
import { resolveAccessibilityLabels } from "../accessibilityLabelDefaults.js";
import { normalizeMenuItem, normalizeLegacyBooleanMenuItem } from "../normalizeMenuItem.js";
import { jsx as _jsx } from "react/jsx-runtime";
// Default English labels for the built-in selection menu actions. Defaults are
// resolved here (JS-side) so the native code always receives a concrete string.
const DEFAULT_COPY_LABEL = 'Copy';
const DEFAULT_COPY_AS_MARKDOWN_LABEL = 'Copy as Markdown';
const DEFAULT_COPY_IMAGE_URL_LABEL = 'Copy Image URL';
const DEFAULT_COPY_IMAGE_URLS_LABEL = 'Copy {count} Image URLs';

/**
 * Resolves `pluralLabels` into a per-count template table (index = image count,
 * 0..100) the native side can index without any locale logic. `Intl.PluralRules`
 * selects the CLDR category for each count; missing categories fall back to the
 * required `other`. Index 1 uses the singular `label` (the single-image case).
 * Native uses `other` (copyImageUrlsLabel) for counts > 100, and falls back to
 * the singular/`{count}` templates entirely when this returns an empty array
 * (no plural labels set, or `Intl.PluralRules` unavailable).
 */
const buildPluralTemplates = (pluralLabels, singularLabel) => {
  if (!pluralLabels) return [];
  const IntlRef = Intl;
  if (typeof IntlRef.PluralRules !== 'function') return [];
  let pluralRules;
  try {
    // TODO: expose `copyImageUrl.pluralLocale?: string` so i18n apps can force
    // a locale independent of the device. Today this resolves to the JS
    // runtime's default locale, so on an English device only `one` and `other`
    // ever fire even when richer plural labels are configured.
    pluralRules = new IntlRef.PluralRules();
  } catch {
    return [];
  }
  const {
    other
  } = pluralLabels;
  const byCategory = {
    zero: pluralLabels.zero ?? other,
    one: pluralLabels.one ?? other,
    two: pluralLabels.two ?? other,
    few: pluralLabels.few ?? other,
    many: pluralLabels.many ?? other,
    other
  };
  const templates = [];
  for (let n = 0; n <= 100; n++) {
    // The literal single-image case uses the (non-plural) singular label; every
    // other count uses its CLDR category form.
    templates.push(n === 1 ? singularLabel : byCategory[pluralRules.select(n)] ?? other);
  }
  return templates;
};
const defaultMd4cFlags = {
  underline: false,
  superscript: false,
  subscript: false,
  latexMath: true,
  highlight: false,
  hardSoftBreaks: false
};
export const EnrichedMarkdownText = ({
  markdown,
  markdownStyle = {},
  containerStyle,
  onLinkPress,
  onLinkLongPress,
  onTaskListItemPress,
  enableTaskListItemToggle = true,
  onCopyPress,
  enableLinkPreview,
  selectable = true,
  md4cFlags = defaultMd4cFlags,
  allowFontScaling = true,
  maxFontSizeMultiplier,
  allowTrailingMargin = false,
  flavor = 'commonmark',
  streamingAnimation = false,
  streamingConfig,
  spoilerOverlay = 'particles',
  contextMenuItems,
  imageRequestHeaders,
  selectionMenuConfig,
  accessibilityLabels,
  selectionColor,
  selectionHandleColor,
  textBreakStrategy,
  lineBreakStrategyIOS,
  writingDirection = 'first-strong',
  ...rest
}) => {
  const normalizedStyleRef = useRef(null);
  const normalized = normalizeMarkdownStyle(markdownStyle);
  // normalizeMarkdownStyle returns cached objects for structurally equal inputs,
  // so this referential check is sufficient to preserve a stable prop reference.
  if (normalizedStyleRef.current !== normalized) {
    normalizedStyleRef.current = normalized;
  }
  const normalizedStyle = normalizedStyleRef.current;
  const normalizedMd4cFlags = useMemo(() => ({
    underline: md4cFlags.underline ?? false,
    superscript: md4cFlags.superscript ?? false,
    subscript: md4cFlags.subscript ?? false,
    latexMath: md4cFlags.latexMath ?? true,
    highlight: md4cFlags.highlight ?? false,
    hardSoftBreaks: md4cFlags.hardSoftBreaks ?? false
  }), [md4cFlags]);
  const contextMenuCallbacksRef = useRef(new Map());
  useEffect(() => {
    const callbacksMap = new Map();
    if (contextMenuItems) {
      for (const item of contextMenuItems) {
        callbacksMap.set(item.text, item.onPress);
      }
    }
    contextMenuCallbacksRef.current = callbacksMap;
  }, [contextMenuItems]);
  const nativeContextMenuItems = useMemo(() => contextMenuItems?.filter(item => item.visible !== false).map(item => ({
    text: item.text,
    icon: item.icon
  })), [contextMenuItems]);
  const nativeImageRequestHeaders = useMemo(() => imageRequestHeaders ? Object.entries(imageRequestHeaders).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0) : undefined, [imageRequestHeaders]);
  const handleContextMenuItemPress = useCallback(e => {
    const {
      itemText,
      selectedText,
      selectionStart,
      selectionEnd
    } = e.nativeEvent;
    const callback = contextMenuCallbacksRef.current.get(itemText);
    callback?.({
      text: selectedText,
      selection: {
        start: selectionStart,
        end: selectionEnd
      }
    });
  }, []);
  const handleLinkPress = useCallback(e => {
    const {
      url
    } = e.nativeEvent;
    onLinkPress?.({
      url
    });
  }, [onLinkPress]);
  const handleLinkLongPress = useCallback(e => {
    const {
      url
    } = e.nativeEvent;
    onLinkLongPress?.({
      url
    });
  }, [onLinkLongPress]);
  const handleTaskListItemPress = useCallback(e => {
    const {
      index,
      checked,
      text
    } = e.nativeEvent;
    onTaskListItemPress?.({
      index,
      checked,
      text
    });
  }, [onTaskListItemPress]);
  const handleCopyPress = useCallback(e => {
    const {
      code,
      language
    } = e.nativeEvent;
    onCopyPress?.({
      code,
      language
    });
  }, [onCopyPress]);
  const tableMode = streamingConfig?.tableMode ?? 'progressive';
  const codeBlockMode = streamingConfig?.codeBlockMode ?? 'progressive';
  const normalizedStreamingConfig = useMemo(() => ({
    tableMode,
    codeBlockMode
  }), [tableMode, codeBlockMode]);
  const normalizedSelectionMenuConfig = useMemo(() => {
    // The boolean acceptance is confined to this wrapper boundary via a single
    // `as unknown` cast; the public type only exposes the object shape.
    const config = selectionMenuConfig;
    const copy = normalizeMenuItem(config?.copy, true, DEFAULT_COPY_LABEL);
    const copyAsMarkdown = normalizeLegacyBooleanMenuItem(config?.copyAsMarkdown, 'selectionMenuConfig', 'copyAsMarkdown', true, DEFAULT_COPY_AS_MARKDOWN_LABEL);
    const copyImageUrl = normalizeLegacyBooleanMenuItem(config?.copyImageUrl, 'selectionMenuConfig', 'copyImageUrl', true, DEFAULT_COPY_IMAGE_URL_LABEL);
    const pluralLabels = config?.copyImageUrl?.pluralLabels;
    return {
      copyAsMarkdown: copyAsMarkdown.enabled,
      copyImageUrl: copyImageUrl.enabled,
      copyLabel: copy.label,
      copyAsMarkdownLabel: copyAsMarkdown.label,
      copyImageUrlLabel: copyImageUrl.label,
      copyImageUrlsLabel: pluralLabels?.other ?? DEFAULT_COPY_IMAGE_URLS_LABEL,
      copyImageUrlPluralTemplates: buildPluralTemplates(pluralLabels, copyImageUrl.label)
    };
  }, [selectionMenuConfig]);
  const resolvedAccessibilityLabels = useMemo(() => resolveAccessibilityLabels(accessibilityLabels), [accessibilityLabels]);
  const sharedProps = {
    markdown,
    markdownStyle: normalizedStyle,
    onLinkPress: handleLinkPress,
    onLinkLongPress: handleLinkLongPress,
    onTaskListItemPress: handleTaskListItemPress,
    enableTaskListItemToggle,
    onCopyPress: handleCopyPress,
    enableLinkPreview: onLinkLongPress == null && (enableLinkPreview ?? true),
    selectable,
    md4cFlags: normalizedMd4cFlags,
    allowFontScaling,
    maxFontSizeMultiplier,
    allowTrailingMargin,
    streamingAnimation,
    streamingConfig: normalizedStreamingConfig,
    spoilerOverlay,
    style: containerStyle,
    contextMenuItems: nativeContextMenuItems,
    imageRequestHeaders: nativeImageRequestHeaders,
    selectionMenuConfig: normalizedSelectionMenuConfig,
    accessibilityLabels: resolvedAccessibilityLabels,
    onContextMenuItemPress: handleContextMenuItemPress,
    selectionColor,
    selectionHandleColor,
    textBreakStrategy,
    lineBreakStrategyIOS,
    writingDirection,
    ...rest
  };
  if (flavor === 'github') {
    return /*#__PURE__*/_jsx(EnrichedMarkdownNativeComponent, {
      ...sharedProps
    });
  }
  return /*#__PURE__*/_jsx(EnrichedMarkdownTextNativeComponent, {
    ...sharedProps
  });
};
export default EnrichedMarkdownText;
//# sourceMappingURL=EnrichedMarkdownText.js.map