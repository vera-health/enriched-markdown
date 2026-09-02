#import "LinkRenderer.h"
#import "BaselineShiftTextAttributes.h"
#import "FontUtils.h"
#import "PillBackground.h"
#import "RenderContext.h"
#import "RendererFactory.h"
#import "StyleConfig.h"
#import <React/RCTFont.h>

// Whitespace at a chip's boundaries (the composer's non-breaking pads) keeps
// the block font: if the scaled label were the tallest thing on its line,
// TextKit would seat that line's baseline lower than its neighbours and the
// whole chip would sag — and overflow the fragment when it is the last line.
static NSRange ENRMScaledLabelRange(NSString *string, NSRange range)
{
  static NSCharacterSet *pads;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken,
                ^{ pads = [NSCharacterSet characterSetWithCharactersInString:@" \u00A0\u202F\u2009\u200B\u2060"]; });
  NSUInteger start = range.location;
  NSUInteger end = NSMaxRange(range);
  while (start < end && [pads characterIsMember:[string characterAtIndex:start]])
    start++;
  while (end > start && [pads characterIsMember:[string characterAtIndex:end - 1]])
    end--;
  return start < end ? NSMakeRange(start, end - start) : range;
}

@implementation LinkRenderer

#pragma mark - Rendering

- (void)renderNodeContent:(MarkdownASTNode *)node
                     into:(NSMutableAttributedString *)output
                  context:(RenderContext *)context
{
  NSUInteger start = output.length;

  // 1. Render children first to establish base attributes
  [_rendererFactory renderChildrenOfNode:node into:output context:context];

  NSRange range = NSMakeRange(start, output.length - start);
  if (range.length == 0)
    return;

  // 2. Extract configuration
  NSString *url = node.attributes[@"url"] ?: @"";
  LinkVariantConfig *variant = [_config effectiveLinkVariantForURL:url];

  RCTUIColor *linkColor = variant.color ?: [_config linkColor];
  BOOL linkUnderline = variant ? variant.underline : [_config linkUnderline];
  NSString *linkFontFamily = [_config linkFontFamily];
  RCTUIColor *backgroundColor = variant ? variant.backgroundColor : [_config linkBackgroundColor];

  NSNumber *underlineStyle = @(linkUnderline ? NSUnderlineStyleSingle : NSUnderlineStyleNone);

  // 3. Apply core link functionality (non-destructive)
  [output addAttribute:NSLinkAttributeName value:url range:range];

  // 4. Optimize visual attributes via enumeration to avoid redundant updates
  [output enumerateAttributesInRange:range
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:^(NSDictionary<NSAttributedStringKey, id> *attrs, NSRange subrange, BOOL *stop) {
                            NSMutableDictionary *newAttributes = [NSMutableDictionary dictionary];

                            // Only apply link color if the subrange isn't already colored by the link style
                            if (linkColor && ![attrs[NSForegroundColorAttributeName] isEqual:linkColor]) {
                              newAttributes[NSForegroundColorAttributeName] = linkColor;
                              newAttributes[NSUnderlineColorAttributeName] = linkColor;
                            }

                            // Only update underline style if it differs from the config
                            if (![attrs[NSUnderlineStyleAttributeName] isEqual:underlineStyle]) {
                              newAttributes[NSUnderlineStyleAttributeName] = underlineStyle;
                            }

                            if (linkFontFamily.length > 0) {
                              UIFont *currentFont = attrs[NSFontAttributeName];
                              if (currentFont) {
                                UIFont *linkFont = [RCTFont updateFont:currentFont
                                                            withFamily:linkFontFamily
                                                                  size:nil
                                                                weight:nil
                                                                 style:nil
                                                               variant:nil
                                                       scaleMultiplier:1.0];
                                if (linkFont && ![currentFont isEqual:linkFont]) {
                                  newAttributes[NSFontAttributeName] = linkFont;
                                }
                              }
                            }

                            if (newAttributes.count > 0) {
                              [output addAttributes:newAttributes range:subrange];
                            }
                          }];

  if (variant && [variant hasPillGeometry]) {
    if (variant.fontScale != 1.0) {
      NSRange labelRange = ENRMScaledLabelRange(output.string, range);
      ENRMApplyBaselineShift(output, labelRange, variant.fontScale, 0.0);
      // The lift lands the label's cap midline on the block font's cap
      // midline — the same anchor the pill pass centres on — so the label is
      // centred in the pill for any fontScale.
      UIFont *blockFont = [output attribute:NSFontAttributeName atIndex:range.location effectiveRange:NULL];
      UIFont *labelFont = [output attribute:NSFontAttributeName
                                    atIndex:labelRange.location + labelRange.length / 2
                             effectiveRange:NULL];
      if (blockFont && labelFont) {
        CGFloat lift = (blockFont.capHeight - labelFont.capHeight) / 2.0;
        if (lift != 0) {
          [output addAttribute:NSBaselineOffsetAttributeName value:@(lift) range:labelRange];
        }
      }
    }

    NSMutableDictionary *pill = [NSMutableDictionary dictionary];
    if (backgroundColor)
      pill[ENRMPillBackgroundColorKey] = backgroundColor;
    if (variant.borderColor)
      pill[ENRMPillBorderColorKey] = variant.borderColor;
    pill[ENRMPillCornerRadiusKey] = @(variant.borderRadius);
    pill[ENRMPillBorderWidthKey] = @(variant.borderWidth);
    pill[ENRMPillPaddingKey] = @(variant.paddingHorizontal);
    pill[ENRMPillVerticalPaddingKey] = @(variant.paddingVertical);

    // Kern only the LAST glyph: NSKern adds space AFTER the character, so
    // kerning the first one would split the label's opening letter off. It
    // must exceed 2x the horizontal padding, or two adjacent pills draw into
    // one another. Background drawing adds no advance width, so without this
    // the padding would overlap the following character.
    CGFloat trailingKern = variant.paddingHorizontal > 0 ? variant.paddingHorizontal * 2 + 2 : 0;
    pill[ENRMPillTrailingKernKey] = @(trailingKern);
    [output addAttribute:ENRMPillAttributeName value:pill range:range];
    if (trailingKern > 0) {
      [output addAttribute:NSKernAttributeName value:@(trailingKern) range:NSMakeRange(NSMaxRange(range) - 1, 1)];
    }
  } else if (backgroundColor) {
    [output addAttribute:NSBackgroundColorAttributeName value:backgroundColor range:range];
  }

  [context registerLinkRange:range url:url];
}

@end