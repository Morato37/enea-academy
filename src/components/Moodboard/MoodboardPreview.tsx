import type { MoodboardHeader } from '../../lib/moodboard/pdf';
import type { MoodboardPage } from '../../lib/moodboard/types';
import { PAGE } from '../../lib/moodboard/layouts';

export function MoodboardPreview({ page, header, pageNumber }: { page: MoodboardPage; header: MoodboardHeader; pageNumber: number }) {
  const pct = (value: number, total: number) => `${(value / total) * 100}%`;
  return <div className="relative w-full overflow-hidden bg-white shadow ring-1 ring-gray-200" style={{ aspectRatio: `${PAGE.w}/${PAGE.h}` }}>
    <div className="absolute right-[3%] top-[4%] text-right text-xs text-gray-600"><img src="/enea-logo%20copy.png" alt="enea landscape design" className="ml-auto w-32" /><div>{[header.project, header.concept, header.area].filter(Boolean).join(' | ')}</div></div>
    {page.layout.columns.map(column => { const first = page.layout.slots.find(slot => slot.column === column.key); return first && column.label ? <span key={column.key} className="absolute text-[10px] text-gray-600" style={{ left: pct(first.x, PAGE.w), top: '17%' }}>{column.label}</span> : null; })}
    {page.layout.slots.map(slot => { const assignment = page.slots.find(item => item.slotId === slot.id); return <div key={slot.id} className="absolute overflow-hidden bg-gray-100" style={{ left: pct(slot.x, PAGE.w), top: pct(slot.y, PAGE.h), width: pct(slot.w, PAGE.w), height: pct(slot.h, PAGE.h) }}>{assignment?.image && <img src={assignment.image.url} alt={assignment.plant?.botanicalName || ''} className="h-full w-full object-cover" />}</div>; })}
    <span className="absolute bottom-[3%] left-[3%] text-[9px] text-gray-500">{pageNumber}</span>
  </div>;
}
