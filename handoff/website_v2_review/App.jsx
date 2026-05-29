const { useState: usA } = React;

function App() {
  const [route, setRoute] = usA(() => localStorage.getItem('sb-v2-route') || 'landing');
  const [locale, setLocale] = usA('zh');
  const nav = (r) => { setRoute(r); localStorage.setItem('sb-v2-route', r); window.scrollTo(0, 0); };

  const screen = route === 'landing' ? 'Landing'
    : route === 'find-pros' ? 'Find Pros'
    : route === 'find-spaces' ? 'Find Spaces'
    : route;

  return (
    <div data-screen-label={`Website v2 · ${screen}`}>
      <SBHeader onNav={nav} active={route} locale={locale} onLocale={setLocale}/>
      <main>
        {route === 'landing' && <>
          <SBHero/>
          <SBEcosystem/>
          <SBFeatures/>
          <SBHowItWorks/>
          <SBAbout/>
          <SBFaq/>
          <SBCta/>
        </>}
        {route === 'features' && <SBFeatures/>}
        {route === 'how' && <SBHowItWorks/>}
        {route === 'about' && <SBAbout/>}
        {route === 'faq' && <SBFaq/>}
        {route === 'find-pros' && <SBFindPros/>}
        {route === 'find-spaces' && <SBFindSpaces/>}
      </main>
      <SBFooter/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
