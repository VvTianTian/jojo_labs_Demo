import { Routes, Route } from "react-router-dom";
import { HomePage } from "./demos/HomePage";
import { PictureBookEditor } from "./demos/picture-book-editor";
import { FlowchartDemo } from "./demos/flowchart";
import { TreeCheckboxDemo } from "./demos/tree-checkbox";
import { CascaderSelectDemo } from "./demos/cascader-select";
import { CoverGenerator } from "./demos/cover-generator";
import { AnimationBookEditor } from "./demos/animation-book";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/picture-book/*" element={<PictureBookEditor />} />
      <Route path="/flowchart/*" element={<FlowchartDemo />} />
      <Route path="/tree-checkbox" element={<TreeCheckboxDemo />} />
      <Route path="/cascader-select" element={<CascaderSelectDemo />} />
      <Route path="/cover-generator" element={<CoverGenerator />} />
      <Route path="/animation-book" element={<AnimationBookEditor />} />
    </Routes>
  );
}

export default App;
