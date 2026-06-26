import { Toolbar } from "../Toolbar/Toolbar";
import { PageList } from "../Sidebar/PageList";
import { PageCanvas } from "../Canvas/PageCanvas";
import { CoverCanvas } from "../Canvas/CoverCanvas";
import { NarrationCanvas } from "../Canvas/NarrationCanvas";
import { PageSettings } from "../Settings/PageSettings";
import { CoverSettings } from "../Settings/CoverSettings";
import { TextBlockSettings } from "../Settings/TextBlockSettings";
import { ImageSettings } from "../Settings/ImageSettings";
import { useBookStore } from "../../store/useBookStore";
import { useRoleStore } from "../../store/useRoleStore";
import { Eye } from "lucide-react";

export function EditorLayout() {
  const { book } = useBookStore();
  const { currentRole } = useRoleStore();
  const isEditorial = currentRole === "editorial";
  const isCoverView = book.currentPageIndex === -1 && book.viewMode === "canvas";
  const isNarrationView = book.viewMode === "narration";

  const renderRightPanel = () => {
    if (isNarrationView) return <PageSettings />;
    if (isCoverView) return <CoverSettings />;

    switch (book.selection.type) {
      case "textBlock":
        // 制作角色不显示文字块设置，显示只读提示
        if (!isEditorial) return <ReadOnlyHint message="文字内容由教研编辑" />;
        return <TextBlockSettings />;
      case "image":
        // 制作角色不显示图片设置（热点功能禁用）
        if (!isEditorial) return <ReadOnlyHint message="图片互动功能暂未开放" />;
        return <ImageSettings />;
      default:
        return <PageSettings />;
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
          {isNarrationView ? (
            <NarrationCanvas />
          ) : isCoverView ? (
            <CoverCanvas />
          ) : (
            <PageCanvas />
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-[280px] flex-shrink-0 bg-neutral-0 border-l border-neutral-200 overflow-hidden">
          {renderRightPanel()}
        </div>
      </div>
    </div>
  );
}

/* ---- Read-only hint panel ---- */

function ReadOnlyHint({ message }: { message: string }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-700">
          查看模式
        </h3>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
            <Eye size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500">{message}</p>
        </div>
      </div>
    </div>
  );
}
