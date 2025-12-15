import { ProjectTemplate } from '@/types/projectTypes';

export const reactTemplate: ProjectTemplate = {
  id: 'react-starter',
  name: 'React Starter',
  description: 'A minimal React + TypeScript template',
  icon: '⚛️',
  dependencies: {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
  },
  files: [
    {
      path: 'src/App.tsx',
      language: 'tsx',
      isEntryPoint: false,
      content: `import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Welcome to Your App</h1>
        <p>Start building something amazing!</p>
      </header>
      
      <main className="main">
        <div className="card">
          <h2>✨ Get Started</h2>
          <p>Edit <code>src/App.tsx</code> and save to see changes.</p>
        </div>
        
        <div className="card">
          <h2>📚 Learn More</h2>
          <p>Explore React documentation and tutorials.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
`,
    },
    {
      path: 'src/App.css',
      language: 'css',
      content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  min-height: 100vh;
  color: #ffffff;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  padding: 4rem 0;
}

.header h1 {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(to right, #8b5cf6, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.header p {
  font-size: 1.25rem;
  color: #a1a1aa;
}

.main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem 0;
}

.card {
  background: rgba(17, 17, 24, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 20px 40px rgba(139, 92, 246, 0.1);
}

.card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.card p {
  color: #a1a1aa;
  line-height: 1.6;
}

.card code {
  background: rgba(139, 92, 246, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: #a855f7;
}
`,
    },
    {
      path: 'src/main.tsx',
      language: 'tsx',
      isEntryPoint: true,
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    },
    {
      path: 'src/index.css',
      language: 'css',
      content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg-primary: #0a0a0f;
  --bg-surface: #111118;
  --bg-elevated: #1a1a24;
  --text-primary: #ffffff;
  --text-muted: #a1a1aa;
  --accent-purple: #8b5cf6;
  --accent-pink: #ec4899;
  --accent-cyan: #22d3ee;
}

html {
  scroll-behavior: smooth;
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}
`,
    },
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: 'package.json',
      language: 'json',
      content: `{
  "name": "my-app",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
`,
    },
  ],
};

export const blankTemplate: ProjectTemplate = {
  id: 'blank',
  name: 'Blank Project',
  description: 'Start from scratch',
  icon: '📄',
  dependencies: {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
  },
  files: [
    {
      path: 'src/App.tsx',
      language: 'tsx',
      isEntryPoint: false,
      content: `import './App.css';

function App() {
  return (
    <div className="app">
      <h1>Hello, World!</h1>
    </div>
  );
}

export default App;
`,
    },
    {
      path: 'src/App.css',
      language: 'css',
      content: `.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0a0f;
  color: #ffffff;
}

h1 {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(to right, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
`,
    },
    {
      path: 'src/index.css',
      language: 'css',
      content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}
`,
    },
    {
      path: 'src/main.tsx',
      language: 'tsx',
      isEntryPoint: true,
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    },
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
  ],
};

export const modernTemplate: ProjectTemplate = {
  id: 'modern-app',
  name: 'Modern App',
  description: 'Tailwind + Components + Routing',
  icon: '🚀',
  dependencies: {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    'react-router-dom': '^6.20.0',
  },
  files: [
    {
      path: 'src/App.tsx',
      language: 'tsx',
      isEntryPoint: false,
      content: `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
`,
    },
    {
      path: 'src/components/Layout.tsx',
      language: 'tsx',
      content: `import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
  ];
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                K
              </div>
              <span className="font-semibold text-slate-900">MyApp</span>
            </Link>
            
            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${
                    location.pathname === item.path
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }\`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main>{children}</main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          © 2024 MyApp. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
`,
    },
    {
      path: 'src/components/ui/Button.tsx',
      language: 'tsx',
      content: `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 focus:ring-violet-500 shadow-lg shadow-violet-500/25',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500',
    outline: 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-500',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };
  
  return (
    <button
      className={\`\${baseStyles} \${variants[variant]} \${sizes[size]} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
}
`,
    },
    {
      path: 'src/components/ui/Card.tsx',
      language: 'tsx',
      content: `interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export function Card({ children, className = '', glass = false }: CardProps) {
  const baseStyles = glass
    ? 'backdrop-blur-xl bg-white/60 border border-white/20 shadow-xl'
    : 'bg-white border border-slate-200 shadow-sm';
    
  return (
    <div className={\`rounded-2xl \${baseStyles} \${className}\`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={\`px-6 py-4 border-b border-slate-100 \${className}\`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={\`px-6 py-4 \${className}\`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={\`px-6 py-4 border-t border-slate-100 \${className}\`}>
      {children}
    </div>
  );
}
`,
    },
    {
      path: 'src/components/ui/Input.tsx',
      language: 'tsx',
      content: `interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        className={\`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all \${
          error ? 'border-red-500 focus:ring-red-500' : ''
        } \${className}\`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
`,
    },
    {
      path: 'src/pages/Home.tsx',
      language: 'tsx',
      content: `import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6">
            ✨ Welcome to the future
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6">
            Build something
            <span className="block bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              amazing today.
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            A modern template with beautiful components, routing, and everything you need to ship fast.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg">
              Get Started →
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Lightning Fast', desc: 'Built for speed and performance' },
              { icon: '🎨', title: 'Beautiful Design', desc: 'Modern UI with Tailwind CSS' },
              { icon: '🔧', title: 'Easy to Customize', desc: 'Components you can modify' },
            ].map((feature, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="py-8 text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
`,
    },
    {
      path: 'src/pages/About.tsx',
      language: 'tsx',
      content: `import { Card, CardContent } from '../components/ui/Card';

export default function About() {
  return (
    <div className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">About Us</h1>
        <p className="text-lg text-slate-600 mb-8">
          Learn more about our mission and values.
        </p>
        
        <Card>
          <CardContent className="prose prose-slate max-w-none">
            <p>
              We're building tools that help developers create beautiful,
              functional applications faster than ever before.
            </p>
            <p>
              Our mission is to democratize software development and make it
              accessible to everyone.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`,
    },
    {
      path: 'src/main.tsx',
      language: 'tsx',
      isEntryPoint: true,
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    },
    {
      path: 'src/index.css',
      language: 'css',
      content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}
`,
    },
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#8b5cf6',
            }
          }
        }
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
  ],
};

export const templates: ProjectTemplate[] = [
  modernTemplate,
  reactTemplate,
  blankTemplate,
];
