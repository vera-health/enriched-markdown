#import <UIKit/UIKit.h>

// Attribute value is a dictionary carrying the pill's own geometry, so several
// variants can coexist in one document.
extern NSString *const ENRMPillAttributeName;
extern NSString *const ENRMPillBackgroundColorKey;
extern NSString *const ENRMPillBorderColorKey;
extern NSString *const ENRMPillCornerRadiusKey;
extern NSString *const ENRMPillBorderWidthKey;
extern NSString *const ENRMPillPaddingKey;
extern NSString *const ENRMPillVerticalPaddingKey;
// The enclosing rect includes the range's trailing kern, so the drawer has to
// subtract it or the pill runs wide to the right of its own text.
extern NSString *const ENRMPillTrailingKernKey;

@interface ENRMPillBackground : NSObject

- (void)drawBackgroundsForGlyphRange:(NSRange)glyphsToShow
                       layoutManager:(NSLayoutManager *)layoutManager
                       textContainer:(NSTextContainer *)textContainer
                             atPoint:(CGPoint)origin;

@end
