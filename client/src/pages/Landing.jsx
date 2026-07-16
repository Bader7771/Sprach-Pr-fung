import { ArrowRight, BookOpenText, ChevronDown, Menu, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http.js';
import shakespearePortrait from '../assets/william shakespeare.png';
import { examKeys, getExamDisplay, getStudentName, hasAnyExamResult, rankStudents } from '../utils/results.js';

const navItems = [
  { id: 'startseite', label: 'Startseite' },
  { id: 'ueber-uns', label: 'Uber uns' },
  { id: 'kurse', label: 'Kurse' },
  { id: 'pruefungen', label: 'Prufungen' },
  { id: 'ergebnisse', label: 'Ergebnisse' },
  { id: 'kontakt', label: 'Kontakt' }
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('startseite');
  const [classes, setClasses] = useState([]);
  const [classesState, setClassesState] = useState({ loading: true, error: false });
  const [selectedClassId, setSelectedClassId] = useState('');
  const [resultsState, setResultsState] = useState({ loading: false, error: false, students: [], classRoom: null });

  const rankedResults = useMemo(() => rankStudents(resultsState.students), [resultsState.students]);
  const hasPublishedResults = useMemo(
    () => resultsState.students.some((student) => hasAnyExamResult(student)),
    [resultsState.students]
  );

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: '-34% 0px -55% 0px', threshold: [0.12, 0.28, 0.5] }
    );

    navItems.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function loadClasses() {
      try {
        setClassesState({ loading: true, error: false });
        const { data } = await http.get('/public/classes');
        setClasses(Array.isArray(data) ? data : []);
      } catch (error) {
        setClassesState({ loading: false, error: true });
        return;
      }
      setClassesState({ loading: false, error: false });
    }

    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setResultsState({ loading: false, error: false, students: [], classRoom: null });
      return;
    }

    async function loadResults() {
      try {
        setResultsState((current) => ({ ...current, loading: true, error: false }));
        const { data } = await http.get(`/public/classes/${selectedClassId}/results`);
        setResultsState({
          loading: false,
          error: false,
          students: Array.isArray(data.students) ? data.students : [],
          classRoom: data.classRoom || null
        });
      } catch (error) {
        setResultsState({ loading: false, error: true, students: [], classRoom: null });
      }
    }

    loadResults();
  }, [selectedClassId]);

  function handleNavClick(id) {
    scrollToSection(id);
    setMenuOpen(false);
  }

  return (
    <main className="landingPage">
      <nav className={`landingNav${scrolled ? ' isScrolled' : ''}`} aria-label="Primary navigation">
        <button className="landingBrand navReset" type="button" onClick={() => handleNavClick('startseite')} aria-label="Sprach-Pr-fung Startseite">
          <span className="landingLogo" aria-hidden="true">
            <BookOpenText size={22} strokeWidth={1.7} />
          </span>
          <span>Sprach-Pr-fung</span>
        </button>

        <button
          className="mobileMenuButton"
          type="button"
          aria-label={menuOpen ? 'Menu schliessen' : 'Menu offnen'}
          aria-expanded={menuOpen}
          aria-controls="landing-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
          <span>Menu</span>
        </button>

        <div id="landing-menu" className={`landingMenu${menuOpen ? ' isOpen' : ''}`}>
          <div className="landingLinks">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? 'active' : ''}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Link className="adminLink" to="/login" onClick={() => setMenuOpen(false)}>
            <ShieldCheck size={17} strokeWidth={1.8} />
            <span className="adminFull">Admin Login</span>
            <span className="adminShort">Admin</span>
          </Link>
        </div>
      </nav>

      <section className="editorialHero" id="startseite" aria-labelledby="landing-title">
        <div className="heroBackdrop" aria-hidden="true" />
        <div className="heroKicker">Deutschschule / Prufung</div>

        <div className="heroTitleBlock">
          <p className="heroEdition">Sprach-Pr-fung fur klare Fortschritte</p>
          <h1 id="landing-title">
            <span>Deutsch</span>
            <span>lernen.</span>
            <span>Zukunft</span>
          </h1>
        </div>

        <figure className="portraitStage">
          <img src={shakespearePortrait} alt="William Shakespeare portrait" />
          <figcaption>Sprache, Disziplin und klassische Bildungskultur.</figcaption>
        </figure>

        <aside className="heroIntro" aria-label="Einfuhrung zur Schule">
          <p className="introNumber">01</p>
          <h2>Sprache mit Ziel und Struktur.</h2>
          <p>
            Sprach-Pr-fung begleitet Lernende auf ihrem Weg zur deutschen Sprache:
            mit qualifizierten Lehrkraften, klaren Niveaustufen und konsequenter
            Prufungsvorbereitung.
          </p>
          <p>
            Der Unterricht verbindet Fortschritt, Leistung und Orientierung fur
            Studium, Beruf und internationale Perspektiven.
          </p>
          <button className="heroAction navReset" type="button" onClick={() => handleNavClick('ergebnisse')}>
            <span>Ergebnisse ansehen</span>
            <ArrowRight size={16} />
          </button>
        </aside>

        <div className="heroMeta heroMetaLeft" aria-hidden="true">
          <span>Deutsch lernen</span>
          <span>Prufungen bestehen</span>
        </div>
        <div className="heroMeta heroMetaRight" aria-hidden="true">
          <span>Fortschritt sehen</span>
          <span>Ziele erreichen</span>
        </div>
      </section>

      <section className="landingBand" aria-label="Schulschwerpunkte">
        <article>
          <span>Unterricht</span>
          <strong>Strukturierte Deutschkurse mit klaren Lernzielen.</strong>
        </article>
        <article>
          <span>Begleitung</span>
          <strong>Lehrkrafte, die Fortschritt sichtbar machen.</strong>
        </article>
        <article>
          <span>Prufung</span>
          <strong>Vier Ergebnisse zeigen Leistung und Entwicklung.</strong>
        </article>
      </section>

      <section className="editorialSection aboutSection revealBlock" id="ueber-uns" aria-labelledby="about-title">
        <div className="sectionNumber">02</div>
        <div className="sectionCopy">
          <span className="sectionKicker">Uber uns</span>
          <h2 id="about-title">Deutsch lernen in einer ruhigen, anspruchsvollen Umgebung.</h2>
          <p>
            Sprach-Pr-fung ist eine Deutschschule fur Lernende, die ihre Sprache
            systematisch verbessern und sich sicher auf Prufungen vorbereiten
            mochten. Der Unterricht folgt klaren Stufen, verbindet Grammatik,
            Kommunikation und Schreiben und schafft Orientierung fur jeden Lernweg.
          </p>
          <p>
            Qualifizierte Lehrkrafte begleiten die Studierenden mit Feedback,
            regelmassiger Leistungskontrolle und einem unterstutzenden Lernklima.
            So entstehen Fortschritte, die fur Ausbildung, Studium und Beruf
            nutzbar werden.
          </p>
        </div>
        <div className="typographicPanel" aria-hidden="true">
          <span>Sprache</span>
          <strong>A1-B2</strong>
        </div>
      </section>

      <section className="editorialSection coursesSection revealBlock" id="kurse" aria-labelledby="courses-title">
        <div className="sectionNumber">03</div>
        <div className="sectionCopy">
          <span className="sectionKicker">Kurse</span>
          <h2 id="courses-title">Aktuelle Klassen aus dem Schulsystem.</h2>
          <p>
            Diese Klassen werden direkt aus der Anwendung geladen. Es werden keine
            Beispielkurse oder erfundenen Teilnehmerzahlen angezeigt.
          </p>
        </div>
        <div className="classEditorialList" aria-live="polite">
          {classesState.loading && <p className="landingState">Kurse werden geladen...</p>}
          {classesState.error && <p className="landingState">Kurse sind vorubergehend nicht verfugbar. Bitte versuchen Sie es spater erneut.</p>}
          {!classesState.loading && !classesState.error && !classes.length && (
            <p className="landingState">Derzeit sind keine Klassen verfugbar.</p>
          )}
          {!classesState.loading && !classesState.error && classes.map((item) => (
            <article className="classEditorialItem" key={item._id}>
              <span>{String(item.className || '').slice(0, 2).toUpperCase()}</span>
              <div>
                <h3>{item.className}</h3>
                <p>{Number(item.studentCount || 0)} Studierende</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="editorialSection examsSection revealBlock" id="pruefungen" aria-labelledby="exams-title">
        <div className="sectionNumber">04</div>
        <div className="sectionCopy">
          <span className="sectionKicker">Prufungen</span>
          <h2 id="exams-title">Vier Prufungen, klare Bewertung, transparente Entwicklung.</h2>
          <p>
            Jede Schulerin und jeder Schuler kann vier Prufungsergebnisse erhalten.
            Jede Note wird von 0 bis 20 Punkten bewertet. 20/20 ist das beste
            Ergebnis, 0/20 das niedrigste numerische Ergebnis.
          </p>
          <p>
            Wenn jemand an einer einzelnen Prufung nicht teilnimmt, wird diese
            Prufung als <strong>Abwesend</strong> markiert. Es wird dann keine
            kunstliche Null vergeben. Ergebnisse erscheinen offentlich erst,
            nachdem sie im Admin-Bereich gespeichert wurden.
          </p>
        </div>
        <div className="examRules">
          {examKeys.map((key, index) => (
            <article key={key}>
              <span>Prufung {index + 1}</span>
              <strong>0-20</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="resultsSection revealBlock" id="ergebnisse" aria-labelledby="results-title">
        <div className="resultsHead">
          <div>
            <span className="sectionKicker">Ergebnisse</span>
            <h2 id="results-title">Klassenergebnisse und Rangliste.</h2>
          </div>
          <label className="classSelectLabel">
            <span>Klasse auswahlen</span>
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              disabled={classesState.loading || classesState.error}
            >
              <option value="">Klasse auswahlen</option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>{item.className}</option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </label>
        </div>

        <div className="resultsSurface" aria-live="polite">
          {!selectedClassId && <p className="landingState">Wahlen Sie Ihre Klasse aus, um die veroffentlichten Prufungsergebnisse zu sehen.</p>}
          {selectedClassId && resultsState.loading && <p className="landingState">Ergebnisse werden geladen...</p>}
          {selectedClassId && resultsState.error && <p className="landingState">Ergebnisse sind vorubergehend nicht verfugbar. Bitte versuchen Sie es spater erneut.</p>}
          {selectedClassId && !resultsState.loading && !resultsState.error && !resultsState.students.length && (
            <p className="landingState">In dieser Klasse wurden keine Studierenden gefunden.</p>
          )}
          {selectedClassId && !resultsState.loading && !resultsState.error && resultsState.students.length > 0 && !hasPublishedResults && (
            <p className="landingState">Fur diese Klasse wurden noch keine Prufungsergebnisse veroffentlicht.</p>
          )}
          {selectedClassId && !resultsState.loading && !resultsState.error && resultsState.students.length > 0 && hasPublishedResults && (
            <div className="publicResultsTableWrap">
              <table className="publicResultsTable">
                <caption>{resultsState.classRoom?.className || 'Klasse'} - Prufungsergebnisse</caption>
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Name</th>
                    <th>Prufung 1</th>
                    <th>Prufung 2</th>
                    <th>Prufung 3</th>
                    <th>Prufung 4</th>
                    <th>Durchschnitt</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedResults.map(({ student, result, rank }) => (
                    <tr key={student._id}>
                      <td><strong className="rankNumber">{result.average === null ? '-' : rank}</strong></td>
                      <td>{getStudentName(student)}</td>
                      {examKeys.map((key) => (
                        <td key={key}>{getExamDisplay(student, key)}</td>
                      ))}
                      <td>
                        <strong>{result.average === null ? '-' : `${result.average.toFixed(2)}/20`}</strong>
                        {result.absentCount > 0 && <small>{result.absentCount} abwesend</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="editorialSection contactSection revealBlock" id="kontakt" aria-labelledby="contact-title">
        <div className="sectionNumber">05</div>
        <div className="sectionCopy">
          <span className="sectionKicker">Kontakt</span>
          <h2 id="contact-title">Bereit fur den nachsten Schritt in Deutsch?</h2>
          <p>
            Kontaktieren Sie die Schule direkt, um Informationen zu Klassen,
            Einstufung und Prufungsvorbereitung zu erhalten. Die Verwaltung der
            Klassen und Ergebnisse erfolgt sicher im geschutzten Admin-Bereich.
          </p>
        </div>
        <Link className="contactAdminLink" to="/login">
          <ShieldCheck size={18} />
          <span>Admin Login</span>
        </Link>
      </section>
    </main>
  );
}
