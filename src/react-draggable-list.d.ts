declare module "react-draggable-list" {
  import * as React from "react";

  export type TemplateProps<I, C = unknown> = {
    item: I;
    itemSelected: number;
    anySelected: number;
    dragHandleProps: React.HTMLAttributes<HTMLElement>;
    commonProps: C;
  };

  interface DraggableListProps<I, C = unknown> {
    itemKey: string | ((item: I) => string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    template: any;
    list: ReadonlyArray<I>;
    onMoveEnd?: (
      newList: ReadonlyArray<I>,
      movedItem: I,
      oldIndex: number,
      newIndex: number
    ) => void;
    container?: () => HTMLElement | null;
    constrainDrag?: boolean;
    springConfig?: object;
    padding?: number;
    unsetZIndex?: boolean;
    autoScrollMaxSpeed?: number;
    autoScrollRegionSize?: number;
    commonProps?: C;
  }

  export default class DraggableList<I, C = unknown> extends React.Component<
    DraggableListProps<I, C>
  > {}
}
