// App.jsx - Con ThemeProvider
import { AppRouter } from './router/AppRouter';
import { ThemeProvider } from './shared/context/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <AppRouter />
      </div>
    </ThemeProvider>
  );
}

export default App;