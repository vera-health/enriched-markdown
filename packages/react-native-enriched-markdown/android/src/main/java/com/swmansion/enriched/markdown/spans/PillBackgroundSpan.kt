package com.swmansion.enriched.markdown.spans

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import android.text.style.LeadingMarginSpan
import android.text.style.LineBackgroundSpan
import com.swmansion.enriched.markdown.styles.LinkVariantEntry
import kotlin.math.max
import kotlin.math.min

/**
 * Draws a rounded, optionally bordered pill behind a link variant's range —
 * the chip form of the plain background highlight. Single-line by contract:
 * chip labels are composed with non-breaking joins, so the multi-line
 * open-border handling of [CodeBackgroundSpan] is deliberately absent.
 *
 * One shared anchor rules the chip: the block font's cap midline above the
 * line baseline. The pill — sized to the label's cap height plus vertical
 * padding — centres on it here, and [BaselineShiftSpan] lifts the label so
 * its cap midline lands on it too, so the label is centred in the pill for
 * any fontScale and vertical padding grows over and under the line
 * symmetrically. The range's trailing kern (see [TrailingKernSpan]) is
 * advance, not text, so it is subtracted to keep the pill symmetric about
 * its label.
 */
class PillBackgroundSpan(
  private val variant: LinkVariantEntry,
) : LineBackgroundSpan {
  companion object {
    private val sharedBackgroundPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val sharedBorderPaint =
      Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeJoin = Paint.Join.ROUND
        strokeCap = Paint.Cap.ROUND
      }
  }

  private val rect = RectF()
  private val capBounds = Rect()

  override fun drawBackground(
    canvas: Canvas,
    p: Paint,
    left: Int,
    right: Int,
    top: Int,
    baseline: Int,
    bottom: Int,
    text: CharSequence,
    start: Int,
    end: Int,
    lineNum: Int,
  ) {
    if (text !is Spanned) return

    val spanStart = text.getSpanStart(this)
    val spanEnd = text.getSpanEnd(this)
    if (spanStart !in 0 until spanEnd) return

    val drawStart = max(spanStart, start)
    val drawEnd = min(spanEnd, end)
    if (drawStart >= drawEnd) return

    val leadingMargin = leadingMarginAt(text, start)
    val startX = getHorizontalOffset(text, start, end, drawStart, p, leadingMargin) + left
    var endX = getHorizontalOffset(text, start, end, drawEnd, p, leadingMargin) + left

    if (drawEnd == spanEnd) endX -= variant.trailingKernPx
    if (endX <= startX) return

    val labelSize = p.textSize * variant.fontScale
    val labelPaint = TextPaint(p)
    labelPaint.textSize = labelSize
    labelPaint.getTextBounds("X", 0, 1, capBounds)
    val labelCap = capBounds.height().toFloat()
    p.getTextBounds("X", 0, 1, capBounds)
    val blockCap = capBounds.height().toFloat()

    val anchorMid = baseline - blockCap / 2f
    val pillHeight = labelCap + variant.paddingVertical * 2f
    rect.set(
      startX - variant.paddingHorizontal,
      anchorMid - pillHeight / 2f,
      endX + variant.paddingHorizontal,
      anchorMid + pillHeight / 2f,
    )

    // A pill that starts or ends a line has less slack than the padding, so
    // clamp into the line bounds: drawing outside clips the cap flat.
    if (rect.left < left) rect.left = left.toFloat()
    if (rect.right > right) rect.right = right.toFloat()
    if (rect.width() <= 0f) return

    val radius = min(variant.borderRadius, rect.height() / 2f)
    if (android.graphics.Color.alpha(variant.backgroundColor) > 0) {
      sharedBackgroundPaint.color = variant.backgroundColor
      canvas.drawRoundRect(rect, radius, radius, sharedBackgroundPaint)
    }
    if (variant.borderWidth > 0f && android.graphics.Color.alpha(variant.borderColor) > 0) {
      sharedBorderPaint.color = variant.borderColor
      sharedBorderPaint.strokeWidth = variant.borderWidth
      canvas.drawRoundRect(rect, radius, radius, sharedBorderPaint)
    }
  }

  private fun getHorizontalOffset(
    text: CharSequence,
    lineStart: Int,
    lineEnd: Int,
    index: Int,
    paint: Paint,
    leadingMargin: Int,
  ): Float {
    if (index <= lineStart) return leadingMargin.toFloat()
    val lineText = text.subSequence(lineStart, lineEnd)
    val textPaint = paint as? TextPaint ?: TextPaint(paint)
    val layout = StaticLayout.Builder.obtain(lineText, 0, lineText.length, textPaint, 10000).build()
    return layout.getPrimaryHorizontal(index - lineStart)
  }

  private fun leadingMarginAt(
    text: Spanned,
    lineStart: Int,
  ): Int {
    if (lineStart >= text.length) return 0
    val spans = text.getSpans(lineStart, lineStart + 1, LeadingMarginSpan::class.java)
    var margin = 0
    for (span in spans) {
      margin += span.getLeadingMargin(false)
    }
    return margin
  }
}
