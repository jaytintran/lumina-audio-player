import type { Modifier } from '@dnd-kit/core';

export const snapCenterToCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  overlayNodeRect,
  transform,
}) => {
  if (
    activatorEvent &&
    activeNodeRect &&
    'clientX' in activatorEvent &&
    'clientY' in activatorEvent
  ) {
    const mouseX = (activatorEvent as MouseEvent).clientX;
    const mouseY = (activatorEvent as MouseEvent).clientY;
    const width = overlayNodeRect ? overlayNodeRect.width : activeNodeRect.width;
    const height = overlayNodeRect ? overlayNodeRect.height : activeNodeRect.height;
    const originX = activeNodeRect.left + width / 2;
    const originY = activeNodeRect.top + height / 2;
    return {
      ...transform,
      x: transform.x + (mouseX - originX),
      y: transform.y + (mouseY - originY),
    };
  }
  return transform;
};
