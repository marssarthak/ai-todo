# AI-Powered Todo App with Blockchain Verification

An AI-powered productivity application that helps users manage tasks, track streaks, and verify task completion on the blockchain. The app includes reputation and gamification systems to encourage consistent productivity.

## Features

- 📝 **Task Management:** Create, edit, and organize tasks with priorities
- 🔄 **Streak Tracking:** Build and maintain productivity streaks
- 🏆 **Gamification:** Earn achievements and level up your reputation
- 🔐 **Blockchain Verification:** Secure task completion verification on-chain
- 🤖 **AI Assistance:** Smart task prioritization and productivity insights
- 📊 **Performance Dashboard:** Track your productivity metrics over time

## Architecture

This application is built with:

- **Frontend:** Next.js with React and Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth and Privy for Web3 login
- **Blockchain:** EVM-compatible chains (Polygon, Ethereum, etc.)
- **AI Integration:** OpenAI's models for task prioritization
- **Testing:** Jest and React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- (Optional) Vercel account for deployment
- OpenAI API key
- Privy App ID (for Web3 login)

### Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ai-todo.git
   cd ai-todo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment variables example and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

4. Set up the database:

   - Go to Supabase dashboard
   - Run the migrations in `migrations/` folder
   - Ensure all tables are created successfully

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to see the application

## Database Setup

### Main Database

Run these SQL scripts in your Supabase SQL editor:

1. `migrations/initial.sql` - Creates core tables
2. `migrations/reputation.sql` - Sets up the reputation system
3. `migrations/streak_gamification.sql` - Sets up streak tracking and achievements
4. `migrations/database_optimization.sql` - Adds indexes and optimizations

### Database Schema

The application uses the following main tables:

- `users` - User profiles (managed by Supabase Auth)
- `tasks` - Todo tasks with properties like title, description, priority
- `task_verifications` - Blockchain verification records
- `user_reputation` - User reputation levels and scores
- `achievements` - Available achievements
- `user_achievements` - Unlocked achievements for users
- `daily_activity` - Activity tracking for streak calculation

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel
4. Deploy the application

### CI/CD Pipeline

This project includes GitHub Actions workflows for CI/CD:

1. **Continuous Integration:** Runs on every pull request to lint and test code
2. **Staging Deployment:** Deploys PRs to a staging environment for review
3. **Production Deployment:** Deploys the main branch to production

To set up CI/CD with GitHub Actions:

1. Add the following secrets to your GitHub repository:

   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CODECOV_TOKEN` (optional, for test coverage reports)

2. Push to the main branch to trigger the workflow

### Environment Configuration

For production, ensure these environment variables are configured:

- Supabase credentials
- Blockchain network and contract details
- Authentication redirect URLs
- API keys for external services

Refer to `.env.example` for all required variables.

## Monitoring and Error Tracking

The application includes built-in error tracking and monitoring:

1. **Error Logging:** Centralized error handling system in `lib/errorLogging.ts`
2. **Performance Monitoring:** Tracks function execution time and reports slow operations
3. **Sentry Integration:** Add your Sentry DSN to enable error reporting

## Testing

Run the test suite with:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Streak and Gamification System

The application includes a complete streak and gamification system:

1. **Daily Streaks:** Track consecutive days of task completion
2. **Achievements:** Unlock achievements for various milestones
3. **Reputation Levels:** Progress through levels as you complete tasks
4. **Motivation:** Encouraging messages based on your current streak

See the `StreakService` and achievements system for implementation details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Shadcn UI](https://ui.shadcn.com/) - UI component library
- [Privy](https://privy.io/) - Web3 authentication
- [OpenAI](https://openai.com/) - AI models for task prioritization

## Reputation System Setup

### Database Setup

To set up the reputation system, you need to run the SQL migrations in your Supabase database:

1. Navigate to the Supabase Dashboard for your project
2. Go to the SQL Editor
3. Copy the contents of the `migrations/reputation.sql` file
4. Paste and execute the SQL script

This will:

- Create the necessary tables for storing reputation data
- Set up triggers to automatically update reputation when tasks are verified
- Populate the reputation levels

### Components

The reputation system includes several components:

- `ReputationBadge`: Displays a user's reputation level with an icon
- `ReputationScore`: Shows the user's score and progress to the next level
- `ReputationHistory`: Timeline of reputation changes
- `UserReputationCard`: Card component for displaying reputation in profiles
- `ReputationPage`: Full dashboard for viewing reputation details and history

### Integration with Task Verification

Reputation points are automatically awarded when tasks are verified on the blockchain. The system:

1. Awards 1 point per verified task
2. Updates the user's reputation level based on their score
3. Records each change in the reputation history
4. Triggers special events when users level up

### Reputation Levels

The system includes the following reputation levels:

| Level | Name         | Threshold | Description                             |
| ----- | ------------ | --------- | --------------------------------------- |
| 0     | Beginner     | 0         | Just starting your productivity journey |
| 1     | Intermediate | 10        | Consistently completing tasks           |
| 2     | Advanced     | 25        | Building strong productivity habits     |
| 3     | Expert       | 50        | Mastering your productivity             |
| 4     | Master       | 100       | Maximum productivity achievement        |
