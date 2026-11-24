import type { ReactNode } from "react";
import { RichTextPreview } from "../animation-book/components/RequirementRichText";
import banner from "./assets/note-banner.png";
import { blockLabel, layoutFields, type LayoutId, type NoteBlock, type NoteEntry } from "./notes";

export function NoteBanner() {
  return <img className="ln-banner" src={banner} alt="今日笔记 · 庄子成语：庖丁解牛" width={300} height={136} />;
}

export function NoteHeading({ index, label }: { index: number; label: string }) {
  return <><span>{index + 1}</span><span>{label}</span></>;
}

export function NotePhoto({ photo }: Pick<NoteEntry, "photo">) {
  return photo?.source ? <img className="ln-note-photo" src={photo.source} alt={photo.name || "配图"} /> : null;
}

export function Vocabulary({ entry, layout, photoSlot }: { entry: NoteEntry; layout: LayoutId; photoSlot?: ReactNode }) {
  const word = entry.word?.trim() ?? "";
  const characters = Array.from(word);
  const syllables = entry.pinyin?.trim().split(/\s+/).filter(Boolean) ?? [];
  const fields = layoutFields(layout).filter((field) => (
    field === "photo" ? Boolean(photoSlot || entry.photo?.source) : Boolean(entry.meaning?.trim() || entry.example?.trim())
  ));

  if (!word && !syllables.length && fields.length === 0) return null;

  return (
    <div className="ln-vocabulary">
      {characters.length === syllables.length && characters.length > 0 ? (
        <div className="ln-word">
          {characters.map((character, index) => (
            <ruby key={index}>{character}<rt>{syllables[index]}</rt></ruby>
          ))}
        </div>
      ) : (
        <div className="ln-word">
          {syllables.length > 0 && <span className="ln-pinyin">{entry.pinyin}</span>}
          {word && <span>{word}</span>}
        </div>
      )}
      {fields.length > 0 && (
        <div className="ln-note-entry ln-content-layout" data-layout={layout} data-paired={fields.length === 2}>
          {fields.map((field) => field === "photo" ? (photoSlot ?? <NotePhoto key={field} photo={entry.photo} />) : (
            <div className="ln-vocabulary-copy" key={field}>
              {entry.meaning?.trim() && <p><span>义</span>{entry.meaning}</p>}
              {entry.example?.trim() && <p><span>例</span>{entry.example}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotePreview({ blocks }: { blocks: NoteBlock[] }) {
  return (
    <article className="ln-note" aria-label="今日笔记">
      <NoteBanner />
      <div className="ln-note-body">
        {blocks.map((block, index) => (
          <section className="ln-note-section" key={block.id}>
            <h2 className="ln-note-title"><NoteHeading index={index} label={blockLabel(block.id)} /></h2>
            {block.entries.map((entry) => {
              if (block.id === "words") return <Vocabulary key={entry.id} entry={entry} layout={block.wordLayout ?? "text-top"} />;
              const fields = layoutFields(block.layout).filter((field) => (
                field === "photo" ? Boolean(entry.photo?.source) : Boolean(entry.richText?.text)
              ));
              if (fields.length === 0) return null;

              return (
                <div key={entry.id} className="ln-note-entry ln-content-layout" data-layout={block.layout} data-paired={fields.length === 2}>
                  {fields.map((field) => field === "photo" ? <NotePhoto key={field} photo={entry.photo} /> : (
                    entry.richText && <RichTextPreview key={field} value={entry.richText} />
                  ))}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </article>
  );
}
