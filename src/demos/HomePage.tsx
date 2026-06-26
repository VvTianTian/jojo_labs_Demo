import { Link } from "react-router-dom";
import { demos } from "./config";
import { ArrowRight, Layout } from "lucide-react";

export function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-8 bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center">
              <Layout size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800">Web Test</h1>
          </div>
          <p className="text-sm text-neutral-500 mt-2">
            前端交互实验合集 · 选择一个 Demo 开始体验
          </p>
        </div>
      </header>

      {/* Demo cards */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto grid gap-4">
          {demos.map((demo) => {
            const Icon = demo.icon;
            return (
              <Link
                key={demo.id}
                to={demo.path}
                className="group flex items-center gap-4 bg-white rounded-xl border border-neutral-200 p-5 hover:border-brand-300 hover:shadow-md transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    demo.color === "brand"
                      ? "bg-brand-50"
                      : "bg-success-50"
                  }`}
                >
                  <Icon
                    size={22}
                    className={
                      demo.color === "brand"
                        ? "text-brand-500"
                        : "text-success-500"
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-neutral-800 group-hover:text-brand-600 transition-colors">
                    {demo.name}
                  </h2>
                  <p className="text-sm text-neutral-500 mt-0.5 truncate">
                    {demo.description}
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className="text-neutral-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all flex-shrink-0"
                />
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
