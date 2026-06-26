import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { FlowchartEditor } from "./components/FlowchartEditor";
import { useFlowchartStore } from "./store/useFlowchartStore";

export function FlowchartDemo() {
  const resetFlowchart = useFlowchartStore((s) => s.resetFlowchart);

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-neutral-200 shadow-xs">
        <Link
          to="/"
          className="p-1.5 rounded-base hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-all"
          title="返回首页"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-lg font-semibold text-neutral-700">流程搭建工具</h1>
        <div className="flex-1" />
        <button
          onClick={resetFlowchart}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1 rounded-base hover:bg-neutral-100 transition-all"
          title="重置"
        >
          <RotateCcw size={13} />
          <span>重置</span>
        </button>
      </div>

      {/* Main content */}
      <FlowchartEditor />
    </div>
  );
}
