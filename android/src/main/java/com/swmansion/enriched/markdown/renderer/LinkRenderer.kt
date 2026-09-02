package com.swmansion.enriched.markdown.renderer

import android.text.SpannableStringBuilder
import com.swmansion.enriched.markdown.parser.MarkdownASTNode
import com.swmansion.enriched.markdown.spans.BaselineShiftSpan
import com.swmansion.enriched.markdown.spans.LinkSpan
import com.swmansion.enriched.markdown.spans.PillBackgroundSpan
import com.swmansion.enriched.markdown.spans.TrailingKernSpan
import com.swmansion.enriched.markdown.utils.text.span.SPAN_FLAGS_EXCLUSIVE_EXCLUSIVE

class LinkRenderer(
  private val config: RendererConfig,
) : NodeRenderer {
  override fun render(
    node: MarkdownASTNode,
    builder: SpannableStringBuilder,
    onLinkPress: ((String) -> Unit)?,
    onLinkLongPress: ((String) -> Unit)?,
    factory: RendererFactory,
  ) {
    val url = node.getAttribute("url") ?: return

    factory.renderWithSpan(builder, { factory.renderChildren(node, builder, onLinkPress, onLinkLongPress) }) { start, end, blockStyle ->
      builder.setSpan(
        LinkSpan(url, onLinkPress, onLinkLongPress, factory.styleCache, blockStyle, factory.context),
        start,
        end,
        SPAN_FLAGS_EXCLUSIVE_EXCLUSIVE,
      )

      val variant = factory.styleCache.resolvedVariantForUrl(url)
      if (variant != null && variant.hasPillGeometry) {
        builder.setSpan(PillBackgroundSpan(variant), start, end, SPAN_FLAGS_EXCLUSIVE_EXCLUSIVE)
        if (variant.fontScale != 1f) {
          val labelStart = scaledLabelStart(builder, start, end)
          val labelEnd = scaledLabelEnd(builder, labelStart, end)
          val labelSpan = BaselineShiftSpan(variant.fontScale, 0f, BaselineShiftSpan.SpanType.LINK_VARIANT)
          labelSpan.absoluteLabelSizePx = blockStyle.fontSize * variant.fontScale
          builder.setSpan(labelSpan, labelStart, labelEnd, SPAN_FLAGS_EXCLUSIVE_EXCLUSIVE)
        }
        if (variant.trailingKernPx > 0f && end > start) {
          builder.setSpan(TrailingKernSpan(variant.trailingKernPx), end - 1, end, SPAN_FLAGS_EXCLUSIVE_EXCLUSIVE)
        }
      }
    }
  }
}

// Whitespace at a chip's boundaries (the composer's non-breaking pads) keeps
// the block font, mirroring the iOS renderer: full-size boundary glyphs pin
// the line's metrics so a chip alone on a line does not sag or overflow.
private val CHIP_PADS = charArrayOf(' ', '\u00A0', '\u202F', '\u2009', '\u200B', '\u2060')

private fun scaledLabelStart(
  text: CharSequence,
  start: Int,
  end: Int,
): Int {
  var index = start
  while (index < end && text[index] in CHIP_PADS) index++
  return if (index < end) index else start
}

private fun scaledLabelEnd(
  text: CharSequence,
  start: Int,
  end: Int,
): Int {
  var index = end
  while (index > start && text[index - 1] in CHIP_PADS) index--
  return if (index > start) index else end
}
