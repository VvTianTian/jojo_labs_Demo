import { Toolbar } from "../Toolbar/Toolbar";
import { PageList } from "../Sidebar/PageList";
import { PageCanvas } from "../Canvas/PageCanvas";
import { CoverCanvas } from "../Canvas/CoverCanvas";
import { CoverSettings } from "../Settings/CoverSettings";
import { TextBlockSettings } from "../Settings/TextBlockSettings";
import { ImageSettings } from "../Settings/ImageSettings";
import { PageNarrationSettings } from "../Settings/PageNarrationSettings";
import { BottomActionBar } from "../common/BottomActionBar";
import { useBookStore } from "../../store/useBookStore";

export function EditorLayout() {
  const { book } = useBookStore();
  const isCoverView = book.currentPageIndex === -1;

  const renderRightPanel = () => {
    if (isCoverView) return <CoverSettings />;

    switch (book.selection.type) {
      case "textBlock":
        return <TextBlockSettings />;
      case "image":
        return <ImageSettings />;
      default:
        return <PageNarrationSettings />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[220px] flex-shrink-0 bg-neutral-0 border-r border-neutral-200 overflow-hidden">
          <PageList />
        </div>

        {/* Center canvas */}
        <div className="flex-1 overflow-auto bg-neutral-50">
          {isCoverView ? (
            <CoverCanvas />
          ) : (
            <PageCanvas />
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-[260px] flex-shrink-0 bg-neutral-0 border-l border-neutral-200 overflow-hidden">
          {renderRightPanel()}
        </div>
      </div>

      <BottomActionBar />
    </div>
  );
}
