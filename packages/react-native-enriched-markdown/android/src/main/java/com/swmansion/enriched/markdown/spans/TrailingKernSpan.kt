package com.swmansion.enriched.markdown.spans

import android.text.TextPaint
import android.text.style.MetricAffectingSpan

/**
 * Reserves advance width after the character it spans (applied to a pill's
 * last character) so the pill's horizontal padding has room before the next
 * glyph — the Android counterpart of the iOS renderer's trailing NSKern.
 * letterSpacing is em-based, hence the division by the current text size.
 */
class TrailingKernSpan(
  private val kernPx: Float,
) : MetricAffectingSpan() {
  override fun updateMeasureState(tp: TextPaint) = applyKern(tp)

  override fun updateDrawState(tp: TextPaint) = applyKern(tp)

  private fun applyKern(tp: TextPaint) {
    if (tp.textSize > 0f) tp.letterSpacing += kernPx / tp.textSize
  }
}
