'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function Home() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<number, boolean>>({});
  const [showModel, setShowModel] = useState<Record<number, boolean>>({});
  const [currentSection, setCurrentSection] = useState(1);
  const [submittedSections, setSubmittedSections] = useState<number[]>([]);
  
  const [savedNotes, setSavedNotes] = useState<Array<{ text: string; answer: string; timestamp: number; paragraphIndex: number }>>([]);
  const [activeNoteParagraph, setActiveNoteParagraph] = useState<number | null>(null);
  
  const [selectedText, setSelectedText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(-1);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/guide.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Data must be an array');
        setSections(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading guide:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const cleanText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
  };

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    const paragraphElements = document.querySelectorAll('[data-paragraph-index]');
    let foundIndex = -1;
    for (let i = 0; i < paragraphElements.length; i++) {
      const el = paragraphElements[i];
      const elText = el.textContent || '';
      if (text && elText.includes(text.slice(0, 50))) {
        foundIndex = parseInt(el.getAttribute('data-paragraph-index') || '-1');
        break;
      }
    }
    
    if (text && text.length > 10 && text.length < 1000) {
      setSelectedText(text);
      setCurrentParagraphIndex(foundIndex);
      setShowChat(true);
      setChatQuestion('');
    }
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
      setShowChat(false);
      setSelectedText('');
      setActiveNoteParagraph(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleTextSelection, handleClickOutside]);

  const handleAsk = async () => {
    if (!chatQuestion.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paragraph: selectedText, question: chatQuestion }),
      });
      const data = await response.json();
      const cleanAnswer = cleanText(data.explanation || "I couldn't explain that.");
      setSavedNotes(prev => [{
        text: selectedText,
        answer: cleanAnswer,
        timestamp: Date.now(),
        paragraphIndex: currentParagraphIndex
      }, ...prev]);
      setActiveNoteParagraph(currentParagraphIndex);
      setChatQuestion('');
      setShowChat(false);
      setSelectedText('');
      setTimeout(() => setActiveNoteParagraph(null), 3000);
    } catch { }
    setIsLoading(false);
  };

  const currentSectionData = sections.find(s => s.id === currentSection);
  const allQuestions = currentSectionData?.questions || [];
  const hasAnsweredAll = allQuestions.every((q: any) => savedAnswers[q.id]);
  const isSubmitted = submittedSections.includes(currentSection);

  const handleSaveAnswer = (questionId: number, answer: string) => {
    if (!answer.trim()) return;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setSavedAnswers(prev => ({ ...prev, [questionId]: true }));
  };

  const toggleModelAnswer = (questionId: number) => {
    setShowModel(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmitSection = () => {
    if (hasAnsweredAll && !isSubmitted) {
      setSubmittedSections(prev => [...prev, currentSection]);
    }
  };

  const handleNextSection = () => {
    if (isSubmitted && currentSection < sections.length) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  const renderContent = (item: any, idx: number, globalIdx: number) => {
    const notesForThisParagraph = savedNotes.filter(n => n.paragraphIndex === globalIdx);
    
    if (item.type === 'heading') {
      if (item.level === 2) {
        return React.createElement('h2', { key: idx, style: { fontSize: '1.5rem', fontWeight: '600', color: '#f59e0b', marginTop: '1.5rem', marginBottom: '1rem' } }, item.text);
      }
      return React.createElement('h3', { key: idx, style: { fontSize: '1.25rem', fontWeight: '600', color: '#f59e0b', marginTop: '1.25rem', marginBottom: '0.75rem' } }, item.text);
    }
    
    if (item.type === 'text') {
      return React.createElement('div', { key: idx },
        React.createElement('p', {
          'data-paragraph-index': globalIdx,
          style: { marginBottom: '0.75rem', lineHeight: '1.6', transition: 'all 0.3s ease', backgroundColor: activeNoteParagraph === globalIdx ? 'rgba(0, 180, 216, 0.15)' : 'transparent', borderRadius: '0.5rem', padding: activeNoteParagraph === globalIdx ? '0.5rem' : '0' }
        }, item.text),
        notesForThisParagraph.map((note, noteIdx) =>
          React.createElement('div', { key: noteIdx, style: { marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(0, 180, 216, 0.1)', borderRadius: '0.5rem', borderLeft: '3px solid #00b4d8', marginLeft: '1rem' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' } },
              React.createElement('span', { style: { fontSize: '0.7rem', color: '#00b4d8' } }, '📌 AI Explanation'),
              React.createElement('span', { style: { fontSize: '0.6rem', color: '#666' } }, new Date(note.timestamp).toLocaleTimeString())
            ),
            React.createElement('p', { style: { fontSize: '0.8rem', color: '#ccc', fontStyle: 'italic', marginBottom: '0.5rem' } }, `Question: "${note.text.slice(0, 80)}..."`),
            React.createElement('p', { style: { fontSize: '0.875rem', lineHeight: '1.5', color: '#ededed' } }, note.answer)
          )
        )
      );
    }
    
    if (item.type === 'table') {
      return React.createElement('div', { key: idx, style: { overflowX: 'auto', marginBottom: '1rem' } },
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' } },
          React.createElement('thead', {},
            React.createElement('tr', { style: { background: '#2a2a2a' } },
              item.headers.map((header: string, i: number) =>
                React.createElement('th', { key: i, style: { border: '1px solid #3a3a3a', padding: '0.5rem', textAlign: 'left' } }, header)
              )
            )
          ),
          React.createElement('tbody', {},
            item.rows.map((row: string[], i: number) =>
              React.createElement('tr', { key: i },
                row.map((cell: string, j: number) =>
                  React.createElement('td', { key: j, style: { border: '1px solid #3a3a3a', padding: '0.5rem' } }, cell)
                )
              )
            )
          )
        )
      );
    }
    
    return null;
  };

  if (loading) {
    return React.createElement('div', { style: { minHeight: '100vh', background: '#0a0a0a', color: '#ededed', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      React.createElement('div', { style: { textAlign: 'center' } },
        React.createElement('div', { style: { width: '40px', height: '40px', border: '3px solid #2a2a2a', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' } }),
        React.createElement('p', {}, 'Loading...')
      )
    );
  }

  if (error) {
    return React.createElement('div', { style: { minHeight: '100vh', background: '#0a0a0a', color: '#ededed', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      React.createElement('div', { style: { textAlign: 'center', color: '#ef4444' } },
        React.createElement('p', {}, `Error: ${error}`)
      )
    );
  }

  if (!currentSectionData) {
    return React.createElement('div', { style: { padding: '2rem', textAlign: 'center' } }, 'Section not found');
  }

  const flattenedContent = currentSectionData.content.flatMap((item: any) => {
    if (item.type === 'text') return [{ type: 'text', text: item.text }];
    if (item.type === 'heading') return [{ type: 'heading', level: item.level, text: item.text }];
    if (item.type === 'table') return [{ type: 'table', headers: item.headers, rows: item.rows }];
    return [];
  });

  return React.createElement('div', { style: { minHeight: '100vh', background: '#0a0a0a', color: '#ededed' } },
    React.createElement('style', {}, `@keyframes spin { to { transform: rotate(360deg); } }`),
    React.createElement('div', { style: { maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: '2rem' } },
        React.createElement('h1', { style: { fontSize: '2.5rem', color: '#3b82f6' } }, '🔥 AS Business Survival Kit'),
        React.createElement('div', { style: { height: '3px', width: '80px', background: '#3b82f6', margin: '0.75rem auto', borderRadius: '2px' } }),
        React.createElement('p', { style: { color: '#888', fontSize: '0.875rem' } }, 'Complete Finance & Accounting Guide for Cambridge AS Level')
      ),
      React.createElement('div', { style: { marginBottom: '2rem' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' } },
          React.createElement('span', {}, `Section ${currentSection} of ${sections.length}`),
          React.createElement('span', {}, `${Object.keys(savedAnswers).length} of ${allQuestions.length} answered`)
        ),
        React.createElement('div', { style: { height: '6px', background: '#2a2a2a', borderRadius: '3px', overflow: 'hidden' } },
          React.createElement('div', { style: { width: `${(Object.keys(savedAnswers).length / allQuestions.length) * 100}%`, height: '100%', background: '#3b82f6', transition: 'width 0.3s' } })
        )
      ),
      React.createElement('div', { style: { background: '#1a1a1a', padding: '1.75rem', borderRadius: '1rem', marginBottom: '2rem' } },
        React.createElement('h2', { style: { fontSize: '1.5rem', color: '#3b82f6', marginBottom: '1.25rem', borderLeft: '4px solid #3b82f6', paddingLeft: '0.75rem' } }, currentSectionData.title),
        flattenedContent.map((item: any, idx: number) => renderContent(item, idx, idx))
      ),
      React.createElement('div', { style: { background: '#1a1a1a', padding: '1.75rem', borderRadius: '1rem', marginBottom: '2rem' } },
        React.createElement('h3', { style: { fontSize: '1.25rem', marginBottom: '1.25rem', color: '#3b82f6' } }, '📝 Check Your Understanding'),
        allQuestions.map((q: any, idx: number) =>
          React.createElement('div', { key: q.id, style: { marginBottom: '1.75rem', paddingBottom: '1.75rem', borderBottom: idx < allQuestions.length - 1 ? '1px solid #2a2a2a' : 'none' } },
            React.createElement('p', { style: { marginBottom: '0.75rem', fontWeight: '500', fontSize: '1rem' } }, q.text),
            React.createElement('textarea', {
              value: answers[q.id] || '',
              onChange: (e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value })),
              placeholder: 'Type your answer here...',
              style: { width: '100%', padding: '0.75rem', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '0.5rem', color: '#ededed', minHeight: '100px', marginBottom: '0.75rem', fontFamily: 'inherit', fontSize: '0.875rem' }
            }),
            React.createElement('div', { style: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' } },
              React.createElement('button', {
                onClick: () => handleSaveAnswer(q.id, answers[q.id] || ''),
                disabled: !answers[q.id]?.trim(),
                style: { padding: '0.5rem 1rem', background: savedAnswers[q.id] ? '#00b4d8' : '#3b82f6', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: !answers[q.id]?.trim() ? 'not-allowed' : 'pointer', opacity: !answers[q.id]?.trim() ? 0.5 : 1, fontSize: '0.875rem', fontWeight: '500' }
              }, savedAnswers[q.id] ? 'Saved' : 'Save Answer'),
              React.createElement('button', {
                onClick: () => toggleModelAnswer(q.id),
                style: { padding: '0.5rem 1rem', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: '0.5rem', color: '#ededed', cursor: 'pointer', fontSize: '0.875rem' }
              }, showModel[q.id] ? 'Hide Answer' : 'Show Answer')
            ),
            showModel[q.id] && React.createElement('div', { style: { marginTop: '0.75rem', padding: '1rem', background: 'rgba(0, 180, 216, 0.1)', borderRadius: '0.5rem', borderLeft: '3px solid #00b4d8' } },
              React.createElement('p', { style: { color: '#00b4d8', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '500' } }, 'Model Answer:'),
              React.createElement('p', { style: { fontSize: '0.875rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' } }, q.modelAnswer),
              React.createElement('p', { style: { color: '#f59e0b', fontSize: '0.75rem', marginTop: '0.5rem' } }, `Exam Tip: ${q.examTip}`)
            )
          )
        )
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' } },
        React.createElement('button', { onClick: handlePrevSection, disabled: currentSection === 1, style: { padding: '0.6rem 1.5rem', background: currentSection === 1 ? '#2a2a2a' : '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '0.5rem', color: currentSection === 1 ? '#666' : '#ededed', cursor: currentSection === 1 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: '500' } }, '← Previous'),
        !isSubmitted && hasAnsweredAll && React.createElement('button', { onClick: handleSubmitSection, style: { padding: '0.6rem 1.5rem', background: '#00b4d8', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' } }, 'Submit & Continue'),
        isSubmitted && React.createElement('button', { onClick: handleNextSection, disabled: currentSection === sections.length, style: { padding: '0.6rem 1.5rem', background: currentSection === sections.length ? '#2a2a2a' : '#3b82f6', border: 'none', borderRadius: '0.5rem', color: currentSection === sections.length ? '#666' : 'white', cursor: currentSection === sections.length ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: '500' } }, 'Next →'),
        !hasAnsweredAll && !isSubmitted && React.createElement('div', { style: { color: '#ef4444', fontSize: '0.875rem' } }, 'Answer all questions to continue')
      ),
      isSubmitted && React.createElement('div', { style: { marginTop: '1rem', padding: '0.75rem', background: 'rgba(0, 180, 216, 0.1)', borderRadius: '0.5rem', textAlign: 'center' } },
        React.createElement('p', { style: { color: '#00b4d8', fontSize: '0.875rem' } }, 'Section complete!')
      )
    ),
    showChat && selectedText && React.createElement('div', { ref: chatRef, style: { position: 'fixed', bottom: 20, right: 20, zIndex: 1000, maxWidth: '380px', width: '90%' } },
      React.createElement('div', { style: { background: '#1a1a1a', borderRadius: '1rem', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid #2a2a2a', overflow: 'hidden' } },
        React.createElement('div', { style: { padding: '0.75rem 1rem', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a' } },
          React.createElement('span', { style: { fontWeight: '600', fontSize: '0.875rem' } }, 'Ask AI'),
          React.createElement('button', { onClick: () => setShowChat(false), style: { background: 'none', border: 'none', color: '#888', fontSize: '1.25rem', cursor: 'pointer' } }, '×')
        ),
        React.createElement('div', { style: { padding: '1rem' } },
          React.createElement('div', { style: { background: '#0a0a0a', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '0.75rem' } },
            React.createElement('p', { style: { fontSize: '0.65rem', color: '#666', marginBottom: '0.25rem' } }, 'Selected'),
            React.createElement('p', { style: { fontSize: '0.75rem', color: '#f59e0b' } }, `"${selectedText.slice(0, 80)}..."`)
          ),
          React.createElement('textarea', {
            value: chatQuestion,
            onChange: (e) => setChatQuestion(e.target.value),
            placeholder: 'Ask anything about this...',
            style: { width: '100%', padding: '0.75rem', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '0.5rem', color: '#ededed', marginBottom: '0.75rem', minHeight: '60px', fontSize: '0.875rem', fontFamily: 'inherit' }
          }),
          React.createElement('button', {
            onClick: handleAsk,
            disabled: isLoading || !chatQuestion.trim(),
            style: { padding: '0.6rem', background: !chatQuestion.trim() ? '#2a2a2a' : '#3b82f6', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: !chatQuestion.trim() ? 'not-allowed' : 'pointer', width: '100%', fontSize: '0.875rem', fontWeight: '500' }
          }, isLoading ? 'Thinking...' : 'Ask & Save')
        )
      )
    )
  );
}