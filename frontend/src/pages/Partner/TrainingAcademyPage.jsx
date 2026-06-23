import React, { useState } from 'react';
import { 
  MdPlayCircleOutline, MdPictureAsPdf, MdAssignmentTurnedIn, 
  MdStar, MdStarHalf, MdSchool, MdCheckCircle, MdLock 
} from 'react-icons/md';

const COURSES = {
  cards: [
    { id: 'cc-1', title: 'Fundamentals of Credit Card Sales', duration: '12 mins', videoId: 'dQw4w9WgXcQ', desc: 'Master pitching reward points, milestone waivers, and fuel surcharge benefits to customers.' },
    { id: 'cc-2', title: 'Handling Card Rejection Objections', duration: '18 mins', videoId: 'dQw4w9WgXcQ', desc: 'Learn how to guide customers through clean credit histories and CIBIL score checks.' }
  ],
  loans: [
    { id: 'ln-1', title: 'Personal Loan Eligibility Criteria', duration: '15 mins', videoId: 'dQw4w9WgXcQ', desc: 'Understanding income limits, debt-to-income checks, and salaried vs business loans.' },
    { id: 'ln-2', title: 'Business Loans & Balance Sheet Checks', duration: '22 mins', videoId: 'dQw4w9WgXcQ', desc: 'How to pitch collateral-free business funds and evaluate tax returns.' }
  ],
  insurance: [
    { id: 'ins-1', title: 'Health Insurance Term Plans Explained', duration: '10 mins', videoId: 'dQw4w9WgXcQ', desc: 'Cover details on critical illnesses, pre-existing conditions, and cash-free network hospitals.' }
  ]
};

export default function TrainingAcademyPage() {
  const [activeTab, setActiveTab] = useState('cards');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [quizScore, setQuizScore] = useState(null);
  const [quizActive, setQuizActive] = useState(false);
  
  // Custom quiz questions for Credit Card Expert
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    let score = 0;
    if (answers.q1 === 'rupay') score += 1;
    if (answers.q2 === 'cibil') score += 1;
    if (answers.q3 === 'cheque') score += 1;
    
    setQuizScore(score);
    setQuizActive(false);
  };

  const levelBadges = [
    { id: 'bronze', label: 'Bronze Sales', minScore: 'Unlocks on start', active: true, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'silver', label: 'Silver Expert', minScore: 'Unlocks at 5 approvals', active: true, color: 'text-slate-500 bg-slate-50 border-slate-200' },
    { id: 'gold', label: 'Gold Partner', minScore: 'Unlocks at 15 approvals', active: true, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { id: 'platinum', label: 'Platinum Elite', minScore: 'Unlocks at 50 approvals', active: false, color: 'text-blue-500 bg-blue-50 border-blue-200' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Header section */}
      <div className="bg-[#0D5CAB] p-6 md:p-8 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-[0.05] rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
            <MdSchool /> Training Academy
          </h2>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">Learn how to boost lead conversions, read bank rules, and earn verified sales certifications.</p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20 text-sm font-bold z-10">
          Current Badge: <span className="text-amber-300 font-extrabold">Gold Partner</span>
        </div>
      </div>

      {/* Certification Levels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {levelBadges.map(badge => (
          <div key={badge.id} className={`p-4 rounded-xl border flex flex-col justify-between h-28 relative ${badge.color} ${!badge.active && 'opacity-60'}`}>
            <div className="flex justify-between items-start">
              <span className="text-sm font-bold">{badge.label}</span>
              {badge.active ? <MdCheckCircle size={16} /> : <MdLock size={16} />}
            </div>
            <p className="text-[10px] uppercase font-bold tracking-wider">{badge.minScore}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Course listings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => { setActiveTab('cards'); setQuizScore(null); setQuizActive(false); }}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'cards' ? 'border-[#0D5CAB] text-[#0D5CAB] bg-white' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
              >
                Credit Cards
              </button>
              <button 
                onClick={() => { setActiveTab('loans'); setQuizScore(null); setQuizActive(false); }}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'loans' ? 'border-[#0D5CAB] text-[#0D5CAB] bg-white' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
              >
                Loan Sales
              </button>
              <button 
                onClick={() => { setActiveTab('insurance'); setQuizScore(null); setQuizActive(false); }}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'insurance' ? 'border-[#0D5CAB] text-[#0D5CAB] bg-white' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
              >
                Insurance Sales
              </button>
            </div>

            {/* Courses items */}
            <div className="p-5 divide-y divide-slate-100">
              {COURSES[activeTab].map(course => (
                <div key={course.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-[#0F172A]">{course.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{course.desc}</p>
                    <span className="inline-block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duration: {course.duration}</span>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => setSelectedVideo(course)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-50 text-[#0D5CAB] text-xs font-bold rounded-lg hover:bg-blue-100"
                    >
                      <MdPlayCircleOutline size={18} /> Watch
                    </button>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); alert("PDF sales guide downloaded!"); }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 text-xs font-bold text-[#334155] rounded-lg hover:bg-slate-100"
                    >
                      <MdPictureAsPdf size={16} /> Sales PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right: Quiz panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-6">
          <h3 className="text-lg font-bold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center gap-2">
            <MdAssignmentTurnedIn /> Academy Certification
          </h3>

          {quizActive ? (
            <form onSubmit={handleQuizSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-bold text-[#334155]">1. Which network cards offer UPI payments? *</p>
                <div className="flex flex-col gap-1.5 text-xs text-[#64748B] font-medium">
                  <label className="flex items-center gap-2"><input type="radio" name="q1" value="visa" onChange={e => setAnswers({ ...answers, q1: e.target.value })} /> Visa Cards</label>
                  <label className="flex items-center gap-2"><input type="radio" name="q1" value="rupay" onChange={e => setAnswers({ ...answers, q1: e.target.value })} /> RuPay Cards</label>
                  <label className="flex items-center gap-2"><input type="radio" name="q1" value="master" onChange={e => setAnswers({ ...answers, q1: e.target.value })} /> Mastercard</label>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-[#334155]">2. What is minimum CIBIL score for HDFC? *</p>
                <div className="flex flex-col gap-1.5 text-xs text-[#64748B] font-medium">
                  <label className="flex items-center gap-2"><input type="radio" name="q2" value="600" onChange={e => setAnswers({ ...answers, q2: e.target.value })} /> 600+</label>
                  <label className="flex items-center gap-2"><input type="radio" name="q2" value="cibil" onChange={e => setAnswers({ ...answers, q2: e.target.value })} /> 750+</label>
                  <label className="flex items-center gap-2"><input type="radio" name="q2" value="no-score" onChange={e => setAnswers({ ...answers, q2: e.target.value })} /> No minimum CIBIL</label>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-[#334155]">3. Which bank documents are mandatory? *</p>
                <div className="flex flex-col gap-1.5 text-xs text-[#64748B] font-medium">
                  <label className="flex items-center gap-2"><input type="radio" name="q3" value="cheque" onChange={e => setAnswers({ ...answers, q3: e.target.value })} /> Cancelled Cheque / PAN</label>
                  <label className="flex items-center gap-2"><input type="radio" name="q3" value="gst" onChange={e => setAnswers({ ...answers, q3: e.target.value })} /> GST certificate & VAT</label>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#0D5CAB] hover:bg-[#083E7A] text-white py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
                Submit Answers
              </button>
            </form>
          ) : quizScore !== null ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto shadow-sm border border-green-100 font-extrabold text-xl">
                {quizScore}/3
              </div>
              <div>
                <h4 className="font-bold text-[#0F172A]">Quiz Submitted!</h4>
                <p className="text-xs text-[#64748B] mt-1">
                  {quizScore === 3 ? 'Outstanding! You got a perfect score.' : 'Good try. Review training materials and try again.'}
                </p>
              </div>
              <button 
                onClick={() => { setQuizScore(null); setQuizActive(true); }}
                className="text-[#0D5CAB] font-bold text-xs hover:underline"
              >
                Retake Quiz
              </button>
            </div>
          ) : (
            <div className="py-6 text-center space-y-4">
              <p className="text-xs text-[#64748B] leading-relaxed">
                Test your knowledge by taking a quick quiz on current banking codes and credit rules.
              </p>
              <button 
                onClick={() => setQuizActive(true)}
                className="w-full bg-[#F8FAFC] border border-slate-200 text-[#334155] py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
              >
                Take Sales Quiz
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden relative flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h4 className="font-bold text-[#0F172A] truncate">{selectedVideo.title}</h4>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="text-slate-400 hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe 
                src={`https://www.youtube.com/embed/${selectedVideo.videoId}`} 
                title={selectedVideo.title} 
                className="w-full h-full border-none"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
