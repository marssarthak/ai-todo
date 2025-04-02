This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
