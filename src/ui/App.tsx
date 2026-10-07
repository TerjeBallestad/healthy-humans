import { DebugPanel } from './DebugPanel';
import { Log } from './Log';
import { ResidentPanel } from './ResidentPanel';
import { TopBar } from './TopBar';

export function App() {
  return (
    <main class="app">
      <TopBar />
      <ResidentPanel />
      <Log />
      <DebugPanel />
    </main>
  );
}
