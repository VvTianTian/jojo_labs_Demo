import { Routes, Route } from "react-router-dom";
import { HomePage } from "./demos/HomePage";
import { PictureBookEditor } from "./demos/picture-book-editor";
import { FlowchartDemo } from "./demos/flowchart";
import { TreeCheckboxDemo } from "./demos/tree-checkbox";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/picture-book/*" element={<PictureBookEditor />} />
      <Route path="/flowchart/*" element={<FlowchartDemo />} />
      <Route path="/tree-checkbox" element={<TreeCheckboxDemo />} />
    </Routes>
  );
}

export default App;
