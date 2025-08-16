// App.jsx - Con ThemeProvider
import { AppRouter } from "./router/AppRouter";
import { ThemeProvider } from "./shared/context/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <ToastContainer />
        <AppRouter />
      </div>
    </ThemeProvider>
  );
}

export default App;
