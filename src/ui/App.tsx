import { ActivityPanel } from './ActivityPanel';
import { DebugPanel } from './DebugPanel';
import { DischargeDialog } from './DischargeDialog';
import { InstitutionPanel } from './InstitutionPanel';
import { Log } from './Log';
import { ProposalDialog } from './ProposalDialog';
import { RequestsMenu } from './RequestsMenu';
import { ResidentPanel } from './ResidentPanel';
import { ResidentStrip } from './ResidentStrip';
import { HireMenu, StaffCard, TrainingMenu } from './StaffMenus';
import { Tips } from './Tips';
import { Toasts } from './Toasts';
import { TopBar } from './TopBar';
import { PatientCard, WaitingList } from './WaitingList';

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
      <TrainingMenu />
      <PatientCard />
      <Tips />
      <Toasts />
      <DebugPanel />
      <footer class="version">
        {__COMMIT__} · {__BUILD_TIME__}
      </footer>
    </main>
  );
}
