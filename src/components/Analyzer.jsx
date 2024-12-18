import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

function Analyzer() {
  const [csvData, setCsvData] = useState([]);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [highlightedText, setHighlightedText] = useState('');

  const [toggles, setToggles] = useState({
    ot: true,
    nt: true,
    ap: true,
    otNt: true,
    otAp: true,
    ntAp: true,
    all: true,
  });

  const categoryNames = {
    ot: 'Old Testament Only',
    nt: 'New Testament Only',
    ap: 'Apocrypha Only',
    otNt: 'Old Testament + New Testament',
    otAp: 'Old Testament + Apocrypha',
    ntAp: 'New Testament + Apocrypha',
    all: 'All Sources',
  };

  useEffect(() => {
    fetch('/bible_word_frequencies.csv')
      .then(response => response.text())
      .then(data => {
        Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => setCsvData(results.data),
        });
      })
      .catch(error => console.error('Error loading CSV:', error));
  }, []);

  const analyzeText = () => {
    if (!csvData.length || !inputText) return;

    const wordData = {};
    csvData.forEach(row => {
      wordData[row.Word.toLowerCase()] = {
        ot: parseInt(row['Old Testament']) || 0,
        nt: parseInt(row['New Testament']) || 0,
        apocrypha: parseInt(row['Apocrypha']) || 0,
      };
    });

    const preWords = inputText.match(/["']?[\w'-]+["']?|[.,!?;:(){}\[\]]/g) || [];
    const wordOnly = preWords.filter(word => /^[\w'"-]+$/.test(word));
    const words = new Set(wordOnly.map(word => word.toLowerCase()));
    const preTotal = wordOnly.length;
    const totalWords = words.size;
    const biblicalWordsUsed = new Set();

    let otCount = 0, ntCount = 0, apocryphaCount = 0, totalBiblicalCount = 0;

    const otOnlyWords = new Set();
    const ntOnlyWords = new Set();
    const apocryphaOnlyWords = new Set();
    const otNtWords = new Set();
    const otApocryphaWords = new Set();
    const ntApocryphaWords = new Set();
    const allWords = new Set();

    words.forEach(word => {
      const lowerWord = word.replace(/['"]/g, '').toLowerCase();
      if (lowerWord in wordData && !biblicalWordsUsed.has(lowerWord)) {
        const { ot, nt, apocrypha } = wordData[lowerWord];
        const inOt = ot > 0;
        const inNt = nt > 0;
        const inApocrypha = apocrypha > 0;

        if (inOt) otCount++;
        if (inNt) ntCount++;
        if (inApocrypha) apocryphaCount++;

        if (inOt && !inNt && !inApocrypha) otOnlyWords.add(lowerWord);
        if (inNt && !inOt && !inApocrypha) ntOnlyWords.add(lowerWord);
        if (inApocrypha && !inOt && !inNt) apocryphaOnlyWords.add(lowerWord);
        if (inOt && inNt && !inApocrypha) otNtWords.add(lowerWord);
        if (inOt && inApocrypha && !inNt) otApocryphaWords.add(lowerWord);
        if (inNt && inApocrypha && !inOt) ntApocryphaWords.add(lowerWord);
        if (inOt && inNt && inApocrypha) allWords.add(lowerWord);

        totalBiblicalCount++;
        biblicalWordsUsed.add(lowerWord);
      }
    });

    const getPct = (num) => ((num / totalWords) * 100).toFixed(2);

    const highlightWord = (word) => {
      const lowerWord = word.replace(/['"]/g, '').toLowerCase();
      if (otOnlyWords.has(lowerWord)) return `<span class="highlight-ot">${word}</span>`;
      if (ntOnlyWords.has(lowerWord)) return `<span class="highlight-nt">${word}</span>`;
      if (apocryphaOnlyWords.has(lowerWord)) return `<span class="highlight-ap">${word}</span>`;
      if (otNtWords.has(lowerWord)) return `<span class="highlight-otNt">${word}</span>`;
      if (otApocryphaWords.has(lowerWord)) return `<span class="highlight-otAp">${word}</span>`;
      if (ntApocryphaWords.has(lowerWord)) return `<span class="highlight-ntAp">${word}</span>`;
      if (allWords.has(lowerWord)) return `<span class="highlight-all">${word}</span>`;
      return word;
    };

    const highlighted = preWords.map(word => highlightWord(word)).join(' ');

    setResult({
      totalWords,
      preTotal,
      otCount,
      ntCount,
      apocryphaCount,
      totalBiblicalCount,
      pctOt: getPct(otCount),
      pctNt: getPct(ntCount),
      pctApocrypha: getPct(apocryphaCount),
      pctBiblical: getPct(totalBiblicalCount),
      biblicalWordsUsed: Array.from(biblicalWordsUsed).join(', '),
    });

    setHighlightedText(highlighted);
  };

  const toggleClass = (category) => {
    setToggles((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="p-4 mx-8 justify-center dark:text-white text-black">
      <h1 className="my-8 mx-auto text-center">Biblical Word Count Analyzer</h1>
      <p className="mb-2 mx-auto text-center">
        Has a sentence ever made you think: <i>wow, none of these words are in the Bible</i>?
      </p>
      <p className="mb-8 mt-2 mx-auto text-center">
        Well now you can check exactly how many of them are.
      </p>
      <textarea
        rows="5"
        placeholder="Enter your text here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />
      <div className="flex justify-center">
        <button
          onClick={analyzeText}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 col-span-2 w-1/2"
        >
          Analyze
        </button>
      </div>

      {result && (
        <div className="mt-2">
          <h3 className="text-xl font-bold mb-4 flex justify-center underline">Results</h3>
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-2 justify-center mx-auto text-center">
              <div className="flex-1 min-w-[300px] text-left ident">
                <p><b>Unique Words:</b> {result.totalWords} ({result.preTotal} Overall)</p>
                <p><b>Old Testament Words:</b> {result.otCount} ({result.pctOt}%)</p>
                <p><b>New Testament Words:</b> {result.ntCount} ({result.pctNt}%)</p>
                <p><b>Apocrypha Words:</b> {result.apocryphaCount} ({result.pctApocrypha}%)</p>
              </div>
              <div className="flex-1 min-w-[300px] text-right ident">
                <p className="text-lg font-bold"><b>Total Biblical Words:</b> {result.totalBiblicalCount}</p>
                <p className="font-semibold">Your text is {result.pctBiblical}% biblical.</p>
              </div>
            </div>
          </div>
          <div>
            <p className="font-bold mt-4">Words Identified as Biblical:</p>
            <p className="mb-4">{result.biblicalWordsUsed}</p>
          </div>
          <div
            className={`border border-gray-300 p-4 rounded ${Object.entries(toggles)
              .filter(([_, isEnabled]) => !isEnabled)
              .map(([category]) => `disable-highlight-${category}`)
              .join(' ')}`}
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
          <div className="grid grid-cols-2 gap-4 max-w-[80%] mx-auto my-4">
            <div className="col-span-2 flex justify-center gap-2">
              <button
                key="all"
                className={`toggle-button button-all ${!toggles.all ? 'disable-btn-all' : ''} w-1/2 flex-1/2`}
                onClick={() => toggleClass('all')}
              >
                {toggles.all ? `${categoryNames.all} (on)` : `${categoryNames.all} (off)`}
              </button>
            </div>
            <div className="flex flex-col justify-center gap-2">
              {['ot', 'nt', 'ap'].map((category) => (
                <button
                  key={category}
                  className={`toggle-button button-${category} ${!toggles[category] ? `disable-btn-${category}` : ''} w-full flex-1`}
                  onClick={() => toggleClass(category)}
                >
                  {toggles[category] ? `${categoryNames[category]} (on)` : `${categoryNames[category]} (off)`}
                </button>
              ))}
            </div>

            <div className="flex flex-col justify-center gap-2">
              {['otNt', 'otAp', 'ntAp'].map((category) => (
                <button
                  key={category}
                  className={`toggle-button button-${category} ${!toggles[category] ? `disable-btn-${category}` : ''} w-full flex-1`}
                  onClick={() => toggleClass(category)}
                >
                  {toggles[category] ? `${categoryNames[category]} (on)` : `${categoryNames[category]} (off)`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analyzer;
