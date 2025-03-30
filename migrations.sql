-- Enable UUID generation extension if not exists
-- create extension if not exists "uuid-ossp"; -- Usually enabled by default

-- Create custom enum types FIRST
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_status as enum ('todo', 'in-progress', 'completed');

-- NOW Create the tasks table using the types
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null check (length(title) > 0),
  description text,
  priority public.task_priority not null default 'medium', -- Use the created type
  status public.task_status not null default 'todo',       -- Use the created type
  deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add index on user_id for performance
create index ix_tasks_user_id on public.tasks (user_id);

-- Add index on status for filtering performance
create index ix_tasks_status on public.tasks (status);

-- Add trigger to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_task_update
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

-- Enable RLS on the tasks table
alter table public.tasks enable row level security;

-- Create RLS policies
create policy "Users can view their own tasks"
  on public.tasks for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own tasks"
  on public.tasks for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using ( auth.uid() = user_id );