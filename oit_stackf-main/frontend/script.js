// Loader
window.addEventListener('load', () => {
  const loader = document.querySelector('.loader-wrapper');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
});

// Sticky Navbar
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  if (!header) return;
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = hamburger.querySelector('i');
    if (navLinks.classList.contains('active')) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-times');
    } else {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });
}

// Active link highlighting
const currentUrl = window.location.pathname;
const navItems = document.querySelectorAll('.nav-links a');
navItems.forEach(item => {
  // Basic active state check, handles root as well
  if (item.getAttribute('href') === currentUrl.substring(currentUrl.lastIndexOf('/') + 1) ||
    (currentUrl.endsWith('/') && item.getAttribute('href') === 'index.html')) {
    item.classList.add('active');
  }
});

// Scroll Animation
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const animElements = document.querySelectorAll('.animate-on-scroll');
  animElements.forEach(el => observer.observe(el));
});

// Regional Analytics Hierarchy Logic
document.addEventListener('DOMContentLoaded', () => {
  const stateToggleBtn = document.getElementById('maharashtraToggle');
  const divisionsContainer = document.getElementById('maharashtraDivisions');

  if (stateToggleBtn && divisionsContainer) {
    stateToggleBtn.addEventListener('click', () => {
      stateToggleBtn.classList.toggle('active');

      if (stateToggleBtn.classList.contains('active')) {
        divisionsContainer.classList.add('active');
        divisionsContainer.style.maxHeight = divisionsContainer.scrollHeight + 800 + 'px';
      } else {
        divisionsContainer.classList.remove('active');
        divisionsContainer.style.maxHeight = '0px';
      }
    });
  }
});

// Global variable to store constituency data for insights
let currentConstituencyData = null;

// Function to fetch and display constituency data
async function loadConstituencyData(constituencyId) {
  // Update this URL to match your deployed Render/Railway backend
  const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? "http://localhost:3000"
    : "https://oit-stack-backend.onrender.com";


  const container2009 = document.getElementById('candidateTableContainer2009');
  const container2014 = document.getElementById('candidateTableContainer2014');
  const container2019 = document.getElementById('candidateTableContainer2019');
  const container2024 = document.getElementById('candidateTableContainer2024');

  if (!container2009 || !container2014 || !container2019 || !container2024) return;

  // Show "Loading" states
  container2009.innerHTML = '<p>Loading 2009 candidates...</p>';
  container2014.innerHTML = '<p>Loading 2014 candidates...</p>';
  container2019.innerHTML = '<p>Loading 2019 candidates...</p>';
  container2024.innerHTML = '<p>Loading 2024 candidates...</p>';

  try {
    // Call the deployed backend API
    const response = await fetch(`${BASE_URL}/api/constituency/${constituencyId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    currentConstituencyData = data; // Store globally for insights

    // Render 2009 Table
    renderTable(container2009, data.records_2009, false, "2009");

    // Render 2014 Table
    renderTable(container2014, data.records_2014, true, "2014");

    // Render 2019 Table
    renderTable(container2019, data.records_2019, true, "2019");

    // Render 2024 Table
    renderTable(container2024, data.records_2024, true, "2024");

    // Initialize Insights Button
    initInsights();

  } catch (error) {
    console.error('Error fetching constituency data:', error);
    const errorMsg = '<p style="color:red;">Unable to fetch data. Please try again later.</p>';
    container2009.innerHTML = errorMsg;
    container2014.innerHTML = errorMsg;
    container2019.innerHTML = errorMsg;
    container2024.innerHTML = errorMsg;
  }
}

// Insights Logic
let charts = {}; // Store chart instances to destroy them before re-rendering

function initInsights() {
  const modal = document.getElementById('insightsModal');
  const btn = document.getElementById('insightsBtn');
  const closeSpan = document.querySelector('.close-modal');

  if (!btn || !modal) return;

  btn.onclick = () => {
    modal.style.display = "block";
    setTimeout(() => {
      renderAllCharts();
    }, 100);
  };

  closeSpan.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

function renderAllCharts() {
  if (!currentConstituencyData) return;

  const years = [2009, 2014, 2019, 2024];
  years.forEach(year => {
    const records = currentConstituencyData[`records_${year}`];
    renderPieChart(`chart${year}`, records, year);
  });
}

// Register Chart.js DataLabels plugin safely
try {
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    console.log('ChartDataLabels plugin registered successfully');
  } else {
    console.warn('ChartDataLabels plugin not found. Slices will not have labels.');
  }
} catch (e) {
  console.error('Error registering ChartDataLabels:', e);
}

// Party Color Mapping (Avoiding Green)
const partyColorMap = {
  'BJP': '#f97316', // Vibrant Orange
  'INC': '#0ea5e9', // Bright Sky Blue (Updated from Royal Blue)
  'NCP': '#fde047', // Vibrant Yellow
  'NCP(SP)': '#7c3aed', // Vibrant Purple
  'SHS': '#e11d48', // Vibrant Crimson
  'SHUBT': '#ec4899', // Vibrant Pink
  'BSP': '#4338ca', // Deep Indigo
  'MNS': '#ea580c', // Dark Orange
  'IND': '#d1d5db', // Light Gray
  'OTHERS': '#cbd5e1' // Light Slate
};

function getPartyColor(party) {
  if (!party) return partyColorMap['IND'];
  const p = party.toUpperCase().replace(/[\(\)\s]/g, ''); // Remove parens and spaces
  
  if (p.includes('BJP')) return partyColorMap['BJP'];
  if (p.includes('INC') || p.includes('CONGRESS')) return partyColorMap['INC'];
  
  // Prioritize NCPSP / NCP(SP) before general NCP
  if (p.includes('NCPSP')) return partyColorMap['NCP(SP)'];
  if (p.includes('NCP')) return partyColorMap['NCP'];
  
  if (p.includes('SHS') || p.includes('SHIV') || p.includes('SENA')) {
    if (p.includes('UBT')) return partyColorMap['SHUBT'];
    return partyColorMap['SHS'];
  }
  if (p.includes('BSP')) return partyColorMap['BSP'];
  if (p.includes('MNS')) return partyColorMap['MNS'];
  if (p === 'OTH' || p === 'OTHERS') return partyColorMap['OTHERS'];
  
  // Fallback to vibrant colors from the image (excluding green)
  const fallbacks = ['#f43f5e', '#8b5cf6', '#3b82f6', '#f59e0b', '#06b6d4'];
  const index = Math.abs(party.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % fallbacks.length;
  return fallbacks[index];
}

function renderPieChart(canvasId, records, year) {
  console.log(`Attempting to render chart for ${year} on ${canvasId}`);
  if (!records || records.length === 0) {
    console.warn(`No records found for ${year}`);
    return;
  }

  // Take top 5 candidates, others = 100% - sum(top 5)
  const topCount = 5;
  const topCandidates = records.slice(0, topCount);
  
  const topPercentageSum = topCandidates.reduce((sum, c) => sum + parseFloat(c.votes_percentage || 0), 0);
  const othersPercentage = Math.max(0, 100 - topPercentageSum).toFixed(2);

  let labels = topCandidates.map(c => c.candidate_name);
  let partyLabels = topCandidates.map(c => c.party || "IND");
  let dataPoints = topCandidates.map(c => parseFloat(c.votes_percentage || 0));
  let backgroundColors = topCandidates.map(c => getPartyColor(c.party));

  if (parseFloat(othersPercentage) > 0.5) {
    labels.push("Others");
    partyLabels.push("OTH");
    dataPoints.push(parseFloat(othersPercentage));
    backgroundColors.push(partyColorMap['OTHERS']);
  }

  const ctx = document.getElementById(canvasId).getContext('2d');
  
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }

  // Light but clearly visible colors
  const premiumColors = [
    '#93c5fd', // Light Blue (600 -> 300)
    '#86efac', // Light Green
    '#fde047', // Light Yellow
    '#fda4af', // Light Rose
    '#c4b5fd', // Light Violet
    '#cbd5e1'  // Light Slate (Others)
  ];

  charts[canvasId] = new Chart(ctx, {
    type: 'pie', // Switched back to pie chart as requested
    data: {
      labels: labels,
      datasets: [{
        data: dataPoints,
        backgroundColor: backgroundColors,
        borderWidth: 1.5,
        borderColor: '#ffffff',
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#000000', // Black as requested
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 15,
            font: { family: "'Inter', sans-serif", size: 11, weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#000',
          bodyColor: '#000',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 15,
          cornerRadius: 10,
          displayColors: true,
          borderColor: '#e2e8f0',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const party = partyLabels[context.dataIndex];
              return ` ${party}: ${context.raw}%`;
            }
          }
        },
        datalabels: {
          color: '#000000', // Black labels on light slices
          font: { weight: 'bold', size: 11 },
          formatter: (value, ctx) => {
            if (value < 5) return ''; 
            return partyLabels[ctx.dataIndex];
          },
          anchor: 'center',
          align: 'center'
        }
      },
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1500,
        easing: 'easeOutQuart'
      }
    }
  });
}

// Reusable helper function to render tables
function renderTable(container, candidates, showSymbol, year) {
  const titleId = `recordYearTitle${year}`;
  const titleElement = document.getElementById(titleId);

  if (!candidates || candidates.length === 0) {
    container.style.display = 'none';
    if (titleElement && titleElement.parentElement) {
      titleElement.parentElement.style.display = 'none';
    }
    return;
  }

  // Ensure container and title are visible if data exists
  container.style.display = 'block';
  if (titleElement && titleElement.parentElement) {
    titleElement.parentElement.style.display = 'block';
  }

  let tableHtml = `
    <table class="candidate-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Candidate</th>
          <th>Sex</th>
          <th>Age</th>
          <th>Cat</th>
          <th>Party</th>
          ${showSymbol ? '<th>Symbol</th>' : ''}
          <th>General</th>
          <th>Postal</th>
          <th>Total</th>
          <th>Performance</th>
        </tr>
      </thead>
      <tbody>
  `;

  candidates.forEach(candidate => {
    const isWinner = candidate.rank_no == 1;
    const votePercent = parseFloat(candidate.votes_percentage) || 0;
    const sexValue = (candidate.sex || '').toUpperCase();
    const isMale = sexValue === 'M' || sexValue === 'MALE';
    const isFemale = sexValue === 'F' || sexValue === 'FEMALE';
    const genderIcon = isMale ? '<i class="fa-solid fa-mars" style="color: #3b82f6;"></i>' : 
                      (isFemale ? '<i class="fa-solid fa-venus" style="color: #ec4899;"></i>' : '');
    
    tableHtml += `
      <tr class="${isWinner ? 'winner-row' : ''}">
        <td class="rank-cell">
          <span class="rank-badge ${isWinner ? 'rank-winner' : ''}">${candidate.rank_no || '-'}</span>
        </td>
        <td class="candidate-name-cell">
          <div class="candidate-name">${candidate.candidate_name || '-'}</div>
        </td>
        <td class="gender-cell">${genderIcon} <span>${isMale ? 'Male' : (isFemale ? 'Female' : (candidate.sex || '-'))}</span></td>
        <td><span class="meta-data">${candidate.age || '-'}</span></td>
        <td><span class="meta-data">${candidate.category || '-'}</span></td>
        <td><span class="party-badge">${candidate.party || '-'}</span></td>
        ${showSymbol ? `<td><span class="symbol-text">${candidate.symbol || '-'}</span></td>` : ''}
        <td class="vote-number">${candidate.general.toLocaleString()}</td>
        <td class="vote-number">${candidate.postal.toLocaleString()}</td>
        <td class="vote-number"><strong>${candidate.total.toLocaleString()}</strong></td>
        <td>
          <div class="performance-data">
            <div class="pie-chart" style="--percent: ${votePercent}%"></div>
            <span class="vote-percent-text">${votePercent}%</span>
          </div>
        </td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  container.innerHTML = tableHtml;
}
const boothFilter = document.getElementById("boothFilter");

if (boothFilter) {

// Generate booth numbers
for(let i = 1; i <= 437; i++){

    const option = document.createElement("option");

    option.value = i;

    option.textContent = i;

    boothFilter.appendChild(option);

}
boothFilter.addEventListener("change", async function(){

    const boothNumber = this.value;

    let url = "http://localhost:5000/api/voters";

    if(boothNumber){

        url += `?boothNumber=${boothNumber}`;

    }

    const response = await fetch(url);

    const data = await response.json();

    displayVoters(data);

});
}

// Site Assistant Chatbot
const getApiBaseUrl = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? "http://localhost:3000" : "https://oit-stack-backend.onrender.com";
};

document.addEventListener('DOMContentLoaded', () => {
  initSiteAssistant();
});

function initSiteAssistant() {
  if (document.querySelector('.chatbot-widget')) return;

  const widget = document.createElement('div');
  widget.className = 'chatbot-widget';
  widget.innerHTML = `
    <button class="chatbot-launcher" type="button" aria-label="Open OIT assistant">
      <span class="chatbot-dance-robot" aria-hidden="true">
        <span class="astro-bot-head">
          <span class="astro-bot-ear left"></span>
          <span class="astro-bot-ear right"></span>
          <span class="astro-bot-screen">
            <span class="astro-bot-eye left"></span>
            <span class="astro-bot-eye right"></span>
            <span class="astro-bot-smile"></span>
          </span>
        </span>
        <span class="astro-bot-arm left"></span>
        <span class="astro-bot-arm right"></span>
        <span class="astro-bot-body">
          <span class="astro-bot-core"></span>
        </span>
        <span class="astro-bot-leg left"></span>
        <span class="astro-bot-leg right"></span>
        <span class="astro-bot-shadow"></span>
      </span>
    </button>
    <section class="chatbot-panel" aria-live="polite" aria-label="OIT assistant chat">
      <button class="chatbot-panel-exit" type="button" aria-label="Exit chat bot">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="chatbot-header">
        <div class="chatbot-avatar" aria-hidden="true">
          <span class="chatbot-robot-face mini">
            <span class="chatbot-antenna"></span>
            <span class="chatbot-eye left"></span>
            <span class="chatbot-eye right"></span>
            <span class="chatbot-smile"></span>
          </span>
        </div>
        <div>
          <h3>OIT Bot</h3>
          <p>Records and service helper</p>
        </div>
        <button class="chatbot-close" type="button" aria-label="Close assistant">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="chatbot-messages"></div>
      <form class="chatbot-form">
        <input type="text" placeholder="Enter service, contact, or constituency..." aria-label="Message OIT bot">
        <button type="submit" aria-label="Send message">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    </section>
  `;

  document.body.appendChild(widget);

  const launcher = widget.querySelector('.chatbot-launcher');
  const messages = widget.querySelector('.chatbot-messages');
  const form = widget.querySelector('.chatbot-form');
  const input = form.querySelector('input');

  const openBot = () => {
    widget.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    setTimeout(() => input.focus(), 120);
  };

  const closeBot = () => {
    widget.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
  };

  launcher.addEventListener('click', openBot);
  launcher.setAttribute('aria-expanded', 'false');
  widget.addEventListener('click', event => {
    if (event.target.closest('.chatbot-close, .chatbot-panel-exit')) {
      closeBot();
    }
  });

  addBotActionMessage(messages, "Welcome to OIT_Stack. How may I help you?", getWelcomeActions());

  const pendingInsight = getStoredBotInsight();
  if (pendingInsight) {
    clearStoredBotInsight();
    openBot();
    addBotMessage(messages, pendingInsight);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    addUserMessage(messages, query);
    input.value = '';
    handleAssistantQuery(query, messages);
  });
}

function addBotMessage(container, text) {
  addChatMessage(container, text, 'bot');
}

function addBotActionMessage(container, text, actions) {
  const message = document.createElement('div');
  message.className = 'chatbot-message bot chatbot-action-message';

  const body = document.createElement('p');
  body.textContent = text;
  message.appendChild(body);

  const actionList = document.createElement('div');
  actionList.className = 'chatbot-action-list';

  actions.forEach(action => {
    const link = document.createElement(action.query ? 'button' : 'a');
    link.className = 'chatbot-action-link';
    link.textContent = action.label;

    if (action.query) {
      link.type = 'button';
      link.addEventListener('click', () => handleAssistantQuery(action.query, container));
    } else {
      link.href = action.href;
    }

    if (action.icon) {
      const icon = document.createElement('i');
      icon.className = action.icon;
      link.prepend(icon);
    }
    actionList.appendChild(link);
  });

  message.appendChild(actionList);
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
}

function addUserMessage(container, text) {
  addChatMessage(container, text, 'user');
}

function addChatMessage(container, text, type) {
  const message = document.createElement('div');
  message.className = `chatbot-message ${type}`;
  message.textContent = text;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
}

function setAssistantTyping(container, isTyping) {
  let typing = container.querySelector('.chatbot-typing');
  if (isTyping && !typing) {
    typing = document.createElement('div');
    typing.className = 'chatbot-message bot chatbot-typing';
    typing.textContent = 'Checking the site data...';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
  }
  if (!isTyping && typing) {
    typing.remove();
  }
}

async function handleAssistantQuery(query, messages) {
  const normalized = query.toLowerCase();

  if (normalized.includes('insight') || normalized.includes('chart') || normalized.includes('pie')) {
    await answerInsightQuery(query, messages);
    return;
  }

  if (normalized.includes('service') || normalized.includes('software') || normalized.includes('campaign') || normalized.includes('training') || normalized.includes('survey') || normalized.includes('analytics')) {
    addBotActionMessage(messages, "Choose a service to open directly:", getServiceActions());
    return;
  }

  if (normalized.includes('contact') || normalized.includes('phone') || normalized.includes('email') || normalized.includes('address')) {
    addBotActionMessage(messages, "You can contact OIT_Stack here:", [
      { label: 'Open Contact Page', href: 'contact.html', icon: 'fa-solid fa-address-book' }
    ]);
    addBotMessage(messages, "Phone: +91 8983461569. Email: onkarholkar@oitstack.com.");
    return;
  }

  if (normalized === 'records' || normalized === 'record' || normalized === 'constituency') {
    addBotMessage(messages, "Please enter a constituency number or name. Example: 208, Vadgaon Sheri, or Kasba Peth.");
    return;
  }

  const constituency = await resolveConstituencyFromQuery(query);
  if (constituency) {
    openConstituencyRecords(constituency, messages);
    return;
  }

  if (normalized.includes('record') || normalized.includes('constituency') || /\b\d{1,3}\b/.test(normalized)) {
    addBotMessage(messages, "Please enter a valid Maharashtra assembly constituency number from 1 to 288, or type the constituency name.");
    return;
  }

  if (normalized.includes('voter') || normalized.includes('booth') || normalized.includes('elector')) {
    addBotMessage(messages, "For voter data, open the voter list page and use the booth dropdown to filter records. You can also ask me for constituency records by typing a constituency number, for example: records 208.");
    return;
  }

  if (normalized.includes('login') || normalized.includes('sign')) {
    addBotMessage(messages, "Use Login or Sign Up from the top navigation. If you are accessing protected constituency dashboards, use the constituency login page for that dashboard.");
    return;
  }

  addBotMessage(messages, "I can help with services, information queries, voter/booth data, contact details, and constituency records. For records, type a constituency number like records 215.");
}

function getWelcomeActions() {
  return [
    { label: 'Services', query: 'services', icon: 'fa-solid fa-list' },
    { label: 'Records', query: 'records', icon: 'fa-solid fa-table' },
    { label: 'Contact', query: 'contact', icon: 'fa-solid fa-address-book' }
  ];
}

let constituencyIndexPromise = null;

async function getConstituencyIndex() {
  if (constituencyIndexPromise) return constituencyIndexPromise;

  constituencyIndexPromise = (async () => {
    const fallbackIndex = [
      { id: '208', name: '208 - Vadgaon Sheri' },
      { id: '215', name: '215 - Kasba Peth' }
    ];

    if (typeof districtData === 'object' && districtData) {
      return buildConstituencyIndexFromDistrictData(districtData);
    }

    try {
      const response = await fetch('constituencies.js');
      if (!response.ok) throw new Error('Constituency list unavailable');
      const source = await response.text();
      const matches = [...source.matchAll(/"(\d{1,3})\s+-\s+([^"]+)"/g)];
      const index = matches.map(match => ({
        id: match[1],
        name: `${match[1]} - ${match[2]}`
      }));
      return index.length ? index : fallbackIndex;
    } catch (error) {
      return fallbackIndex;
    }
  })();

  return constituencyIndexPromise;
}

function buildConstituencyIndexFromDistrictData(data) {
  return Object.values(data).flatMap(district => {
    if (!Array.isArray(district.assemblies)) return [];
    return district.assemblies.map(assembly => {
      const match = assembly.match(/^(\d{1,3})\s+-\s+(.+)$/);
      return match ? { id: match[1], name: assembly } : null;
    }).filter(Boolean);
  });
}

async function resolveConstituencyFromQuery(query) {
  const idMatch = query.match(/\b([1-9]|[1-9]\d|1\d\d|2[0-8]\d)\b/);
  const index = await getConstituencyIndex();

  if (idMatch) {
    const id = idMatch[1];
    return index.find(item => item.id === id) || { id, name: getConstituencyName(id) };
  }

  const normalizedQuery = normalizeConstituencyText(query);
  if (!normalizedQuery || normalizedQuery.length < 3) return null;

  return index.find(item => normalizeConstituencyText(item.name).includes(normalizedQuery))
    || index.find(item => normalizedQuery.includes(normalizeConstituencyText(item.name).replace(/^\d+\s+/, '')));
}

function normalizeConstituencyText(value) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function openConstituencyRecords(constituency, messages) {
  const url = getRecordPageUrl(constituency.id, constituency.name);
  addBotActionMessage(messages, `Opening ${constituency.name} records page.`, [
    { label: 'Open Records Page', href: url, icon: 'fa-solid fa-table' }
  ]);

  setTimeout(() => {
    window.location.href = url;
  }, 450);
}

async function answerRecordQuery(query, messages) {
  const idMatch = query.match(/\b([1-9]|[1-9]\d|1\d\d|2[0-8]\d)\b/);

  if (!idMatch) {
    addBotMessage(messages, "Please share a constituency number from 1 to 288. Example: records 208 for Vadgaon Sheri or records 215 for Kasba Peth.");
    return;
  }

  const constituencyId = idMatch[1];
  setAssistantTyping(messages, true);

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/constituency/${constituencyId}`);
    if (!response.ok) throw new Error('Unable to fetch constituency records');

    const data = await response.json();
    const latestYear = ['2024', '2019', '2014', '2009'].find(year => Array.isArray(data[`records_${year}`]) && data[`records_${year}`].length);
    setAssistantTyping(messages, false);

    if (!latestYear) {
      addBotActionMessage(messages, `I found constituency ${constituencyId}, but no election records are available yet. You can still open the records page to check details.`, [
        { label: 'Open Records Page', href: getRecordPageUrl(constituencyId), icon: 'fa-solid fa-table' }
      ]);
      return;
    }

    const records = data[`records_${latestYear}`];
    const winner = records.find(candidate => Number(candidate.rank_no) === 1) || records[0];
    const runnerUp = records.find(candidate => Number(candidate.rank_no) === 2);
    const constituencyName = getConstituencyName(constituencyId);
    const summaryParts = [
      `${constituencyName} has ${records.length} records for ${latestYear}.`,
      winner ? `Winner: ${winner.candidate_name || 'N/A'} (${winner.party || 'N/A'}) with ${formatNumber(winner.total)} votes.` : '',
      runnerUp ? `Runner-up: ${runnerUp.candidate_name || 'N/A'} (${runnerUp.party || 'N/A'}) with ${formatNumber(runnerUp.total)} votes.` : '',
    ].filter(Boolean);

    addBotActionMessage(messages, summaryParts.join(' '), [
      { label: 'Open Records Page', href: getRecordPageUrl(constituencyId), icon: 'fa-solid fa-table' }
    ]);
  } catch (error) {
    setAssistantTyping(messages, false);
    addBotActionMessage(messages, "I could not reach the records API right now, but you can still open the records page directly.", [
      { label: 'Open Records Page', href: getRecordPageUrl(constituencyId), icon: 'fa-solid fa-table' }
    ]);
  }
}

async function answerInsightQuery(query, messages) {
  const constituency = await resolveConstituencyFromQuery(query);

  if (!constituency) {
    addBotMessage(messages, "Please enter the constituency name or number for insights. Example: insights of Kasba Peth or insights 208.");
    return;
  }

  setAssistantTyping(messages, true);

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/constituency/${constituency.id}`);
    if (!response.ok) throw new Error('Unable to fetch insight data');

    const data = await response.json();
    const summary = buildYearWiseInsightSummary(data, constituency);
    const url = getInsightPageUrl(constituency.id, constituency.name);

    setAssistantTyping(messages, false);
    addBotActionMessage(messages, summary, [
      { label: 'Open Insights', href: url, icon: 'fa-solid fa-chart-pie' }
    ]);

    setTimeout(() => {
      storeBotInsight(summary);
      window.location.href = url;
    }, 900);
  } catch (error) {
    const url = getInsightPageUrl(constituency.id, constituency.name);
    setAssistantTyping(messages, false);
    addBotActionMessage(messages, `Opening ${constituency.name} insights. The records page will show the available pie charts.`, [
      { label: 'Open Insights', href: url, icon: 'fa-solid fa-chart-pie' }
    ]);

    setTimeout(() => {
      storeBotInsight(`Opening ${constituency.name} insights. The pie chart window will show charts; year-wise insight text will appear here in the bot when data is available.`);
      window.location.href = url;
    }, 900);
  }
}

function getStoredBotInsight() {
  try {
    return window.sessionStorage ? window.sessionStorage.getItem('oitBotPendingInsight') : null;
  } catch (error) {
    return null;
  }
}

function storeBotInsight(summary) {
  try {
    if (window.sessionStorage) {
      window.sessionStorage.setItem('oitBotPendingInsight', summary);
    }
  } catch (error) {
    // Bot still shows the insight before navigation if browser storage is unavailable.
  }
}

function clearStoredBotInsight() {
  try {
    if (window.sessionStorage) {
      window.sessionStorage.removeItem('oitBotPendingInsight');
    }
  } catch (error) {
    // Ignore storage cleanup failures.
  }
}

function buildYearWiseInsightSummary(data, constituency) {
  const years = ['2009', '2014', '2019', '2024'];
  const lines = years
    .map(year => {
      const records = data[`records_${year}`];
      if (!Array.isArray(records) || !records.length) return null;

      return `${year}: ${buildSimpleYearInsight(records)}`;
    })
    .filter(Boolean);

  if (!lines.length) {
    return `${constituency.name}: No simple insight is available yet because records are missing.`;
  }

  return `${constituency.name} simple election insights:\n${lines.join('\n')}`;
}

function buildSimpleYearInsight(records) {
  const leader = records[0];
  const runnerUp = records[1];
  const third = records[2];
  const leaderShare = parseFloat(leader?.votes_percentage) || 0;
  const runnerShare = parseFloat(runnerUp?.votes_percentage) || 0;
  const thirdShare = parseFloat(third?.votes_percentage) || 0;
  const margin = Math.abs(leaderShare - runnerShare);
  const topTwoShare = leaderShare + runnerShare;

  if (!leader) return 'No clear result is available.';

  let resultType = 'This looks like a close contest.';
  if (margin >= 15) {
    resultType = 'This looks like a comfortable win.';
  } else if (margin >= 7) {
    resultType = 'This looks like a clear but not one-sided win.';
  } else if (margin < 3) {
    resultType = 'This looks like a very tight fight.';
  }

  const mainLine = `${leader.candidate_name || 'The leading candidate'} from ${leader.party || 'N/A'} is ahead with about ${leaderShare.toFixed(1)}% votes.`;
  const secondLine = runnerUp
    ? `${runnerUp.candidate_name || 'The second candidate'} from ${runnerUp.party || 'N/A'} is next with about ${runnerShare.toFixed(1)}%, so the gap is about ${margin.toFixed(1)} percentage points.`
    : '';
  const votePattern = topTwoShare >= 80
    ? 'Most voters are split mainly between the top two candidates.'
    : thirdShare >= 8
      ? `A third candidate also has a visible share of about ${thirdShare.toFixed(1)}%, so the vote is more divided.`
      : 'Other candidates have a smaller share, so the main fight is between the top two.';

  return [mainLine, secondLine, resultType, votePattern].filter(Boolean).join(' ');
}

function buildInsightSummary(data, constituency) {
  const availableYears = ['2024', '2019', '2014', '2009']
    .filter(year => Array.isArray(data[`records_${year}`]) && data[`records_${year}`].length);

  if (!availableYears.length) {
    return `${constituency.name} insights page is opening, but no chart records are available yet.`;
  }

  const latestYear = availableYears[0];
  const latestRecords = data[`records_${latestYear}`];
  const topCandidates = latestRecords.slice(0, 3);
  const topShare = topCandidates.reduce((sum, candidate) => sum + (parseFloat(candidate.votes_percentage) || 0), 0);
  const leader = topCandidates[0];
  const runnerUp = topCandidates[1];
  const margin = leader && runnerUp
    ? Math.abs((parseFloat(leader.votes_percentage) || 0) - (parseFloat(runnerUp.votes_percentage) || 0)).toFixed(2)
    : null;

  const topText = topCandidates
    .map(candidate => `${candidate.candidate_name || 'N/A'} (${candidate.party || 'N/A'}) ${candidate.votes_percentage || 0}%`)
    .join(', ');

  const yearText = availableYears.length > 1
    ? `Charts are available for ${availableYears.reverse().join(', ')}.`
    : `Chart is available for ${latestYear}.`;

  return `${constituency.name} ${latestYear} pie insight: ${topText}. Top 3 share is ${topShare.toFixed(2)}%. ${margin ? `Leader margin is ${margin} percentage points. ` : ''}${yearText} Opening the Insights tab now.`;
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'N/A';
  return number.toLocaleString('en-IN');
}

function getServiceActions() {
  return [
    { label: 'Software Development', href: 'service-software.html', icon: 'fa-solid fa-code' },
    { label: 'Data Analytics', href: 'service-analytics.html', icon: 'fa-solid fa-chart-line' },
    { label: 'Campaign Management', href: 'service-campaign.html', icon: 'fa-solid fa-bullhorn' },
    { label: 'Corporate Training', href: 'service-training.html', icon: 'fa-solid fa-users-viewfinder' },
    { label: 'Political Surveys', href: 'service-surveys.html', icon: 'fa-solid fa-square-poll-vertical' }
  ];
}

function getConstituencyName(constituencyId) {
  const knownNames = {
    '208': '208 - Vadgaon Sheri',
    '215': '215 - Kasba Peth'
  };

  if (knownNames[constituencyId]) return knownNames[constituencyId];

  if (typeof districtData === 'object' && districtData) {
    for (const district of Object.values(districtData)) {
      const match = district.assemblies.find(assembly => assembly.startsWith(`${constituencyId} - `));
      if (match) return match;
    }
  }

  return `Constituency ${constituencyId}`;
}

function getRecordPageUrl(constituencyId, constituencyName) {
  const name = constituencyName || getConstituencyName(constituencyId);
  return `constituency-details.html?id=${encodeURIComponent(constituencyId)}&name=${encodeURIComponent(name)}`;
}

function getInsightPageUrl(constituencyId, constituencyName) {
  return `${getRecordPageUrl(constituencyId, constituencyName)}&insights=true`;
}
