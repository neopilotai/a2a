/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as d3 from 'd3';

export interface ViewportTransform {
  x: number;
  y: number;
  k: number;
}

export interface GraphNodePosition {
  id: string;
  x?: number;
  y?: number;
  group?: number;
  category?: string;
  importance?: string;
  diffStatus?: string;
}

export interface GraphBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Creates a standard high-precision, smooth wheel delta function for D3 Zoom.
 * Handles both smooth trackpad gestures and notched mouse wheels without jumping.
 */
export function createSmoothWheelDelta() {
  return (event: WheelEvent) => {
    // Detect standard delta modes: 0=pixels, 1=lines, 2=pages
    const normalizedDelta = -event.deltaY * (
      event.deltaMode === 1 ? 0.05 : 
      event.deltaMode === 2 ? 1.0 : 
      0.002
    );
    // Clamp per-event factor for buttery-smooth feel
    return Math.max(-0.5, Math.min(0.5, normalizedDelta));
  };
}

/**
 * Computes the geometric bounding box for a set of positioned graph nodes.
 */
export function computeGraphBounds(nodes: GraphNodePosition[]): GraphBoundingBox | null {
  const positionedNodes = nodes.filter(n => typeof n.x === 'number' && typeof n.y === 'number');
  if (positionedNodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of positionedNodes) {
    const x = n.x!;
    const y = n.y!;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  // Add minimum padding if nodes are clustered tightly
  if (maxX - minX < 60) {
    minX -= 30;
    maxX += 30;
  }
  if (maxY - minY < 60) {
    minY -= 30;
    maxY += 30;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  return { minX, minY, maxX, maxY, width, height, centerX, centerY };
}

/**
 * Computes the ideal transform to fit all nodes smoothly into the container with padding.
 */
export function calculateFitTransform(
  bounds: GraphBoundingBox,
  containerWidth: number,
  containerHeight: number,
  padding: number = 48,
  maxScale: number = 1.6,
  minScale: number = 0.15
): ViewportTransform {
  const availableWidth = Math.max(100, containerWidth - padding * 2);
  const availableHeight = Math.max(100, containerHeight - padding * 2);

  const scaleX = availableWidth / bounds.width;
  const scaleY = availableHeight / bounds.height;
  let k = Math.min(scaleX, scaleY);

  // Clamp scale
  k = Math.max(minScale, Math.min(maxScale, k));

  // Center the bounding box center in the viewport
  const x = containerWidth / 2 - bounds.centerX * k;
  const y = containerHeight / 2 - bounds.centerY * k;

  return { x, y, k };
}

/**
 * Smoothly animates D3 zoom behavior to fit the specified bounding box.
 */
export function smoothFitToBounds(
  svgElement: SVGSVGElement | null,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null,
  bounds: GraphBoundingBox,
  containerWidth: number,
  containerHeight: number,
  duration: number = 550,
  padding: number = 48
) {
  if (!svgElement || !zoomBehavior) return;

  const target = calculateFitTransform(bounds, containerWidth, containerHeight, padding);
  const transform = d3.zoomIdentity.translate(target.x, target.y).scale(target.k);

  d3.select(svgElement)
    .transition()
    .duration(duration)
    .ease(d3.easeCubicOut)
    .call(zoomBehavior.transform, transform);
}

/**
 * Smoothly centers and zooms in on a specific node coordinate with spatial awareness easing.
 */
export function smoothFocusOnNode(
  svgElement: SVGSVGElement | null,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null,
  nodeX: number,
  nodeY: number,
  containerWidth: number,
  containerHeight: number,
  targetScale: number = 1.35,
  duration: number = 650
) {
  if (!svgElement || !zoomBehavior) return;

  const targetX = containerWidth / 2 - nodeX * targetScale;
  const targetY = containerHeight / 2 - nodeY * targetScale;
  const transform = d3.zoomIdentity.translate(targetX, targetY).scale(targetScale);

  d3.select(svgElement)
    .transition('spatial-focus')
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .call(zoomBehavior.transform, transform);
}

/**
 * Smoothly animates D3 zoom and pan with a spatial awareness trajectory.
 * When the camera travels across the graph to focus on a specific file or module,
 * it applies a smooth camera curve that preserves the user's mental map and spatial context.
 */
export function smoothSpatialFocusTransition(
  svgElement: SVGSVGElement | null,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null,
  nodeX: number,
  nodeY: number,
  containerWidth: number,
  containerHeight: number,
  targetScale: number = 1.45,
  duration: number = 750,
  onComplete?: () => void
) {
  if (!svgElement || !zoomBehavior) return;

  const currentTransform = d3.zoomTransform(svgElement);
  const startX = currentTransform.x;
  const startY = currentTransform.y;

  const finalX = containerWidth / 2 - nodeX * targetScale;
  const finalY = containerHeight / 2 - nodeY * targetScale;

  const dx = finalX - startX;
  const dy = finalY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Dynamic duration scaling with distance to feel natural and buttery-smooth
  const adjustedDuration = Math.min(1100, Math.max(580, Math.round(duration + dist * 0.25)));
  const transform = d3.zoomIdentity.translate(finalX, finalY).scale(targetScale);

  d3.select(svgElement)
    .transition('spatial-focus-anim')
    .duration(adjustedDuration)
    .ease(d3.easeCubicInOut)
    .call(zoomBehavior.transform, transform)
    .on('end', () => {
      if (onComplete) onComplete();
    });
}

/**
 * Smoothly fits and frames a specific file and its direct 1st-degree caller/dependency neighborhood
 * with spatial awareness padding and smooth camera interpolation.
 */
export function smoothSpatialNeighborhoodTransition(
  svgElement: SVGSVGElement | null,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null,
  bounds: GraphBoundingBox,
  containerWidth: number,
  containerHeight: number,
  duration: number = 780,
  padding: number = 88,
  maxScale: number = 1.5,
  minScale: number = 0.45,
  onComplete?: () => void
) {
  if (!svgElement || !zoomBehavior) return;

  const target = calculateFitTransform(bounds, containerWidth, containerHeight, padding, maxScale, minScale);
  const currentTransform = d3.zoomTransform(svgElement);

  const dx = target.x - currentTransform.x;
  const dy = target.y - currentTransform.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const adjustedDuration = Math.min(1200, Math.max(620, Math.round(duration + dist * 0.28)));

  const transform = d3.zoomIdentity.translate(target.x, target.y).scale(target.k);

  d3.select(svgElement)
    .transition('spatial-neighborhood-anim')
    .duration(adjustedDuration)
    .ease(d3.easeCubicInOut)
    .call(zoomBehavior.transform, transform)
    .on('end', () => {
      if (onComplete) onComplete();
    });
}

/**
 * Smoothly pans the viewport by relative delta x and delta y.
 */
export function smoothPanBy(
  svgElement: SVGSVGElement | null,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null,
  currentTransform: ViewportTransform,
  dx: number,
  dy: number,
  duration: number = 220
) {
  if (!svgElement || !zoomBehavior) return;

  const newTransform = d3.zoomIdentity
    .translate(currentTransform.x + dx, currentTransform.y + dy)
    .scale(currentTransform.k);

  d3.select(svgElement)
    .transition()
    .duration(duration)
    .ease(d3.easeQuadOut)
    .call(zoomBehavior.transform, newTransform);
}

/**
 * Smoothly scales the viewport by factor (e.g. 1.3 for zoom in, 0.75 for zoom out).
 */
export function smoothScaleBy(
  svgElement: SVGSVGElement | null,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null,
  factor: number,
  duration: number = 240
) {
  if (!svgElement || !zoomBehavior) return;

  d3.select(svgElement)
    .transition()
    .duration(duration)
    .ease(d3.easeQuadOut)
    .call(zoomBehavior.scaleBy, factor);
}

/**
 * Smoothly sets absolute scale factor while keeping the center intact.
 */
export function smoothSetScale(
  svgElement: SVGSVGElement | null,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null,
  currentTransform: ViewportTransform,
  containerWidth: number,
  containerHeight: number,
  newScale: number,
  duration: number = 320
) {
  if (!svgElement || !zoomBehavior) return;

  // Find center in graph coordinates
  const centerX = (containerWidth / 2 - currentTransform.x) / currentTransform.k;
  const centerY = (containerHeight / 2 - currentTransform.y) / currentTransform.k;

  const newX = containerWidth / 2 - centerX * newScale;
  const newY = containerHeight / 2 - centerY * newScale;

  const transform = d3.zoomIdentity.translate(newX, newY).scale(newScale);

  d3.select(svgElement)
    .transition()
    .duration(duration)
    .ease(d3.easeCubicOut)
    .call(zoomBehavior.transform, transform);
}
