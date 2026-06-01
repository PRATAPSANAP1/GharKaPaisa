const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config();

const categories = [
  // Aptitude
  { name: 'Math', type: 'aptitude', description: 'Mathematical and quantitative aptitude tests', icon: 'Calculator' },
  { name: 'Verbal', type: 'aptitude', description: 'Verbal reasoning and English comprehension', icon: 'Type' },
  { name: 'Non Verbal', type: 'aptitude', description: 'Logical and non-verbal reasoning tests', icon: 'Brain' },
  
  // Technical
  { name: 'MCQ', type: 'technical', description: 'Technical Multiple Choice Questions on Programming', icon: 'Code' },
  { name: 'Interview', type: 'technical', description: 'Technical Interview Preparation', icon: 'Mic' },
  
  // Coding is already type 'coding', but we can ensure a generic 'Coding' category exists
  { name: 'Coding', type: 'coding', description: 'Programming Challenges', icon: 'Terminal' }
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');

    for (const cat of categories) {
      const exists = await Category.findOne({ name: cat.name });
      if (!exists) {
        await Category.create(cat);
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
    }

    console.log('Categories seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
