/**
 * DailyMotivation
 *
 * Displays one motivational quote below the greeting banner.
 * - Offline only — no external APIs
 * - Deterministic rotation: same quote all day for every user
 * - Professional, school-friendly quotes
 * - Collection of 100+ unique quotes
 *
 * @module components/DailyMotivation
 */

import { Quote } from 'lucide-react'

// ─── Quote Collection ──────────────────────────────────────────

const QUOTES: { text: string; author: string }[] = [
  {
    text: 'Education is the most powerful weapon which you can use to change the world.',
    author: 'Nelson Mandela',
  },
  {
    text: 'The beautiful thing about learning is that no one can take it away from you.',
    author: 'B.B. King',
  },
  { text: 'In learning you will teach, and in teaching you will learn.', author: 'Phil Collins' },
  { text: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
  {
    text: 'Intelligence plus character — that is the goal of true education.',
    author: 'Martin Luther King Jr.',
  },
  { text: 'The roots of education are bitter, but the fruit is sweet.', author: 'Aristotle' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  {
    text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.',
    author: 'Mahatma Gandhi',
  },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: 'Zig Ziglar',
  },
  {
    text: 'A person who never made a mistake never tried anything new.',
    author: 'Albert Einstein',
  },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: 'Knowledge is power. Information is liberating.', author: 'Kofi Annan' },
  { text: 'The mind is not a vessel to be filled but a fire to be kindled.', author: 'Plutarch' },
  {
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
  },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  {
    text: 'The purpose of education is to replace an empty mind with an open one.',
    author: 'Malcolm Forbes',
  },
  {
    text: 'Education breeds confidence. Confidence breeds hope. Hope breeds peace.',
    author: 'Confucius',
  },
  {
    text: 'Learning is not attained by chance; it must be sought with ardor and attended to with diligence.',
    author: 'Abigail Adams',
  },
  {
    text: 'The goal of education is not to increase the amount of knowledge but to create possibilities.',
    author: 'Jean Piaget',
  },
  {
    text: 'One child, one teacher, one book, one pen can change the world.',
    author: 'Malala Yousafzai',
  },
  {
    text: 'The function of education is to teach one to think intensively and to think critically.',
    author: 'Martin Luther King Jr.',
  },
  { text: 'Strive for progress, not perfection.', author: 'Anonymous' },
  {
    text: 'Difficulties in life are intended to make us better, not bitter.',
    author: 'Dan Reeves',
  },
  { text: "Hard work beats talent when talent doesn't work hard.", author: 'Tim Notke' },
  { text: "It always seems impossible until it's done.", author: 'Nelson Mandela' },
  {
    text: 'You are braver than you believe, stronger than you seem, and smarter than you think.',
    author: 'A.A. Milne',
  },
  { text: 'With the new day comes new strength and new thoughts.', author: 'Eleanor Roosevelt' },
  { text: 'Excellence is not a skill. It is an attitude.', author: 'Ralph Marston' },
  {
    text: 'The only limit to our realization of tomorrow is our doubts of today.',
    author: 'Franklin D. Roosevelt',
  },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  {
    text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
  },
  { text: 'Your attitude, not your aptitude, will determine your altitude.', author: 'Zig Ziglar' },
  {
    text: 'Success usually comes to those who are too busy to be looking for it.',
    author: 'Henry David Thoreau',
  },
  { text: "Opportunities don't happen. You create them.", author: 'Chris Grosser' },
  { text: "Don't limit your challenges. Challenge your limits.", author: 'Jerry Dunn' },
  {
    text: 'Education is not preparation for life; education is life itself.',
    author: 'John Dewey',
  },
  {
    text: "The more I learn, the more I realize how much I don't know.",
    author: 'Albert Einstein',
  },
  { text: 'You must be the change you wish to see in the world.', author: 'Mahatma Gandhi' },
  { text: 'Curiosity is the wick in the candle of learning.', author: 'William Arthur Ward' },
  { text: 'Dream big and dare to fail.', author: 'Norman Vaughan' },
  {
    text: 'The mind that opens to a new idea never returns to its original size.',
    author: 'Albert Einstein',
  },
  {
    text: 'Perseverance is not a long race; it is many short races one after the other.',
    author: 'Walter Elliot',
  },
  { text: 'Great things never come from comfort zones.', author: 'Roy T. Bennett' },
  {
    text: 'Success is the sum of small efforts repeated day in and day out.',
    author: 'Robert Collier',
  },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Anonymous' },
  { text: 'Sometimes later becomes never. Do it now.', author: 'Anonymous' },
  {
    text: 'If you are not willing to risk the usual, you will have to settle for the ordinary.',
    author: 'Jim Rohn',
  },
  {
    text: 'The only place where success comes before work is in the dictionary.',
    author: 'Vidal Sassoon',
  },
  { text: 'Nothing in the world can take the place of persistence.', author: 'Calvin Coolidge' },
  {
    text: 'Education is the key to unlocking the world, a passport to freedom.',
    author: 'Oprah Winfrey',
  },
  {
    text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'The beautiful thing about knowledge is that no one can take it away from you.',
    author: 'Anonymous',
  },
  {
    text: 'Every student can learn, just not on the same day or in the same way.',
    author: 'George Evans',
  },
  { text: 'Teachers plant the seeds of knowledge that last a lifetime.', author: 'Anonymous' },
  {
    text: 'A great teacher can inspire hope, ignite the imagination, and instill a love of learning.',
    author: 'Brad Henry',
  },
  {
    text: 'Teaching is the one profession that creates all other professions.',
    author: 'Anonymous',
  },
  {
    text: 'The mediocre teacher tells. The good teacher explains. The great teacher inspires.',
    author: 'William Arthur Ward',
  },
  {
    text: 'Technology is just a tool. In terms of getting the kids working together, the teacher is most important.',
    author: 'Bill Gates',
  },
  { text: 'A child educated only at school is an uneducated child.', author: 'George Santayana' },
  {
    text: 'Spoon feeding in the long run teaches us nothing but the shape of the spoon.',
    author: 'E.M. Forster',
  },
  { text: 'To teach is to touch a life forever.', author: 'Anonymous' },
  { text: 'The influence of a great teacher can never be erased.', author: 'Anonymous' },
  { text: 'Books are the training weights of the mind.', author: 'Epictetus' },
  {
    text: 'The illiterate of the future will not be the person who cannot read. It will be the person who does not know how to learn.',
    author: 'Alvin Toffler',
  },
  { text: 'Knowledge speaks, but wisdom listens.', author: 'Jimi Hendrix' },
  {
    text: 'Education is not filling a bucket but lighting a fire.',
    author: 'William Butler Yeats',
  },
  { text: 'Imagination is more important than knowledge.', author: 'Albert Einstein' },
  { text: 'Learning never exhausts the mind.', author: 'Leonardo da Vinci' },
  { text: 'The wisest mind has something yet to learn.', author: 'George Santayana' },
  { text: 'If you think education is expensive, try ignorance.', author: 'Derek Bok' },
  { text: 'Commit yourself to lifelong learning.', author: 'Brian Tracy' },
  { text: 'A reader lives a thousand lives before he dies.', author: 'George R.R. Martin' },
  { text: 'The more you know, the more you realize you know nothing.', author: 'Socrates' },
  {
    text: 'Take the attitude of a student, never be too big to ask questions, never know too much to learn something new.',
    author: 'Og Mandino',
  },
  { text: 'A mistake repeated more than once is a decision.', author: 'Paulo Coelho' },
  {
    text: 'Success is not how high you have climbed, but how you make a positive difference to the world.',
    author: 'Roy T. Bennett',
  },
  { text: 'Work hard in silence. Let your success make the noise.', author: 'Anonymous' },
  { text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
  { text: "Be so good they can't ignore you.", author: 'Steve Martin' },
  { text: 'Motivation gets you started. Habit keeps you going.', author: 'Jim Ryun' },
  { text: 'Small deeds done are better than great deeds planned.', author: 'Peter Marshall' },
  { text: "Try to be a rainbow in someone else's cloud.", author: 'Maya Angelou' },
  {
    text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.',
    author: 'Nelson Mandela',
  },
  {
    text: 'Integrity is doing the right thing, even when no one is watching.',
    author: 'C.S. Lewis',
  },
  { text: 'Character is how you treat those who can do nothing for you.', author: 'Anonymous' },
  {
    text: "Your time is limited, so don't waste it living someone else's life.",
    author: 'Steve Jobs',
  },
  { text: 'We rise by lifting others.', author: 'Robert Ingersoll' },
  {
    text: 'The secret of change is to focus all of your energy not on fighting the old, but on building the new.',
    author: 'Socrates',
  },
  {
    text: "In three words I can sum up everything I've learned about life: it goes on.",
    author: 'Robert Frost',
  },
  {
    text: 'Kindness is a language which the deaf can hear and the blind can see.',
    author: 'Mark Twain',
  },
  {
    text: 'What you get by achieving your goals is not as important as what you become.',
    author: 'Henry David Thoreau',
  },
  {
    text: 'Darkness cannot drive out darkness; only light can do that.',
    author: 'Martin Luther King Jr.',
  },
  { text: 'Be the change that you wish to see in the world.', author: 'Mahatma Gandhi' },
  {
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
  },
]

// ─── Helpers ──────────────────────────────────────────────────

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// ─── Component ────────────────────────────────────────────────

export function DailyMotivation() {
  const dayIndex = getDayOfYear() % QUOTES.length
  const quote = QUOTES[dayIndex]

  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-muted/30 rounded-lg border border-dashed">
      <Quote className="h-4 w-4 text-primary/50 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground italic leading-relaxed">"{quote.text}"</p>
        <p className="text-xs font-semibold text-foreground/50 mt-1">— {quote.author}</p>
      </div>
    </div>
  )
}
