"use strict";

/**
 * Jest mock for `react-native-enriched-markdown`, wired up via
 * `jest.mock('react-native-enriched-markdown', () => require('react-native-enriched-markdown/jest'))`.
 * See docs/TESTING.md for setup and the behavior it mirrors.
 *
 * The two components are Fabric/codegen native views: under Jest there is no
 * native view manager, so rendering them or calling any imperative ref method
 * (each dispatches a native command) throws. These replacements render plain RN
 * primitives and expose every imperative method as a spy.
 *
 * Behavior mirrored from the native component: typing fires `onChangeText` and,
 * when set, `onChangeMarkdown` (the raw text stands in for parsed markdown);
 * `setValue()` updates the rendered text but emits no change events, matching
 * the native suppression of emits for programmatic updates.
 *
 * The mock is typed against the real public types, so `yarn typecheck` fails if
 * the API gains a prop or ref method the mock does not cover -- it cannot
 * silently drift from the real component.
 */
import { useImperativeHandle, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { jsx as _jsx } from "react/jsx-runtime";
export { DEFAULT_ACCESSIBILITY_LABELS, resolveAccessibilityLabels } from "../accessibilityLabelDefaults.js";
const spy = impl => jest.fn(impl);
const EMPTY_CARET_RECT = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};
export const EnrichedMarkdownTextInput = ({
  ref,
  defaultValue,
  onChangeText,
  onChangeMarkdown,
  onFocus,
  onBlur,
  editable = true,
  placeholder,
  placeholderTextColor,
  autoFocus = false,
  multiline = true,
  scrollEnabled = true,
  style,
  testID,
  accessible,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  nativeID,
  markdownStyle: _markdownStyle,
  cursorColor: _cursorColor,
  selectionColor: _selectionColor,
  autoCapitalize: _autoCapitalize,
  onChangeSelection: _onChangeSelection,
  onChangeState: _onChangeState,
  onKeyPress: _onKeyPress,
  onCaretRectChange: _onCaretRectChange,
  onLinkDetected: _onLinkDetected,
  mentionIndicators: _mentionIndicators,
  onStartMention: _onStartMention,
  onChangeMention: _onChangeMention,
  onEndMention: _onEndMention,
  contextMenuItems: _contextMenuItems,
  selectionMenuConfig: _selectionMenuConfig,
  formatMenuConfig: _formatMenuConfig,
  linkRegex: _linkRegex,
  writingDirection: _writingDirection
}) => {
  const [text, setText] = useState(defaultValue ?? '');
  const textRef = useRef(text);
  const inputRef = useRef(null);
  const applyText = next => {
    textRef.current = next;
    setText(next);
  };
  const handleChangeText = next => {
    applyText(next);
    onChangeText?.(next);
    onChangeMarkdown?.(next);
  };
  const instanceRef = useRef(null);
  if (instanceRef.current === null) {
    instanceRef.current = {
      focus: spy(() => inputRef.current?.focus()),
      blur: spy(() => inputRef.current?.blur()),
      measure: spy(callback => callback(0, 0, 0, 0, 0, 0)),
      measureInWindow: spy(callback => callback(0, 0, 0, 0)),
      measureLayout: spy((_relativeToNativeNode, onSuccess) => onSuccess(0, 0, 0, 0)),
      setValue: spy(markdown => applyText(markdown)),
      setSelection: spy((_start, _end) => {}),
      toggleBold: spy(() => {}),
      toggleItalic: spy(() => {}),
      toggleUnderline: spy(() => {}),
      toggleStrikethrough: spy(() => {}),
      toggleSpoiler: spy(() => {}),
      toggleHeading: spy(_level => {}),
      toggleUnorderedList: spy(() => {}),
      toggleOrderedList: spy(() => {}),
      indentList: spy(() => {}),
      outdentList: spy(() => {}),
      setLink: spy(_url => {}),
      insertLink: spy((_text, _url) => {}),
      insertText: spy(_text => {}),
      insertMention: spy((_displayText, _url) => {}),
      startMention: spy(_indicator => {}),
      removeLink: spy(() => {}),
      copyToClipboard: spy(() => {}),
      getMarkdown: spy(() => Promise.resolve(textRef.current)),
      getCaretRect: spy(() => Promise.resolve(EMPTY_CARET_RECT))
    };
  }
  useImperativeHandle(ref, () => instanceRef.current);
  return /*#__PURE__*/_jsx(TextInput, {
    ref: inputRef,
    value: text,
    onChangeText: handleChangeText,
    onFocus: () => onFocus?.(),
    onBlur: () => onBlur?.(),
    editable: editable,
    placeholder: placeholder,
    placeholderTextColor: placeholderTextColor,
    autoFocus: autoFocus,
    multiline: multiline,
    scrollEnabled: scrollEnabled,
    style: style,
    testID: testID,
    accessible: accessible,
    accessibilityLabel: accessibilityLabel,
    accessibilityHint: accessibilityHint,
    accessibilityRole: accessibilityRole,
    accessibilityState: accessibilityState,
    nativeID: nativeID
  });
};
export const EnrichedMarkdownText = ({
  markdown,
  containerStyle,
  testID,
  accessible,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  nativeID,
  markdownStyle: _markdownStyle,
  onLinkPress: _onLinkPress,
  onLinkLongPress: _onLinkLongPress,
  onTaskListItemPress: _onTaskListItemPress,
  enableLinkPreview: _enableLinkPreview,
  selectable: _selectable,
  md4cFlags: _md4cFlags,
  allowFontScaling: _allowFontScaling,
  maxFontSizeMultiplier: _maxFontSizeMultiplier,
  allowTrailingMargin: _allowTrailingMargin,
  flavor: _flavor,
  streamingAnimation: _streamingAnimation,
  streamingConfig: _streamingConfig,
  spoilerOverlay: _spoilerOverlay,
  contextMenuItems: _contextMenuItems,
  imageRequestHeaders: _imageRequestHeaders,
  selectionMenuConfig: _selectionMenuConfig,
  accessibilityLabels: _accessibilityLabels,
  selectionColor: _selectionColor,
  selectionHandleColor: _selectionHandleColor,
  textBreakStrategy: _textBreakStrategy,
  lineBreakStrategyIOS: _lineBreakStrategyIOS,
  writingDirection: _writingDirection
}) => {
  return /*#__PURE__*/_jsx(Text, {
    style: containerStyle,
    testID: testID,
    accessible: accessible,
    accessibilityLabel: accessibilityLabel,
    accessibilityHint: accessibilityHint,
    accessibilityRole: accessibilityRole,
    accessibilityState: accessibilityState,
    nativeID: nativeID,
    children: markdown
  });
};
//# sourceMappingURL=index.js.map