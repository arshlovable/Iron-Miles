import Nav from './components/Nav';
import Hero from './sections/Hero';
import Story from './sections/Story';
import TheApp from './sections/TheApp';
import DisciplineCulture from './sections/DisciplineCulture';

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Story />
        <TheApp />
        <DisciplineCulture />
      </main>
    </>
  );
}
