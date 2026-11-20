import type { MoodboardHeader } from '../../lib/moodboard/pdf';
import type { MoodboardPage } from '../../lib/moodboard/types';
import { PAGE } from '../../lib/moodboard/layouts';

interface MoodboardPreviewProps {
  page: MoodboardPage;
  header: MoodboardHeader;
  pageNumber: number;
  /** Highlighted slot (picture picker open). */
  selectedSlotId?: string | null;
  /** Makes the slots clickable, e.g. to swap the picture. */
  onSlotClick?: (slotId: string) => void;
}

export function MoodboardPreview({ page, header, pageNumber, selectedSlotId, onSlotClick }: MoodboardPreviewProps) {
  const pct = (value: number, total: number) => `${(value / total) * 100}%`;
  return (
    <div className="relative w-full overflow-hidden bg-white shadow ring-1 ring-gray-200" style={{ aspectRatio: `${PAGE.w}/${PAGE.h}` }}>
      <div className="absolute right-[3%] top-[4%] text-right text-xs text-gray-600">
        <img src="/enea-logo%20copy.png" alt="enea landscape design" className="ml-auto w-32" />
        <div>{[header.project, header.concept, header.area].filter(Boolean).join(' | ')}</div>
      </div>

      {page.layout.columns.map(column => {
        const first = page.layout.slots.find(slot => slot.column === column.key);
        return first && column.label ? (
          <span key={column.key} className="absolute text-[10px] text-gray-600" style={{ left: pct(first.x, PAGE.w), top: '17%' }}>
            {column.label}
          </span>
        ) : null;
      })}

      {page.layout.slots.map(slot => {
        const assignment = page.slots.find(item => item.slotId === slot.id);
        const selected = slot.id === selectedSlotId;
        const title = assignment?.plant ? assignment.plant.botanicalName : 'Leeres Feld';
        const style = { left: pct(slot.x, PAGE.w), top: pct(slot.y, PAGE.h), width: pct(slot.w, PAGE.w), height: pct(slot.h, PAGE.h) };
        const content = assignment?.image
          ? <img src={assignment.image.url} alt={title} loading="lazy" className="h-full w-full object-cover" />
          : onSlotClick ? <span className="flex h-full items-center justify-center text-[10px] text-gray-400">+ Bild</span> : null;
        const className = `absolute overflow-hidden bg-gray-100 ${selected ? 'ring-4 ring-emerald-600 z-10' : ''}`;
        return onSlotClick ? (
          <button key={slot.id} type="button" title={`${title} – klicken zum Tauschen`} onClick={() => onSlotClick(slot.id)}
            className={`${className} cursor-pointer hover:ring-2 hover:ring-emerald-500`} style={style}>
            {content}
          </button>
        ) : (
          <div key={slot.id} title={title} className={className} style={style}>{content}</div>
        );
      })}

      <span className="absolute bottom-[3%] left-[3%] text-[9px] text-gray-500">{pageNumber}</span>
    </div>
  );
}
