export interface Question {
  id: string
  type: 'quiz' | 'scenario'
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface Course {
  id: string
  title: string
  description: string
  icon: string
  color: string
  questions: Question[]
}

export const COURSES: Course[] = [
  {
    id: 'intro-to-business',
    title: 'Intro to Business',
    description: 'Learn the basics of starting and running a small business',
    icon: '🏪',
    color: '#A855F7',
    questions: [
      {
        id: 'ib-1',
        type: 'quiz',
        question: 'What is the main purpose of a business plan?',
        options: [
          'To impress investors with big words',
          'To map out your goals, strategy, and how you will make money',
          'To get a tax break from the government',
          'To register your business name',
        ],
        correctIndex: 1,
        explanation: 'A business plan is your roadmap. It helps you think through your idea, figure out your customers, and plan how you will actually make money.',
      },
      {
        id: 'ib-2',
        type: 'scenario',
        question: 'A friend wants to start a food delivery business but has no savings. What should they do first?',
        options: [
          'Take out a big loan and go all in',
          'Start small — deliver from home, use their own car, test with 10 customers first',
          'Wait until they save $50,000',
          'Buy a food truck immediately',
        ],
        correctIndex: 1,
        explanation: 'Start small, test your idea with real customers, and grow from there. You do not need a lot of money to validate a business idea.',
      },
      {
        id: 'ib-3',
        type: 'quiz',
        question: 'What does "revenue" mean?',
        options: [
          'The profit you keep after expenses',
          'The total money your business brings in before expenses',
          'The money you owe to suppliers',
          'Your business savings account balance',
        ],
        correctIndex: 1,
        explanation: 'Revenue is all the money coming in. Profit is what is left after you pay your costs. A business can have high revenue but low profit if costs are too high.',
      },
      {
        id: 'ib-4',
        type: 'scenario',
        question: 'You sell handmade candles for $15 each. Your materials cost $5 per candle. You sold 100 candles this month. What is your gross profit?',
        options: [
          '$1,500',
          '$500',
          '$1,000',
          '$1,500 minus rent and other costs',
        ],
        correctIndex: 2,
        explanation: 'Gross profit = Revenue ($1,500) minus cost of goods ($500) = $1,000. This does not include rent, marketing, or other overhead — that would be net profit.',
      },
      {
        id: 'ib-5',
        type: 'quiz',
        question: 'What is a "target market"?',
        options: [
          'Everyone in your city',
          'The specific group of people most likely to buy your product',
          'The store where you sell your products',
          'Your competitors',
        ],
        correctIndex: 1,
        explanation: 'Your target market is the specific group of people you are trying to reach. Trying to sell to everyone means you connect with no one.',
      },
      {
        id: 'ib-6',
        type: 'quiz',
        question: 'Which is the most important thing for a new business?',
        options: [
          'A fancy logo and website',
          'A large office space',
          'Real customers who pay you money',
          'Business cards',
        ],
        correctIndex: 2,
        explanation: 'Nothing matters more than paying customers. You can always improve your brand later — but without customers, there is no business.',
      },
    ],
  },
  {
    id: 'business-management',
    title: 'Business Management Systems',
    description: 'Tools and systems to organize and run your business smoothly',
    icon: '⚙️',
    color: '#3B82F6',
    questions: [
      {
        id: 'bms-1',
        type: 'quiz',
        question: 'What is a CRM?',
        options: [
          'A type of social media platform',
          'A system to track your customers, conversations, and sales',
          'A government registration number',
          'A marketing technique',
        ],
        correctIndex: 1,
        explanation: 'CRM stands for Customer Relationship Management. It helps you keep track of who your customers are, what they bought, and when to follow up.',
      },
      {
        id: 'bms-2',
        type: 'scenario',
        question: 'You have 50 customers but keep losing track of who ordered what. Messages are scattered across WhatsApp, Instagram, and email. What should you do?',
        options: [
          'Hire an assistant to manage all messages',
          'Set up a simple CRM to centralize all customer info in one place',
          'Stop using Instagram and only use WhatsApp',
          'Write everything in a paper notebook',
        ],
        correctIndex: 1,
        explanation: 'A CRM puts all your customer info in one spot. You can see orders, messages, and follow-ups without digging through 5 different apps.',
      },
      {
        id: 'bms-3',
        type: 'quiz',
        question: 'What is the benefit of using checkout links instead of manual payment collection?',
        options: [
          'They look more professional',
          'Customers can pay instantly, you get paid faster, and there is a clear record',
          'They are required by law',
          'They cost less than cash',
        ],
        correctIndex: 1,
        explanation: 'Checkout links let customers pay right away without you chasing them. You get paid faster and have a clear record of every transaction.',
      },
      {
        id: 'bms-4',
        type: 'quiz',
        question: 'Why should you track your tasks and to-dos in a system instead of your head?',
        options: [
          'To impress your team',
          'Because your brain forgets things — a system does not',
          'It is required for tax purposes',
          'Only big companies need task management',
        ],
        correctIndex: 1,
        explanation: 'Your brain is for having ideas, not storing them. A task system makes sure nothing falls through the cracks.',
      },
      {
        id: 'bms-5',
        type: 'scenario',
        question: 'A customer messages you on WhatsApp asking about an order from 3 weeks ago. You cannot find the details. How do you prevent this from happening again?',
        options: [
          'Tell customers to keep their own records',
          'Log every order in a system with dates, amounts, and status',
          'Only accept orders in person',
          'Hire a bookkeeper',
        ],
        correctIndex: 1,
        explanation: 'When every order is logged in a system, you can look up any customer or order in seconds. No more digging through old chats.',
      },
      {
        id: 'bms-6',
        type: 'quiz',
        question: 'What does "automation" mean in a business context?',
        options: [
          'Replacing all employees with robots',
          'Setting up systems that do repetitive tasks for you automatically',
          'Making your website load faster',
          'Using social media scheduling tools only',
        ],
        correctIndex: 1,
        explanation: 'Automation means letting software handle repetitive work — like sending follow-up messages, updating order status, or generating reports — so you can focus on growing.',
      },
    ],
  },
  {
    id: 'smb-tech-stack',
    title: '2026 SMB Tech Stack',
    description: 'The essential technology tools every small business needs today',
    icon: '🛠️',
    color: '#10B981',
    questions: [
      {
        id: 'ts-1',
        type: 'quiz',
        question: 'What is a "tech stack" for a small business?',
        options: [
          'A pile of computers in your office',
          'The set of software tools you use to run your business',
          'A coding framework for developers',
          'An expensive IT department',
        ],
        correctIndex: 1,
        explanation: 'Your tech stack is simply the collection of apps and tools you use — like your payment processor, CRM, messaging app, and website builder.',
      },
      {
        id: 'ts-2',
        type: 'scenario',
        question: 'You are choosing between a free tool with limited features and a $30/month tool that does everything. Your business makes $2,000/month. What is the smart choice?',
        options: [
          'Always go free — never pay for software',
          'If the paid tool saves you 5+ hours a month, it pays for itself — go paid',
          'Wait until you make $10,000/month to invest in tools',
          'Build your own tool from scratch',
        ],
        correctIndex: 1,
        explanation: 'Time is money. If a $30 tool saves you 5 hours of manual work, and your time is worth $15/hour, you are saving $75 worth of time for $30.',
      },
      {
        id: 'ts-3',
        type: 'quiz',
        question: 'Why is WhatsApp important for small businesses in Latin America?',
        options: [
          'It has the best video quality',
          'Most customers already use it daily — it is where the conversations happen',
          'It is the only legal way to message customers',
          'It is free for businesses',
        ],
        correctIndex: 1,
        explanation: 'In Latin America, WhatsApp is how people communicate. Meeting your customers where they already are is smarter than asking them to download a new app.',
      },
      {
        id: 'ts-4',
        type: 'quiz',
        question: 'What is an AI assistant for business?',
        options: [
          'A robot that physically works in your store',
          'Software that can understand messages, answer questions, and do tasks for you',
          'A human virtual assistant from another country',
          'A chatbot that only says pre-written responses',
        ],
        correctIndex: 1,
        explanation: 'AI assistants like Kitz can understand what customers are asking, help manage orders, and automate repetitive work — like having a smart team member that never sleeps.',
      },
      {
        id: 'ts-5',
        type: 'scenario',
        question: 'You currently use 8 different apps to run your business and waste 2 hours a day switching between them. What should you do?',
        options: [
          'That is normal — keep going',
          'Consolidate into fewer tools that talk to each other, or use a platform that combines them',
          'Stop using technology altogether',
          'Hire someone to manage all the apps for you',
        ],
        correctIndex: 1,
        explanation: 'Tool sprawl kills productivity. Look for platforms that combine multiple functions (CRM + orders + payments + messaging) so you spend less time switching and more time selling.',
      },
      {
        id: 'ts-6',
        type: 'quiz',
        question: 'What should you look for first when choosing business software?',
        options: [
          'The coolest design and animations',
          'Whether it solves your biggest daily pain point',
          'How many features it has',
          'Whether it has an app for Apple Watch',
        ],
        correctIndex: 1,
        explanation: 'Start with your biggest headache. If chasing payments takes 3 hours a week, get a payment tool first. Solve real problems before adding nice-to-haves.',
      },
    ],
  },
  {
    id: 'social-media-marketing',
    title: 'Social Media Marketing',
    description: 'How to find and attract customers using social media',
    icon: '📱',
    color: '#F59E0B',
    questions: [
      {
        id: 'smm-1',
        type: 'quiz',
        question: 'What is the number one rule of social media marketing for small businesses?',
        options: [
          'Post as much as possible, even if it is low quality',
          'Be consistent and provide value — help people, do not just sell',
          'Only post product photos with prices',
          'Buy followers to look popular',
        ],
        correctIndex: 1,
        explanation: 'People follow accounts that help them or entertain them. If every post is "buy my stuff," people tune out. Share tips, stories, and behind-the-scenes content too.',
      },
      {
        id: 'smm-2',
        type: 'scenario',
        question: 'You posted 3 times this week. One post got 500 views, one got 50, and one got 2,000. What should you do?',
        options: [
          'Delete the post with 50 views',
          'Study what made the 2,000-view post work and make more content like it',
          'Post the same content every day',
          'Stop posting and try paid ads only',
        ],
        correctIndex: 1,
        explanation: 'Your best-performing content tells you what your audience actually wants. Double down on what works instead of guessing.',
      },
      {
        id: 'smm-3',
        type: 'quiz',
        question: 'What is "organic reach" on social media?',
        options: [
          'Reach from paid advertisements',
          'The number of people who see your content without you paying to promote it',
          'The reach of organic food businesses',
          'How many followers you have',
        ],
        correctIndex: 1,
        explanation: 'Organic reach is free visibility. When people share, comment, or save your posts, the platform shows it to more people — without you spending a dollar.',
      },
      {
        id: 'smm-4',
        type: 'scenario',
        question: 'A customer leaves a negative comment on your Instagram post. What do you do?',
        options: [
          'Delete it immediately',
          'Respond publicly with empathy, then take it to DMs to resolve it',
          'Ignore it and hope no one sees it',
          'Post a response calling them out',
        ],
        correctIndex: 1,
        explanation: 'How you handle complaints in public shows everyone what kind of business you are. Respond with care, then move the conversation to private messages to fix the issue.',
      },
      {
        id: 'smm-5',
        type: 'quiz',
        question: 'How often should a small business post on social media?',
        options: [
          'Once a month is enough',
          '3-5 times per week — consistent without burning out',
          '10 times a day to beat the algorithm',
          'Only when you have a sale or promotion',
        ],
        correctIndex: 1,
        explanation: '3-5 posts a week keeps you visible without overwhelming yourself. Quality and consistency matter more than volume.',
      },
      {
        id: 'smm-6',
        type: 'quiz',
        question: 'What is a "call to action" (CTA) in a social media post?',
        options: [
          'A phone number in your bio',
          'Telling the viewer exactly what to do next — like "DM us to order" or "tap the link"',
          'A hashtag at the end of your post',
          'Tagging another business in your post',
        ],
        correctIndex: 1,
        explanation: 'If you do not tell people what to do, they will scroll past. A clear CTA turns viewers into customers — "DM us," "click the link," "comment YES to get started."',
      },
    ],
  },
]
