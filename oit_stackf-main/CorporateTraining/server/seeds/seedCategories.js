const mongoose = require('mongoose');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const config = require('../config/env');

const categoriesData = [
  {
    name: 'Quantitative Aptitude',
    type: 'aptitude',
    description: 'Mathematical and numerical reasoning topics including arithmetic, algebra, geometry, and data interpretation.',
    icon: 'Calculator',
    subcategories: [
      { name: 'Arithmetic', description: 'Percentages, Profit & Loss, Simple & Compound Interest, Ratio & Proportion, Averages.' },
      { name: 'Algebra', description: 'Linear equations, quadratic equations, progressions, functions.' },
      { name: 'Geometry & Mensuration', description: 'Triangles, circles, polygons, area, volume, and coordinate geometry.' },
      { name: 'Data Interpretation', description: 'Tables, bar graphs, line charts, pie charts, and radar plots.' }
    ]
  },
  {
    name: 'Logical Reasoning',
    type: 'aptitude',
    description: 'Analytical and logical thinking topics including verbal, non-verbal, and analytical reasoning.',
    icon: 'Brain',
    subcategories: [
      { name: 'Verbal Reasoning', description: 'Blood relations, coding-decoding, direction sense, syllogisms.' },
      { name: 'Non-Verbal Reasoning', description: 'Pattern completion, series completion, paper folding, cubes and dice.' },
      { name: 'Analytical Reasoning', description: 'Seating arrangement, scheduling, puzzles, logical deductions.' }
    ]
  },
  {
    name: 'Verbal Ability',
    type: 'aptitude',
    description: 'English language proficiency topics including grammar, vocabulary, and reading comprehension.',
    icon: 'BookOpen',
    subcategories: [
      { name: 'Grammar & Usage', description: 'Tenses, subject-verb agreement, active-passive voice, direct-indirect speech.' },
      { name: 'Vocabulary', description: 'Synonyms, antonyms, idioms & phrases, sentence completion.' },
      { name: 'Reading Comprehension', description: 'Passage analysis, main ideas, tone, and inferences.' }
    ]
  },
  {
    name: 'Data Structures & Algorithms',
    type: 'technical',
    description: 'Core concepts of organizing, managing, and storing data along with algorithm design and complexity analysis.',
    icon: 'Code2',
    subcategories: [
      { name: 'Arrays & Linked Lists', description: 'Single/Double array operations, Singly/Doubly/Circular linked lists.' },
      { name: 'Stacks & Queues', description: 'LIFO & FIFO structures, double-ended queues, priority queues.' },
      { name: 'Trees & Graphs', description: 'Binary trees, BST, AVL trees, DFS, BFS, Dijkstra, MST algorithms.' },
      { name: 'Sorting & Searching', description: 'Bubble, insertion, selection, quick, merge sort, binary search, hashing.' }
    ]
  },
  {
    name: 'Database Management Systems',
    type: 'technical',
    description: 'Relational databases, SQL queries, database design, normalization, transactions, and indexing.',
    icon: 'Database',
    subcategories: [
      { name: 'SQL Queries', description: 'SELECT statement, JOINS, subqueries, aggregations, window functions.' },
      { name: 'Database Design & Normalization', description: 'ER diagrams, keys (primary, foreign), 1NF, 2NF, 3NF, BCNF.' },
      { name: 'Transactions & Concurrency', description: 'ACID properties, transaction states, schedules, locking, serialization.' }
    ]
  },
  {
    name: 'Operating Systems',
    type: 'technical',
    description: 'Core OS concepts including process management, CPU scheduling, memory management, and file systems.',
    icon: 'Terminal',
    subcategories: [
      { name: 'Process & CPU Scheduling', description: 'Processes vs Threads, FCFS, SJF, Round Robin, deadlocks, semaphores.' },
      { name: 'Memory Management', description: 'Paging, segmentation, virtual memory, page replacement algorithms.' },
      { name: 'File Systems & Storage', description: 'File allocation, directory structures, disk scheduling algorithms.' }
    ]
  },
  {
    name: 'Computer Networks',
    type: 'technical',
    description: 'Data communication, networking models, network layers, TCP/IP protocol suite, and routing protocols.',
    icon: 'Globe',
    subcategories: [
      { name: 'OSI & TCP/IP Models', description: 'Functionality of layers, physical media, framing, error checking.' },
      { name: 'Protocols & Addressing', description: 'IP addressing (IPv4/IPv6), subnetting, TCP vs UDP, DNS, HTTP, FTP.' },
      { name: 'Routing & Security', description: 'Static and dynamic routing, firewalls, cryptography, VPNs.' }
    ]
  },
  {
    name: 'Object-Oriented Programming',
    type: 'technical',
    description: 'Core OOP concepts including classes, inheritance, polymorphism, encapsulation, and abstraction.',
    icon: 'Layers',
    subcategories: [
      { name: 'Classes & Objects', description: 'Instantiation, constructors, destructors, access specifiers.' },
      { name: 'Inheritance & Polymorphism', description: 'Single/Multiple inheritance, function overloading, method overriding.' },
      { name: 'Encapsulation & Abstraction', description: 'Data hiding, interfaces, abstract classes.' }
    ]
  },
  {
    name: 'Coding Challenges',
    type: 'coding',
    description: 'Programming challenges for practicing syntax, logic, and optimization across different difficulties.',
    icon: 'Cpu',
    subcategories: [
      { name: 'String & Array Manipulation', description: 'String searching, sorting arrays, multi-dimensional array operations.' },
      { name: 'Dynamic Programming', description: 'Memoization, tabulation, knapsack, LCS, LIS problems.' },
      { name: 'Backtracking & Recursion', description: 'N-Queens, permutations, combinations, maze solver.' }
    ]
  }
];

const seedCategories = async () => {
  try {
    console.log('Connecting to database for seeding categories...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected!');

    console.log('Checking existing categories...');
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} categories. Clearing them to reseed fresh...`);
      await Category.deleteMany({});
      await Subcategory.deleteMany({});
      console.log('Cleared existing categories and subcategories.');
    }

    for (const catData of categoriesData) {
      const category = await Category.create({
        name: catData.name,
        type: catData.type,
        description: catData.description,
        icon: catData.icon,
        isActive: true
      });
      console.log(`Created Category: ${category.name}`);

      for (const subData of catData.subcategories) {
        const sub = await Subcategory.create({
          name: subData.name,
          category: category._id,
          description: subData.description,
          isActive: true
        });
        console.log(`   └─ Created Subcategory: ${sub.name}`);
      }
    }

    mongoose.connection.close();
    console.log('Database connection closed. Category seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error.message);
    process.exit(1);
  }
};

seedCategories();

