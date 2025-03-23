import { ReactNode } from "react";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="app-bg min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="content-bg rounded-lg shadow-xl p-6 border border-accent-color">
          {children}
        </div>
      </main>
      <footer className="mt-16 py-6 content-bg border-t border-accent-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} ForestLedger. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <a
              href="#"
              className="text-accent-color hover:opacity-80 transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-accent-color hover:opacity-80 transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-accent-color hover:opacity-80 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
