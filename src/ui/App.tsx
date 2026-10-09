import { ActivityPanel } from './ActivityPanel';
import { DebugPanel } from './DebugPanel';
import { DischargeDialog } from './DischargeDialog';
import { InstitutionPanel } from './InstitutionPanel';
import { Log } from './Log';
import { ProposalDialog } from './ProposalDialog';
import { RequestsMenu } from './RequestsMenu';
import { ResidentPanel } from './ResidentPanel';
import { ResidentStrip } from './ResidentStrip';
import { HireMenu, StaffCard } from './StaffMenus';
import { TopBar } from './TopBar';
import { WaitingList } from './WaitingList';

export function App() {
  return (
    <main class="app">
      <TopBar />
      <div class="col left">
        <WaitingList />
        <InstitutionPanel />
      </div>
      <div class="main">
        <ResidentStrip />
        <div class="main-cols">
          <div class="col mid">
            <ResidentPanel />
          </div>
          <div class="col right">
            <ActivityPanel />
            <Log />
          </div>
        </div>
      </div>
      <ProposalDialog />
      <DischargeDialog />
      <RequestsMenu />
      <HireMenu />
      <StaffCard />
      <DebugPanel />
      <footer class="version">
        {__COMMIT__} · {__BUILD_TIME__}
      </footer>
    </main>
  );
}
