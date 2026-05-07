import { getPool, closeDatabase } from './client'
import bcrypt from 'bcrypt'

async function runQuery(sql: string, params: any[] = []): Promise<any> {
  const result = await getPool().query(sql, params)
  return result.rows
}

async function seed(): Promise<void> {
  // Check if already seeded by checking if admin exists
  const existingAdmin = await runQuery(`SELECT * FROM "Admin" WHERE email = 'admin@quiz.com'`)
  if (existingAdmin.length > 0) {
    console.log('Database already seeded, skipping...')
    await closeDatabase()
    return
  }

  console.log('Seeding database...')

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin1234', 12)
  const now = new Date().toISOString()
  
  await runQuery(
    `INSERT INTO "Admin" (id, name, email, "passwordHash", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)`,
    [crypto.randomUUID(), 'Administrator', 'admin@quiz.com', adminPasswordHash, now, now]
  )
  console.log('Created admin user: admin@quiz.com')

  // Create settings
  await runQuery(
    `INSERT INTO "Setting" (id, "numQuestions", "timerEnabled", "timerSeconds", "allowReview", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)`,
    [1, 15, false, 1200, true, now]
  )
  console.log('Created default settings')

  // Create categories
  const categories = [
    { id: crypto.randomUUID(), name: 'General', slug: 'general' },
    { id: crypto.randomUUID(), name: 'Science', slug: 'science' },
    { id: crypto.randomUUID(), name: 'Technology', slug: 'technology' },
  ]

  for (const cat of categories) {
    await runQuery(
      `INSERT INTO "Category" (id, name, slug, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5)`,
      [cat.id, cat.name, cat.slug, now, now]
    )
  }
  console.log('Created categories:', categories.map(c => c.name).join(', '))

  // Create questions
  const questions = [
    // General - Easy (SCQ)
    {
      body: 'What is the capital of France?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[0].id,
      explanation: 'Paris is the capital and most populous city of France.',
      answers: [
        { body: 'London', isCorrect: false },
        { body: 'Paris', isCorrect: true },
        { body: 'Berlin', isCorrect: false },
        { body: 'Madrid', isCorrect: false },
      ],
    },
    {
      body: 'Which planet is known as the Red Planet?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[0].id,
      explanation: 'Mars appears red due to iron oxide on its surface.',
      answers: [
        { body: 'Venus', isCorrect: false },
        { body: 'Jupiter', isCorrect: false },
        { body: 'Mars', isCorrect: true },
        { body: 'Saturn', isCorrect: false },
      ],
    },
    {
      body: 'How many continents are there on Earth?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[0].id,
      explanation: 'There are 7 continents.',
      answers: [
        { body: '5', isCorrect: false },
        { body: '6', isCorrect: false },
        { body: '7', isCorrect: true },
        { body: '8', isCorrect: false },
      ],
    },
    {
      body: 'What is the largest ocean on Earth?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[0].id,
      explanation: 'The Pacific Ocean is the largest.',
      answers: [
        { body: 'Atlantic Ocean', isCorrect: false },
        { body: 'Indian Ocean', isCorrect: false },
        { body: 'Pacific Ocean', isCorrect: true },
        { body: 'Arctic Ocean', isCorrect: false },
      ],
    },
    // General - Medium (MCQ)
    {
      body: 'Which of the following are European countries?',
      type: 'MCQ',
      difficulty: 'MEDIUM',
      categoryId: categories[0].id,
      explanation: 'France, Germany, and Italy are European.',
      answers: [
        { body: 'France', isCorrect: true },
        { body: 'Germany', isCorrect: true },
        { body: 'Japan', isCorrect: false },
        { body: 'Italy', isCorrect: true },
      ],
    },
    {
      body: 'Which of these are prime numbers?',
      type: 'MCQ',
      difficulty: 'MEDIUM',
      categoryId: categories[0].id,
      explanation: '2 and 7 are prime.',
      answers: [
        { body: '2', isCorrect: true },
        { body: '4', isCorrect: false },
        { body: '7', isCorrect: true },
        { body: '9', isCorrect: false },
      ],
    },
    // Science - Easy (SCQ)
    {
      body: 'What is the chemical symbol for water?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[1].id,
      explanation: 'H2O is water.',
      answers: [
        { body: 'H2O', isCorrect: true },
        { body: 'CO2', isCorrect: false },
        { body: 'NaCl', isCorrect: false },
        { body: 'O2', isCorrect: false },
      ],
    },
    {
      body: 'What is the largest organ in the human body?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[1].id,
      explanation: 'Skin is the largest organ.',
      answers: [
        { body: 'Heart', isCorrect: false },
        { body: 'Liver', isCorrect: false },
        { body: 'Skin', isCorrect: true },
        { body: 'Brain', isCorrect: false },
      ],
    },
    {
      body: 'What gas do plants absorb from the atmosphere?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[1].id,
      explanation: 'Plants absorb CO2.',
      answers: [
        { body: 'Oxygen', isCorrect: false },
        { body: 'Nitrogen', isCorrect: false },
        { body: 'Carbon Dioxide', isCorrect: true },
        { body: 'Hydrogen', isCorrect: false },
      ],
    },
    {
      body: 'What is the speed of light in vacuum (approx)?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[1].id,
      explanation: 'Light travels at ~300,000 km/s.',
      answers: [
        { body: '150,000 km/s', isCorrect: false },
        { body: '300,000 km/s', isCorrect: true },
        { body: '450,000 km/s', isCorrect: false },
        { body: '600,000 km/s', isCorrect: false },
      ],
    },
    // Science - Medium (MCQ)
    {
      body: 'Which of the following are noble gases?',
      type: 'MCQ',
      difficulty: 'MEDIUM',
      categoryId: categories[1].id,
      explanation: 'Helium and Neon are noble gases.',
      answers: [
        { body: 'Helium', isCorrect: true },
        { body: 'Oxygen', isCorrect: false },
        { body: 'Neon', isCorrect: true },
        { body: 'Nitrogen', isCorrect: false },
      ],
    },
    {
      body: 'Which of these are phases of matter?',
      type: 'MCQ',
      difficulty: 'MEDIUM',
      categoryId: categories[1].id,
      explanation: 'Solid, liquid, gas, plasma are phases.',
      answers: [
        { body: 'Solid', isCorrect: true },
        { body: 'Liquid', isCorrect: true },
        { body: 'Plasma', isCorrect: true },
        { body: 'Magnet', isCorrect: false },
      ],
    },
    // Science - Hard (SCQ)
    {
      body: 'What is the atomic number of Carbon?',
      type: 'SCQ',
      difficulty: 'HARD',
      categoryId: categories[1].id,
      explanation: 'Carbon has atomic number 6.',
      answers: [
        { body: '4', isCorrect: false },
        { body: '6', isCorrect: true },
        { body: '8', isCorrect: false },
        { body: '12', isCorrect: false },
      ],
    },
    // Technology - Easy (SCQ)
    {
      body: 'What does CPU stand for?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[2].id,
      explanation: 'CPU means Central Processing Unit.',
      answers: [
        { body: 'Central Processing Unit', isCorrect: true },
        { body: 'Computer Personal Unit', isCorrect: false },
        { body: 'Central Program Utility', isCorrect: false },
        { body: 'Computer Processing Unit', isCorrect: false },
      ],
    },
    {
      body: 'What does HTML stand for?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[2].id,
      explanation: 'HTML is HyperText Markup Language.',
      answers: [
        { body: 'Hyper Text Markup Language', isCorrect: true },
        { body: 'High Tech Modern Language', isCorrect: false },
        { body: 'Home Tool Markup Language', isCorrect: false },
        { body: 'Hyperlink Text Management Language', isCorrect: false },
      ],
    },
    {
      body: 'Which company created the iPhone?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[2].id,
      explanation: 'Apple created the iPhone.',
      answers: [
        { body: 'Samsung', isCorrect: false },
        { body: 'Apple', isCorrect: true },
        { body: 'Google', isCorrect: false },
        { body: 'Microsoft', isCorrect: false },
      ],
    },
    {
      body: 'What does USB stand for?',
      type: 'SCQ',
      difficulty: 'EASY',
      categoryId: categories[2].id,
      explanation: 'USB stands for Universal Serial Bus.',
      answers: [
        { body: 'Universal Serial Bus', isCorrect: true },
        { body: 'United System Bus', isCorrect: false },
        { body: 'Universal System Board', isCorrect: false },
        { body: 'Unique Serial Buffer', isCorrect: false },
      ],
    },
    // Technology - Medium (MCQ)
    {
      body: 'Which of these are programming languages?',
      type: 'MCQ',
      difficulty: 'MEDIUM',
      categoryId: categories[2].id,
      explanation: 'Python, JavaScript, Java are languages.',
      answers: [
        { body: 'Python', isCorrect: true },
        { body: 'JavaScript', isCorrect: true },
        { body: 'HTML', isCorrect: false },
        { body: 'Java', isCorrect: true },
      ],
    },
    {
      body: 'Which of these are frontend frameworks?',
      type: 'MCQ',
      difficulty: 'MEDIUM',
      categoryId: categories[2].id,
      explanation: 'React, Angular, Vue are frontend frameworks.',
      answers: [
        { body: 'React', isCorrect: true },
        { body: 'Angular', isCorrect: true },
        { body: 'Django', isCorrect: false },
        { body: 'Vue', isCorrect: true },
      ],
    },
    // Technology - Hard (SCQ)
    {
      body: 'What port does HTTPS use by default?',
      type: 'SCQ',
      difficulty: 'HARD',
      categoryId: categories[2].id,
      explanation: 'HTTPS uses port 443.',
      answers: [
        { body: '80', isCorrect: false },
        { body: '443', isCorrect: true },
        { body: '8080', isCorrect: false },
        { body: '22', isCorrect: false },
      ],
    },
    {
      body: 'What does SQL stand for?',
      type: 'SCQ',
      difficulty: 'HARD',
      categoryId: categories[2].id,
      explanation: 'SQL means Structured Query Language.',
      answers: [
        { body: 'Simple Query Language', isCorrect: false },
        { body: 'Structured Query Language', isCorrect: true },
        { body: 'Standard Question Language', isCorrect: false },
        { body: 'System Query Logic', isCorrect: false },
      ],
    },
    // More questions
    {
      body: 'What is the boiling point of water at sea level?',
      type: 'SCQ',
      difficulty: 'MEDIUM',
      categoryId: categories[1].id,
      explanation: 'Water boils at 100°C.',
      answers: [
        { body: '90°C', isCorrect: false },
        { body: '100°C', isCorrect: true },
        { body: '110°C', isCorrect: false },
        { body: '120°C', isCorrect: false },
      ],
    },
    {
      body: 'Which element has the chemical symbol "Fe"?',
      type: 'SCQ',
      difficulty: 'MEDIUM',
      categoryId: categories[1].id,
      explanation: 'Fe is iron.',
      answers: [
        { body: 'Gold', isCorrect: false },
        { body: 'Silver', isCorrect: false },
        { body: 'Iron', isCorrect: true },
        { body: 'Copper', isCorrect: false },
      ],
    },
    {
      body: 'Which of these are valid CSS selectors?',
      type: 'MCQ',
      difficulty: 'HARD',
      categoryId: categories[2].id,
      explanation: 'Class, ID, attribute are valid selectors.',
      answers: [
        { body: '.class', isCorrect: true },
        { body: '#id', isCorrect: true },
        { body: '@element', isCorrect: false },
        { body: '[attribute]', isCorrect: true },
      ],
    },
  ]

  // Create all questions with answers
  for (const q of questions) {
    const questionId = crypto.randomUUID()
    
    await runQuery(
      `INSERT INTO "Question" (id, body, type, difficulty, explanation, "categoryId", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [questionId, q.body, q.type, q.difficulty, q.explanation, q.categoryId, now, now]
    )

    for (const a of q.answers) {
      await runQuery(
        `INSERT INTO "Answer" (id, body, "isCorrect", "questionId", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), a.body, a.isCorrect, questionId, now, now]
      )
    }
  }
  console.log(`Created ${questions.length} questions with answers`)

  console.log('Seeding completed!')
  await closeDatabase()
}

// Run if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err)
      process.exit(1)
    })
}

export { seed }