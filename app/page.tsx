'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import {
  buildEnglishDraft,
  buildHindiDraft,
  CLASS_OPTIONS,
  DURATION_OPTIONS,
  formatDraftForDownload,
  getEstimatedLength,
  lookupWord,
  splitTopics,
  transliterateHindiTopics,
} from '@/lib/extempore/builders';
import { ENGLISH_DICTIONARY } from '@/lib/extempore/dictionary';
import type { DictionaryEntry, Draft, Duration, Language } from '@/lib/extempore/types';

export default function Home() {
  const exportSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [language, setLanguage] = useState<Language>('english');
  const [className, setClassName] = useState('5');
  const [duration, setDuration] = useState<Duration>('2');
  const [rawTopics, setRawTopics] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>(() => [
    buildEnglishDraft('My Best Teacher', '5', '2'),
    buildEnglishDraft('Importance of Reading', '5', '2'),
  ]);
  const [selectedWord, setSelectedWord] = useState<DictionaryEntry | null>(ENGLISH_DICTIONARY.respect ?? null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPreparingContent, setIsPreparingContent] = useState(false);

  const helperText = useMemo(() => {
    const topics = splitTopics(rawTopics);
    const count = topics.filter(Boolean).length;
    if (count === 0) return language === 'english' ? 'Enter at least one topic.' : 'कम से कम एक विषय दर्ज करें।';
    if (count === 1)
      return language === 'english' ? '1 topic detected.' : '1 विषय पहचाना गया।';
    return language === 'english' ? `${count} topics detected.` : `${count} विषय पहचाने गए।`;
  }, [rawTopics, language]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPreparingContent(true);
    try {
      let topics = splitTopics(rawTopics);
      if (topics.length === 0) return;

      if (language === 'hindi') {
        const transliterated = await transliterateHindiTopics(topics);
        topics = transliterated;
        setRawTopics(transliterated.join(', '));
      }

      const built = topics.map((topic) =>
        language === 'english'
          ? buildEnglishDraft(topic, className, duration)
          : buildHindiDraft(topic, className, duration),
      );
      setDrafts(built);
      setSelectedWord(null);
    } finally {
      setIsPreparingContent(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const text = drafts
      .map((draft) => formatDraftForDownload(draft, language, className))
      .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extempore-${language}-class-${className}-${duration}min.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePdfDownload = async () => {
    const surface = exportSurfaceRef.current;
    if (!surface) return;
    setIsExportingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(surface, { scale: 2, useCORS: true });
      const imageData = canvas.toDataURL('image/png');
      const imageWidth = canvas.width;
      const imageHeight = canvas.height;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const scaledImageHeight = (imageHeight / imageWidth) * contentWidth;

      let remainingHeight = scaledImageHeight;
      let imageOffset = margin;

      pdf.addImage(imageData, 'PNG', margin, imageOffset, contentWidth, scaledImageHeight, undefined, 'FAST');
      remainingHeight -= contentHeight;

      while (remainingHeight > 0) {
        pdf.addPage();
        imageOffset = margin - (scaledImageHeight - remainingHeight);
        pdf.addImage(imageData, 'PNG', margin, imageOffset, contentWidth, scaledImageHeight, undefined, 'FAST');
        remainingHeight -= contentHeight;
      }

      const languageLabel = language === 'english' ? 'english' : 'hindi';
      pdf.save(`extempore-${languageLabel}-class-${className}-${duration}min.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <main className="extempore-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">✦ School extempore helper for parents</span>
          <h1>Your child&apos;s speech, ready in seconds.</h1>
          <p>
            Choose the language, type one or more topics, pick your child&apos;s class, and get a
            complete, age-appropriate speech they can read out loud &mdash; plus a word meaning helper
            for the harder words.
          </p>
          <div className="hero-steps" aria-hidden="true">
            <div className="hero-step-chip"><span>1</span>Pick language</div>
            <div className="hero-step-chip"><span>2</span>Add topics</div>
            <div className="hero-step-chip"><span>3</span>Get speech</div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="hero-art-chip">📚</span>
            <span className="hero-art-chip">🎤</span>
            <span className="hero-art-chip">⭐</span>
          </div>
        </div>

        <form className="brief-card" onSubmit={handleSubmit}>
          <div className="field-group">
            <span className="field-label"><span className="step-dot">1</span>Language</span>
            <div className="segmented-control">
              <button
                type="button"
                className={language === 'english' ? 'segment active' : 'segment'}
                onClick={() => setLanguage('english')}
              >
                English
              </button>
              <button
                type="button"
                className={language === 'hindi' ? 'segment active' : 'segment'}
                onClick={() => setLanguage('hindi')}
              >
                Hindi
              </button>
            </div>
          </div>

          <label className="field-group" htmlFor="topics">
            <span className="field-label"><span className="step-dot">2</span>Extempore topics</span>
            <textarea
              id="topics"
              className="input-area"
              value={rawTopics}
              onChange={(event) => setRawTopics(event.target.value)}
              rows={5}
              placeholder={
                language === 'english'
                  ? 'E.g. My Best Teacher, Importance of Books, Trees and Environment'
                  : 'जैसे: मेरा विद्यालय, पेड़ों का महत्व, आदर्श जीवन'
              }
            />
            <span className="field-hint">{helperText}</span>
          </label>

          <label className="field-group" htmlFor="className">
            <span className="field-label"><span className="step-dot">3</span>Student class</span>
            <select
              id="className"
              className="input-select"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            >
              {CLASS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {language === 'english' ? `Class ${value}` : `कक्षा ${value}`}
                </option>
              ))}
            </select>
          </label>

          <div className="field-group">
            <span className="field-label">
              <span className="step-dot">4</span>{language === 'english' ? 'Speech length' : 'भाषण की अवधि'}
            </span>
            <div className="segmented-control duration-control">
              {DURATION_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={duration === value ? 'segment active' : 'segment'}
                  onClick={() => setDuration(value)}
                >
                  {language === 'english' ? `${value} min` : `${value} मिनट`}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="generate-button" disabled={isPreparingContent}>
            {isPreparingContent
              ? language === 'english'
                ? 'Preparing speech...'
                : 'भाषण तैयार हो रहा है...'
              : language === 'english'
                ? 'Prepare Final Speech'
                : 'अंतिम भाषण तैयार करें'}
          </button>
        </form>
      </section>

      <section className="workspace-grid">
        <div className="drafts-column">
          <div className="output-toolbar no-print">
            <div className="toolbar-copy">
              <h2>{language === 'english' ? 'Draft pack' : 'ड्राफ्ट पैक'}</h2>
              <p>
                {language === 'english'
                  ? 'Download a real PDF, keep a text copy, or print these sheets directly.'
                  : 'वास्तविक PDF डाउनलोड करें, टेक्स्ट कॉपी रखें, या इन शीट्स को सीधे प्रिंट करें।'}
              </p>
            </div>

            <div className="toolbar-actions">
              <button
                type="button"
                className="toolbar-button primary"
                onClick={handlePdfDownload}
                disabled={isExportingPdf}
              >
                {isExportingPdf
                  ? language === 'english'
                    ? 'Preparing PDF...'
                    : 'PDF तैयार हो रही है...'
                  : language === 'english'
                    ? 'Download PDF'
                    : 'PDF डाउनलोड करें'}
              </button>
              <button type="button" className="toolbar-button secondary" onClick={handleDownload}>
                {language === 'english' ? 'Download Draft Pack' : 'ड्राफ्ट डाउनलोड करें'}
              </button>
              <button type="button" className="toolbar-button secondary" onClick={handlePrint}>
                {language === 'english' ? 'Print or Save as PDF' : 'प्रिंट या PDF सेव करें'}
              </button>
            </div>
          </div>

          <div ref={exportSurfaceRef} className="export-surface">
            <div className="print-sheet-heading">
              <h2>{language === 'english' ? 'Extempore Practice Sheet' : 'वक्तृत्व अभ्यास पत्र'}</h2>
              <p>
                {language === 'english'
                  ? `Class ${className} • ${getEstimatedLength(language, duration)} • ${drafts.length} topic${drafts.length === 1 ? '' : 's'}`
                  : `कक्षा ${className} • ${getEstimatedLength(language, duration)} • ${drafts.length} विषय`}
              </p>
            </div>

            {drafts.map((draft) => (
              <article key={`${draft.topic}-${draft.title}`} className="speech-card">
                <div className="speech-header">
                  <div className="speech-meta-row">
                    <span className="speech-badge">
                      {language === 'english' ? `Class ${className}` : `कक्षा ${className}`}
                    </span>
                    <span className="speech-badge muted-badge">{draft.estimatedLength}</span>
                  </div>
                  <h2>{draft.title}</h2>
                </div>

                <div className="speech-section-title">
                  {language === 'english' ? 'Final speech' : 'अंतिम भाषण'}
                </div>

                <p className="speech-paragraph">{draft.intro}</p>

                {draft.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="speech-paragraph">
                    {paragraph}
                  </p>
                ))}

                <p className="speech-closing">{draft.closing}</p>

                {draft.difficultWords.length > 0 ? (
                  <div className="difficult-words-box no-print">
                    <h3>
                      {language === 'english'
                        ? 'Difficult words in this speech'
                        : 'इस भाषण के कठिन शब्द'}
                    </h3>
                    <div className="difficult-word-list">
                      {draft.difficultWords.map((entry) => (
                        <button
                          key={`${draft.topic}-${entry.word}`}
                          type="button"
                          className={
                            selectedWord?.word === entry.word
                              ? 'difficulty-chip active'
                              : 'difficulty-chip'
                          }
                          onClick={() =>
                            setSelectedWord(lookupWord(entry.word, draft.topic, language))
                          }
                        >
                          {entry.word}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="cue-box">
                  <h3>
                    {language === 'english'
                      ? 'Extra ideas if the student wants to extend the speech'
                      : 'यदि छात्र भाषण बढ़ाना चाहें तो ये अतिरिक्त बिंदु'}
                  </h3>
                  <ul>
                    {draft.ideas.map((idea) => (
                      <li key={idea}>{idea}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="dictionary-panel">
          <span className="eyebrow">
            {language === 'english' ? 'Difficult word helper' : 'कठिन शब्द सहायक'}
          </span>
          <h2>{language === 'english' ? 'Meaning helper' : 'शब्दार्थ सहायक'}</h2>
          {selectedWord ? (
            <div className="dictionary-card">
              <div className="dictionary-word">{selectedWord.word}</div>
              <p>{selectedWord.meaning}</p>
              <div className="dictionary-usage">
                <strong>
                  {language === 'english' ? 'How to use it:' : 'इसे कैसे समझाएँ:'}
                </strong>
                <p>{selectedWord.usage}</p>
              </div>
            </div>
          ) : (
            <p className="dictionary-empty">
              {language === 'english'
                ? 'Choose one of the difficult-word chips from a speech card to see its meaning.'
                : 'किसी भाषण कार्ड में दिए गए कठिन शब्दों में से एक चुनें और उसका अर्थ देखें।'}
            </p>
          )}

          <div className="dictionary-note">
            <p>
              {language === 'english'
                ? 'The drafts are written in a plain speaking tone so children can present them naturally instead of sounding scripted.'
                : 'सामग्री को बोलचाल की सरल शैली में रखा गया है ताकि छात्र स्वाभाविक ढंग से बोल सकें, रटा हुआ न लगे।'}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}



