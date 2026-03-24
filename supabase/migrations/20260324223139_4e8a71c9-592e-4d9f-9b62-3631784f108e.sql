
-- Allow poems without a user (for classic/system poems)
ALTER TABLE public.poems ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS to allow everyone to see poems (already done) and allow nulls
DROP POLICY IF EXISTS "Users can create poems" ON public.poems;
CREATE POLICY "Users can create poems" ON public.poems FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert classic poems with no user_id
INSERT INTO public.poems (title, content, excerpt, tags, user_id, created_at) VALUES
(
  'The Road Not Taken',
  E'Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;\n\nThen took the other, as just as fair,\nAnd having perhaps the better claim,\nBecause it was grassy and wanted wear;\nThough as for that the passing there\nHad worn them really about the same,\n\nAnd both that morning equally lay\nIn leaves no step had trodden black.\nOh, I kept the first for another day!\nYet knowing how way leads on to way,\nI doubted if I should ever come back.\n\nI shall be telling this with a sigh\nSomewhere ages and ages hence:\nTwo roads diverged in a wood, and I—\nI took the one less traveled by,\nAnd that has made all the difference.',
  E'Two roads diverged in a yellow wood,\nAnd sorry I could not travel both...',
  ARRAY['classic', 'nature', 'life'],
  NULL,
  '1916-01-01'
),
(
  'Still I Rise',
  E'You may write me down in history\nWith your bitter, twisted lies,\nYou may trod me in the very dirt\nBut still, like dust, I''ll rise.\n\nDoes my sassiness upset you?\nWhy are you beset with gloom?\n''Cause I walk like I''ve got oil wells\nPumping in my living room.\n\nJust like moons and like suns,\nWith the certainty of tides,\nJust like hopes springing high,\nStill I''ll rise.',
  E'You may write me down in history\nWith your bitter, twisted lies...',
  ARRAY['empowerment', 'resilience', 'classic'],
  NULL,
  '1978-01-01'
),
(
  'Do Not Go Gentle into That Good Night',
  E'Do not go gentle into that good night,\nOld age should burn and rave at close of day;\nRage, rage against the dying of the light.\n\nThough wise men at their end know dark is right,\nBecause their words had forked no lightning they\nDo not go gentle into that good night.\n\nGood men, the last wave by, crying how bright\nTheir frail deeds might have danced in a green bay,\nRage, rage against the dying of the light.',
  E'Do not go gentle into that good night,\nOld age should burn and rave at close of day...',
  ARRAY['classic', 'mortality', 'defiance'],
  NULL,
  '1951-01-01'
),
(
  'Hope is the thing with feathers',
  E'Hope is the thing with feathers\nThat perches in the soul,\nAnd sings the tune without the words,\nAnd never stops at all,\n\nAnd sweetest in the gale is heard;\nAnd sore must be the storm\nThat could abash the little bird\nThat kept so many warm.\n\nI''ve heard it in the chillest land,\nAnd on the strangest sea;\nYet, never, in extremity,\nIt asked a crumb of me.',
  E'Hope is the thing with feathers\nThat perches in the soul...',
  ARRAY['hope', 'nature', 'classic'],
  NULL,
  '1891-01-01'
),
(
  'Invictus',
  E'Out of the night that covers me,\nBlack as the pit from pole to pole,\nI thank whatever gods may be\nFor my unconquerable soul.\n\nIn the fell clutch of circumstance\nI have not winced nor cried aloud.\nUnder the bludgeonings of chance\nMy head is bloody, but unbowed.\n\nBeyond this place of wrath and tears\nLooms but the Horror of the shade,\nAnd yet the menace of the years\nFinds and shall find me unafraid.\n\nIt matters not how strait the gate,\nHow charged with punishments the scroll,\nI am the master of my fate,\nI am the captain of my soul.',
  E'Out of the night that covers me,\nBlack as the pit from pole to pole...',
  ARRAY['courage', 'resilience', 'classic'],
  NULL,
  '1875-01-01'
);

-- Add an author_name column for classic poems without user accounts
ALTER TABLE public.poems ADD COLUMN author_name TEXT;

-- Set author names for the seeded classics
UPDATE public.poems SET author_name = 'Robert Frost' WHERE title = 'The Road Not Taken';
UPDATE public.poems SET author_name = 'Maya Angelou' WHERE title = 'Still I Rise';
UPDATE public.poems SET author_name = 'Dylan Thomas' WHERE title = 'Do Not Go Gentle into That Good Night';
UPDATE public.poems SET author_name = 'Emily Dickinson' WHERE title = 'Hope is the thing with feathers';
UPDATE public.poems SET author_name = 'William Ernest Henley' WHERE title = 'Invictus';
