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

export const templates: ProjectTemplate[] = [
  reactTemplate,
  blankTemplate,
];
