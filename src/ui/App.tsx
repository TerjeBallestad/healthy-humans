import { DebugPanel } from './DebugPanel';
import { DischargeDialog } from './DischargeDialog';
import { InstitutionPanel } from './InstitutionPanel';
import { Log } from './Log';
import { ProposalDialog } from './ProposalDialog';
import { ResidentPanel } from './ResidentPanel';
import { TopBar } from './TopBar';

export function App() {
  return (
    <main class="app">
      <TopBar />
      <ResidentPanel />
      <Log />
      <InstitutionPanel />
      <ProposalDialog />
      <DischargeDialog />
      <DebugPanel />
    </main>
  );
}
