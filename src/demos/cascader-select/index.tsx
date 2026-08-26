import { useState, useCallback, useRef, useEffect, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface CascaderNode {
  id: string;
  label: string;
  isNone?: boolean; // 特殊节点：无需复核
  children?: CascaderNode[];
}

/* ------------------------------------------------------------------ */
/*  Sample data                                                        */
/* ------------------------------------------------------------------ */
const CASCADER_DATA: CascaderNode[] = [
  { id: "none", label: "无需复核", isNone: true },
  {
    id: "producer",
    label: "制作人组",
    children: [
      {
        id: "research",
        label: "教研组",
        children: [
          { id: "course-design", label: "课程设计组" },
          { id: "book-edit", label: "图书编辑组" },
        ],
      },
      { id: "review", label: "审校组" },
      { id: "production", label: "制作组" },
    ],
  },
  { id: "film", label: "制片组" },
  { id: "course-product", label: "课程产品组" },
  { id: "config", label: "配置组" },
  { id: "outsource", label: "外包" },
  { id: "operation", label: "运营组" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** 构建 id -> node 的映射 */
function buildNodeMap(nodes: CascaderNode[]): Map<string, CascaderNode> {
  const map = new Map<string, CascaderNode>();
  const walk = (list: CascaderNode[]) => {
    for (const n of list) {
      map.set(n.id, n);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return map;
}

/* ------------------------------------------------------------------ */
/*  Checkbox                                                           */
/* ------------------------------------------------------------------ */
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        borderRadius: 4,
        border: `2px solid ${checked ? "#4f6ef7" : "#c4c4c4"}`,
        background: checked ? "#4f6ef7" : "#fff",
        cursor: "pointer",
        transition: "all .15s",
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  CascaderItem                                                       */
/* ------------------------------------------------------------------ */
interface CascaderItemProps {
  node: CascaderNode;
  checked: boolean;
  isActive: boolean; // 当前列是否展开了此节点的子级
  onToggle: () => void;
  onHover: () => void;
}

function CascaderItem({ node, checked, isActive, onToggle, onHover }: CascaderItemProps) {
  const hasChildren = !!node.children?.length;

  const [hovered, setHovered] = useState(false);

  const bg = isActive ? "#eef2ff" : hovered ? "#f7f8fa" : "transparent";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onMouseEnter={() => {
        setHovered(true);
        if (hasChildren) onHover();
      }}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: bg,
        cursor: "pointer",
        userSelect: "none",
        transition: "background .12s",
        fontSize: 14,
        lineHeight: "20px",
      }}
    >
      <Checkbox checked={checked} onChange={onToggle} />

      <span style={{ flex: 1, color: "#333" }}>{node.label}</span>

      {hasChildren && (
        <span style={{ color: "#999", fontSize: 12, flexShrink: 0 }}>›</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CascaderColumn                                                     */
/* ------------------------------------------------------------------ */
interface CascaderColumnProps {
  nodes: CascaderNode[];
  selectedIds: Set<string>;
  activeId: string | null;
  onToggle: (id: string) => void;
  onHoverItem: (node: CascaderNode) => void;
}

function CascaderColumn({
  nodes,
  selectedIds,
  activeId,
  onToggle,
  onHoverItem,
}: CascaderColumnProps) {
  return (
    <div
      style={{
        width: 200,
        borderRight: "1px solid #f0f0f0",
        overflowY: "auto",
        maxHeight: 320,
      }}
    >
      {nodes.map((node) => (
        <CascaderItem
          key={node.id}
          node={node}
          checked={selectedIds.has(node.id)}
          isActive={activeId === node.id}
          onToggle={() => onToggle(node.id)}
          onHover={() => onHoverItem(node)}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CascaderPanel                                                      */
/* ------------------------------------------------------------------ */
interface CascaderPanelProps {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

function CascaderPanel({ selectedIds, onToggle }: CascaderPanelProps) {
  // activePath: 当前展开的路径节点 id 数组
  // 例如 ["producer", "research"] 表示展开了制作人组 -> 教研组
  const [activePath, setActivePath] = useState<string[]>([]);

  // 计算要展示的列
  const columns = useMemo(() => {
    const cols: { nodes: CascaderNode[]; activeId: string | null }[] = [];

    // 第一列始终是顶层数据
    cols.push({ nodes: CASCADER_DATA, activeId: activePath[0] ?? null });

    // 根据 activePath 逐层展开
    let currentNodes: CascaderNode[] = CASCADER_DATA;
    for (let i = 0; i < activePath.length; i++) {
      const node = currentNodes.find((n) => n.id === activePath[i]);
      if (node?.children) {
        cols.push({
          nodes: node.children,
          activeId: activePath[i + 1] ?? null,
        });
        currentNodes = node.children;
      } else {
        break;
      }
    }

    return cols;
  }, [activePath]);

  const handleHoverItem = useCallback(
    (node: CascaderNode, colIndex: number) => {
      if (!node.children?.length) return;
      // 更新路径到当前列
      setActivePath((prev) => {
        const newPath = prev.slice(0, colIndex);
        newPath.push(node.id);
        return newPath;
      });
    },
    []
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        overflow: "hidden",
        marginTop: 4,
      }}
    >
      {columns.map((col, idx) => (
        <CascaderColumn
          key={idx}
          nodes={col.nodes}
          selectedIds={selectedIds}
          activeId={col.activeId}
          onToggle={onToggle}
          onHoverItem={(node) => handleHoverItem(node, idx)}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chip                                                               */
/* ------------------------------------------------------------------ */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        background: "#eef2ff",
        borderRadius: 4,
        fontSize: 13,
        color: "#4f6ef7",
        lineHeight: "20px",
      }}
    >
      {label}
      <span
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          cursor: "pointer",
          color: "#999",
          fontSize: 14,
          lineHeight: 1,
          marginLeft: 2,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#e53935"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#999"; }}
      >
        ×
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  CascaderTrigger                                                    */
/* ------------------------------------------------------------------ */
interface CascaderTriggerProps {
  selectedIds: Set<string>;
  nodeMap: Map<string, CascaderNode>;
  isOpen: boolean;
  onClick: () => void;
  onRemove: (id: string) => void;
}

function CascaderTrigger({
  selectedIds,
  nodeMap,
  isOpen,
  onClick,
  onRemove,
}: CascaderTriggerProps) {
  const isNoneSelected = selectedIds.has("none");
  const selectedNodes = Array.from(selectedIds)
    .filter((id) => id !== "none")
    .map((id) => nodeMap.get(id))
    .filter(Boolean) as CascaderNode[];

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        minHeight: 40,
        padding: "6px 12px",
        border: `1px solid ${isOpen ? "#4f6ef7" : "#d9d9d9"}`,
        borderRadius: 8,
        background: "#fff",
        cursor: "pointer",
        transition: "border-color .15s",
      }}
    >
      {/* 内容区域 */}
      <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {isNoneSelected ? (
          <span style={{ color: "#666", fontSize: 14 }}>无需复核</span>
        ) : selectedNodes.length === 0 ? (
          <span style={{ color: "#bbb", fontSize: 14 }}>请选择复核方</span>
        ) : (
          selectedNodes.map((node) => (
            <Chip key={node.id} label={node.label} onRemove={() => onRemove(node.id)} />
          ))
        )}
      </div>

      {/* 下拉箭头 */}
      <span
        style={{
          flexShrink: 0,
          color: "#999",
          transition: "transform .2s",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Demo                                                          */
/* ------------------------------------------------------------------ */
export function CascaderSelectDemo() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(["none"]));
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodeMap = useMemo(() => buildNodeMap(CASCADER_DATA), []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // toggle 选择
  const handleToggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const node = nodeMap.get(id);

        if (node?.isNone) {
          // 点击"无需复核"：清空其他，只保留自身
          if (next.has("none")) {
            // 已选中，取消选择
            next.clear();
          } else {
            next.clear();
            next.add("none");
          }
        } else {
          // 点击其他节点：移除"无需复核"，toggle 当前节点
          next.delete("none");
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
        }

        return next;
      });
    },
    [nodeMap]
  );

  // 从触发器移除某个选项
  const handleRemove = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f6fa",
        padding: "32px 0",
        fontFamily: '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,.08)",
          overflow: "visible",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid #eee",
          }}
        >
          <a
            href="/"
            title="返回首页"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              color: "#888",
              textDecoration: "none",
              transition: "all .15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f0f0f0";
              e.currentTarget.style.color = "#333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#888";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </a>
          <h2 style={{ margin: 0, fontSize: 18, color: "#333" }}>级联多选下拉</h2>
        </div>

        {/* Form area */}
        <div style={{ padding: "24px 20px" }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 14, color: "#333", fontWeight: 500 }}>复核</label>
          </div>

          <div ref={containerRef} style={{ position: "relative" }}>
            <CascaderTrigger
              selectedIds={selectedIds}
              nodeMap={nodeMap}
              isOpen={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              onRemove={handleRemove}
            />

            {isOpen && (
              <div style={{ position: "absolute", left: 0, right: 0, zIndex: 100 }}>
                <CascaderPanel selectedIds={selectedIds} onToggle={handleToggle} />
              </div>
            )}
          </div>

          {/* 提示信息 */}
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              background: "#fafbff",
              borderRadius: 8,
              fontSize: 13,
              color: "#666",
              lineHeight: 1.8,
            }}
          >
            <strong>交互说明：</strong>
            <br />
            • 默认选中「无需复核」，与其他选项互斥
            <br />
            • 选择任意其他选项时，「无需复核」自动取消
            <br />
            • 支持多选，可点击 chip 上的 × 移除选项
            <br />
            • 鼠标悬停有子级的项可展开下一列
          </div>
        </div>
      </div>
    </div>
  );
}

export default CascaderSelectDemo;
