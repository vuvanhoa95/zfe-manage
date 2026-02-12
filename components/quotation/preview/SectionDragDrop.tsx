'use client';

import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { ReactNode, useState, useEffect } from 'react';

interface Section {
  id: string;
  name: string;
  component: ReactNode;
}

interface SectionDragDropProps {
  sections: Section[];
  order?: string[];
  onOrderChange: (newOrder: string[]) => void;
  isEditing: boolean;
  className?: string;
}

/**
 * SectionDragDrop - Container to allow reordering sections of the quotation
 */
export default function SectionDragDrop({
  sections,
  order,
  onOrderChange,
  isEditing,
  className = '',
}: SectionDragDropProps) {
  const [sortedSections, setSortedSections] = useState<Section[]>([]);

  // Apply order to sections
  useEffect(() => {
    const currentOrder = order || sections.map(s => s.id);
    const sorted = [...sections].sort((a, b) => {
      return currentOrder.indexOf(a.id) - currentOrder.indexOf(b.id);
    });
    setSortedSections(sorted);
  }, [sections, order]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sortedSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSortedSections(items);
    onOrderChange(items.map(i => i.id));
  };

  if (!isEditing) {
    return (
      <div className={className}>
        {sortedSections.map(section => (
          <div key={section.id} id={section.id}>
            {section.component}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="quotation-sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {sortedSections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        relative group transition-all
                        ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 z-50 bg-blue-50' : ''}
                      `}
                    >
                      {/* Drag Handle */}
                      <div 
                        {...provided.dragHandleProps}
                        className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-md cursor-grab text-gray-400 no-print"
                        title="Drag to reorder"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="12" r="1"></circle>
                          <circle cx="9" cy="5" r="1"></circle>
                          <circle cx="9" cy="19" r="1"></circle>
                          <circle cx="15" cy="12" r="1"></circle>
                          <circle cx="15" cy="5" r="1"></circle>
                          <circle cx="15" cy="19" r="1"></circle>
                        </svg>
                      </div>

                      {/* Section Badge (only when editing) */}
                      <div className="absolute -left-2 top-2 no-print">
                        <span className="px-2 py-0.5 bg-gray-100 text-[10px] text-gray-400 rounded uppercase font-bold border border-gray-200">
                          {section.name}
                        </span>
                      </div>

                      <div className={snapshot.isDragging ? 'opacity-80' : ''}>
                        {section.component}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
