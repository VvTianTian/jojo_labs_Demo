import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface TreeNode {
  id: string;
  label: string;
  tag?: string;
  tagType?: "pending" | "published";
  children?: TreeNode[];
}

type CheckState = Record<string, boolean>;

/* ------------------------------------------------------------------ */
/*  Sample data                                                        */
/* ------------------------------------------------------------------ */
const TREE_DATA: TreeNode[] = [
  {
    id: "01",
    label: "主题名称：正式资源",
    children: [
      { id: "01-01", label: "JY_31985_0003", tag: "待发布", tagType: "pending" },
      { id: "01-02", label: "JY_31985_0002 综合", tag: "待发布", tagType: "pending" },
      { id: "01-03", label: "JY_31985_0004 type23", tag: "已发布", tagType: "published" },
      { id: "01-04", label: "JY_20013_07_01 课程待停销", tag: "已发布", tagType: "published" },
    ],
  },
  {
    id: "02",
    label: "主题名称：试听资源",
    children: [
      { id: "02-01", label: "JY_31985_0010 试听A", tag: "待发布", tagType: "pending" },
      { id: "02-02", label: "JY_31985_0011 试听B", tag: "已发布", tagType: "published" },
      { id: "02-03", label: "JY_31985_0012 试听C", tag: "待发布", tagType: "pending" },
    ],
  },
  {
    id: "03",
    label: "主题名称：下教研 1",
    children: [
      {
        id: "03-01",
        label: "子单元 A",
        children: [
          { id: "03-01-01", label: "JY_40001_0001 课时一", tag: "待发布", tagType: "pending" },
          { id: "03-01-02", label: "JY_40001_0002 课时二", tag: "已发布", tagType: "published" },
          { id: "03-01-03", label: "JY_40001_0003 课时三", tag: "待发布", tagType: "pending" },
        ],
      },
      {
        id: "03-02",
        label: "子单元 B",
        children: [
          { id: "03-02-01", label: "JY_40002_0001 课时一", tag: "已发布", tagType: "published" },
          { id: "03-02-02", label: "JY_40002_0002 课时二", tag: "待发布", tagType: "pending" },
        ],
      },
    ],
  },
  {
    id: "04",
    label: "主题名称：下教研 2",
    children: [
      { id: "04-01", label: "JY_50001_0001 拓展A", tag: "已发布", tagType: "published" },
      { id: "04-02", label: "JY_50001_0002 拓展B", tag: "待发布", tagType: "pending" },
      { id: "04-03", label: "JY_50001_0003 拓展C", tag: "待发布", tagType: "pending" },
      { id: "04-04", label: "JY_50001_0004 拓展D", tag: "已发布", tagType: "published" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Collect all descendant ids (flat) */
function collectIds(node: TreeNode): string[] {
  const ids = [node.id];
  node.children?.forEach((c) => ids.push(...collectIds(c)));
  return ids;
}

/** Get visible (expanded) leaf / node ids in order */
function getVisibleIds(nodes: TreeNode[], expanded: Set<string>): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    result.push(node.id);
    if (node.children && expanded.has(node.id)) {
      result.push(...getVisibleIds(node.children, expanded));
    }
  }
  return result;
}

/** Build parent→children id map */
function buildChildrenMap(nodes: TreeNode[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      if (n.children) {
        map.set(n.id, collectIds(n).filter((id) => id !== n.id));
        walk(n.children);
      }
    }
  };
  walk(nodes);
  return map;
}

/** Build child→parent map */
function buildParentMap(nodes: TreeNode[], parent?: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const n of nodes) {
    if (parent) map.set(n.id, parent);
    if (n.children) {
      for (const [k, v] of buildParentMap(n.children, n.id)) {
        map.set(k, v);
      }
    }
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Checkbox (tri-state)                                               */
/* ------------------------------------------------------------------ */
function Checkbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) {
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
        width: 18,
        height: 18,
        borderRadius: 4,
        border: `2px solid ${checked || indeterminate ? "#4f6ef7" : "#c4c4c4"}`,
        background: checked || indeterminate ? "#4f6ef7" : "#fff",
        cursor: "pointer",
        transition: "all .15s",
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {indeterminate && !checked && (
        <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
          <rect width="10" height="2" rx="1" fill="#fff" />
        </svg>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  TreeItem                                                           */
/* ------------------------------------------------------------------ */
function TreeItem({
  node,
  depth,
  expanded,
  checked,
  indeterminate,
  highlighted,
  dragHover,
  onToggleExpand,
  onCheck,
  onRowClick,
  onDragEnter,
}: {
  node: TreeNode;
  depth: number;
  expanded: boolean;
  checked: boolean;
  indeterminate: boolean;
  highlighted: boolean;
  dragHover: boolean;
  onToggleExpand: () => void;
  onCheck: () => void;
  onRowClick: (e: React.MouseEvent) => void;
  onDragEnter: () => void;
}) {
  const hasChildren = !!node.children?.length;

  const bg = dragHover
    ? "#dbeafe"
    : highlighted
      ? "#eef2ff"
      : "transparent";

  return (
    <>
      <div
        data-tree-id={node.id}
        onClick={onRowClick}
        onMouseEnter={onDragEnter}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          paddingLeft: 12 + depth * 24,
          background: bg,
          borderBottom: "1px solid #f0f0f0",
          cursor: "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          transition: "background .12s",
          fontSize: 14,
          lineHeight: "32px",
        }}
        onMouseOver={(e) => {
          if (!highlighted && !dragHover) (e.currentTarget as HTMLDivElement).style.background = "#f7f8fa";
        }}
        onMouseOut={(e) => {
          if (!highlighted && !dragHover) (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      >
        {/* expand / collapse */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand();
          }}
          style={{
            width: 20,
            height: 20,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: hasChildren ? "pointer" : "default",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform .2s",
            color: hasChildren ? "#666" : "transparent",
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          ▶
        </span>

        <Checkbox checked={checked} indeterminate={indeterminate} onChange={onCheck} />

        <span style={{ flex: 1, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.label}
        </span>

        {node.tag && (
          <span
            style={{
              fontSize: 12,
              padding: "1px 8px",
              borderRadius: 4,
              background: node.tagType === "published" ? "#e8f5e9" : "#fff3e0",
              color: node.tagType === "published" ? "#388e3c" : "#e65100",
              flexShrink: 0,
            }}
          >
            {node.tag}
          </span>
        )}
      </div>

      {/* children */}
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeItemNested
              key={child.id}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}

/** Wrapper that reads context from parent component via props drilling through a render function */
function TreeItemNested({ node, depth }: { node: TreeNode; depth: number }) {
  return <TreeCheckboxContext.Consumer>
    {(ctx) => {
      if (!ctx) return null;
      const { expandedSet, checkedSet, indeterminateSet, highlightedSet, dragHoverSet, toggleExpand, toggleCheck, handleRowClick, handleDragEnter } = ctx;
      return (
        <TreeItem
          node={node}
          depth={depth}
          expanded={expandedSet.has(node.id)}
          checked={checkedSet.has(node.id)}
          indeterminate={indeterminateSet.has(node.id)}
          highlighted={highlightedSet.has(node.id)}
          dragHover={dragHoverSet.has(node.id)}
          onToggleExpand={() => toggleExpand(node.id)}
          onCheck={() => toggleCheck(node.id)}
          onRowClick={(e) => handleRowClick(e, node.id)}
          onDragEnter={() => handleDragEnter(node.id)}
        />
      );
    }}
  </TreeCheckboxContext.Consumer>;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */
interface TreeCtx {
  expandedSet: Set<string>;
  checkedSet: Set<string>;
  indeterminateSet: Set<string>;
  highlightedSet: Set<string>;
  dragHoverSet: Set<string>;
  toggleExpand: (id: string) => void;
  toggleCheck: (id: string) => void;
  handleRowClick: (e: React.MouseEvent, id: string) => void;
  handleDragEnter: (id: string) => void;
}

const TreeCheckboxContext = React.createContext<TreeCtx | null>(null);

/* ------------------------------------------------------------------ */
/*  Main Demo                                                          */
/* ------------------------------------------------------------------ */
export function TreeCheckboxDemo() {
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set(["01"]));
  const [checkedSet, setCheckedSet] = useState<Set<string>>(new Set());
  const lastCheckedRef = useRef<string | null>(null);

  const childrenMap = useMemo(() => buildChildrenMap(TREE_DATA), []);
  const parentMap = useMemo(() => buildParentMap(TREE_DATA), []);
  const visibleIds = useMemo(() => getVisibleIds(TREE_DATA, expandedSet), [expandedSet]);

  /* ---- derived: indeterminate ---- */
  const indeterminateSet = useMemo(() => {
    const s = new Set<string>();
    childrenMap.forEach((descendantIds, parentId) => {
      if (checkedSet.has(parentId)) return; // fully checked, not indeterminate
      const someChecked = descendantIds.some((id) => checkedSet.has(id));
      const allChecked = descendantIds.every((id) => checkedSet.has(id));
      if (someChecked && !allChecked) s.add(parentId);
    });
    return s;
  }, [checkedSet, childrenMap]);

  /* ---- derived: highlighted (for shift range visual) ---- */
  const [highlightedSet, setHighlightedSet] = useState<Set<string>>(new Set());

  /* ---- drag selection state ---- */
  const isDraggingRef = useRef(false);
  const dragStartIdRef = useRef<string | null>(null);
  const dragIdsRef = useRef<Set<string>>(new Set());
  const [dragHoverSet, setDragHoverSet] = useState<Set<string>>(new Set());

  const handleDragEnter = useCallback((id: string) => {
    if (!isDraggingRef.current) return;
    dragIdsRef.current.add(id);
    setDragHoverSet(new Set(dragIdsRef.current));
  }, []);

  /* ---- toggle expand ---- */
  const toggleExpand = useCallback((id: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  /* ---- toggle check (with cascade) ---- */
  const toggleCheck = useCallback(
    (id: string) => {
      setCheckedSet((prev) => {
        const next = new Set(prev);
        const willCheck = !next.has(id);

        // cascade to children
        const descendants = childrenMap.get(id) ?? [];
        if (willCheck) {
          next.add(id);
          descendants.forEach((d) => next.add(d));
        } else {
          next.delete(id);
          descendants.forEach((d) => next.delete(d));
        }

        // cascade up to parents
        let cur = parentMap.get(id);
        while (cur) {
          const siblings = childrenMap.get(cur) ?? [];
          const allChecked = siblings.every((s) => next.has(s));
          if (allChecked) next.add(cur);
          else next.delete(cur);
          cur = parentMap.get(cur);
        }

        return next;
      });
      lastCheckedRef.current = id;
    },
    [childrenMap, parentMap],
  );

  // global mouseup to commit drag selection
  useEffect(() => {
    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const ids = Array.from(dragIdsRef.current);
      dragIdsRef.current = new Set();
      setDragHoverSet(new Set());
      document.body.style.userSelect = "";

      if (ids.length === 0) return;

      // Single item click (no drag movement) → toggle
      if (ids.length === 1) {
        toggleCheck(ids[0]);
        return;
      }

      // Multi-item drag → check all (with cascade)
      setCheckedSet((prev) => {
        const next = new Set(prev);
        for (const rid of ids) {
          next.add(rid);
          const descendants = childrenMap.get(rid) ?? [];
          descendants.forEach((d) => next.add(d));
        }
        // cascade up
        for (const rid of ids) {
          let cur = parentMap.get(rid);
          while (cur) {
            const siblings = childrenMap.get(cur) ?? [];
            if (siblings.every((s) => next.has(s))) next.add(cur);
            else next.delete(cur);
            cur = parentMap.get(cur);
          }
        }
        return next;
      });

      // flash highlight
      setHighlightedSet(new Set(ids));
      setTimeout(() => setHighlightedSet(new Set()), 600);
    };

    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [childrenMap, parentMap, toggleCheck]);

  /* ---- shift+click range select / drag start ---- */
  const handleRowClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      // If not shift, start drag selection
      if (!e.shiftKey) {
        // Start drag
        isDraggingRef.current = true;
        dragStartIdRef.current = id;
        dragIdsRef.current = new Set([id]);
        setDragHoverSet(new Set([id]));
        document.body.style.userSelect = "none"; // prevent text selection while dragging
        return;
      }

      // Shift+click → range select
      const lastId = lastCheckedRef.current;
      if (!lastId) {
        toggleCheck(id);
        return;
      }

      const startIdx = visibleIds.indexOf(lastId);
      const endIdx = visibleIds.indexOf(id);
      if (startIdx === -1 || endIdx === -1) {
        toggleCheck(id);
        return;
      }

      const [lo, hi] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      const rangeIds = visibleIds.slice(lo, hi + 1);

      // highlight
      setHighlightedSet(new Set(rangeIds));
      setTimeout(() => setHighlightedSet(new Set()), 800);

      // check all in range
      setCheckedSet((prev) => {
        const next = new Set(prev);
        for (const rid of rangeIds) {
          next.add(rid);
          // also cascade children
          const descendants = childrenMap.get(rid) ?? [];
          descendants.forEach((d) => next.add(d));
        }
        // cascade up
        for (const rid of rangeIds) {
          let cur = parentMap.get(rid);
          while (cur) {
            const siblings = childrenMap.get(cur) ?? [];
            if (siblings.every((s) => next.has(s))) next.add(cur);
            else next.delete(cur);
            cur = parentMap.get(cur);
          }
        }
        return next;
      });

      lastCheckedRef.current = id;
    },
    [toggleCheck, visibleIds, childrenMap, parentMap],
  );

  /* ---- expand / collapse all ---- */
  const expandAll = () => {
    const allParentIds = new Set<string>();
    childrenMap.forEach((_, k) => allParentIds.add(k));
    setExpandedSet(allParentIds);
  };
  const collapseAll = () => setExpandedSet(new Set());

  /* ---- select / deselect all ---- */
  const selectAll = () => {
    const all = new Set<string>();
    const walk = (nodes: TreeNode[]) => nodes.forEach((n) => { all.add(n.id); n.children && walk(n.children); });
    walk(TREE_DATA);
    setCheckedSet(all);
  };
  const deselectAll = () => setCheckedSet(new Set());

  const checkedCount = checkedSet.size;

  /* ---- ctx value ---- */
  const ctxValue: TreeCtx = {
    expandedSet,
    checkedSet,
    indeterminateSet,
    highlightedSet,
    dragHoverSet,
    toggleExpand,
    toggleCheck,
    handleRowClick,
    handleDragEnter,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", padding: "32px 0", fontFamily: '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif' }}>
      <div style={{ maxWidth: 720, margin: "0 auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,.08)", overflow: "hidden" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #eee" }}>
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
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#333"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
          </a>
          <h2 style={{ margin: 0, fontSize: 18, color: "#333" }}>批量发布内容</h2>
        </div>

        {/* toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderBottom: "1px solid #eee", flexWrap: "wrap" }}>
          <button onClick={expandAll} style={btnStyle}>展开全部</button>
          <button onClick={collapseAll} style={btnStyle}>收起全部</button>
          <span style={{ width: 1, height: 20, background: "#ddd" }} />
          <button onClick={selectAll} style={btnStyle}>全选</button>
          <button onClick={deselectAll} style={btnStyle}>取消全选</button>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: "#888" }}>
            已勾选：<strong style={{ color: "#4f6ef7" }}>{checkedCount}</strong> 项
          </span>
        </div>

        {/* tip */}
        <div style={{ padding: "8px 20px", background: "#fafbff", borderBottom: "1px solid #eee", fontSize: 12, color: "#888", lineHeight: 1.6 }}>
          <strong>操作提示：</strong>
          ① 按住鼠标拖过行 → 框选一批内容并勾选&nbsp;
          ② <kbd style={kbdStyle}>Shift</kbd> + 点击 → 范围选中&nbsp;
          ③ 点击复选框 → 单选（父子联动）&nbsp;
          ④ 点击箭头 → 展开/收起
        </div>

        {/* tree */}
        <TreeCheckboxContext.Provider value={ctxValue}>
          <div>
            {TREE_DATA.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                depth={0}
                expanded={expandedSet.has(node.id)}
                checked={checkedSet.has(node.id)}
                indeterminate={indeterminateSet.has(node.id)}
                highlighted={highlightedSet.has(node.id)}
                dragHover={dragHoverSet.has(node.id)}
                onToggleExpand={() => toggleExpand(node.id)}
                onCheck={() => toggleCheck(node.id)}
                onRowClick={(e) => handleRowClick(e, node.id)}
                onDragEnter={() => handleDragEnter(node.id)}
              />
            ))}
          </div>
        </TreeCheckboxContext.Provider>

        {/* footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button style={{ ...btnStyle, opacity: checkedCount === 0 ? 0.4 : 1 }} disabled={checkedCount === 0}>
            批量发布 ({checkedCount})
          </button>
          <button style={{ ...btnStyle, background: "#4f6ef7", color: "#fff", opacity: checkedCount === 0 ? 0.4 : 1 }} disabled={checkedCount === 0}>
            确认提交
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const btnStyle: React.CSSProperties = {
  padding: "4px 12px",
  fontSize: 13,
  borderRadius: 6,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#555",
  cursor: "pointer",
  transition: "all .15s",
};

const kbdStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "0 4px",
  fontSize: 11,
  borderRadius: 3,
  border: "1px solid #ccc",
  background: "#f5f5f5",
  fontFamily: "monospace",
};

export default TreeCheckboxDemo;
