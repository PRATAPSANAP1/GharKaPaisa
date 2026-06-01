import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ChevronLeft, Play, Send, Terminal, CheckCircle2, XCircle, Code2, Clock, Cpu, Calendar, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import codingService from '../../services/codingService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Select from '../../components/common/Select';

const DEFAULT_STARTER_CODE = {
  javascript: `// JavaScript Starter Code\nfunction solve() {\n    const fs = require('fs');\n    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim();\n    console.log(input);\n}\n\nsolve();`,
  python: `# Python Starter Code\nimport sys\n\ndef solve():\n    lines = sys.stdin.read().trim().split('\\n')\n    for line in lines:\n        print(line)\n\nif __name__ == '__main__':\n    solve()`,
  java: `// Java Starter Code\nimport java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            System.out.println(sc.nextLine());\n        }\n    }\n}`,
  cpp: `// C++ Starter Code\n#include <iostream>\nusing namespace std;\n\nint main() {\n    string s;\n    if (cin >> s) {\n        cout << s << endl;\n    }\n    return 0;\n}`,
  c: `// C Starter Code\n#include <stdio.h>\n\nint main() {\n    char s[100];\n    if (scanf("%s", s) == 1) {\n        printf("%s\\n", s);\n    }\n    return 0;\n}`
};

const CodingEditor = () => {
  const { id } = useParams(); // problemId
  const navigate = useNavigate();
  const { theme } = useSelector((state) => state.ui);

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('description'); // 'description', 'submissions'
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState(null); // { results, isSubmit, finalStatus }
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchProblemDetail = async () => {
      try {
        setLoading(true);
        const res = await codingService.getProblem(id);
        const prob = res.data;
        setProblem(prob);

        const histRes = await codingService.getSubmissions(id);
        setSubmissions(histRes.data);

        const savedCode = localStorage.getItem(`code_${id}_${language}`);
        if (savedCode) {
          setCode(savedCode);
        } else {
          setCode(prob.starterCode?.[language] || DEFAULT_STARTER_CODE[language]);
        }
      } catch (err) {
        console.error('Error fetching problem details:', err.message);
        toast.error('Failed to load coding challenge details');
        navigate('/student/coding');
      } finally {
        setLoading(false);
      }
    };
    fetchProblemDetail();
  }, [id, navigate]);

  const handleLanguageChange = (e) => {
    const nextLang = e.target.value;

    if (code) {
      localStorage.setItem(`code_${id}_${language}`, code);
    }

    setLanguage(nextLang);
    const savedCode = localStorage.getItem(`code_${id}_${nextLang}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(problem.starterCode?.[nextLang] || DEFAULT_STARTER_CODE[nextLang]);
    }
  };

  const handleRunCode = async () => {
    try {
      setRunning(true);
      setTerminalOutput(null);

      const res = await codingService.runCode({
        problemId: id,
        language,
        code
      });

      setTerminalOutput({
        results: res.data.results || [],
        isSubmit: false,
        allPassed: res.data.allPassed
      });

      if (res.data.allPassed) {
        toast.success('Example test cases passed successfully!');
      } else {
        toast.error('Some test cases failed.');
      }
    } catch (err) {
      console.error('Run code error:', err.message);
      toast.error('Error executing code in compiler');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    try {
      setSubmitting(true);
      setTerminalOutput(null);

      const res = await codingService.submitCode({
        problemId: id,
        language,
        code
      });

      const submission = res.data;
      const passedAll = submission.status === 'accepted';

      setTerminalOutput({
        results: [{
          status: submission.status,
          time: submission.executionTime,
          memory: submission.memoryUsed,
          error: submission.error,
          testCasesPassed: submission.testCasesPassed,
          totalTestCases: submission.totalTestCases
        }],
        isSubmit: true,
        finalStatus: submission.status
      });

      if (passedAll) {
        toast.success('Accepted! All test cases passed! 🎉');
      } else {
        toast.error(`Wrong Answer or Error: ${submission.status}`);
      }

      const histRes = await codingService.getSubmissions(id);
      setSubmissions(histRes.data);
    } catch (err) {
      console.error('Submit code error:', err.message);
      toast.error('Error submitting code to compiler');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!problem) return null;

  return (
    <div className="flex flex-col gap-5 h-full max-w-7xl mx-auto pb-12">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/coding"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to Coding Problems
        </Link>
        <span className="text-xs font-bold text-slate-400">
          Earn points: <strong className="text-indigo-500">{problem.points} pts</strong>
        </span>
      </div>

      {/* Main split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* Left Side: Descriptions & Submissions tabs */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col h-[650px] overflow-hidden p-0" hover={false}>
            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'description'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Problem Description
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'submissions'
                    ? 'border-b-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Submission History ({submissions.length})
              </button>
            </div>

            {/* Description Tab Contents */}
            {activeTab === 'description' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <div className="flex gap-2 mb-2.5">
                    <Badge variant="gray" size="sm">
                      {problem.category?.name || 'Category'}
                    </Badge>
                    <Badge variant={problem.difficulty === 'easy' ? 'success' : problem.difficulty === 'medium' ? 'warning' : 'danger'} size="sm">
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{problem.title}</h2>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
                  <p className="whitespace-pre-line">{problem.description}</p>
                </div>

                {/* Constraints & Limits */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800/80 text-xs font-bold">
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/30 rounded-xl flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Time Limit: {problem.timeLimit || 2} seconds</span>
                  </div>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/30 rounded-xl flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-slate-400" />
                    <span>Memory Limit: {problem.memoryLimit || 256} MB</span>
                  </div>
                </div>

                {problem.inputFormat && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Input Format</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/20">
                      {problem.inputFormat}
                    </p>
                  </div>
                )}

                {problem.outputFormat && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Output Format</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/20">
                      {problem.outputFormat}
                    </p>
                  </div>
                )}

                {problem.constraints && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Constraints</h4>
                    <pre className="text-[11px] font-mono leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/20">
                      {problem.constraints}
                    </pre>
                  </div>
                )}

                {/* Example Test Cases */}
                {problem.examples && problem.examples.map((ex, idx) => (
                  <div key={idx} className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800/80">
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">Example Case {idx + 1}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Input</span>
                        <pre className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/20 rounded-xl p-3 text-xs font-mono">{ex.input}</pre>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Expected Output</span>
                        <pre className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/20 rounded-xl p-3 text-xs font-mono">{ex.output}</pre>
                      </div>
                    </div>
                    {ex.explanation && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        <strong>Explanation:</strong> {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submissions Tab Contents */}
            {activeTab === 'submissions' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {submissions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No submissions recorded yet for this problem. Write code and click 'Submit Code' to create one!
                  </div>
                ) : (
                  submissions.map((sub) => {
                    const isPassed = sub.status === 'accepted';
                    return (
                      <div
                        key={sub._id}
                        className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/20 hover:bg-slate-50/60 dark:hover:bg-slate-800/35 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                          }`}>
                            {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                              {sub.status.replace('_', ' ')}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Language: <strong className="text-slate-800 dark:text-white capitalize">{sub.language}</strong>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Passed: {sub.testCasesPassed || 0}/{sub.totalTestCases || 0} Cases
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Language select + Monaco Code Editor + Results */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1 flex flex-col justify-between p-0" hover={false}>
            {/* Header controls */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" /> Code Editor
              </span>
              <Select
                value={language}
                options={[
                  { label: 'Python 3', value: 'python' },
                  { label: 'JavaScript', value: 'javascript' },
                  { label: 'Java', value: 'java' },
                  { label: 'C++', value: 'cpp' },
                  { label: 'C', value: 'c' }
                ]}
                onChange={handleLanguageChange}
                className="w-40 py-1"
              />
            </div>

            {/* Monaco Editor frame */}
            <div className="flex-1 border-b border-slate-100 dark:border-slate-800/80 bg-slate-950">
              <Editor
                height="400px"
                language={language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'python' ? 'python' : 'javascript'}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={code}
                onChange={(val) => setCode(val)}
                options={{
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, Consolas, monospace',
                  minimap: { enabled: false },
                  automaticLayout: true,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  tabSize: 4,
                  wordWrap: 'on'
                }}
              />
            </div>

            {/* Bottom Panel compiler triggers */}
            <div className="px-6 py-4 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Terminal className="w-4 h-4" /> Ready to compile
              </span>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  loading={running}
                  disabled={submitting}
                  icon={Play}
                  onClick={handleRunCode}
                  className="font-bold py-1.5 px-4 text-xs"
                >
                  Run Code
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  disabled={running}
                  icon={Send}
                  onClick={handleSubmitCode}
                  className="font-bold py-1.5 px-5 text-xs shadow-blue-500/10"
                >
                  Submit Code
                </Button>
              </div>
            </div>
          </Card>

          {/* Terminal output results */}
          {terminalOutput && (
            <Card className="bg-slate-900 border-slate-800 text-slate-100 max-h-[220px] overflow-y-auto" hover={false}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Console Compiler Output
                </span>
                <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                  terminalOutput.isSubmit
                    ? (terminalOutput.finalStatus === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400')
                    : (terminalOutput.allPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400')
                }`}>
                  {terminalOutput.isSubmit ? terminalOutput.finalStatus.replace('_', ' ') : (terminalOutput.allPassed ? 'All Passed' : 'Failed')}
                </span>
              </div>

              {terminalOutput.isSubmit ? (
                <div className="text-xs space-y-2 mt-2">
                  {terminalOutput.results[0].error ? (
                    <pre className="text-rose-400 font-mono bg-rose-950/20 border border-rose-950/40 p-3 rounded-xl whitespace-pre-wrap">
                      {terminalOutput.results[0].error}
                    </pre>
                  ) : (
                    <div className="flex flex-col gap-2 font-semibold">
                      <p>Status: <strong className={terminalOutput.finalStatus === 'accepted' ? 'text-emerald-400' : 'text-rose-400'}>{terminalOutput.finalStatus.replace('_', ' ').toUpperCase()}</strong></p>
                      <p>Test Cases Evaluated: <strong className="text-slate-200">{terminalOutput.results[0].testCasesPassed} / {terminalOutput.results[0].totalTestCases} Passed</strong></p>
                      <p>Max Run Duration: <strong className="text-slate-200">{terminalOutput.results[0].time}s</strong></p>
                      <p>Memory Overhead: <strong className="text-slate-200">{Math.round(terminalOutput.results[0].memory / 1024)} MB</strong></p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs space-y-3 mt-2">
                  {terminalOutput.results.map((res, idx) => (
                    <div key={idx} className="border-b border-slate-800 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between font-bold mb-1.5">
                        <span>Example Test Case {res.caseIndex}</span>
                        <span className={res.status === 'accepted' ? 'text-emerald-400' : 'text-rose-400'}>
                          {res.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {res.error ? (
                        <pre className="text-rose-400 font-mono bg-rose-950/20 p-2.5 rounded-lg border border-rose-950/30 whitespace-pre-wrap">{res.error}</pre>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-[11px] font-mono leading-relaxed bg-slate-950/60 p-2.5 rounded-lg">
                          <div>
                            <span className="text-slate-500 font-bold block mb-0.5">Input</span>
                            <pre className="text-slate-300">{res.input}</pre>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold block mb-0.5">Actual Output</span>
                            <pre className="text-slate-300">{res.actualOutput || '<No stdout output>'}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

        </div>

      </div>
    </div>
  );
};

export default CodingEditor;

