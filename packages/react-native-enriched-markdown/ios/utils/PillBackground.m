#import "PillBackground.h"

NSString *const ENRMPillAttributeName = @"ENRMPill";
NSString *const ENRMPillBackgroundColorKey = @"bg";
NSString *const ENRMPillBorderColorKey = @"border";
NSString *const ENRMPillCornerRadiusKey = @"radius";
NSString *const ENRMPillBorderWidthKey = @"borderWidth";
NSString *const ENRMPillPaddingKey = @"padding";
NSString *const ENRMPillVerticalPaddingKey = @"vPadding";
NSString *const ENRMPillTrailingKernKey = @"trailingKern";

@implementation ENRMPillBackground

- (void)drawBackgroundsForGlyphRange:(NSRange)glyphsToShow
                       layoutManager:(NSLayoutManager *)layoutManager
                       textContainer:(NSTextContainer *)textContainer
                             atPoint:(CGPoint)origin
{
  NSTextStorage *textStorage = layoutManager.textStorage;
  if (!textStorage)
    return;

  NSRange charRange = [layoutManager characterRangeForGlyphRange:glyphsToShow actualGlyphRange:NULL];
  if (charRange.location == NSNotFound || charRange.length == 0)
    return;

  [textStorage enumerateAttribute:ENRMPillAttributeName
                          inRange:NSMakeRange(0, textStorage.length)
                          options:0
                       usingBlock:^(id value, NSRange range, BOOL *stop) {
                         if (![value isKindOfClass:[NSDictionary class]] || range.length == 0)
                           return;
                         if (NSIntersectionRange(range, charRange).length == 0)
                           return;
                         [self drawPillForRange:range
                                          style:(NSDictionary *)value
                                  layoutManager:layoutManager
                                  textContainer:textContainer
                                        atPoint:origin];
                       }];
}

- (void)drawPillForRange:(NSRange)range
                   style:(NSDictionary *)style
           layoutManager:(NSLayoutManager *)layoutManager
           textContainer:(NSTextContainer *)textContainer
                 atPoint:(CGPoint)origin
{
  NSRange glyphRange = [layoutManager glyphRangeForCharacterRange:range actualCharacterRange:NULL];
  if (glyphRange.location == NSNotFound || glyphRange.length == 0)
    return;

  UIColor *background = style[ENRMPillBackgroundColorKey];
  UIColor *border = style[ENRMPillBorderColorKey];
  CGFloat radius = [style[ENRMPillCornerRadiusKey] doubleValue];
  CGFloat borderWidth = [style[ENRMPillBorderWidthKey] doubleValue];
  CGFloat padding = [style[ENRMPillPaddingKey] doubleValue];
  CGFloat vPadding = [style[ENRMPillVerticalPaddingKey] doubleValue];
  CGFloat trailingKern = [style[ENRMPillTrailingKernKey] doubleValue];

  // One shared anchor rules the chip: the block font's cap midline above the
  // line baseline. The pill centres on it here, and LinkRenderer lifts the
  // label so its cap midline lands on it too — so the label is centred in the
  // pill for any fontScale, and vertical padding grows over and under the
  // line symmetrically. The label font (mid-range, inside the pads) sizes the
  // pill; the block font (the leading pad) places it.
  NSUInteger labelCharIndex = range.location + range.length / 2;
  UIFont *labelFont = [layoutManager.textStorage attribute:NSFontAttributeName
                                                   atIndex:labelCharIndex
                                            effectiveRange:NULL];
  UIFont *anchorFont =
      [layoutManager.textStorage attribute:NSFontAttributeName atIndex:range.location effectiveRange:NULL] ?: labelFont;
  if (!labelFont)
    return;

  [layoutManager
      enumerateEnclosingRectsForGlyphRange:glyphRange
                  withinSelectedGlyphRange:NSMakeRange(NSNotFound, 0)
                           inTextContainer:textContainer
                                usingBlock:^(CGRect rect, BOOL *stop) {
                                  CGRect box = CGRectOffset(rect, origin.x, origin.y);

                                  // Trailing kern is advance, not text: drop it
                                  // so the pill is symmetric about its label.
                                  box.size.width -= trailingKern;
                                  if (box.size.width <= 0)
                                    return;

                                  // The leading pad glyph carries no baseline
                                  // offset, so its location is the line's true
                                  // baseline whether or not the layout manager
                                  // folds offsets into glyph locations.
                                  NSUInteger anchorGlyph = glyphRange.location;
                                  CGRect lineRect = [layoutManager lineFragmentRectForGlyphAtIndex:anchorGlyph
                                                                                    effectiveRange:NULL];
                                  CGPoint glyphLoc = [layoutManager locationForGlyphAtIndex:anchorGlyph];
                                  CGFloat baselineY = lineRect.origin.y + origin.y + glyphLoc.y;
                                  CGFloat anchorMid = baselineY - anchorFont.capHeight / 2.0;
                                  CGFloat height = labelFont.capHeight + vPadding * 2.0;

                                  box.origin.y = anchorMid - height / 2.0;
                                  box.size.height = height;
                                  box = CGRectInset(box, -padding, 0);

                                  // A chip that starts or ends a line has less
                                  // slack than `padding`, so clamp into the line
                                  // fragment: drawing outside it clips the cap
                                  // flat instead of rounding it.
                                  CGRect lineBox = CGRectOffset(lineRect, origin.x, origin.y);
                                  CGFloat minX = CGRectGetMinX(lineBox);
                                  CGFloat maxX = CGRectGetMaxX(lineBox);
                                  if (CGRectGetMinX(box) < minX) {
                                    box.size.width -= (minX - CGRectGetMinX(box));
                                    box.origin.x = minX;
                                  }
                                  if (CGRectGetMaxX(box) > maxX) {
                                    box.size.width = maxX - CGRectGetMinX(box);
                                  }
                                  if (box.size.width <= 0)
                                    return;

                                  CGFloat r = MIN(radius, box.size.height / 2.0);
                                  UIBezierPath *path = [UIBezierPath bezierPathWithRoundedRect:box cornerRadius:r];
                                  if (background) {
                                    [background setFill];
                                    [path fill];
                                  }
                                  if (border && borderWidth > 0) {
                                    [border setStroke];
                                    path.lineWidth = borderWidth;
                                    [path stroke];
                                  }
                                }];
}

@end
