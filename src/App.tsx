import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { HomePage } from "./demos/HomePage";
import { PictureBookEditor } from "./demos/picture-book-editor";
import { FlowchartDemo } from "./demos/flowchart";
import { CascaderSelectDemo } from "./demos/cascader-select";
import { CoverGenerator } from "./demos/cover-generator";
import { AnimationBookEditor } from "./demos/animation-book";
import { trackPageView } from "./analytics";

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/cover-generator") return;
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}

function App() {
  return (
    <>
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/picture-book/*" element={<PictureBookEditor />} />
        <Route path="/flowchart/*" element={<FlowchartDemo />} />
        <Route path="/cascader-select" element={<CascaderSelectDemo />} />
        <Route path="/cover-generator" element={<CoverGenerator />} />
        <Route path="/animation-book" element={<AnimationBookEditor />} />
      </Routes>
    </>
  );
}

export default App;
