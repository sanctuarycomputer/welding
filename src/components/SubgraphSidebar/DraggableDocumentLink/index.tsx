import type { Identifier, XYCoord } from "dnd-core";
import type { FC } from "react";
import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import Link from "next/link";
import slugifyNode from "src/utils/slugifyNode";
import VerticalDots from "src/components/Icons/VerticalDots";
import styles from "./styles.module.css";
import { BaseNode } from "src/types";

type Props = {
  id: string;
  node: BaseNode;
  subgraph: BaseNode;
  isStashed: boolean;
  isCurrent: boolean;
  index: number;
  move: Function;
};

interface DragItem {
  index: number
  id: string
  type: string
};

const DraggableDocumentLink: FC<Props> = ({
  id,
  node,
  subgraph,
  isStashed,
  isCurrent,
  index,
  move,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: "DraggableDocumentLink",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      move(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [, drag] = useDrag({
    type: "DraggableDocumentLink",
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));
  return (
    <div
      ref={ref}
      className={`${styles.DraggableDocumentLink} flex items-center`}
      data-handler-id={handlerId}
    >
      <div className={`${styles.handle} cursor-ns-resize`}>
        <VerticalDots />
      </div>
      {isCurrent ? (
        <p className="text-xs font-semibold pb-1">
          {isStashed ? "↗ " : ""}
          {node.currentRevision.metadata.properties.emoji.native}{" "}
          {node.currentRevision.metadata.name}
        </p>
      ) : (
        <Link href={`/${slugifyNode(subgraph)}/${slugifyNode(node)}`}>
          <a className="text-xs pb-1">
            {isStashed ? "↗ " : ""}
            {node.currentRevision.metadata.properties.emoji.native}{" "}
            {node.currentRevision.metadata.name}
          </a>
        </Link>
      )}
    </div>
  );
};

export default DraggableDocumentLink;
