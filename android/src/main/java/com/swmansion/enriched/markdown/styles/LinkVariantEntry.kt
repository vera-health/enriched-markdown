package com.swmansion.enriched.markdown.styles

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.PixelUtil

/**
 * Resolved style for a single URL-pattern variant.
 * The `pattern` field is a regex tested against the full URL in normalized order.
 * Fields are pre-merged with the base link style by the JS normalizer — native code
 * uses them directly without any additional fallback logic.
 *
 * The geometry fields (border, radius, padding — stored in px, converted from dp
 * at parse) turn the variant into an inline pill; with all of them at 0 the
 * variant renders exactly as before. Scale fields are ratios and carry no unit.
 */
data class LinkVariantEntry(
  val pattern: String,
  val color: Int,
  val underline: Boolean,
  val backgroundColor: Int,
  val borderColor: Int = 0,
  val borderWidth: Float = 0f,
  val borderRadius: Float = 0f,
  val paddingHorizontal: Float = 0f,
  val paddingVertical: Float = 0f,
  val fontScale: Float = 1f,
) {
  val hasPillGeometry: Boolean
    get() = borderWidth > 0f || borderRadius > 0f || paddingHorizontal > 0f || paddingVertical > 0f

  // Must exceed 2x the horizontal padding, or two adjacent pills draw into one
  // another; background drawing adds no advance width. Mirrors the iOS renderer.
  val trailingKernPx: Float
    get() = if (paddingHorizontal > 0f) paddingHorizontal * 2f + PixelUtil.toPixelFromDIP(2f) else 0f

  companion object {
    fun fromReadableMap(
      map: ReadableMap,
      parser: StyleParser,
    ): LinkVariantEntry =
      LinkVariantEntry(
        pattern = map.getString("pattern") ?: "",
        color = parser.parseColor(map, "color"),
        underline = parser.parseBoolean(map, "underline"),
        backgroundColor = parser.parseColor(map, "backgroundColor"),
        borderColor = parser.parseOptionalColor(map, "borderColor") ?: 0,
        borderWidth = PixelUtil.toPixelFromDIP(parser.parseOptionalDouble(map, "borderWidth").toFloat()),
        borderRadius = PixelUtil.toPixelFromDIP(parser.parseOptionalDouble(map, "borderRadius").toFloat()),
        paddingHorizontal = PixelUtil.toPixelFromDIP(parser.parseOptionalDouble(map, "paddingHorizontal").toFloat()),
        paddingVertical = PixelUtil.toPixelFromDIP(parser.parseOptionalDouble(map, "paddingVertical").toFloat()),
        fontScale = parser.parseOptionalDouble(map, "fontScale", 1.0).toFloat().let { if (it > 0f) it else 1f },
      )
  }
}
