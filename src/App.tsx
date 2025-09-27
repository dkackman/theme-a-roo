import { discoverThemes, resolveThemeImage } from '@/lib/themes';
import {
  createHashRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, useTheme } from 'theme-o-rama';
import { ErrorProvider } from './contexts/ErrorContext';
import About from './pages/About';
import BackgroundEditor from './pages/BackgroundEditor';
import Components from './pages/Components';
import Dialogs from './pages/Dialogs';
import JsonEditor from './pages/JsonEditor';
import PrepareNft from './pages/PrepareNft';
import Tables from './pages/Tables';
import Themes from './pages/Themes';

// Initialize default theme in localStorage if not present
function initializeDefaultTheme() {
  const existingTheme = localStorage.getItem('theme');
  if (!existingTheme) {
    localStorage.setItem('theme', 'theme-a-roo-custom-theme');
  }
}

// Theme-aware toast container component
function ThemeAwareToastContainer() {
  const { currentTheme } = useTheme();

  const toastTheme = currentTheme?.mostLike ?? 'light';

  return (
    <ToastContainer
      position='bottom-right'
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={toastTheme}
      transition={Slide}
      style={
        {
          '--toastify-toast-transition-timing': 'ease',
          '--toastify-toast-transition-duration': '750ms',
        } as React.CSSProperties
      }
    />
  );
}

const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path='/' element={<Themes />} />
      <Route path='/tables' element={<Tables />} />
      <Route path='/components' element={<Components />} />
      <Route path='/dialogs' element={<Dialogs />} />
      <Route path='/about' element={<About />} />
      <Route path='/prepare-nft' element={<PrepareNft />} />
      <Route path='/background-editor' element={<BackgroundEditor />} />
      <Route path='/json-editor' element={<JsonEditor />} />
    </>,
  ),
);

export default function App() {
  // Initialize default theme in localStorage early in app startup
  initializeDefaultTheme();

  return (
    <ThemeProvider
      discoverThemes={discoverThemes}
      imageResolver={resolveThemeImage}
    >
      <ErrorProvider>
        <RouterProvider router={router} />
        <ThemeAwareToastContainer />
      </ErrorProvider>
    </ThemeProvider>
  );
}
