import { render } from 'preact';
import { startLoop } from '../../src/store';
import { loadKitFonts } from '../../src/kit/fonts';
import { App } from './App';
import './style.css';

// The real game, with its save: this page and the main game share one save, so open one at a time.
startLoop();
void loadKitFonts();
render(<App />, document.getElementById('app')!);
