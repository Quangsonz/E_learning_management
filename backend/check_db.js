require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

const Course = require('./src/models/Course');
const Quiz = require('./src/models/Quiz');
const Lesson = require('./src/models/Lesson');
const Question = require('./src/models/Question');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const courseId = '6a467b057919baaf25ecfe95';
  
  const course = await Course.findById(courseId);
  if (!course) {
    console.log('Course not found!');
    process.exit(0);
  }
  console.log(`Course Title: ${course.title}`);

  const quizzes = await Quiz.find({ course: courseId });
  console.log(`Number of Quizzes: ${quizzes.length}`);
  quizzes.forEach(q => console.log(` - Quiz ID: ${q._id}, Title: ${q.title}`));

  const lessons = await Lesson.find({ course: courseId });
  console.log(`Number of Lessons: ${lessons.length}`);
  lessons.forEach(l => console.log(` - Lesson ID: ${l._id}, Title: ${l.title}`));

  const quizIds = quizzes.map(q => q._id);
  const lessonIds = lessons.map(l => l._id);

  const quizQuestions = await Question.find({ quiz: { $in: quizIds } });
  console.log(`Number of Questions attached to Quizzes: ${quizQuestions.length}`);

  const lessonQuestions = await Question.find({ lesson: { $in: lessonIds } });
  console.log(`Number of Questions attached to Lessons: ${lessonQuestions.length}`);

  process.exit(0);
};

run().catch(console.error);
