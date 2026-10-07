import { render } from 'preact';
import { App } from './ui/App';
import { startLoop } from './store';
import './style.css';

startLoop();
render(<App />, document.getElementById('app')!);
