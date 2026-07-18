require('dotenv').config();
const mongoose = require('mongoose');
const Lesson = require('./src/models/Lesson');
const Question = require('./src/models/Question');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch all lessons
    const lessons = await Lesson.find({});
    console.log(`Fetched ${lessons.length} lessons. Generating questions...`);

    let totalCreated = 0;

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      console.log(`Generating questions for lesson ${i+1}/${lessons.length}: "${lesson.title}"...`);

      const questionsToInsert = [];

      for (let qNum = 1; qNum <= 50; qNum++) {
        // Multiple choice question template
        const questionText = `[Review Q${qNum}] Trắc nghiệm bài học: "${lesson.title}" - Câu hỏi ${qNum}?`;
        const options = [
          { text: `Đáp án A cho câu hỏi ôn tập thứ ${qNum}`, isCorrect: true },
          { text: `Đáp án B cho câu hỏi ôn tập thứ ${qNum}`, isCorrect: false },
          { text: `Đáp án C cho câu hỏi ôn tập thứ ${qNum}`, isCorrect: false },
          { text: `Đáp án D cho câu hỏi ôn tập thứ ${qNum}`, isCorrect: false }
        ];

        // Shuffle options so the correct answer is randomized (A, B, C, or D)
        const shuffledOptions = options.sort(() => 0.5 - Math.random());

        questionsToInsert.push({
          lesson: lesson._id,
          text: questionText,
          points: 10,
          options: shuffledOptions,
          explanation: `Giải thích chi tiết cho câu hỏi ôn tập số ${qNum} của bài học "${lesson.title}".`
        });
      }

      // Bulk insert for this lesson
      await Question.insertMany(questionsToInsert);
      totalCreated += questionsToInsert.length;
      console.log(`Inserted 50 questions for lesson: "${lesson.title}".`);
    }

    console.log(`🎉 Done! Successfully generated and seeded a total of ${totalCreated} questions in the database.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

run();
