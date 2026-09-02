package com.swmansion.enriched.markdown.spans

import android.graphics.Rect
import android.text.TextPaint
import android.text.style.MetricAffectingSpan
import kotlin.math.roundToInt

class BaselineShiftSpan(
  private val fontScale: Float,
  private val baselineOffsetScale: Float,
  val spanType: SpanType,
) : MetricAffectingSpan() {
  enum class SpanType { SUPERSCRIPT, SUBSCRIPT, LINK_VARIANT }

  override fun updateDrawState(tp: TextPaint) {
    applyShift(tp)
  }

  override fun updateMeasureState(tp: TextPaint) {
    applyShift(tp)
  }

  // A chip label's size is absolute, captured from the block style at render
  // time: relative multiplication is not idempotent, and span application
  // order varies between contexts (list items re-order copied spans), which
  // rendered some labels unscaled.
  var absoluteLabelSizePx: Float = 0f

  private var chipLiftPx: Float = UNMEASURED
  private val capBounds = Rect()

  private fun applyShift(tp: TextPaint) {
    if (spanType == SpanType.LINK_VARIANT && absoluteLabelSizePx > 0f) {
      if (chipLiftPx == UNMEASURED && tp.textSize != absoluteLabelSizePx) {
        chipLiftPx = capMidlineLift(tp)
      }
      tp.textSize = absoluteLabelSizePx
      if (chipLiftPx != UNMEASURED) {
        tp.baselineShift -= chipLiftPx.roundToInt()
      }
      return
    }
    val originalTextSize = tp.textSize
    tp.textSize = originalTextSize * fontScale
    tp.baselineShift -= (originalTextSize * baselineOffsetScale).roundToInt()
  }

  // The lift lands the label's cap midline on the block font's cap midline —
  // the same anchor PillBackgroundSpan centres the pill on — so the label is
  // centred in the pill for any fontScale. Measured from the run's own paint
  // (still block-sized on entry) so both use the same typeface.
  private fun capMidlineLift(tp: TextPaint): Float {
    tp.getTextBounds("X", 0, 1, capBounds)
    val blockCap = capBounds.height().toFloat()
    val labelPaint = TextPaint(tp)
    labelPaint.textSize = absoluteLabelSizePx
    labelPaint.getTextBounds("X", 0, 1, capBounds)
    val labelCap = capBounds.height().toFloat()
    return (blockCap - labelCap) / 2f
  }

  private companion object {
    const val UNMEASURED = Float.MIN_VALUE
  }
}
